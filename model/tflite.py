!pip install ultralytics tensorflow onnx

from google.colab import files
from ultralytics import RTDETR
import os

uploaded = files.upload()
print("업로드된 파일 목록:")
for filename in uploaded.keys():
    print(f"- {filename}")

# 현재 작업 디렉토리 확인
!pwd  # 출력: /content

# 파일 리스트 확인
!ls -lh
# 출력 예시:
# -rw-r--r-- 1 root root 42M best.pt

# 2. RT-DETR 모델 로드
model = RTDETR('/content/best.pt')  # 업로드한 best.pt 경로
results = model.predict('https://ultralytics.com/images/bus.jpg')
results[0].show()

# 3. TFLite 변환
model.export(
    format='tflite',
    int8=True,          # 8bit 양자화 (선택사항)
    imgsz=[640, 640],   # 입력 크기 (학습시 사용한 값)
    optimize=False      # CPU 환경에서는 False 권장
)

# 4. 변환 파일 다운로드
tflite_path = '/content/runs/detect/export/best_int8.tflite'
if os.path.exists(tflite_path):
    print("✅ TFLite 변환 성공!")
    files.download(tflite_path)
else:
    print("❌ 변환 실패. !ls /content/runs/detect/export 로 파일 확인")
