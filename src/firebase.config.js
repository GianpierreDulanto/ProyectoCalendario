// ======================================
// FIREBASE CONFIGURATION
// ======================================
// Reemplaza estos valores con tus credenciales de Firebase Console
// https://console.firebase.google.com/

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAuVa4JbK9XTFtjYpX6H_bJN_XWhG3j9S4",
  authDomain: "planificador-23f95.firebaseapp.com",
  projectId: "planificador-23f95",
  storageBucket: "planificador-23f95.firebasestorage.app",
  messagingSenderId: "315657225842",
  appId: "1:315657225842:web:01e26818778d5e168164eb",
  measurementId: "G-6W9YHT2HNW"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
// Configurar persistencia de sesión en localStorage
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;
