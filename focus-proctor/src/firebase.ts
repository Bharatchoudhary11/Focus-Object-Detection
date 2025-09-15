import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: 'AIzaSyCVLBqo3kG1QqyOoCnvLhdxdh7B_NHQjnA',
  authDomain: 'face-detection-88234.firebaseapp.com',
  projectId: 'face-detection-88234',
  // storageBucket expects the bucket name, not a URL
  storageBucket: 'face-detection-88234.appspot.com',
  messagingSenderId: '179268555151',
  appId: '1:179268555151:web:f8c3be4bae90bee1ec7bfa',
  measurementId: 'G-RWT7LGBPDT',
};

const app = initializeApp(firebaseConfig);
// Improve connectivity in restricted environments (proxies, ad blockers)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
export const storage = getStorage(app);
