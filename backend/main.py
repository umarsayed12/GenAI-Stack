from fastapi import FastAPI
from api.v1.api import api_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GenAI Stack API")
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the GenAI Stack API!"}