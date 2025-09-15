import './style.css';
import { db, storage } from './firebase';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const video = document.getElementById('video') as HTMLVideoElement;
const canvas = document.getElementById('overlay') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const logs = document.getElementById('logs') as HTMLUListElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;

startBtn.disabled = true;

let faceModel: any; // Loaded dynamically
let objectModel: any; // Loaded dynamically
let stream: MediaStream;
let recorder: MediaRecorder;
const recordingChunks: Blob[] = [];

// Firebase session state
let sessionDocId: string | null = null;

let lastFaceTime = 0;
let lastFocusedTime = 0;
let focusLostLogged = false;
let noFaceLogged = false;
let multiFaceLogged = false;
let lastDirection: 'left' | 'right' | null = null;
let detecting = false;
let animationId = 0;

function logEvent(msg: string) {
  const li = document.createElement('li');
  li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logs.appendChild(li);

  // Fire-and-forget store to Firestore if a session exists
  if (sessionDocId) {
    const ev = {
      message: msg,
      ts: new Date(),
    } as const;
    addDoc(collection(db, 'sessions', sessionDocId, 'events'), {
      ...ev,
      serverTs: serverTimestamp(),
    }).catch((e) => console.warn('Failed to write event', e));
  }
}

async function loadModels() {
  const [blaze, coco, tf] = await Promise.all([
    import('@tensorflow-models/blazeface'),
    import('@tensorflow-models/coco-ssd'),
    import('@tensorflow/tfjs'),
  ]);
  // Ensure backend is initialized before using models
  if (tf.ready) {
    await tf.ready();
  }
  faceModel = await blaze.load();
  objectModel = await coco.load();
}

loadModels().finally(() => {
  startBtn.disabled = false;
});

async function start() {
  startBtn.disabled = true;
  logs.innerHTML = '';
  focusLostLogged = false;
  noFaceLogged = false;
  multiFaceLogged = false;
  recordingChunks.length = 0;
  // Start camera immediately; models continue loading in background
  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  video.srcObject = stream;
  await video.play();
  // Ensure video has non-zero dimensions before starting detection
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    await new Promise<void>((resolve) => {
      const tryResolve = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          video.removeEventListener('loadedmetadata', tryResolve);
          video.removeEventListener('resize', tryResolve);
          video.removeEventListener('playing', tryResolve);
          resolve();
        }
      };
      video.addEventListener('loadedmetadata', tryResolve);
      video.addEventListener('resize', tryResolve);
      video.addEventListener('playing', tryResolve);
      // Also try once on next frame in case metadata already updated
      requestAnimationFrame(tryResolve);
    });
  }
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => recordingChunks.push(e.data);
  recorder.start();

  // Create a new session in Firestore
  try {
    const session = await addDoc(collection(db, 'sessions'), {
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      video: { width: video.videoWidth, height: video.videoHeight },
      status: 'recording',
    });
    sessionDocId = session.id;
  } catch (e) {
    console.warn('Failed to create session doc', e);
  }
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

  // Upload to Firebase Storage and update session
  if (sessionDocId) {
    const path = `recordings/${sessionDocId}.webm`;
    const storageRef = ref(storage, path);
    uploadBytes(storageRef, blob)
      .then(() => getDownloadURL(storageRef))
      .then(async (downloadURL) => {
        await updateDoc(doc(db, 'sessions', sessionDocId!), {
          endedAt: serverTimestamp(),
          status: 'stopped',
          recordingPath: path,
          recordingUrl: downloadURL,
        });
      })
      .catch((e) => console.warn('Failed to upload/update session', e));
  }
}

async function detect() {
  if (!detecting) return;
  const vw = video.videoWidth | 0;
  const vh = video.videoHeight | 0;
  const ready = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

  // Wait until video has valid dimensions and data
  if (vw === 0 || vh === 0 || !ready) {
    animationId = requestAnimationFrame(detect);
    return;
  }

  // Update canvas size to match the current video frame
  if (canvas.width !== vw || canvas.height !== vh) {
    canvas.width = vw;
    canvas.height = vh;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // If models aren't ready, skip detection this frame
  if (!faceModel || !objectModel) {
    animationId = requestAnimationFrame(detect);
    return;
  }

  try {
    const faces = await faceModel.estimateFaces(video, false);

    // The video element can occasionally report zero dimensions if the stream
    // is interrupted between awaits. Skip processing in that case to avoid
    // WebGL texture creation errors.
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationId = requestAnimationFrame(detect);
      return;
    }

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

      // Draw frames around all detected faces
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'lime';
      faces.forEach((f: any) => {
        const [fx1, fy1] = f.topLeft as number[];
        const [fx2, fy2] = f.bottomRight as number[];
        ctx.strokeRect(fx1, fy1, fx2 - fx1, fy2 - fy1);
      });

      // Focus tracking based on the primary face (first)
      const primary = faces[0];
      const [x1, y1] = primary.topLeft as number[];
      const [x2, y2] = primary.bottomRight as number[];
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const threshX = canvas.width * 0.2;
      const threshY = canvas.height * 0.2;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      let dir: 'left' | 'right' | null = null;
      if (cx < centerX - threshX) dir = 'left';
      else if (cx > centerX + threshX) dir = 'right';

      const offCenter = dir !== null || Math.abs(cy - centerY) > threshY;
      if (offCenter) {
        if (
          (dir !== lastDirection || !focusLostLogged) &&
          Date.now() - lastFocusedTime > 5000
        ) {
          logEvent(dir ? `User looking away (${dir})` : 'User looking away');
          focusLostLogged = true;
          lastDirection = dir;
        }
      } else {
        lastFocusedTime = Date.now();
        focusLostLogged = false;
        lastDirection = null;
      }
    }

    // Re-check dimensions before running object detection.
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationId = requestAnimationFrame(detect);
      return;
    }

    const objects = await objectModel.detect(video);

    // Draw frames around all detected objects with labels
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'red';
    ctx.font = '14px sans-serif';
    ctx.textBaseline = 'top';
    objects.forEach((obj: any) => {
      const [x, y, w, h] = obj.bbox as [number, number, number, number];
      ctx.strokeRect(x, y, w, h);
      const label = `${obj.class} ${(obj.score * 100).toFixed(0)}%`;
      const padding = 2;
      const metrics = ctx.measureText(label);
      const textW = metrics.width + padding * 2;
      const textH = 16 + padding * 2; // approximate height
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x, y, textW, textH);
      ctx.fillStyle = 'white';
      ctx.fillText(label, x + padding, y + padding);

      if (['cell phone', 'book', 'laptop'].includes(obj.class)) {
        logEvent(`Suspicious item detected: ${obj.class}`);
      }
    });
  } catch (err) {
    console.error('Detection error:', err);
    // Swallow and continue next frame
  }

  if (detecting) {
    animationId = requestAnimationFrame(detect);
  }
}

startBtn.addEventListener('click', () => {
  start().catch((e) => console.error(e));
});
stopBtn.addEventListener('click', stop);

// Auto-start on page load to minimize perceived delay after redirect
// This will prompt for camera/microphone permissions immediately
start().catch((e) => console.error(e));
