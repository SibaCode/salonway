import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAkPbUFVsK_gckqAADq8C-hLMbUVqBigks",
  authDomain: "sibaway-30129.firebaseapp.com",
  projectId: "sibaway-30129",
  storageBucket: "sibaway-30129.firebasestorage.app",
  messagingSenderId: "927386642428",
  appId: "1:927386642428:web:0d38ecb075416e4babf479",
  measurementId: "G-M8YF7YCXD4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('🔥 Firebase initialized for project:', firebaseConfig.projectId);
export default app;