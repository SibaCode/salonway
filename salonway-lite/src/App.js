// src/App.js - SIMPLIFIED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OwnerLogin from './components/owner/OwnerLogin';
import OwnerDashboard from './components/owner/OwnerDashboard';
import StaffDashboard from './components/staff/StaffDashboard';
import ClientConsultation from './components/client/ClientConsultation';
import CataloguePage from './components/client/CataloguePage';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/catalogue/:salonId" element={<CataloguePage />} />
        <Route path="/staff/:code" element={<StaffDashboard />} />
        <Route path="/client/:salonId" element={<ClientConsultation />} />
        
        {/* Owner Routes */}
        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        
        {/* Root redirect - SIMPLE */}
        <Route 
          path="/" 
          element={
            <NavigateToDashboard />
          } 
        />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

// Simple redirect component
function NavigateToDashboard() {
  const salonOwner = JSON.parse(localStorage.getItem('salonOwner') || 'null');
  
  if (salonOwner && salonOwner.salonId) {
    // User is logged in, go to dashboard
    return <Navigate to="/owner/dashboard" replace />;
  } else {
    // Not logged in, go to login
    return <Navigate to="/owner/login" replace />;
  }
}

// 404 Page Component (keep as is)
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