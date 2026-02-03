// src/test-firebase.js
import { db } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';

console.log('Firebase DB object:', db);

// Test connection
const testFirebase = async () => {
  try {
    console.log('Testing Firebase connection...');
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('Firebase connection successful!', snapshot);
  } catch (error) {
    console.error('Firebase connection failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
};

testFirebase();