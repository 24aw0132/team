// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBK6nz8E5yhYektsaF2Xzrmv2kArmM5gg8',
  authDomain: 'web-koimoyou.firebaseapp.com',
  projectId: 'web-koimoyou',
  storageBucket: 'web-koimoyou.appspot.com',
  messagingSenderId: '505803301244',
  appId: '1:505803301244:web:afaedd995de48d6b6604f9'
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };


