import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TestRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 Testing redirect...');
    console.log('• localStorage owner:', localStorage.getItem('owner'));
    console.log('• localStorage salonId:', localStorage.getItem('salonId'));
    
    // Test after 2 seconds
    setTimeout(() => {
      const salonId = localStorage.getItem('salonId');
      if (salonId) {
        console.log('🚀 Redirecting to:', `/owner/dashboard/${salonId}`);
        navigate(`/owner/dashboard/${salonId}`);
      } else {
        console.log('❌ No salonId found in localStorage');
      }
    }, 2000);
  }, [navigate]);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Testing Redirect...</h1>
      <p>Check browser console for details.</p>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '3px solid #E5E7EB',
        borderTopColor: '#3B82F6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '20px auto'
      }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TestRedirect;