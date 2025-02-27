import os
import logging
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from data_initialization import initialize_data, load_vector_store, get_conversational_chain, summarize_text, extract_metadata, chunk_text
from langchain.vectorstores import FAISS
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.memory import ConversationBufferMemory

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Configure Logging
logging.basicConfig(filename="logs/app.log", level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = Flask(__name__)

# Memory for conversational context
memory = ConversationBufferMemory(memory_key="chat_history")

# API Endpoint: Process and Store Text Files
@app.route("/process_texts", methods=["POST"])
def process_texts():
    try:
        if "files" not in request.files:
            return jsonify({"error": "No files uploaded"}), 400

        files = request.files.getlist("files")
        
        for file in files:
            text = file.read().decode("utf-8")
            summary = summarize_text(text)
            metadata = extract_metadata(text)
            chunks = chunk_text(text)
            
            # Store processed data
            initialize_data(chunks, metadata)
            logging.info(f"Processed file: {file.filename}, Summary: {summary}")
        
        return jsonify({"message": "Text files processed successfully."})
    except Exception as e:
        logging.error("Error processing text files: %s", str(e))
        return jsonify({"error": str(e)}), 500

# API Endpoint: Query the vector store with hybrid search
@app.route("/query", methods=["POST"])
def query_text():
    try:
        question = request.form.get("question")
        if not question:
            return jsonify({"error": "No question provided"}), 400

        if not os.path.exists("faiss_index"):
            return jsonify({"error": "No processed text files found. Please upload and process texts first."}), 400

        vector_store = load_vector_store()
        qa_chain = get_conversational_chain(memory)
        docs = vector_store.similarity_search(question)

        # Perform hybrid retrieval (keyword + vector search)
        keywords_results = vector_store.get_relevant_documents(question, k=5)
        combined_docs = list(set(docs + keywords_results))

        response = qa_chain({"input_documents": combined_docs, "question": question, "chat_history": memory.chat_memory}, return_only_outputs=True)
        memory.save_context({"question": question}, {"answer": response["output_text"]})

        return jsonify({"response": response["output_text"]})
    except Exception as e:
        logging.error("Error in querying: %s", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
