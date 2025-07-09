from ultralytics import YOLO
import os
from pathlib import Path

model = YOLO(r'D:\Axolotl\roboflow\converted\test\axolotl_keypoints\improved_model3\weights\best.pt') # change this

folder_path = r'D:\Axolotl\roboflow\converted\api' # change this

output_folder = 'prediction_results'
os.makedirs(output_folder, exist_ok=True)
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

        # Create output filename (keeping original name with suffix)
        output_filename = f"{image_path.stem}_prediction{image_path.suffix}"
        output_path = os.path.join(output_folder, output_filename)


        # Save the results
        results[0].save(output_path)

    except Exception as e:
        print(f"Error processing {image_path.name}: {str(e)}")
        continue

print(f"Processing complete! Results saved in '{output_folder}' folder.")
