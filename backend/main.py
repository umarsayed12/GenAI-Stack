from fastapi import FastAPI
from api.v1.api import api_router
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
load_dotenv()
app = FastAPI(title="GenAI Stack API")
origins = [
    "https://genaistack.netlify.app",
    os.getenv("FRONTEND_URL")
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.options("/{rest_of_path:path}")
async def preflight_handler():
    return {}

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the GenAI Stack API!"}