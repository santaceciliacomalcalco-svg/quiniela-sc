import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "A1zaSyAOEIKRtitvUcOyq-jIkMbRpiPp3WFX6mM",
  authDomain: "quiniela-sc.firebaseapp.com",
  projectId: "quiniela-sc",
  storageBucket: "quiniela-sc.firebasestorage.app",
  messagingSenderId: "260219925764",
  appId: "1:260219925764:web:d0cd79b5e196dd4f72cc51"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);