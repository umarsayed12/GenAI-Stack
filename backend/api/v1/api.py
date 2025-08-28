# api/v1/api.py
from fastapi import APIRouter
from api.v1.endpoints import chat

api_router = APIRouter()
api_router.include_router(chat.router, prefix="/v1", tags=["v1"])