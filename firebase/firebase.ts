import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIbqSTchnI5lx5SsvQqWT_8ARzrpJHgM8",
  authDomain: "chadgpt-d08b1.firebaseapp.com",
  projectId: "chadgpt-d08b1",
  storageBucket: "chadgpt-d08b1.appspot.com",
  messagingSenderId: "175459165431",
  appId: "1:175459165431:web:9b8dd4bb6ac91e59291ff2",
};

// Initialize Firebase using Singleton Pattern
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
