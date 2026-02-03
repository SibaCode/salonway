// src/services/firestoreService.js
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all salons
export const getSalons = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'salons'));
    const salons = [];
    querySnapshot.forEach((doc) => {
      salons.push({ id: doc.id, ...doc.data() });
    });
    return salons;
  } catch (error) {
    console.error('Error getting salons:', error);
    return [];
  }
};

// Create a new salon
export const createSalon = async (salonData) => {
  try {
    const docRef = await addDoc(collection(db, 'salons'), {
      ...salonData,
      createdAt: serverTimestamp(),
      status: 'active',
      staffCount: 0,
      revenue: 0,
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating salon:', error);
    return { success: false, error: error.message };
  }
};