import chromadb
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter 
import google.generativeai as genai
from core.config import GEMINI_API_KEY

client = chromadb.PersistentClient(path="./chroma_data")
embedding_model = "models/text-embedding-004"

def configure_gemini(api_key: str | None = None):
    final_api_key = api_key if api_key else GEMINI_API_KEY
    if not final_api_key:
        raise ValueError("Gemini API key is not configured.")
    genai.configure(api_key=final_api_key)

def process_pdf_and_store(file_path: str, collection_name: str, api_key: str | None = None):
    try:
        configure_gemini(api_key)

        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""

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

def query_collection(collection_name: str, query: str | None = None , api_key: str | None = None, n_results: int = 3):
    try:
        configure_gemini(api_key)
        
        collection = client.get_collection(name=collection_name)
        query_embedding_response = genai.embed_content(model=embedding_model, content=query if query else "Query")
        query_embedding = query_embedding_response['embedding']
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        return results['documents'][0]
    except Exception as e:
        print(f"Error querying collection: {e}")
        return []

