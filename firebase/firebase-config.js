// firebase/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const firebaseConfig = {

    apiKey: "AIzaSyC1fvvkyCXGdoFQMdz_fZ9xxiSw_Oo9tCU",

    authDomain: "disgrafia-app.firebaseapp.com",

    projectId: "disgrafia-app",

    storageBucket: "disgrafia-app.firebasestorage.app",

    messagingSenderId: "250432172213",

    appId: "1:250432172213:web:7c79ac3697800375510efc"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);

export { app, auth, db, storage };