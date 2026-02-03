// src/components/admin/SimpleAdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const SimpleAdminDashboard = () => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if admin is logged in
  useEffect(() => {
    const isAdmin = localStorage.getItem('admin') === 'true';
    if (!isAdmin) {
      navigate('/admin/login');
    } else {
      fetchSalons();
    }
  }, [navigate]);

  const fetchSalons = async () => {
    try {
      console.log('Fetching salons...');
      const querySnapshot = await getDocs(collection(db, 'salons'));
      console.log('Query snapshot:', querySnapshot);
      
      const salonList = [];
      querySnapshot.forEach((doc) => {
        console.log('Doc:', doc.id, '=>', doc.data());
        salonList.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('Salons fetched:', salonList);
      setSalons(salonList);
      setError('');
    } catch (error) {
      console.error('Firestore error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      setError(`Firestore Error: ${error.code} - ${error.message}`);
      
      // For now, show demo data
      setSalons([
        { id: 'demo1', name: 'Demo Salon', ownerEmail: 'demo@email.com' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSalon = async () => {
    try {
      console.log('Creating salon...');
      const salonData = {
        name: 'Test Salon ' + Date.now(),
        ownerEmail: 'test@email.com',
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      const docRef = await addDoc(collection(db, 'salons'), salonData);
      console.log('Salon created with ID:', docRef.id);
      
      // Refresh list
      fetchSalons();
      alert('Salon created successfully! Check Firebase Console.');
    } catch (error) {
      console.error('Create error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Loading...</h2>
        <p>Checking Firebase connection...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>SalonWay Admin</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>
          Logout
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#fee', 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 20,
          color: '#c00'
        }}>
          <strong>Firebase Error:</strong> {error}
          <div style={{ marginTop: 10, fontSize: 14 }}>
            <p>Make sure:</p>
            <ol>
              <li>Firestore rules allow public access</li>
              <li>Firestore is enabled in Firebase Console</li>
              <li>Collection "salons" exists (or will be auto-created)</li>
            </ol>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={handleCreateSalon}
          style={{
            background: '#3B82F6',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          + Create Test Salon
        </button>
        <p style={{ marginTop: 10, color: '#666', fontSize: 14 }}>
          Click to test Firestore write operation
        </p>
      </div>

      <div>
        <h2>Salons ({salons.length})</h2>
        
        {salons.length === 0 ? (
          <p>No salons found. Click "Create Test Salon" above.</p>
        ) : (
          <div style={{ 
            background: 'white', 
            borderRadius: 8, 
            padding: 20,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {salons.map((salon) => (
              <div key={salon.id} style={{ 
                padding: '15px 0',
                borderBottom: '1px solid #eee'
              }}>
                <div style={{ fontWeight: 'bold' }}>{salon.name}</div>
                <div style={{ color: '#666', fontSize: 14 }}>{salon.ownerEmail}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>
                  ID: {salon.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 30, padding: 20, background: '#f0f9ff', borderRadius: 8 }}>
        <h3>Debug Info</h3>
        {/* <pre style={{ 
          background: '#f8f9fa', 
          padding: 15, 
          borderRadius: 4,
          fontSize: 12,
          overflow: 'auto'
        }}>
          Firebase Config Loaded: {firebaseConfig.projectId ? 'YES' : 'NO'}
          Admin Status: {localStorage.getItem('admin') ? 'Logged In' : 'Not Logged In'}
          Salon Count: {salons.length}
        </pre> */}
      </div>
    </div>
  );
};

export default SimpleAdminDashboard;