from flask import Flask, request, jsonify
from langchain.prompts import ChatPromptTemplate
from langchain_neo4j import Neo4jGraph, GraphCypherQAChain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferWindowMemory
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins


# Neo4j connection details (Replace with actual credentials)
NEO4J_URI="neo4j+s://ef35ef60.databases.neo4j.io"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="XU2GP16UGJR2itxQyIUuiMtHD6nAMVRVamjXhTBL3fs"

# Knowledge Graph connection
graph = Neo4jGraph(
    url=NEO4J_URI,
    username=NEO4J_USERNAME,
    password=NEO4J_PASSWORD,
    database="neo4j"
)

memory = ConversationBufferWindowMemory(k=5)

# Initialize LLM (Google Gemini)
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.5,
    google_api_key="AIzaSyBZuDWwC9QC6BortBUgRNN0Z_s23wxpCb4"  # Replace with your actual Gemini API key
)

# Schema description and prompt
template = ChatPromptTemplate.from_messages([
    ("system", """
    You are an AI-powered government scheme assistant. Your task is to convert user queries about government schemes into Cypher queries for a Neo4j knowledge graph. You must return ONLY the Cypher query. Do not include any other text, explanations, or conversational elements. When constructing the Cypher query, ALWAYS convert all string values to lowercase so that the query is case-insensitive and matches the data stored in the graph, which is entirely in lowercase. Also, always use contains for searching or filtering, instead of equals. Also give responses in under 200 characters.

    ## Instructions for Query Generation
    1.  Analyze the user query to identify relevant filters related to:
    -  State  (where the scheme is available).
    -  Ministry  (which ministry manages the scheme).
    -  Category  (e.g., "agriculture", "education").
    -  Eligibility Criteria  (gender, caste, occupation, etc.).
    -  Required Documents  (if the user asks for documents).
    -  Keywords (Tags)  (if applicable).
    -  Benefits, DBT, Application Mode  (if explicitly asked).

    2.  Always use `CONTAINS` to find matches of anything   
    - If a user asks for  generic terms  (like "fishing", "loan", "education"),  
        - Use `CONTAINS` instead of `=` to allow broader retrieval.  
    - Apply `CONTAINS` on:
        - `scheme_title`
        - `scheme_name`
        - `description`
        - `Category`
        - `Tag`
        - `EligibilityAttribute (occupation, caste, etc.)`

    3.  Use `=` for Exact Boolean Matches   
    - `below_poverty_line`, `DBT`, `gov_emp`, `student`, should match  exact values  (True/False).  

    4.  Construct a Cypher Query Using `MATCH` Clauses   
    - Use proper  relationship mappings :
        - `:AVAILABLE_IN` → State
        - `:MANAGED_BY` → Ministry
        - `:BELONGS_TO` → Category
        - `:HAS_TAG` → Tag
        - `:REQUIRES_DOC` → Document
        - `:HAS_ELIGIBILITY` → EligibilityAttribute

    5.  Prioritize Scheme Retrieval First   
    - The primary goal is to find relevant  schemes  first, then filter based on eligibility, documents, or benefits.  

    6.  Return the Following Properties for Each Matching Scheme   
    - `s.scheme_title`, `s.scheme_name`, `s.benefits`, `s.application_mode`
   

    ---

    ##  Knowledge Graph Schema 
    The knowledge graph contains the following node types and relationships:

    Scheme (Central Node) 
    - Represents a government scheme.
    -  Properties: 
    - `scheme_title` (String): A brief, lowercase title of the scheme.
    - `scheme_name` (String): The full official name of the scheme.
    - `description` (String): A detailed explanation of the scheme.
    - `benefits` (Integer): The monetary benefit amount.
    - `application_mode` (String): How to apply (e.g., "online", "offline", "onlineviacsc").
    - `benefit_type` (String): The type of benefit (e.g., "cash", "inkind", "both").
    - `DBT` (Boolean): Indicates if the scheme supports direct benefit transfer.
    -  Relationships: 
    - `(Scheme)-[:BELONGS_TO]->(Category)`
    - `(Scheme)-[:MANAGED_BY]->(Ministry)`
    - `(Scheme)-[:AVAILABLE_IN]->(State)`
    - `(Scheme)-[:HAS_TAG]->(Tag)`
    - `(Scheme)-[:REQUIRES_DOC]->(Document)`
    - `(Scheme)-[:HAS_ELIGIBILITY]->(EligibilityAttribute)`

    Category 
    - Categorizes schemes (e.g., "agriculture", "education").
    -  Properties: 
    - `name` (String): The category name.
    -  Relationship:   
    - `(Scheme)-[:BELONGS_TO]->(Category)`

    Ministry 
    - Represents the government ministry managing the scheme.
    -  Properties: 
    - `name` (String): The ministry name.
    -  Relationship:   
    - `(Scheme)-[:MANAGED_BY]->(Ministry)`

    State 
    - Defines the geographical region where the scheme is applicable.
    -  Properties: 
    - `name` (String): The state name.
    -  Relationship:   
    - `(Scheme)-[:AVAILABLE_IN]->(State)`

    Tag 
    - Stores keywords associated with a scheme.
    -  Properties: 
    - `name` (String): The tag label.
    -  Relationship:   
    - `(Scheme)-[:HAS_TAG]->(Tag)`

    Document 
    - Lists required documents for application.
    -  Properties: 
    - `name` (String): The document name.
    -  Relationship:   
    - `(Scheme)-[:REQUIRES_DOC]->(Document)`

    EligibilityAttribute 
    - Defines eligibility criteria.
    -  Properties: 
    - `type` (String): The attribute type.
    - `value` (String or Boolean): The expected value.
    -  Valid type-value pairs include: 
    - `gender`: "male", "female", "all"
    - `caste`: "gen", "obc", "sc", "st", "any"
    - `below_poverty_line`: True, False
    - `gov_emp`: True, False
    - `student`: True, False
    - `differently_abled`: True, False
    - `occupation`: "farmer", "fisherman", "worker", "entrepreneur"
    - `marital_status`: "married", "single", "any"
    -  Relationship:   
    - `(Scheme)-[:HAS_ELIGIBILITY]->(EligibilityAttribute)`

    Example Queries & Expected Cypher Output 

    User Query:   
    > "Tell me about aasra scheme"

    Expected Cypher Query: 
    MATCH (s:Scheme)
    WHERE s.scheme_title CONTAINS "aasra"
    RETURN s

    """),
    ("human", "{query}")
])

# Create QA chain
qa_chain = GraphCypherQAChain.from_llm(
    llm=llm,
    graph=graph,
    prompt=template,
    verbose=True,
    allow_dangerous_requests=True,
    memory=memory,
    validate_cypher=True
)

@app.route('/query', methods=['GET'])
def query_schemes():
    print("Received GET request")
    print("Headers:", request.headers)
    print("Query Params:", request.args)

    user_query = request.args.get('message')
    if not user_query:
        return jsonify({'error': 'Missing "message" parameter in query'}), 400

    print("Extracted Query:", user_query)

    try:
        response = qa_chain.run(user_query)  # Generate response
        print("Generated Response:", response)
        return jsonify({'response': response}), 200
    except Exception as e:
        print("🔥 Flask Error:", str(e))  # Log error in Flask console
        return jsonify({'error': 'Internal Server Error', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(port=8000,debug=True)
