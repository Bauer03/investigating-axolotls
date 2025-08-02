from ultralytics import YOLO
import os
from pathlib import Path
import sys
import json

# --- Path Refactoring ---
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parents[1]
model_path = project_root / 'resources' / 'best.pt'

# --- Initialize Calvin's YOLO model ---
model = YOLO(model_path)

# --- Handling Input/Output ---
if len(sys.argv) < 2:
    # Print usage instructions to stderr
    print("Usage: python kp_est_01_results.py <image_path_1> <image_path_2> ...", file=sys.stderr)
    sys.exit(1)

image_files = [Path(p) for p in sys.argv[1:]]

# also printing to stderr so I don't accidentally read in my program.
print(f"Found {len(image_files)} images to process...", file=sys.stderr)

all_results = []
for i, image_path in enumerate(image_files, 1):
    try:
        print(f"Processing {i}/{len(image_files)}: {image_path.name}", file=sys.stderr)

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
        # Errors go to stderr, since my program reads stdout for data
        print(f"Error processing {image_path.name}: {str(e)}", file=sys.stderr)
        continue

# --- Final Output ---
# i'm using this in main.py to read the results of this script, so important not to print anything else out to stdout!!!
print(json.dumps(all_results))

# changed to stderr so that it wouldn't be included in std output
print(f"Processing complete!", file=sys.stderr)
