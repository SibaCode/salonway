// src/components/owner/OwnerLogin.js - UPDATED WITH DEBUGGING
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaCut, FaLock, FaEnvelope } from 'react-icons/fa';

const OwnerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page refresh
    console.log('Login attempt with:', { email, password });
    
    setLoading(true);
    setError('');

    try {
      console.log('1. Querying Firestore for salon with ownerEmail:', email);
      
      // Find salon by owner email
      const q = query(
        collection(db, 'salons'),
        where('ownerEmail', '==', email.toLowerCase().trim())
      );
      
      const querySnapshot = await getDocs(q);
      console.log('2. Query result size:', querySnapshot.size);
      
      if (querySnapshot.empty) {
        console.log('3. No salon found with this email');
        setError('No salon found with this email. Please check your email or contact support.');
        setLoading(false);
        return;
      }

      const salonDoc = querySnapshot.docs[0];
      const salonData = salonDoc.data();
      console.log('4. Found salon:', {
        id: salonDoc.id,
        name: salonData.name,
        ownerEmail: salonData.ownerEmail,
        hasPassword: !!salonData.ownerPassword
      });

      // Debug: Log actual password for testing (remove in production!)
      if (salonData.ownerPassword) {
        console.log('DEBUG - Stored password:', salonData.ownerPassword);
        console.log('DEBUG - Entered password:', password);
      }

      // Simple password check
      if (!salonData.ownerPassword) {
        console.log('5. No password set for this salon');
        setError('No password set for this salon. Please contact support.');
        setLoading(false);
        return;
      }

      if (salonData.ownerPassword !== password) {
        console.log('6. Password mismatch');
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      console.log('7. Password correct! Creating session...');
      
      // Save to localStorage
      const ownerSession = {
        salonId: salonDoc.id,
        email: salonData.ownerEmail,
        name: salonData.ownerName || salonData.ownerEmail.split('@')[0],
        salonName: salonData.name,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('salonOwner', JSON.stringify(ownerSession));
      console.log('8. Saved to localStorage:', ownerSession);
      
      // Navigate to owner dashboard
      console.log('9. Navigating to dashboard...');
      navigate('/owner/dashboard');

    } catch (error) {
      console.error('10. Login error details:', {
        message: error.message,
        code: error.code,
        fullError: error
      });
      setError('Login failed. Please try again or contact support.');
    } finally {
      setLoading(false);
      console.log('11. Login process completed');
    }
  };

  // Test function to create a sample salon (for development only)
  const createTestSalon = async () => {
    if (!window.confirm('Create a test salon? This is for development only.')) return;
    
    try {
      // Note: You'll need to add this function to your firebase.js
      // import { addDoc } from 'firebase/firestore';
      const testSalon = {
        name: "Test Beauty Salon",
        ownerEmail: "test@salon.com",
        ownerPassword: "test123", // Plain text - INSECURE for production!
        ownerName: "Test Owner",
        primaryColor: "#3B82F6",
        secondaryColor: "#10B981",
        createdAt: new Date().toISOString()
      };
      
      console.log('Test salon data:', testSalon);
      alert(`Use these credentials to test:\nEmail: test@salon.com\nPassword: test123\n\nYou need to manually add this to Firestore.`);
      
    } catch (error) {
      console.error('Error creating test salon:', error);
    }
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
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
            fontSize: '32px',
            cursor: 'pointer'
          }} onClick={createTestSalon} title="Click for test credentials">
            <FaCut />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            SalonWay
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Salon Owner Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>Error:</strong> {error}
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
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              marginTop: '20px', 
              padding: '10px',
              background: '#F3F4F6',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#6B7280'
            }}>
              <strong>Debug:</strong> Check console (F12) for login process details
            </div>
          )}

          {/* Help Text */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              Need help? Contact support@salonway.com
            </p>
          </div>ownerU
        </form>
      </div>
    </div>
  );
};

export default OwnerLogin;