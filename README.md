# 🧭 Project Overview

This project is a React Native-based application that integrates a **real-time camera feed**, **traffic light recognition model**, and **Tmap-based route guidance** to provide users with both visual and voice-assisted navigation.

---

## 🧠 Model Overview

- Trained for **100 epochs** with `EarlyStopping(patience=5)`
- Early stopped at **epoch 46**
- The PyTorch `.pt` model was converted to **TensorFlow Lite (.tflite)**
- Accuracy:
  - Left: model accuracy graph
  - Right: model output using a YOLO test image

---

## 📱 Main Screens

### 🏠 1. HomeScreen

- Displays user **location-based map**
- Implemented using **Tmap Raster Map SDK (JS)** in an HTML file and embedded via **WebView**
- On app startup, `Tts.speak` announces:  
  → *“Would you like to start the app?”*
- Pressing the "MapCam" button navigates to the next screen

### 🗺️ 2. MapCam

- **Top**: Real-time camera feed using `react-native-vision-camera`
- **Bottom**: Route guidance via **Tmap Vector JS**

Key features:
- Users input start and destination → route is displayed
- If deviating more than 10m from the route → rerouting is triggered
- Voice guidance via `react-native-tts`:  
  → *“New route found”*

---

## 📁 Directory Overview

| Directory Name      | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `TmapWebView/`       | Main directory with all integrated features (camera, TTS, routing)          |
| `App/`              | Basic bundling test project (no longer used)                                |
| `CameraApp/`        | Standalone camera functionality testing                                     |
| `Tmap-TTS-App/`     | Tmap and TTS integration test project                                       |
| `TTS_START/`        | Early-stage testing for text-to-speech feature                              |
| `Tmap webview/`     | Real-time camera focused on sidewalk (for vision testing)                   |
| `TmapProject/`      | Early prototype with exposed API keys (not in use)                          |
| `OsppApp/`          | Early test version of Home screen                                           |
| `model/`            | Contains the `.tflite` model and label files                                |
| `MapCam.js`         | Core screen component within `TmapWebView/`                                 |
| `Camera/`           | Single-file test for camera functionality                                   |
| `README.md.docx`    | Draft explanation document for internal reference (not part of the app)     |

> Note: The `Camera_test/` directory has been deleted in recent commits.

---

## 🔗 Libraries Used

- [react-native-vision-camera](https://github.com/mrousavy/react-native-vision-camera) – Device camera access
- [react-native-tts](https://github.com/ak1394/react-native-tts) – Text-to-Speech functionality
- [Tmap API (Web)](https://tmapapi.sktelecom.com/main.html#webV2Sample) – SK Telecom map & navigation API
