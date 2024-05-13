// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuOZbTynY7axfAga1g76ron9dACfSZm1A",
  authDomain: "rule-puzzle.firebaseapp.com",
  databaseURL: "https://rule-puzzle-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rule-puzzle",
  storageBucket: "rule-puzzle.appspot.com",
  messagingSenderId: "602507812720",
  appId: "1:602507812720:web:9d467bffbacffa420739b5",
  measurementId: "G-GD2FQVLE4D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);	

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export {
	app,
	db,
	analytics
}