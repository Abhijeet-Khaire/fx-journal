import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDfmaTLZLg2vwjyf2YZXaZGRO-6zlC5jqE",
  authDomain: "fx-journal-a839a.firebaseapp.com",
  projectId: "fx-journal-a839a",
  storageBucket: "fx-journal-a839a.firebasestorage.app",
  messagingSenderId: "695692984392",
  appId: "1:695692984392:web:8537892a2049abd817d87d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
