from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from kp_est_01_results import process_images as run_model

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
def process_images_endpoint(image_paths: ImagePaths):
    if not image_paths.paths:
        return {"error": "No image paths provided"}

    # Validate model name to prevent path traversal
    if '..' in image_paths.model or '/' in image_paths.model or '\\' in image_paths.model:
        return {"error": "Invalid model name"}

    model_arg = f"models/{image_paths.model}"

    try:
        model_data = run_model(image_paths.paths, model_arg)
        return {"message": "Images processed successfully!", "data": model_data}
    except Exception as e:
        print(f"Error running model: {e}")
        return {"error": "Failed to process images", "details": str(e)}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)
