from ultralytics import YOLO
from google.colab import files
import shutil
import os

# 1. 학습된 모델 불러오기
model = YOLO("YOLOv8n-optimized.pt")

# 2. float32 export
float32_results = model.export(format="tflite", int8=False, dynamic=False, project="tflite_export", name="float32", exist_ok=True)
float32_path = "/content/YOLOv8n-optimized_saved_model/YOLOv8n-optimized_float32.tflite"

# 3. int8 export
int8_results = model.export(format="tflite", int8=True, dynamic=False, project="tflite_export", name="int8", exist_ok=True)
int8_path = "/content/YOLOv8n-optimized_saved_model/YOLOv8n-optimized_int8.tflite"

# 4. 평가 함수 (YOLO 제공 val셋 사용)
def evaluate_tflite(tflite_model_path, data_yaml):
    eval_model = YOLO(tflite_model_path)
    metrics = eval_model.val(data=data_yaml, imgsz=640, split="val", verbose=False).box
    return metrics.map

# 5. 평가 진행
print("🧪 float32 평가 중...")
float32_map = evaluate_tflite(float32_path, "/content/dataset/data.yaml")

print("🧪 int8 평가 중...")
int8_map = evaluate_tflite(int8_path, "/content/dataset/data.yaml")

# 6. 결과 비교 및 최종 선택
print(f"\nfloat32 mAP50-95: {float32_map:.4f}")
print(f"int8    mAP50-95: {int8_map:.4f}")

if int8_map >= float32_map:
    final_path = int8_path
    print("INT8 모델 선택")
else:
    final_path = float32_path
    print("Float32 모델 선택")

# 7. best_model.tflite로 저장
shutil.copyfile(final_path, "best_model.tflite")
print("최종 모델 저장 완료 → best_model.tflite")

# 8. 로컬 다운로드
files.download("best_model.tflite")
