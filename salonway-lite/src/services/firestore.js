// src/services/firestore.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Salons
export const salonsCollection = collection(db, 'salons');

export const getSalons = async () => {
  const querySnapshot = await getDocs(salonsCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createSalon = async (salonData) => {
  const docRef = await addDoc(salonsCollection, {
    ...salonData,
    createdAt: serverTimestamp(),
    status: 'active',
    staffCount: 0,
    revenue: 0
  });
  return docRef.id;
};

export const getSalonById = async (id) => {
  const docRef = doc(db, 'salons', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

// Staff
export const staffCollection = collection(db, 'staff');

export const getStaffBySalonId = async (salonId) => {
  const q = query(staffCollection, where('salonId', '==', salonId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Services
export const servicesCollection = collection(db, 'services');

export const getServicesBySalonId = async (salonId) => {
  const q = query(servicesCollection, where('salonId', '==', salonId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};