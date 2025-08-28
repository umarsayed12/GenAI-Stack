from fastapi import APIRouter
from pydantic import BaseModel

class ChatRequest(BaseModel):
    prompt: str

class ChatResponse(BaseModel):
    response: str


from services.gemini_service import get_gemini_response

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def handle_chat(request: ChatRequest):
    """
    Receives a chat prompt and returns a response from Gemini.
    """
    gemini_response = get_gemini_response(request.prompt)
    return ChatResponse(response=gemini_response)