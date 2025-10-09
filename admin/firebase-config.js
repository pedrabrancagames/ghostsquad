// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHVatoCWMcCWLzJfH993OOVRS04S3f3oI",
  authDomain: "ghostfire-bbb16.firebaseapp.com",
  databaseURL: "https://ghostfire-bbb16-default-rtdb.firebaseio.com",
  projectId: "ghostfire-bbb16",
  storageBucket: "ghostfire-bbb16.appspot.com",
  messagingSenderId: "149492792943",
  appId: "1:149492792943:web:9db199904a4daf7c0e979a",
  measurementId: "G-36GHBETYNC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make available globally for other scripts
window.firebaseConfig = firebaseConfig;