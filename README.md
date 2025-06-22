# 🧭 Project Overview

This project is a React Native application that integrates a **real-time camera feed**, **traffic light recognition model**, and **Tmap-based route guidance**, offering users both **visual and voice-assisted navigation**.

---

## 🧠 Model Overview

- Trained for **100 epochs** with `EarlyStopping(patience=5)`
- Training stopped early at **epoch 46**
- The PyTorch `.pt` model was converted to **TensorFlow Lite (.tflite)**
- **Model Performance**:
  - **Left**: Accuracy graph  
  - **Right**: Sample YOLO test image output

---

## 📱 Main Screens

### 🏠 1. HomeScreen
![HomeScreen](Images%20for%20README/KakaoTalk_20250621_230051611.png)
- Displays a **location-based map**
- Implemented using the **Tmap Raster Map SDK (JavaScript)** embedded via **WebView**
- On app launch, `Tts.speak` announces:  
  → *“Would you like to start the app?”*
- Tapping the **"MapCam"** button navigates to the next screen

### 🗺️ 2. MapCam
![MapCam](Images%20for%20README/KakaoTalk_20250621_211951451_02.png)
- **Top**: Real-time camera feed powered by `react-native-vision-camera`
- **Bottom**: Route guidance using **Tmap Vector JS**

**Key features:**
![find new route](Images%20for%20README/KakaoTalk_20250621_211951451_03.png)
- Users input a **starting point and destination** → route is displayed
- If deviating more than **10 meters** from the route, **re-routing** is triggered
- Voice guidance via `react-native-tts`:  
  → *“New route found”*


---

## 📁 Directory Structure

| Directory Name        | Description                                                                                     |
|------------------------|-------------------------------------------------------------------------------------------------|
| `TmapWebView/`          | Main application directory containing integrated features such as camera, TTS, and route guidance |
| `App/`                 | Initial bundling test project (deprecated)                                                      |
| `CameraApp/`           | Standalone test for camera functionality                                                        |
| `Tmap-TTS-App/`        | Test project for integrating Tmap and TTS                                                        |
| `TTS_START/`           | Early-stage testing for text-to-speech functionality                                            |
| `Tmap webview/`        | Sidewalk-focused camera testing for vision-based detection                                       |
| `TmapProject/`         | Early prototype with exposed API keys (no longer in use)                                        |
| `OsppApp/`             | Early prototype of the Home screen                                                              |
| `model/`               | Contains the `.tflite` model and label files                                                    |
| `MapCam.js`            | **Final integrated screen** that combines Tmap route guidance, real-time camera feed, and off-route detection with TTS-based voice re-routing alerts |
| `Camera/`              | Single-file camera test component                                                               |
| `README.md.docx`       | Draft documentation for internal reference (not part of the final app)                          |
| `Images for README/`   | Contains screenshots and visual assets used in the `README.md` to illustrate app features       |

> 🔄 Note: The `Camera_test/` directory was removed in recent commits.


---

## 🔗 Libraries Used

- [react-native-vision-camera](https://github.com/mrousavy/react-native-vision-camera) – Device camera access
- [react-native-tts](https://github.com/ak1394/react-native-tts) – Text-to-Speech functionality
- [Tmap API (Web)](https://tmapapi.sktelecom.com/main.html#webV2Sample) – SK Telecom map & navigation API
