from ultralytics import YOLO
import os
from pathlib import Path
import sys
import json
import argparse

# Get correct path for bundled resources
# (important for built app working on anyone's OS other than mine lol)
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        print("Error, using alt path: ", file=sys.stderr)
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)


def process_images(image_paths: list, model_path: str = "models/best.pt") -> list:
    model_full_path = resource_path(model_path)
    model = YOLO(model_full_path)

    image_files = [Path(p) for p in image_paths]
    all_results = []

    for image_path in image_files:
        try:
            results = model(image_path)

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

    # changed to stderr so that it wouldn't be included in std output
    print(f"Processing complete!", file=sys.stderr)
    return all_results


# Keep CLI usage for standalone testing/debugging
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', default='models/best.pt', help='Path to .pt model file')
    parser.add_argument('images', nargs='+', help='Image file paths')
    args = parser.parse_args()

    results = process_images(args.images, args.model)
    # i'm using this in main.py to read the results of this script, so important not to print anything else out to stdout!!!
    print(json.dumps(results))
