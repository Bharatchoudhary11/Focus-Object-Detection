import './style.css';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const video = document.getElementById('video') as HTMLVideoElement;
const canvas = document.getElementById('overlay') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const logs = document.getElementById('logs') as HTMLUListElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;

let faceModel: blazeface.BlazeFaceModel;
let objectModel: cocoSsd.ObjectDetection;
let stream: MediaStream;
let recorder: MediaRecorder;
const recordingChunks: Blob[] = [];

let lastFaceTime = 0;
let lastFocusedTime = 0;
let lastObjectCheck = 0;
let focusLostLogged = false;
let noFaceLogged = false;
let multiFaceLogged = false;
let detecting = false;
let animationId = 0;

function logEvent(msg: string) {
  const li = document.createElement('li');
  li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logs.appendChild(li);
}

async function initModels() {
  [faceModel, objectModel] = await Promise.all([
    blazeface.load(),
    cocoSsd.load()
  ]);
}

async function start() {
  startBtn.disabled = true;
  await initModels();
  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  video.srcObject = stream;
  await video.play();
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => recordingChunks.push(e.data);
  recorder.start();
  lastFaceTime = Date.now();
  lastFocusedTime = Date.now();
  detecting = true;
  detect();
  stopBtn.disabled = false;
}

function stop() {
  stopBtn.disabled = true;
  detecting = false;
  cancelAnimationFrame(animationId);
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  const blob = new Blob(recordingChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recording.webm';
  a.click();
  startBtn.disabled = false;
}

async function detect() {
  if (!detecting) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const faces = await faceModel.estimateFaces(video, false);

  if (faces.length === 0) {
    if (!noFaceLogged && Date.now() - lastFaceTime > 10000) {
      logEvent('No face detected for >10s');
      noFaceLogged = true;
    }
  } else {
    lastFaceTime = Date.now();
    noFaceLogged = false;

    if (faces.length > 1 && !multiFaceLogged) {
      logEvent('Multiple faces detected');
      multiFaceLogged = true;
    }
    if (faces.length === 1) {
      multiFaceLogged = false;
    }

    const face = faces[0];
    const [x1, y1] = face.topLeft as number[];
    const [x2, y2] = face.bottomRight as number[];
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const threshX = canvas.width * 0.2;
    const threshY = canvas.height * 0.2;
    if (
      Math.abs(cx - canvas.width / 2) > threshX ||
      Math.abs(cy - canvas.height / 2) > threshY
    ) {
      if (!focusLostLogged && Date.now() - lastFocusedTime > 5000) {
        logEvent('User looking away for >5s');
        focusLostLogged = true;
      }
    } else {
      lastFocusedTime = Date.now();
      focusLostLogged = false;
    }
  }

  if (Date.now() - lastObjectCheck > 1000) {
    lastObjectCheck = Date.now();
    const objects = await objectModel.detect(video);
    objects.forEach((obj) => {
      if (['cell phone', 'book', 'laptop'].includes(obj.class)) {
        logEvent(`Suspicious item detected: ${obj.class}`);
      }
    });
  }

  if (detecting) {
    animationId = requestAnimationFrame(detect);
  }
}

startBtn.addEventListener('click', () => {
  start().catch((e) => console.error(e));
});
stopBtn.addEventListener('click', stop);
