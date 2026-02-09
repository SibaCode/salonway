// src/components/owner/OwnerLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCut, FaLock, FaEnvelope } from 'react-icons/fa';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

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

    try {
      // Clean and validate email
      const cleanEmail = email.trim().toLowerCase();
      
      if (!cleanEmail || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      console.log('🔐 Attempting login for:', cleanEmail);

      // Query Firestore for salon with matching email
      const q = query(
        collection(db, 'salons'),
        where('ownerEmail', '==', cleanEmail)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('No salon account found with this email');
        setLoading(false);
        return;
      }
      
      // Get the first matching salon
      const salonDoc = querySnapshot.docs[0];
      const salonData = salonDoc.data();
      
      // Check password (Note: In production, use password hashing!)
      if (salonData.ownerPassword !== password) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }
      
      // Save owner session data
      const ownerData = {
        salonId: salonDoc.id,
        email: salonData.ownerEmail,
        name: salonData.ownerName,
        salonName: salonData.name,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('salonOwner', JSON.stringify(ownerData));
      console.log('✅ Login successful:', ownerData.name);
      
      // Navigate to dashboard
      navigate('/owner/dashboard');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
            fontSize: '32px'
          }}>
            <FaCut />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1F2937' }}>
            SalonWay
          </h1>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            Owner Portal Login
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #FECACA'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Login Error</div>
              <div>{error}</div>
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '14px'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <FaEnvelope style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                fontSize: '18px'
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@your-salon.com"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '15px',
                  background: loading ? '#F9FAFB' : 'white',
                  color: loading ? '#9CA3AF' : '#1F2937',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '14px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                fontSize: '18px'
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '15px',
                  background: loading ? '#F9FAFB' : 'white',
                  color: loading ? '#9CA3AF' : '#1F2937',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>

          {/* Help Text */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              Need help? <a 
                href="mailto:support@salonway.com" 
                style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
              >
                Contact Support
              </a>
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '20px' }}>
              Use the email and password created when your salon was set up
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        input:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      `}</style>
    </div>
  );
};

export default OwnerLogin;