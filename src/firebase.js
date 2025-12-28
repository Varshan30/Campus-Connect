// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3q6SnmT_o0CkRqtfge9PxGbxiXMj25u0",
  authDomain: "campus-connect-b8059.firebaseapp.com",
  projectId: "campus-connect-b8059",
  storageBucket: "campus-connect-b8059.firebasestorage.app",
  messagingSenderId: "170595996344",
  appId: "1:170595996344:web:c58d50393267fba2321a4d",
  measurementId: "G-B8BRTSCQ50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };