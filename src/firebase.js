import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA48nOhgNrRk8VQXgOR4Ci1o30jEdYnWoI",
  authDomain: "meraki-papeleria-creativa.firebaseapp.com",
  projectId: "meraki-papeleria-creativa",
  storageBucket: "meraki-papeleria-creativa.firebasestorage.app",
  messagingSenderId: "684864584961",
  appId: "1:684864584961:web:863873633459589ac56f00"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);