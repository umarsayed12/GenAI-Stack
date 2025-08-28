from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from services.knowledge_service import process_pdf_and_store, query_collection
from services.gemini_service import get_gemini_response
import os
import uuid

router = APIRouter()

class PDFUploadResponse(BaseModel):
    success: bool
    message: str
    collection_name: str

class RAGQueryRequest(BaseModel):
    collection_name: str
    query: str

class RAGQueryResponse(BaseModel):
    response: str
    context: list[str]



@router.post("/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        

    collection_name = f"pdf_{uuid.uuid4().hex}"
    

    result = process_pdf_and_store(file_path, collection_name)
    

    os.remove(file_path)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return PDFUploadResponse(
        success=True, 
        message=f"File '{file.filename}' processed successfully.",
        collection_name=collection_name
    )

@router.post("/rag-chat", response_model=RAGQueryResponse)
def handle_rag_chat(request: RAGQueryRequest):
    context_chunks = query_collection(request.collection_name, request.query)
    
    if not context_chunks:
        final_response = get_gemini_response(request.query)
        return RAGQueryResponse(response=final_response, context=[])
    
    context_str = "\n\n".join(context_chunks)
    prompt = f"""
    You are a helpful AI assistant. Use the context provided below to answer the user's question.
    If the answer is not found in the context, state that you do not have the information. Do not provide answers from outside the given context.

    Context:
    ---
    {context_str}
    ---

    User's Question: {request.query}
    """
    final_response = get_gemini_response(prompt)
    
    return RAGQueryResponse(response=final_response, context=context_chunks)

