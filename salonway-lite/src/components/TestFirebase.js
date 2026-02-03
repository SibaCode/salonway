import React, { useState } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const TestFirebase = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  // Test with your EXACT config
  const firebaseConfig = {
    apiKey: "AIzaSyAkPbUFVsK_gckqAADq8C-hLMbUVqBigks",
    authDomain: "sibaway-30129.firebaseapp.com",
    projectId: "sibaway-30129",
    storageBucket: "sibaway-30129.firebasestorage.app",
    messagingSenderId: "927386642428",
    appId: "1:927386642428:web:0d38ecb075416e4babf479",
    measurementId: "G-M8YF7YCXD4"
  };

  const testFirestore = async () => {
    setLoading(true);
    setResult('');
    setError('');
    
    try {
      console.log('🧪 Starting Firestore test...');
      console.log('Project ID:', firebaseConfig.projectId);
      
      // 1. Initialize Firebase
      const app = initializeApp(firebaseConfig, "TestApp-" + Date.now());
      const db = getFirestore(app);
      console.log('✅ Firebase initialized');
      
      // 2. Test WRITE
      console.log('Attempting to write document...');
      const docRef = await addDoc(collection(db, "debug_test"), {
        test: "Debug test from React",
        timestamp: new Date().toISOString(),
        project: firebaseConfig.projectId
      });
      console.log('✅ Document written with ID:', docRef.id);
      
      // 3. Test READ
      console.log('Attempting to read documents...');
      const querySnapshot = await getDocs(collection(db, "debug_test"));
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      console.log('✅ Documents read:', docs.length);
      
      setResult(`✅ SUCCESS!
• Project: ${firebaseConfig.projectId}
• Document ID: ${docRef.id}
• Total documents: ${docs.length}
• Check Firebase Console for data.`);
      
    } catch (err) {
      console.error('❌ Firestore error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      setError(`❌ FAILED: ${err.code}
${err.message}
      
Please check:
1. Go to Firebase Console → sibaway-30129 → Firestore Database
2. Click "Rules" tab
3. Replace with:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
4. Click "PUBLISH"`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '50px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ marginBottom: '20px', color: '#111827' }}>Firebase Debug Test</h1>
      
      <div style={{ 
        background: '#F0F9FF', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div><strong>Project ID:</strong> sibaway-30129</div>
        <div><strong>Status:</strong> Testing...</div>
      </div>
      
      <button
        onClick={testFirestore}
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px',
          background: loading ? '#9CA3AF' : '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : '🔧 Test Firestore Connection'}
      </button>
      
      {result && (
        <div style={{
          background: '#D1FAE5',
          color: '#065F46',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          whiteSpace: 'pre-line'
        }}>
          {result}
        </div>
      )}
      
      {error && (
        <div style={{
          background: '#FEE2E2',
          color: '#991B1B',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          whiteSpace: 'pre-line'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '20px', background: '#F9FAFB', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px' }}>Steps to Fix:</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
          <li>Select project <strong>sibaway-30129</strong></li>
          <li>Click <strong>Firestore Database</strong> in left menu</li>
          <li>Click <strong>Rules</strong> tab</li>
          <li>Replace ALL text with the rules above</li>
          <li>Click <strong>PUBLISH</strong> (blue button)</li>
          <li>Come back and click "Test" button again</li>
        </ol>
      </div>
    </div>
  );
};

export default TestFirebase;