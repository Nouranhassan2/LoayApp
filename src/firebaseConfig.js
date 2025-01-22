


// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  // تأكد من تحديث هذه القيم من مشروع Firebase الخاص بك
  apiKey: "AIzaSyC0ecbGXGJbG2jnoF9aPKlP2OToFX9cOLg",
  authDomain: "loyapp-343d9.firebaseapp.com",
  projectId: "loyapp-343d9",
  storageBucket: "loyapp-343d9.appspot.com",
  messagingSenderId: "895403386155",
  appId: "1:895403386155:web:231764bddbce490382116e",
  measurementId: "G-BK0E96EXPN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export { app, auth, db, functions };