from ultralytics import YOLO
import os
from pathlib import Path
import sys
import json

# --- Path Refactoring ---

script_dir = Path(__file__).resolve().parent
project_root = script_dir.parents[1]
model_path = project_root / 'resources' / 'best.pt'

# Initialize the YOLO model
model = YOLO(model_path)

# --- Handling Input/Output ---

if len(sys.argv) < 2:
    print("Usage: python kp_est_01_results.py <image_path_1> <image_path_2> ...")
    sys.exit(1)

# The script now receives a list of image paths
image_files = [Path(p) for p in sys.argv[1:]]

print(f"Found {len(image_files)} images to process...")

all_results = []
for i, image_path in enumerate(image_files, 1):
    try:
        print(f"Processing {i}/{len(image_files)}: {image_path.name}")

        results = model.predict(str(image_path), conf=0.25)

        for result in results:
            if result.boxes and result.keypoints:
                image_data = {
                    "image_name": image_path.name,
                    "bounding_box": result.boxes.xyxy.tolist(),
                    "keypoints": result.keypoints.xy.tolist()
                }
                all_results.append(image_data)

    except Exception as e:
        print(f"Error processing {image_path.name}: {str(e)}")
        continue

print(json.dumps(all_results))

print(f"Processing complete!")
