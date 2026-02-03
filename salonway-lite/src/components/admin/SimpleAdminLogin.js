// src/components/admin/SimpleAdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@salonway.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simple validation
    if (email === 'admin@salonway.com' && password === 'admin123') {
      localStorage.setItem('admin', 'true');
      setTimeout(() => {
        navigate('/admin');
      }, 500);
    } else {
      alert('Use: admin@salonway.com / admin123');
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'white',
        borderRadius: 12,
        padding: 40,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: 30 }}>
          SalonWay Admin
        </h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 16
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 16
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 14,
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ 
          marginTop: 30, 
          textAlign: 'center',
          color: '#666',
          fontSize: 14
        }}>
          <p>Use: admin@salonway.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminLogin;