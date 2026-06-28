import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBCwUrtaYUmQecaQpghFNt3l0nEwnKwjcE',
  authDomain: 'mln122-game.firebaseapp.com',
  projectId: 'mln122-game',
  storageBucket: 'mln122-game.firebasestorage.app',
  messagingSenderId: '400918566706',
  appId: '1:400918566706:web:c771b3d67496eeb8eca92b',
  measurementId: 'G-3LMZ0J3MCG',
  databaseURL:
    'https://mln122-game-default-rtdb.asia-southeast1.firebasedatabase.app',
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export default app;
