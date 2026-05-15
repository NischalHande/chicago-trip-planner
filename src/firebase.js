import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD36F2tqL7w11zP_x1b5kxN4Gq8zBIC7P8",
  authDomain: "chicago-trip-planner.firebaseapp.com",
  projectId: "chicago-trip-planner",
  storageBucket: "chicago-trip-planner.firebasestorage.app",
  messagingSenderId: "380098386754",
  appId: "1:380098386754:web:37cd5765b872fb6da146db",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
