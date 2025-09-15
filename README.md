# Focus Object Detection

This project demonstrates browser-based proctoring using TensorFlow.js models for face and object detection. Session events and recordings are saved to **Firebase** for later review.

## Features
- Detects faces to track user attention and triggers events when the user looks away or multiple faces appear.
- Uses COCO-SSD to flag suspicious objects such as phones, books or laptops.
- Records the camera stream and uploads the video to Firebase Storage.
- Logs session metadata and events in Firestore for persistence.

## Setup
1. Navigate into the app directory and install dependencies:
   ```bash
   cd focus-proctor
   npm install
   ```
2. The Firebase project configuration lives in `src/firebase.ts`. Replace the values with your own configuration if needed.

## Development
Run a local dev server:
```bash
npm run dev
```

## Build
Compile TypeScript and bundle the app with Vite:
```bash
npm run build
```

## Preview
Serve the production build locally:
```bash
npm run preview
```
