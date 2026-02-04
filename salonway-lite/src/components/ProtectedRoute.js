// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, type }) => {
  if (type === 'admin') {
    const isAdmin = localStorage.getItem('admin') === 'true';
    return isAdmin ? children : <Navigate to="/admin/login" />;
  }
  
  if (type === 'owner') {
    const isOwner = localStorage.getItem('owner') === 'true';
    return isOwner ? children : <Navigate to="/owner/login" />;
  }
  
  // For other types or unauthenticated access
  return <Navigate to="/admin/login" />;
};

export default ProtectedRoute;