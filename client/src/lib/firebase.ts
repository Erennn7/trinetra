import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDhw0Rv6ZQ7qPnpAf5cu7Z5bSAz0usoHgI',
  authDomain: 'trinetra-pandharpur.firebaseapp.com',
  projectId: 'trinetra-pandharpur',
  storageBucket: 'trinetra-pandharpur.firebasestorage.app',
  messagingSenderId: '641685390658',
  appId: '1:641685390658:web:1049c0e2980e9e6263f4db',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
