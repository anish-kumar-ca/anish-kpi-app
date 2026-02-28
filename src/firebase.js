import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase configuration for Anish's KPI app
// Get these values from your Firebase Console (Settings → Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSyDUX1XWEsoX-_It9of5ZMsDA77OkRl2xW4",
  authDomain: "anish-kpi.firebaseapp.com",
  databaseURL: "https://anish-kpi-default-rtdb.firebaseio.com",
  projectId: "anish-kpi",
  storageBucket: "anish-kpi.firebasestorage.app",
  messagingSenderId: "487617828374",
  appId: "1:487617828374:web:b4b0c9802a720f34368737",
  measurementId: "G-W57L6V4VL6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);

// Get a reference to the Realtime Database
export const db = getDatabase(app);
