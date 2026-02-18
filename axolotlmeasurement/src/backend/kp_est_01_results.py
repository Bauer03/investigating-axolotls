from ultralytics import YOLO
import os
from pathlib import Path
import sys
import json
import argparse
import math

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


def euclidean(a, b):
    return math.hypot(a['x'] - b['x'], a['y'] - b['y'])


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
                    kp_list = []
                    measurements = {}

                    pts = result.keypoints.xy[0] if len(result.keypoints.xy) > 0 else []
                    pts_conf = result.keypoints.conf[0] if result.keypoints.conf is not None and len(result.keypoints.conf) > 0 else []

                    if len(pts) >= 6:
                        # 6-keypoint model: index order is Tail, Head, midU, midL, leg1, leg2
                        tail     = {"name": "Tail",  "x": float(pts[0][0]), "y": float(pts[0][1]), "confidence": float(pts_conf[0]) if len(pts_conf) > 0 else 0.0}
                        head     = {"name": "Head",  "x": float(pts[1][0]), "y": float(pts[1][1]), "confidence": float(pts_conf[1]) if len(pts_conf) > 1 else 0.0}
                        midU     = {"name": "midU",  "x": float(pts[2][0]), "y": float(pts[2][1]), "confidence": float(pts_conf[2]) if len(pts_conf) > 2 else 0.0}
                        midL     = {"name": "midL",  "x": float(pts[3][0]), "y": float(pts[3][1]), "confidence": float(pts_conf[3]) if len(pts_conf) > 3 else 0.0}
                        leg1     = {"x": float(pts[4][0]), "y": float(pts[4][1]), "confidence": float(pts_conf[4]) if len(pts_conf) > 4 else 0.0}
                        leg2     = {"x": float(pts[5][0]), "y": float(pts[5][1]), "confidence": float(pts_conf[5]) if len(pts_conf) > 5 else 0.0}

                        legs_midpoint = {
                            "name": "legs_midpoint",
                            "x": (leg1["x"] + leg2["x"]) / 2.0,
                            "y": (leg1["y"] + leg2["y"]) / 2.0,
                            "confidence": (leg1["confidence"] + leg2["confidence"]) / 2.0
                        }

                        dist_head_midU    = euclidean(head, midU)
                        dist_midU_midL    = euclidean(midU, midL)
                        dist_midL_legs    = euclidean(midL, legs_midpoint)
                        dist_legs_tail    = euclidean(legs_midpoint, tail)
                        SVL               = dist_head_midU + dist_midU_midL + dist_midL_legs

                        # 5 display points (leg1 + leg2 collapsed into legs_midpoint)
                        kp_list = [head, midU, midL, legs_midpoint, tail]

                        measurements = {
                            "head_to_midU": dist_head_midU,
                            "midU_to_midL": dist_midU_midL,
                            "midL_to_legs_midpoint": dist_midL_legs,
                            "legs_midpoint_to_tail": dist_legs_tail,
                            "total_length": SVL
                        }
                    else:
                        # Fallback: fewer than 6 keypoints — return raw unnamed points
                        for i, (point, point_conf) in enumerate(zip(pts, pts_conf)):
                            kp_list.append({
                                "name": f"Keypoint {i + 1}",
                                "x": float(point[0]),
                                "y": float(point[1]),
                                "confidence": float(point_conf)
                            })

                    image_data = {
                        "image_name": image_path.name,
                        "bounding_box": result.boxes.xyxy.tolist(),
                        "keypoints": kp_list,
                        "measurements": measurements
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
