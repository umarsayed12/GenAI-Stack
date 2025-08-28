from fastapi import FastAPI
from api.v1.api import api_router

app = FastAPI(title="GenAI Stack API")

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the GenAI Stack API!"}