// /src/firebaseConfig.ts
// IMPORTANT: Replace with your actual Firebase project configuration!

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAq7yGsWNbcK8v85vvsi_x070JFVZIgEkc",
  authDomain: "customer-management-syst-87151.firebaseapp.com",
  projectId: "customer-management-syst-87151",
  storageBucket: "customer-management-syst-87151.firebasestorage.app",
  messagingSenderId: "738357441662",
  appId: "1:738357441662:web:b0e9faaec9712b96cdd42f",
  measurementId: "G-ZNG812CQKS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore instance
const db = getFirestore(app);

// Get Auth instance
const auth = getAuth(app);

export { db, auth, app };

