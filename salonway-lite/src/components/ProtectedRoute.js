// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, type = 'admin' }) => {
  if (type === 'admin') {
    const isAdmin = localStorage.getItem('admin');
    return isAdmin ? children : <Navigate to="/admin/login" />;
  }
  
  if (type === 'owner') {
    const isOwner = localStorage.getItem('salonOwner');
    return isOwner ? children : <Navigate to="/owner/login" />;
  }
  
  return children;
};

export default ProtectedRoute;