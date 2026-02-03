// src/components/admin/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaEnvelope } from 'react-icons/fa';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@salonway.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simple validation - no Firebase Auth needed
    setTimeout(() => {
      if (email === 'admin@salonway.com' && password === 'admin@salonway.com') {
        localStorage.setItem('admin', 'true');
        localStorage.setItem('adminEmail', email);
        navigate('/admin');
      } else {
        setError('Invalid credentials. Use: admin@salonway.com / admin@salonway.com');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--space-md)' 
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-5">
          <h1 className="text-2xl font-semibold mb-2">SalonWay Admin</h1>
          <p className="text-gray-400">Create and manage salons</p>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Admin Sign In</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="input-label">Email</label>
              <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="admin@salonway.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="admin@salonway.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Demo credentials: admin@salonway.com / admin@salonway.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;