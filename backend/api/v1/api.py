from fastapi import APIRouter
from api.v1.endpoints import chat,knowledge,stacks
api_router = APIRouter()
api_router.include_router(chat.router, prefix="/v1", tags=["v1"])
api_router.include_router(knowledge.router, prefix="/v1/knowledge", tags=["v1_knowledge"])
api_router.include_router(stacks.router, prefix="/v1/stacks", tags=["Stacks"])