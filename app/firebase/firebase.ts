// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore/lite";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABEgis5Rd4fiF5U64lGvgomeH2r0MNG-w",
  authDomain: "wetravel-569a0.firebaseapp.com",
  projectId: "wetravel-569a0",
  storageBucket: "wetravel-569a0.firebasestorage.app",
  messagingSenderId: "992264324404",
  appId: "1:992264324404:web:ae3cef2cdb7e519d68d161",
  measurementId: "G-YNJPZ4B478"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {app, auth, db};