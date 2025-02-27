import streamlit as st
import requests

# Flask API URL
FLASK_API_URL = "http://127.0.0.1:5000"

st.set_page_config(page_title="Chat with Text Files", layout="wide")
st.title("Chat with Text Files 💬")

# Upload and process text files
st.sidebar.title("Upload Files:")
uploaded_files = st.sidebar.file_uploader("Upload your text files and click 'Process'", accept_multiple_files=True)

if st.sidebar.button("Process"):
    if uploaded_files:
        files = [("files", (file.name, file, "text/plain")) for file in uploaded_files]
        response = requests.post(f"{FLASK_API_URL}/process_texts", files=files)
        st.sidebar.success(response.json().get("message", "Processing complete."))
    else:
        st.sidebar.error("Please upload text files first.")

# Query Interface
user_question = st.text_input("Ask a question based on the text files:")

if user_question:
    response = requests.post(f"{FLASK_API_URL}/query", data={"question": user_question})
    if response.status_code == 200:
        st.write("Reply:", response.json().get("response", "No response available."))
    else:
        st.write("Error:", response.json().get("error", "Error occurred while processing the query."))
