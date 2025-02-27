from flask import Flask, request, jsonify, send_file
from langchain.prompts import ChatPromptTemplate
from langchain_neo4j import Neo4jGraph, GraphCypherQAChain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferWindowMemory
from groq import Groq
from dotenv import load_dotenv
import requests
import os
from gtts import gTTS  # Google Text-to-Speech for Marathi TTS

# Load environment variables
load_dotenv()

# Initialize Groq client
groq_api_key = os.getenv('GROQ_API_KEY')
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is not set in the environment variables.")
groq_client = Groq(api_key=groq_api_key)

# Sarvam AI Mayura API details
mayura_api_url = "https://api.sarvam.ai/translate"
mayura_api_key = os.getenv('MAYURA_API_KEY')

# Neo4j connection details
NEO4J_URI = "neo4j+s://ef35ef60.databases.neo4j.io"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "XU2GP16UGJR2itxQyIUuiMtHD6nAMVRVamjXhTBL3fs"

# Initialize Flask app
app = Flask(__name__)

# Connect to Neo4j knowledge graph
graph = Neo4jGraph(
    url=NEO4J_URI,
    username=NEO4J_USERNAME,
    password=NEO4J_PASSWORD,
    database="neo4j"
)

# Initialize memory for conversation context
memory = ConversationBufferWindowMemory(k=5)

# Initialize LLM (Google Gemini)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.3
)

# Define ChatPromptTemplate for LLM
template = ChatPromptTemplate.from_messages([
    ("system", """
    You are an AI-powered government scheme assistant. Your task is to convert user queries about government schemes into Cypher queries for a Neo4j knowledge graph. You must return ONLY the Cypher query. Do not include any other text, explanations, or conversational elements. When constructing the Cypher query, ALWAYS convert all string values to lowercase so that the query is case-insensitive and matches the data stored in the graph, which is entirely in lowercase. Also, always use contains for searching or filtering, instead of equals.

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

# Create QA chain with memory
qa_chain = GraphCypherQAChain.from_llm(
    llm=llm,
    graph=graph,
    prompt=template,
    verbose=True,
    allow_dangerous_requests=True,
    memory=memory,
    validate_cypher=True
)

@app.route('/process_audio', methods=['POST'])
def process_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided.'}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400

    # Save the uploaded audio file temporarily
    audio_path = os.path.join('/tmp', audio_file.filename)
    audio_file.save(audio_path)

    try:
        with open(audio_path, 'rb') as file:
            files = {
                'file': ('audiofile.mp3', audio_file, 'audio/mpeg')
            }
            headers = {
                'api-subscription-key': '0ced95ba-6c6b-44aa-ad0e-afc589ff0102'  # Replace with your actual API subscription key
            }
            response = requests.post("http://localhost:3000/transcribe_with_node", headers=headers, files=files)
            print(response.text)
        if response.status_code != 200:
            return jsonify({'error': 'Transcription and translation failed', 'details': response.text}), 500

        result = response.json()
        english_text = result.get('transcript', '')
        # english_text = translated_text
        print(english_text)

        # Step 2: Send English text to LLM via GraphCypherQAChain
        response_from_llm = qa_chain.run(english_text)
        print(response_from_llm)
        # Step 3: Translate LLM response to Marathi using Sarvam AI Mayura
        headers = {
            "api-subscription-key": "0ced95ba-6c6b-44aa-ad0e-afc589ff0102",
            "Content-Type": "application/json"
        }
        payload = {
            "input": response_from_llm.replace("\\", ""),
            "source_language_code": "en-IN",
            "target_language_code": "mr-IN",
            "model": "mayura:v1",
            "mode": "formal",
            "speaker_gender": "Male",
            "enable_preprocessing": False
        }
        mayura_response = requests.post(mayura_api_url, json=payload, headers=headers)

        if mayura_response.status_code == 200:
            marathi_text = mayura_response.json().get('translated_text', '')
        else:
            return jsonify({'error': 'Translation to Marathi failed'}), 500

        # Step 4: Convert Marathi text to Speech (MP3)
        tts = gTTS(marathi_text, lang='mr')  
        audio_output_path = "/tmp/marathi_translation.mp3"
        tts.save(audio_output_path)

        return jsonify({
            'english_transcription': english_text,
            'llm_response': response_from_llm,
            'marathi_translation': marathi_text,
            'audio_url': request.host_url + "download_mp3"
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

@app.route('/download_mp3', methods=['GET'])
def download_mp3():
    audio_path = "/tmp/marathi_translation.mp3"
    if os.path.exists(audio_path):
        return send_file(audio_path, as_attachment=True)
    else:
        return jsonify({'error': 'Audio file not found.'}), 404

if __name__ == '__main__':
    app.run(debug=True)
