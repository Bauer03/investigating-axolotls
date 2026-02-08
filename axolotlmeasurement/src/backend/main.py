from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import subprocess
import sys
import os
import json

app = FastAPI()

class ImagePaths(BaseModel):
    paths: List[str]
    model: str = "best.pt"

class FolderPath(BaseModel):
    path: str

origins = [
    "http://localhost",
    "http://localhost:5173",
    "file://",
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

@app.get("/models")
def list_models():
    models_dir = os.path.join(os.path.abspath("."), "models")
    if not os.path.isdir(models_dir):
        os.makedirs(models_dir, exist_ok=True)
        return {"models": []}

    model_files = [
        f for f in os.listdir(models_dir)
        if f.endswith('.pt') and os.path.isfile(os.path.join(models_dir, f))
    ]
    return {"models": sorted(model_files)}

@app.post("/process-images")
def process_images(image_paths: ImagePaths):
    if not image_paths.paths:
        return {"error": "No image paths provided"}

    # Validate model name to prevent path traversal
    if '..' in image_paths.model or '/' in image_paths.model or '\\' in image_paths.model:
        return {"error": "Invalid model name"}

    python_executable = sys.executable
    model_arg = f"models/{image_paths.model}"

    try:
        # Pass the model and list of image paths to the script
        result = subprocess.run(
            [python_executable, "kp_est_01_results.py", "--model", model_arg, *image_paths.paths],
            capture_output=True,
            text=True,
            check=True
        )

        output_lines = result.stdout.strip().split('\n')
        json_output_str = output_lines[-1]

        model_data = json.loads(json_output_str)

        # print("Model Data:", model_data)

        return {"message": "Images processed successfully!", "data": model_data}

    except subprocess.CalledProcessError as e:
        print("Error running script:", e.stderr)
        return {"error": "Failed to process images", "details": e.stderr}
    except json.JSONDecodeError as e:
        print("Error decoding JSON from script output:", e)
        print("Script stdout:", result.stdout)
        print("Script stderr:", result.stderr)
        return {"error": "Failed to decode JSON from script output", "details": result.stdout}

@app.post("/get-folder-contents")
def process_folder(folder_path: FolderPath):
    if not folder_path.path or not os.path.isdir(folder_path.path):
        return {"error": "No valid folder provided"}

    full_paths = []
    for item in os.listdir(folder_path.path):
        item_path = os.path.join(folder_path.path, item)
        if os.path.isfile(item_path):
            full_paths.append(item_path)

    return full_paths
