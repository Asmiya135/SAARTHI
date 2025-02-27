import os
import logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from PyPDF2 import PdfReader

# Configure Logging
logging.basicConfig(filename="logs/data_initialization.log", level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Extract text from TXT files
def get_text_from_files(text_files):
    text = ""
    for file in text_files:
        content = file.read().decode("utf-8")
        text += content + "\n"
    return text

# Split text into chunks
def get_text_chunks(text):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=1000)
    return text_splitter.split_text(text)

# Create FAISS vector store
def initialize_data(files):
    raw_text = get_text_from_files(files)
    text_chunks = get_text_chunks(raw_text)

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", task_type="retrieval_document")
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    vector_store.save_local("faiss_index")

    logging.info("Text files processed and FAISS index created successfully.")

# Load FAISS vector store
def load_vector_store():
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", task_type="retrieval_document")
    return FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

# Define conversational chain
def get_conversational_chain():
    from langchain.chains.question_answering import load_qa_chain
    from langchain.prompts import PromptTemplate
    from langchain_google_genai import ChatGoogleGenerativeAI

    prompt_template = """
    Answer the question as detailed as possible from the provided context. If the answer is not in
    the provided context, respond with "The answer is not available in the context." Do not provide incorrect information.

    Context:
    {context}

    Question:
    {question}

    Answer:
    """
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    model = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.3)
    return load_qa_chain(model, chain_type="stuff", prompt=prompt)
