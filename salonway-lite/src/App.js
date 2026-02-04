// src/App.js - Add Owner Routes
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import OwnerLogin from './components/owner/OwnerLogin';
import OwnerDashboard from './components/owner/OwnerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import StaffDashboard from './components/staff/StaffDashboard';
import ClientConsultation from './components/client/ClientConsultation';
import CataloguePage from './components/owner/CataloguePage';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading to false after initial render
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
          {/* Public Catalogue Route */}
          <Route path="/catalogue/:salonId" element={<CataloguePage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute type="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Owner Routes */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/login/:salonId" element={<OwnerLogin />} />
          
          {/* Protect both dashboard routes */}
          <Route 
            path="/owner/dashboard" 
            element={
              <ProtectedRoute type="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/owner/dashboard/:salonId" 
            element={
              <ProtectedRoute type="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Staff and Client Public Routes */}
          <Route path="/staff/:code" element={<StaffDashboard />} />
          <Route path="/client/:salonId" element={<ClientConsultation />} />
          
          {/* Root redirect based on localStorage */}
          <Route 
            path="/" 
            element={<RootRedirect />} 
          />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

// Helper component for root redirect
function RootRedirect() {
  useEffect(() => {
    const isAdmin = localStorage.getItem('admin') === 'true';
    const isOwner = localStorage.getItem('owner') === 'true';
    const salonId = localStorage.getItem('salonId');
    
    if (isAdmin) {
      window.location.href = '/admin';
    } else if (isOwner && salonId) {
      window.location.href = `/owner/dashboard/${salonId}`;
    } else if (isOwner) {
      window.location.href = '/owner/dashboard';
    } else {
      window.location.href = '/admin/login';
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <p>Redirecting...</p>
    </div>
  );
}

// 404 Page Component
function NotFoundPage() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>404</h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>Page not found</p>
      <button 
        onClick={() => window.history.back()}
        style={{
          padding: '10px 20px',
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Go Back
      </button>
    </div>
  );
}

export default App;