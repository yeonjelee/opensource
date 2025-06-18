!pip install roboflow
!pip install ultralytics

from roboflow import Roboflow
import glob
import os
import shutil
from collections import Counter
from ultralytics import YOLO
from shutil import copyfile

rf = Roboflow(api_key=roboflow_api_key)
project = rf.workspace("safewalkbd").project("safewalkbd-l8jbn")
version = project.version(9)
dataset = version.download("yolov8")
rf = Roboflow(api_key=roboflow_api_key)
project = rf.workspace("data-dynamos").project("streets-and-crosswalks")
version = project.version(42)
dataset = version.download("yolov8")
# SafeWalkBD의 class ID → 통합 class ID
safewalkbd_map = {
    0: 0,    # Animal
    1: 6,    # Crosswalk
    2: 10,   # Obstacle
    3: 11,   # Over-bridge
    4: 12,   # Person
    5: 14,   # Pole
    6: 15,   # Pothole
    7: 16,   # Railway
    8: 17,   # Road-barrier
    9: 19,   # Sidewalk
    10: 20,  # Stairs
    11: 21,  # Traffic-light
    12: 22,  # Traffic-sign
    13: 23,  # Train
    14: 24,  # Tree
    15: 28,  # Vehicle
}

# StreetsAndCrosswalks의 class ID → 통합 class ID
streets_map = {
    1: 1,    # bench
    2: 2,    # bike
    3: 3,    # bin
    4: 4,    # bush
    5: 4,    # bush- (합침)
    6: 5,    # car
    7: 6,    # crosswalk
    8: 7,    # fence
    9: 8,    # minipole
    10: 9,   # miniwall
    11: 12,  # person
    12: 13,  # pinetree
    13: 14,  # pole
    14: 18,  # scooter
    15: 24,  # tree
    16: 25,  # truck
    17: 26,  # trunk
    18: 27,  # wall
}

print('SafeWalkBD\n\n')

label_files = glob.glob("/content/SafeWalkBD-9/train/labels/*.txt")
print(f"라벨 파일 수 (train): {len(label_files)}")

label_files = glob.glob("/content/SafeWalkBD-9/valid/labels/*.txt")
print(f"라벨 파일 수 (valid): {len(label_files)}")

print('Streets-and-Crosswalks\n\n')

label_files = glob.glob("/content/Streets-and-Crosswalks-42/train/labels/*.txt")
print(f"라벨 파일 수 (train): {len(label_files)}")

label_files = glob.glob("/content/Streets-and-Crosswalks-42/valid/labels/*.txt")
print(f"라벨 파일 수 (valid): {len(label_files)}")

def remap_labels(label_dir, id_map, drop_ids=None):
    for filename in os.listdir(label_dir):
        if filename.endswith('.txt'):
            file_path = os.path.join(label_dir, filename)
            with open(file_path, 'r') as f:
                lines = f.readlines()

            new_lines = []
            for line in lines:
                parts = line.strip().split()
                class_id = int(parts[0])

                if drop_ids and class_id in drop_ids:
                    continue  # drop_ids에 해당하는 클래스는 건너뜀

                if class_id in id_map:
                    new_class_id = id_map[class_id]
                    new_line = f"{new_class_id} {' '.join(parts[1:])}\n"
                    new_lines.append(new_line)

            # 줄이 아예 없어도 빈 파일로 덮어씀 (YOLO 포맷은 빈 라벨 허용)
            with open(file_path, 'w') as f:
                f.writelines(new_lines)


remap_labels("/content/SafeWalkBD-9/train/labels", safewalkbd_map)
remap_labels("/content/SafeWalkBD-9/valid/labels", safewalkbd_map)
remap_labels("/content/SafeWalkBD-9/test/labels", safewalkbd_map)
remap_labels("/content/Streets-and-Crosswalks-42/train/labels", streets_map)
remap_labels("/content/Streets-and-Crosswalks-42/valid/labels", streets_map)
remap_labels("/content/Streets-and-Crosswalks-42/test/labels", streets_map)

src1 = "/content/SafeWalkBD-9"
src2 = "/content/Streets-and-Crosswalks-42"
dataset = "/content/dataset"

# 병합할 대상 디렉토리 생성
for split in ['train', 'valid', 'test']:
    os.makedirs(f"{dataset}/images/{split}", exist_ok=True)
    os.makedirs(f"{dataset}/labels/{split}", exist_ok=True)

def merge_dataset(src, dst):
    for split in ['train', 'valid']:
        src_img = os.path.join(src, split, 'images')
        src_label = os.path.join(src, split, 'labels')
        dst_img = os.path.join(dst, 'images', split)
        dst_label = os.path.join(dst, 'labels', split)

        if os.path.exists(src_img):
            for f in os.listdir(src_img):
                shutil.copy(os.path.join(src_img, f), dst_img)

        if os.path.exists(src_label):
            for f in os.listdir(src_label):
                shutil.copy(os.path.join(src_label, f), dst_label)

# 실행
merge_dataset(src1, dataset)
merge_dataset(src2, dataset)

yaml_text = """
train: /content/dataset/images/train
val: /content/dataset/images/valid
nc: 29
names: [
    'Animal', 'Bench', 'Bike', 'Bin', 'Bush', 'Car', 'Crosswalk',
    'Fence', 'Minipole', 'Miniwall', 'Obstacle', 'Over-bridge', 'Person', 'Pinetree',
    'Pole', 'Pothole', 'Railway', 'Road-barrier', 'Scooter', 'Sidewalk',
    'Stairs', 'Traffic-light', 'Traffic-sign', 'Train', 'Tree', 'Truck', 'Trunk', 'Vehicle',
    'Wall'
]
"""

with open("/content/dataset/data.yaml", "w") as f:
  f.write(yaml_text.strip())

!cat /content/dataset/data.yaml

# YOLO 라벨 텍스트 파일들이 저장된 경로
label_path = "/content/dataset/labels/train"  # 또는 valid, test 등

label_count = Counter()

for label_file in os.listdir(label_path):
    if label_file.endswith(".txt"):
        with open(os.path.join(label_path, label_file), "r") as f:
            for line in f:
                class_id = line.strip().split()[0]  # 첫 번째 항목이 클래스 ID
                label_count[int(class_id)] += 1

# 출력
print("클래스별 라벨 수:")
for class_id, count in sorted(label_count.items()):
    print(f"클래스 {class_id}: {count}개")

# YOLOv8 모델만 사용
model_name = "YOLOv8n"
model = YOLO("yolov8n.pt")

print(f"{model_name} 학습 시작...")

try:
    # 학습 실행
    results = model.train(
        data="/content/dataset/data.yaml",
        epochs=100,
        imgsz=640,
        project="model_only_yolov8",
        name=model_name,
        exist_ok=True,
        save=True,
        verbose=False,
        patience=5  # EarlyStopping
    )

    # metrics 추출
    if hasattr(model, "metrics"):
        metrics = model.metrics.box
        print(f"""
        학습 완료! 주요 성능:
        - mAP@0.5     : {metrics.map50:.4f}
        - mAP@0.5:0.95: {metrics.map:.4f}
        - Precision   : {metrics.mp:.4f}
        - Recall      : {metrics.mr:.4f}
        """)

    # best.pt 저장
    save_dir = model.trainer.save_dir
    best_path = os.path.join(save_dir, 'weights', 'best.pt')
    last_path = os.path.join(save_dir, 'weights', 'last.pt')

    if os.path.exists(best_path):
        copyfile(best_path, f"{model_name}-optimized.pt")
    elif os.path.exists(last_path):
        copyfile(last_path, f"{model_name}-optimized.pt")

    print(f"{model_name}-optimized.pt 저장 완료")

except Exception as e:
    print(f"❌ 학습 중 오류 발생: {str(e)}")
