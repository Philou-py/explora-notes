import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAN3ILAetxZqpWtL3uPW0B5iYD0wKtbx3U",
  authDomain: "explora-notes-dev.firebaseapp.com",
  projectId: "explora-notes-dev",
  storageBucket: "explora-notes-dev.appspot.com",
  messagingSenderId: "412389402336",
  appId: "1:412389402336:web:af0db90f57ac7b8e7dd285",
};

export const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
