from ultralytics import YOLO
import os
from pathlib import Path
import sys

# --- Path Refactoring ---

# Get the directory of the current script.
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parents[1]
model_path = project_root / 'resources' / 'best.pt'

# Initialize the YOLO model
model = YOLO(model_path)

# --- Handling Input/Output Folders ---

# It is best practice to pass the input folder path as a command-line argument
# rather than hardcoding it. This makes your script more flexible.
# You can run it like: python kp_est_01_results.py /path/to/your/images
if len(sys.argv) < 2:
    print("Usage: python kp_est_01_results.py <path_to_image_folder>")
    sys.exit(1)

folder_path = sys.argv[1]

# Create the output folder in the same directory as the input folder.
output_folder = Path(folder_path) / 'prediction_results'
os.makedirs(output_folder, exist_ok=True)

# --- Image Processing (No changes needed here) ---
image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}

image_files = []
for ext in image_extensions:
    image_files.extend(Path(folder_path).glob(f'*{ext}'))
    image_files.extend(Path(folder_path).glob(f'*{ext.upper()}'))

print(f"Found {len(image_files)} images to process...")

for i, image_path in enumerate(image_files, 1):
    try:
        print(f"Processing {i}/{len(image_files)}: {image_path.name}")

        # Run inference on the image
        results = model.predict(str(image_path), conf=0.25)

        # Create output filename
        output_filename = f"{image_path.stem}_prediction{image_path.suffix}"
        output_path = output_folder / output_filename

        # Save the results
        results[0].save(str(output_path))

    except Exception as e:
        print(f"Error processing {image_path.name}: {str(e)}")
        continue

print(f"Processing complete! Results saved in '{output_folder}' folder.")
