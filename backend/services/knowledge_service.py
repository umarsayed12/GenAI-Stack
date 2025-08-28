import chromadb
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import google.generativeai as genai
import os
import uuid


client = chromadb.PersistentClient(path="./chroma_data")
embedding_model = "models/text-embedding-004"

def process_pdf_and_store(file_path: str, collection_name: str):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()

        if not text:
            return {"error": "Could not extract text from PDF."}

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_text(text)

        collection = client.get_or_create_collection(name=collection_name)

        for i, chunk in enumerate(chunks):
            embedding_response = genai.embed_content(model=embedding_model, content=chunk)
            embedding = embedding_response['embedding']
            
            collection.add(
                embeddings=[embedding],
                documents=[chunk],
                ids=[f"chunk_{i}"]
            )
        
        return {"success": True, "message": f"Processed and stored {len(chunks)} chunks in collection '{collection_name}'."}

    except Exception as e:
        print(f"Error in processing PDF: {e}")
        return {"error": str(e)}

def query_collection(collection_name: str, query: str, n_results: int = 3):
    try:
        collection = client.get_collection(name=collection_name)
        query_embedding_response = genai.embed_content(model=embedding_model, content=query)
        query_embedding = query_embedding_response['embedding']
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        return results['documents'][0]
    except Exception as e:
        print(f"Error querying collection: {e}")
        return []

