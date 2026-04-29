import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAqDEZOtVtpsrgZaz2MTqlrd6HjMWCtiM8",
  authDomain: "pcosense-ai-467dc.firebaseapp.com",
  databaseURL: "https://pcosense-ai-467dc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pcosense-ai-467dc",
  storageBucket: "pcosense-ai-467dc.firebasestorage.app",
  messagingSenderId: "405457268788",
  appId: "1:405457268788:web:52ffea4ad2deec93b49a61",
  measurementId: "G-RLC68MZ6T8"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;
