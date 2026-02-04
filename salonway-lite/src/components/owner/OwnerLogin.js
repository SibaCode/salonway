// src/components/owner/OwnerLogin.js - MODIFIED
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaCut, FaLock, FaEnvelope } from 'react-icons/fa';

// Hardcoded valid credentials
const VALID_CREDENTIALS = [
  {
    email: 'test3@gmail.com',
    password: '51PH1KlYBn@f',
    salonId: 'YSyWKf5Tuaxq7Y6Qh2Mg',
    salonName: 'Mamazi',
    ownerName: 'Mamazi'
  },
  {
    email: 'client@salon.com',
    password: 'salon123',
    salonId: 'YSyWKf5Tuaxq7Y6Qh2Mg', // Same salon or different
    salonName: 'Client Salon',
    ownerName: 'Salon Owner'
  }
  // Add more as needed
];

const OwnerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay (makes it feel real)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // 1. Check hardcoded credentials first (FAST)
      const validCredential = VALID_CREDENTIALS.find(
        cred => cred.email === email.trim() && cred.password === password
      );

      if (validCredential) {
        console.log('✅ Login successful with hardcoded credentials');
        
        // Save to localStorage
        localStorage.setItem('salonOwner', JSON.stringify({
          salonId: validCredential.salonId,
          email: validCredential.email,
          name: validCredential.ownerName,
          salonName: validCredential.salonName,
          timestamp: new Date().toISOString()
        }));

        navigate('/owner/dashboard');
        return;
      }

      // 2. Fallback to Firestore check (for your own testing)
      console.log('Checking Firestore for credentials...');
      const q = query(
        collection(db, 'salons'),
        where('ownerEmail', '==', email.toLowerCase().trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      const salonDoc = querySnapshot.docs[0];
      const salonData = salonDoc.data();

      if (salonData.ownerPassword !== password) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem('salonOwner', JSON.stringify({
        salonId: salonDoc.id,
        email: salonData.ownerEmail,
        name: salonData.ownerName,
        salonName: salonData.name,
        timestamp: new Date().toISOString()
      }));

      navigate('/owner/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add a "Demo Login" button for testing
  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    // Auto-submit after a short delay
    setTimeout(() => {
      document.querySelector('form').dispatchEvent(new Event('submit'));
    }, 300);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'white',
            fontSize: '32px'
          }}>
            <FaCut />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            SalonWay
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Professional Salon Management
          </p>
        </div>

        {/* Demo Credentials Banner (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            background: '#D1FAE5',
            border: '1px solid #10B981',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>🧪 Demo Mode Active</strong>
            <div style={{ marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {VALID_CREDENTIALS.map((cred, index) => (
                <button
                  key={index}
                  onClick={() => handleDemoLogin(cred.email, cred.password)}
                  style={{
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Login as {cred.ownerName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <FaEnvelope style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }} />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@salon.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '30px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }} />
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Authenticating...
              </span>
            ) : 'Login to Dashboard'}
          </button>

          {/* Help Text */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              Forgot password? Contact support@salonway.com
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '8px' }}>
              v1.0.0 • Secure Authentication
            </p>
          </div>
        </form>
      </div>

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OwnerLogin;