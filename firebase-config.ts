import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCHDji39_QjYHJmkOTLywtbjna-x5s496c",
  authDomain: "exploranotes-9f012.firebaseapp.com",
  projectId: "exploranotes-9f012",
  storageBucket: "exploranotes-9f012.appspot.com",
  messagingSenderId: "46311163536",
  appId: "1:46311163536:web:6eb59cbaff9534fe26ba15",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
