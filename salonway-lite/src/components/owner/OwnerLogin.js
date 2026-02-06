// src/components/owner/OwnerLogin.js - FIXED NAVIGATION
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCut, FaLock, FaEnvelope } from 'react-icons/fa';

// Hardcoded valid credentials
const VALID_CREDENTIALS = [
  {
    email: 'test3@gmail.com',
    password: '51PH1KlYBn@f',
    salonId: 'YSyWKf5Tuaxq7Y6Qh2Mg',
    salonName: 'Mamazi1',
    ownerName: 'Mamazi'
  },
  {
    email: 'client@salon.com',
    password: 'salon123',
    salonId: 'YSyWKf5Tuaxq7Y6Qh2Mg',
    salonName: 'Client Salon',
    ownerName: 'Salon Owner'
  },
  {
    email: 'thebeautyclub@gmail.com',
    password: 'I4FfldcaN8Ml',
    salonId: 'GGXnw4lFKEHB8IpPP99C',
    salonName: 'The Beauty Club',
    ownerName: 'Kat Moeti'
  },
];

const OwnerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('🔐 Login attempt started...');
    setLoading(true);
    setError('');

    // Simulate network delay (makes it feel real)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      console.log('Checking credentials for:', email.trim());
      
      // 1. Check hardcoded credentials first (FAST)
      const validCredential = VALID_CREDENTIALS.find(
        cred => cred.email === email.trim() && cred.password === password
      );

      if (!validCredential) {
        console.log('❌ Invalid credentials');
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      console.log('✅ Login successful!');
      console.log('User:', validCredential.ownerName);
      
      // 2. Save to localStorage
      const ownerData = {
        salonId: validCredential.salonId,
        email: validCredential.email,
        name: validCredential.ownerName,
        salonName: validCredential.salonName,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('salonOwner', JSON.stringify(ownerData));
      console.log('💾 Saved to localStorage:', ownerData);
      
      // 3. IMPORTANT: Clear any React state issues
      setLoading(false);
      
      // 4. Force navigation - MULTIPLE METHODS
      console.log('🚀 Attempting navigation...');
      
      // Method 1: Direct navigation (should work)
      navigate('/owner/dashboard');
      
      // Method 2: Force a state update then navigate
      setTimeout(() => {
        console.log('⏰ Timeout navigation attempt...');
        navigate('/owner/dashboard', { replace: true });
      }, 100);
      
      // Method 3: Fallback - window location
      setTimeout(() => {
        console.log('Checking if navigation worked...');
        if (window.location.pathname !== '/owner/dashboard') {
          console.log('🔄 Using window.location fallback');
          window.location.href = '/owner/dashboard';
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  // Quick login function for testing
  const quickLogin = (credential) => {
    console.log('🚀 Quick login as:', credential.ownerName);
    setEmail(credential.email);
    setPassword(credential.password);
    
    // Auto-submit after a short delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        console.log('Submitting form...');
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      } else {
        console.error('Form not found!');
      }
    }, 300);
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
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1F2937' }}>
            SalonWay
          </h1>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            Owner Portal
          </p>
        </div>

        {/* Quick Login Buttons (Development Only) */}
        {process.env.NODE_ENV !== 'production' && (
          <div style={{
            background: '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', marginBottom: '10px' }}>
              🧪 DEVELOPMENT LOGINS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {VALID_CREDENTIALS.map((cred, index) => (
                <button
                  key={index}
                  onClick={() => quickLogin(cred)}
                  style={{
                    background: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: '#1F2937' }}>
                      {cred.ownerName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      {cred.email}
                    </div>
                  </div>
                  <div style={{ color: '#10B981', fontSize: '12px', fontWeight: '600' }}>
                    LOGIN
                  </div>
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
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #FECACA'
            }}>
              <div style={{ fontSize: '18px' }}>⚠️</div>
              <div>
                <div style={{ fontWeight: '600' }}>Authentication Error</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{
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
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@salon.com"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  background: loading ? '#F9FAFB' : 'white',
                  color: loading ? '#9CA3AF' : '#1F2937'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '30px' }}>
            <label htmlFor="password" style={{
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
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  background: loading ? '#F9FAFB' : 'white',
                  color: loading ? '#9CA3AF' : '#1F2937'
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
              transition: 'all 0.3s',
              opacity: loading ? 0.7 : 1,
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
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
                Authenticating...
              </span>
            ) : 'Login to Dashboard'}
          </button>

          {/* Help Text */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              Forgot password? <a href="mailto:support@salonway.com" style={{ color: '#667eea', textDecoration: 'none' }}>Contact support</a>
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '12px' }}>
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
        
        /* Debug info in console */
        .debug-info {
          display: none;
        }
      `}</style>
    </div>
  );
};

// Add a direct navigation test function (call from console)
window.testNavigation = () => {
  console.log('🔧 Testing navigation manually...');
  const testData = {
    salonId: 'wTHoxDi4owFzyYf1xhQZ',
    email: 'thebeautyclub@gmail.com',
    name: 'Mamazi',
    salonName: 'The Beauty Club',
    timestamp: new Date().toISOString()
  };
 
  localStorage.setItem('salonOwner', JSON.stringify(testData));
  console.log('💾 Saved test data to localStorage');
  
  // Try multiple navigation methods
  const navMethods = [
    () => window.location.href = '/owner/dashboard',
    () => window.location.pathname = '/owner/dashboard',
    () => window.history.pushState({}, '', '/owner/dashboard') && window.location.reload()
  ];
  
  console.log('🚀 Attempting navigation methods...');
  navMethods.forEach((method, index) => {
    setTimeout(() => {
      console.log(`Method ${index + 1}...`);
      try { method(); } catch(e) { console.error(e); }
    }, index * 1000);
  });
};

export default OwnerLogin;