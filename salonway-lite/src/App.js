// src/App.js - Add Owner Routes
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import OwnerLogin from './components/owner/OwnerLogin';
import OwnerDashboard from './components/owner/OwnerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import StaffDashboard from './components/staff/StaffDashboard';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminStatus = localStorage.getItem('admin') === 'true';
    const ownerStatus = localStorage.getItem('owner') === 'true';
    
    setIsAdmin(adminStatus);
    setIsOwner(ownerStatus);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #E5E7EB',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666' }}>Loading SalonWay...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={
            !isAdmin ? <AdminLogin /> : <Navigate to="/admin" />
          } />
          
          <Route path="/admin" element={
            isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" />
          } />
          
          {/* Owner Routes */}
          {/* <Route path="/owner/login" element={
            !isOwner ? <OwnerLogin /> : <Navigate to="/owner/dashboard" />
          } /> */}
          
          <Route path="/owner/login/:salonId" element={
            !isOwner ? <OwnerLogin /> : <Navigate to="/owner/dashboard" />
          } />
          
          {/* <Route path="/owner/dashboard" element={
            isOwner ? <OwnerDashboard /> : <Navigate to="/owner/login" />
          } /> */}
          
          {/* <Route path="/owner/dashboard/:salonId" element={
            isOwner ? <OwnerDashboard /> : <Navigate to="/owner/login" />
          } /> */}
                  {/* <Route path="/" element={<Navigate to="/owner/login" />} /> */}
<Route path="/staff/:code" element={<StaffDashboard />} />

// In App.js - Update owner routes
<Route path="/owner/login" element={<OwnerLogin />} />
<Route path="/owner/dashboard/:salonId" element={<OwnerDashboard />} />
 <Route 
          path="/owner/dashboard" 
          element={
            <ProtectedRoute type="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          } 
        />          {/* Root redirect - Change to admin login for now */}
          <Route path="/" element={<Navigate to="/admin/login" />} />
          
          {/* Coming Soon */}
          <Route path="/staff/*" element={<div style={{ padding: '20px' }}>Staff Portal - Coming Soon</div>} />
          <Route path="/client/*" element={<div style={{ padding: '20px' }}>Client Portal - Coming Soon</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;