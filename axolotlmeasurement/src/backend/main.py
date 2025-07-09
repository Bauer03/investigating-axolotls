from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # You'll need this for frontend communication
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Note: Might be interesting to learn how to send progress updates from fastapi server to frontend - useful for the interface's target audience of someone who isn't tech savvy, and something that's good to know/easy to make look good in CSS

# Add CORS middleware for frontend communication (as discussed previously)
origins = [
    "http://localhost",
    "http://localhost:5173",
    "file://", # For production builds
    "*" # remove
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Axolotl Measurement Backend!"}

@app.get("/data")
def read_data():
    return {"message": "not using this endpoint"}

# @app.post("/process-images")
