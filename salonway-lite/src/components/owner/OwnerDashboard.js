// src/components/owner/OwnerDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc,
  query, 
  where, 
  orderBy, 
  updateDoc,
  serverTimestamp,
  deleteDoc,
  setDoc,
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaShoppingBag,
  FaCrown,
  FaChevronRight,
} from 'react-icons/fa';
import './css/OwnerDashboard.css';
import ServicesContent from './ServicesContent';
import ClientsContent from './ClientsContent';

// Toast notification component
const ToastNotification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: { background: '#10B981', icon: '✅' },
    error: { background: '#EF4444', icon: '❌' },
    info: { background: '#3B82F6', icon: 'ℹ️' },
    warning: { background: '#F59E0B', icon: '⚠️' }
  };

  const style = typeStyles[type] || typeStyles.success;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: style.background,
      color: 'white',
      padding: '12px 20px',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minWidth: '280px',
      maxWidth: '90%',
      animation: 'slideUp 0.3s ease'
    }}>
      <span style={{ fontSize: '18px' }}>{style.icon}</span>
      <span style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ×
      </button>
    </div>
  );
};

// Add this CSS for the animation
const toastStyles = `
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
`;

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ownerData, setOwnerData] = useState(null);
  const [salonData, setSalonData] = useState(null);
  const [loading, setLoading] = useState(true);
const [errorState, setErrorState] = useState({  hasError: false,
  message: '',
  details: ''
});

const handleLogout = useCallback(() => {
  console.log('🚪 Logging out...');
  
  // Clear localStorage only (no Firebase Auth)
  localStorage.removeItem('salonOwner');
  
  // Navigate to login
  navigate('/owner/login', { replace: true });
  
  // Force reload
  setTimeout(() => {
    window.location.reload();
  }, 100);
}, [navigate]);

  const checkAuth = useCallback(async () => {
  console.log('🔐 checkAuth started...');
  
  try {
    // 1. Check localStorage
    const ownerJson = localStorage.getItem('salonOwner');
    console.log('📦 localStorage data:', ownerJson);
    
    if (!ownerJson) {
      console.log('❌ No owner data found in localStorage');
      navigate('/owner/login');
      return;
    }

    // 2. Parse owner data
    const owner = JSON.parse(ownerJson);
    console.log('✅ Owner data parsed:', owner);
    
    if (!owner.salonId) {
      console.log('❌ No salonId in owner data');
      navigate('/owner/login');
      return;
    }

    // 3. Immediately set owner data (makes dashboard show faster)
    setOwnerData(owner);
    
    // 4. Try to fetch salon data
    console.log(`🏢 Fetching salon data for ID: ${owner.salonId}`);
    const salonRef = doc(db, 'salons', owner.salonId);
    const salonSnap = await getDoc(salonRef);

    if (salonSnap.exists()) {
      // Salon found in Firestore
      const salonData = { 
        id: salonSnap.id, 
        ...salonSnap.data(),
        // Ensure required fields exist
        name: salonSnap.data().name || owner.salonName || 'My Salon',
        primaryColor: salonSnap.data().primaryColor || '#3B82F6',
        secondaryColor: salonSnap.data().secondaryColor || '#10B981'
      };
      
      setSalonData(salonData);
      console.log('🎨 Salon data loaded:', salonData);
      
      // Set CSS variables
      document.documentElement.style.setProperty('--primary-color', salonData.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', salonData.secondaryColor);
      
    } else {
      // Salon not found in Firestore - use fallback
      console.log('⚠️ Salon not found in Firestore, using fallback data');
      
      const fallbackSalonData = {
        id: owner.salonId,
        name: owner.salonName || 'My Salon',
        ownerEmail: owner.email,
        ownerName: owner.name,
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        createdAt: new Date().toISOString()
      };
      
      setSalonData(fallbackSalonData);
      console.log('🔄 Using fallback salon data:', fallbackSalonData);
      
      // Set CSS variables with fallback colors
      document.documentElement.style.setProperty('--primary-color', '#3B82F6');
      document.documentElement.style.setProperty('--secondary-color', '#10B981');
    }

    console.log('✅ Authentication successful!');
    
  } catch (error) {
    console.error('🚨 Auth check error:', error);
    
    // More specific error handling
    if (error.code === 'permission-denied') {
      console.error('Firestore permission denied. Check Firestore rules.');
    } else if (error.code === 'not-found') {
      console.error('Salon document not found.');
    }
    
    // Don't logout immediately, show error state first
    setErrorState({
      hasError: true,
      message: 'Failed to load salon data',
      details: error.message
    });
    
    // Use fallback data for development
    const fallbackOwner = {
      salonId: 'fallback-id',
      email: 'demo@salon.com',
      name: 'Demo Owner',
      salonName: 'Demo Salon'
    };
    
    const fallbackSalon = {
      id: 'fallback-id',
      name: 'Demo Salon',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981'
    };
    
    setOwnerData(fallbackOwner);
    setSalonData(fallbackSalon);
    document.documentElement.style.setProperty('--primary-color', '#3B82F6');
    document.documentElement.style.setProperty('--secondary-color', '#10B981');
    
  } finally {
    console.log('🏁 Auth check completed');
    setLoading(false);
  }
}, [navigate, handleLogout]);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const BottomNav = () => (
    <nav className="bottom-nav">
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('staff')}
        className={`nav-btn ${activeTab === 'staff' ? 'active' : ''}`}
      >
        <span className="nav-icon">👥</span>
        <span className="nav-label">Staff</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('services')}
        className={`nav-btn ${activeTab === 'services' ? 'active' : ''}`}
      >
        <span className="nav-icon">💼</span>
        <span className="nav-label">Services</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('clients')}
        className={`nav-btn ${activeTab === 'clients' ? 'active' : ''}`}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Clients</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('more')}
        className={`nav-btn ${activeTab === 'more' ? 'active' : ''}`}
      >
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">More</span>
      </button>
    </nav>
  );

 if (loading) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading your salon...</p>
      <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
        Checking authentication...
      </p>
    </div>
  );
}

if (errorState.hasError) {
  return (
    <div className="error-container">
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', color: '#EF4444', marginBottom: '20px' }}>
          ⚠️
        </div>
        <h2 style={{ marginBottom: '10px' }}>Connection Issue</h2>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>
          {errorState.message}
        </p>
        <div style={{ 
          background: '#F3F4F6', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '12px',
          textAlign: 'left'
        }}>
          <strong>Debug Info:</strong>
          <div style={{ marginTop: '5px' }}>{errorState.details}</div>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#F3F4F6',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

  if (!ownerData || !salonData) {
    return null;
  }

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <aside className="desktop-sidebar">
      <div className="sidebar-header">
        <div className="salon-logo" style={{ background: salonData.primaryColor || '#3B82F6' }}>
          {salonData.name?.charAt(0) || 'S'}
        </div>
        <div className="salon-name">{salonData.name}</div>
        <div className="owner-name">{ownerData.name}</div>
      </div>

      <nav className="sidebar-nav">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
          { id: 'staff', label: 'Staff', icon: '👥' },
          { id: 'services', label: 'Services', icon: '💼' },
          { id: 'clients', label: 'Clients', icon: '👤' },
        ].map((item) => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </aside>
  );

  const MoreContent = ({ salonData, ownerData, setActiveTab, handleLogout }) => {
    const moreOptions = [
      // { id: 'catalogue', label: 'Catalogue', icon: '🖼️', description: 'Showcase work' },
      // { id: 'reports', label: 'Reports & Analytics', icon: '📊', description: 'View business insights' },
      // { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Salon settings & preferences' },
      // { id: 'subscription', label: 'Subscription', icon: '👑', description: 'Manage your plan' },
      // { id: 'help', label: 'Help & Support', icon: '❓', description: 'Get help & tutorials' },
    ];

    return (
      <div style={{ padding: '20px' }}>
        {/* Profile Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e9ecef'
        }}>
          <div 
            className="owner-avatar"
            style={{ 
              background: salonData.primaryColor || '#3B82F6',
              width: '60px',
              height: '60px',
              fontSize: '24px'
            }}
          >
            {ownerData.name?.charAt(0) || 'O'}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>
              {ownerData.name}
            </h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
              {salonData.name}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#adb5bd' }}>
              Owner Account
            </p>
          </div>
        </div>

        {/* More Options Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {moreOptions.map((option) => (
            <div 
              key={option.id}
              className="content-card"
              style={{ 
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setActiveTab(option.id)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {option.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                    {option.label}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6c757d' }}>
                    {option.description}
                  </p>
                </div>
                <div style={{ color: '#adb5bd', fontSize: '20px' }}>
                  →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FaSignOutAlt /> Logout Account
          </button>
          <p style={{ 
            textAlign: 'center', 
            marginTop: '12px', 
            fontSize: '11px', 
            color: '#adb5bd' 
          }}>
            v1.0.0 • salonway.com
          </p>
        </div>
      </div>
    );
  };

  // Mobile Header Component (different from desktop)
  const MobileHeader = () => (
    <header className="owner-header">
      <div className="owner-header-left">
        <h1>
          {activeTab === 'dashboard' ? 'Dashboard' : 
           activeTab === 'staff' ? 'Staff' :
           activeTab === 'services' ? 'Services' :
           activeTab === 'gallery' ? 'Gallery' :
           activeTab === 'links' ? 'Links' :
           activeTab === 'settings' ? 'Settings' : 'Dashboard'}
        </h1>
        <p>Welcome back, {ownerData.name}</p>
      </div>
      
      <div className="owner-header-right">
        <div 
          className="owner-avatar"
          style={{ background: salonData.primaryColor || '#3B82F6' }}
        >
          {ownerData.name?.charAt(0) || 'O'}
        </div>
      </div>
    </header>
  );

  // Desktop Header Component
  const DesktopHeader = () => (
    <header className="owner-header">
      <div className="owner-header-left">
        <h1>
          {activeTab === 'dashboard' ? 'Dashboard' : 
           activeTab === 'staff' ? 'Staff Management' :
           activeTab === 'services' ? 'Services Menu' :
           activeTab === 'gallery' ? 'Gallery' :
           activeTab === 'links' ? 'Shareable Links' :
           activeTab === 'settings' ? 'Settings' : 'Dashboard'}
        </h1>
        <p>Manage your salon operations</p>
      </div>
      
      <div className="owner-header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '500', fontSize: '14px' }}>{ownerData.name}</div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>{salonData.name}</div>
          </div>
          
          <div 
            className="owner-avatar"
            style={{ 
              background: salonData.primaryColor || '#3B82F6',
              width: '45px',
              height: '45px'
            }}
          >
            {ownerData.name?.charAt(0) || 'O'}
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="owner-dashboard">
      {/* Desktop Sidebar (only on larger screens) */}
      <div className="desktop-only">
        <DesktopSidebar />
      </div>

      <div className="main-content">
        {/* Different headers for mobile vs desktop */}
        <div className="mobile-only">
          <MobileHeader />
        </div>
        <div className="desktop-only">
          <DesktopHeader />
        </div>

        {/* Main Content */}
        <main>
          {activeTab === 'dashboard' && (
            <DashboardContent 
              salonData={salonData} 
              ownerData={ownerData}
              salonId={salonData.id}
              setActiveTab={setActiveTab}
            />
          )}
          
          {activeTab === 'staff' && (
            <StaffContent salonId={salonData.id} ownerData={ownerData} />
          )}
          
          {activeTab === 'services' && (
            <ServicesContent 
              salonId={salonData.id} 
              salonData={salonData} 
              ownerData={ownerData}
            />
          )}
          
          {activeTab === 'clients' && (
            <ClientsContent 
              salonId={salonData.id} 
              salonData={salonData} 
              ownerData={ownerData}
            />
          )}
          
          {activeTab === 'reports' && (
            <ReportsContent salonId={salonData.id} />
          )}
          
          {activeTab === 'settings' && (
            <SettingsContent salonData={salonData} ownerData={ownerData} />
          )}
          
          {activeTab === 'more' && (
            <MoreContent 
              salonData={salonData} 
              ownerData={ownerData} 
              setActiveTab={setActiveTab}
              handleLogout={handleLogout}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation (only on mobile) */}
        <div className="mobile-only">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

const DashboardContent = ({ salonData, ownerData, salonId, setActiveTab }) => {
  const [dashboardStats, setDashboardStats] = useState({
    staffActive: 0,
    todayRevenue: 0,
    formResponses: 0,
    galleryViews: 0
  });
  const [liveFeed, setLiveFeed] = useState([]);
  const [recentWork, setRecentWork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLiveFeedTab, setActiveLiveFeedTab] = useState('all');
  
  // Add filtered live feed based on active tab
  const filteredLiveFeed = activeLiveFeedTab === 'all' 
    ? liveFeed 
    : liveFeed.filter(item => item.type === activeLiveFeedTab);

  // Helper function to get time ago
  const getTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Just now';
    }
  }, []);

  // Helper function to get service icon
  const getServiceIcon = useCallback((category) => {
    if (!category) return '💼';
    
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('hair')) return '💇';
    if (categoryLower.includes('nail')) return '💅';
    if (categoryLower.includes('beauty')) return '💄';
    if (categoryLower.includes('spa')) return '🧖';
    if (categoryLower.includes('makeup')) return '🎨';
    if (categoryLower.includes('massage')) return '💆';
    if (categoryLower.includes('bridal')) return '👰';
    return '💼';
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log("Fetching dashboard data for salon:", salonId);
      
      // 1. Get ALL clock records
      const clockSnapshot = await getDocs(collection(db, 'clockRecords'));
      const allClockRecords = clockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for this salon AND active staff (no clockOut)
      const salonClockRecords = allClockRecords.filter(record => 
        record.salonId === salonId
      );
      
      // Removed unused activeStaff assignment
      // const activeStaffList = salonClockRecords.filter(record => !record.clockOut);
      
      // 2. Get ALL work logs
      const workSnapshot = await getDocs(collection(db, 'workLogs'));
      const allWorkLogs = workSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for this salon AND today's date
      const today = new Date().toISOString().split('T')[0];
      const salonWorkLogs = allWorkLogs.filter(log => 
        log.salonId === salonId
      );
      
      const todayWorkLogs = salonWorkLogs.filter(log => log.date === today);
      setRecentWork(todayWorkLogs);
      
      // Calculate today's revenue
      const todayRevenue = todayWorkLogs.reduce((total, log) => {
        return total + (parseFloat(log.servicePrice) || 0);
      }, 0);
      
      // 3. Get ALL consultations
      const formSnapshot = await getDocs(collection(db, 'consultations'));
      const allForms = formSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for this salon AND today's forms
      const salonForms = allForms.filter(form => form.salonId === salonId);
      
      // Count today's forms
      const todayForms = salonForms.filter(form => {
        const formDate = form.createdAt?.toDate?.();
        if (!formDate) return false;
        return formDate.toISOString().split('T')[0] === today;
      });
      
      // 4. Build live feed from all activities
      const activities = [];
      
      // Add clock activities
      salonClockRecords.forEach(record => {
        activities.push({
          id: `clock_${record.id}`,
          type: 'clock',
          message: `${record.staffName} ${record.clockOut ? 'clocked out' : 'clocked in'}`,
          icon: '⏰',
          time: getTimeAgo(record.clockIn),
          timestamp: record.clockIn?.toDate?.() || new Date()
        });
      });
      
      // Add work log activities
      salonWorkLogs.forEach(log => {
        activities.push({
          id: `work_${log.id}`,
          type: 'service',
          message: `${log.staffName} completed ${log.serviceName || 'service'}`,
          icon: getServiceIcon(log.serviceCategory),
          time: getTimeAgo(log.timestamp),
          timestamp: log.timestamp?.toDate?.() || new Date(),
          price: log.servicePrice
        });
      });
      
      // Add form activities
      salonForms.forEach(form => {
        activities.push({
          id: `form_${form.id}`,
          type: 'form',
          message: `New form from ${form.clientName || 'client'}`,
          icon: '📝',
          time: getTimeAgo(form.createdAt),
          timestamp: form.createdAt?.toDate?.() || new Date()
        });
      });
      
      // Sort by timestamp (newest first) and take 10
      const sortedActivities = activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      setLiveFeed(sortedActivities);
      
      // 5. Update dashboard stats with staff active count
      const activeStaffList = salonClockRecords.filter(record => !record.clockOut);
      setDashboardStats({
        staffActive: activeStaffList.length,
        todayRevenue: todayRevenue,
        formResponses: todayForms.length,
        galleryViews: 0
      });
      
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setLoading(false);
    }
  }, [salonId, getTimeAgo, getServiceIcon]);

  useEffect(() => {
    fetchDashboardData();
    
    // Check every 10 seconds for new data
    const interval = setInterval(fetchDashboardData, 10000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Refresh button function
  const refreshDashboard = () => {
    setLoading(true);
    fetchDashboardData();
  };

  // Stats items for the grid
  const statItems = [
    {
      title: 'Staff Active',
      value: dashboardStats.staffActive,
      icon: '👥',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      label: 'Now',
      onClick: () => setActiveTab && setActiveTab('staff')
    },
    {
      title: "Today's Revenue",
      value: `R${dashboardStats.todayRevenue}`,
      icon: '💰',
      color: '#10B981',
      bgColor: '#ECFDF5',
      label: '',
      onClick: () => {
        if (recentWork.length > 0) {
          const element = document.querySelector('.content-card:last-child');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
    {
      title: 'Form Responses',
      value: dashboardStats.formResponses,
      icon: '📝',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      label: 'New',
      onClick: () => alert('Forms management coming soon!')
    },
  ];

  return (
    <>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h2>Welcome to {salonData.name}! 👋</h2>
        <p>Here's what's happening in your salon right now.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statItems.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card"
            onClick={stat.onClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-content">
              <div className="stat-text">
                <h3>{stat.title}</h3>
                <div className="stat-value">{stat.value}</div>
                {stat.label && <small style={{ color: '#6c757d' }}>{stat.label}</small>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Feed Section with Tabs */}
      <div className="content-card" style={{ margin: '0 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span style={{ fontSize: '20px' }}>📡</span> Live Feed
            </h3>
          </div>
          <button 
            onClick={refreshDashboard}
            style={{
              padding: '6px 12px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
        
        {/* Tabs Navigation */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e9ecef',
          marginBottom: '16px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'all', label: 'All', icon: '📡' },
            { id: 'service', label: 'Services', icon: '💼', count: liveFeed.filter(item => item.type === 'service').length },
            { id: 'form', label: 'Forms', icon: '📝', count: liveFeed.filter(item => item.type === 'form').length },
            { id: 'clock', label: 'Attendance', icon: '⏰', count: liveFeed.filter(item => item.type === 'clock').length }
          ].map(tab => {
            const isActive = activeLiveFeedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLiveFeedTab(tab.id)}
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? 'var(--primary-color)' : 'transparent'}`,
                  color: isActive ? 'var(--primary-color)' : '#6c757d',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: '11px',
                    background: isActive ? 'var(--primary-color)' : '#e9ecef',
                    color: isActive ? 'white' : '#6c757d',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '4px'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Activities List */}
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="loading-spinner" style={{ width: '30px', height: '30px', margin: '0 auto 10px' }}></div>
              <p style={{ color: '#6c757d', fontSize: '14px' }}>Loading live feed...</p>
            </div>
          ) : filteredLiveFeed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '40px', color: '#e2e8f0', marginBottom: '12px' }}>
                {activeLiveFeedTab === 'service' ? '💼' :
                 activeLiveFeedTab === 'form' ? '📝' :
                 activeLiveFeedTab === 'clock' ? '⏰' : '📡'}
              </div>
              <p style={{ color: '#6c757d', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                {activeLiveFeedTab === 'all' ? 'No activity yet' :
                 activeLiveFeedTab === 'service' ? 'No services logged' :
                 activeLiveFeedTab === 'form' ? 'No form submissions' :
                 'No attendance records'}
              </p>
              <p style={{ color: '#adb5bd', fontSize: '12px' }}>
                {activeLiveFeedTab === 'all' ? 'Activity will appear when staff clock in, log work, or clients submit forms' :
                 activeLiveFeedTab === 'service' ? 'Services will appear when staff log completed work' :
                 activeLiveFeedTab === 'form' ? 'Forms will appear when clients submit consultation forms' :
                 'Attendance records will appear when staff clock in or out'}
              </p>
            </div>
          ) : (
            filteredLiveFeed.map((item) => {
              let activityColor = '#3B82F6';
              if (item.type === 'service') activityColor = '#10B981';
              else if (item.type === 'form') activityColor = '#F59E0B';
              else if (item.type === 'clock') activityColor = '#6366F1';
              
              return (
                <div 
                  key={item.id} 
                  className="activity-item"
                  style={{ 
                    padding: '12px 0',
                    borderBottom: '1px solid #f1f3f4',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ 
                    width: '36px',
                    height: '36px',
                    background: `${activityColor}15`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    color: activityColor
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#1a1a1a'
                    }}>
                      {item.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '12px', 
                        color: '#64748b'
                      }}>
                        {item.time}
                      </p>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: `${activityColor}20`,
                        color: activityColor,
                        borderRadius: '10px',
                        fontWeight: '500'
                      }}>
                        {item.type === 'service' ? 'Service' : 
                         item.type === 'form' ? 'Form' : 
                         item.type === 'clock' ? 'Attendance' : 'Activity'}
                      </span>
                      {item.type === 'service' && item.price && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: '#10B98120',
                          color: '#10B981',
                          borderRadius: '10px',
                          fontWeight: '600'
                        }}>
                          R{item.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

const ReportsContent = ({ salonId }) => {
  const [workLogs, setWorkLogs] = useState([]);
  const [dateRange, setDateRange] = useState('today');

  const fetchWorkLogs = useCallback(async () => {
    try {
      let q;
      const today = new Date().toISOString().split('T')[0];
      
      if (dateRange === 'today') {
        q = query(
          collection(db, 'workLogs'),
          where('salonId', '==', salonId),
          where('date', '==', today),
          orderBy('timestamp', 'desc')
        );
      } else {
        q = query(
          collection(db, 'workLogs'),
          where('salonId', '==', salonId),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
      }
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setWorkLogs(logs);
    } catch (error) {
      console.error('Error fetching work logs:', error);
    }
  }, [salonId, dateRange]);

  useEffect(() => {
    fetchWorkLogs();
  }, [fetchWorkLogs]);

  const calculateTotalRevenue = () => {
    return workLogs.reduce((sum, log) => sum + (log.servicePrice || 0), 0);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Work Logs Report
          </h2>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
            Track services performed by staff
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="today">Today</option>
            <option value="all">All Time</option>
          </select>
          
          <div style={{
            padding: '12px 20px',
            background: '#10B981',
            color: 'white',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Total: ${calculateTotalRevenue()}
          </div>
        </div>
      </div>
      
      {/* Rest of the report table... */}
    </div>
  );
};

// Staff Content Component
const StaffContent = ({ salonId, ownerData }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [staffClockStatus, setStaffClockStatus] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const staffSnapshot = await getDocs(collection(db, 'salons', salonId, 'staff'));
      const staffList = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaff(staffList);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showToast('Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  }, [salonId, showToast]);

  const fetchClockStatus = useCallback(async () => {
    try {
      const clockQuery = query(
        collection(db, 'clockRecords'),
        where('salonId', '==', salonId),
        where('clockOut', '==', null)
      );
      
      const snapshot = await getDocs(clockQuery);
      const clockStatus = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        clockStatus[data.staffId] = {
          clockId: doc.id,
          clockIn: data.clockIn,
          isClockedIn: true
        };
      });
      
      setStaffClockStatus(clockStatus);
    } catch (error) {
      console.error('Error fetching clock status:', error);
    }
  }, [salonId]);

  useEffect(() => {
    fetchStaff();
    fetchClockStatus();
  }, [fetchStaff, fetchClockStatus]);

  const handleClockInStaff = async (staffMember) => {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const clockRecord = {
        staffId: staffMember.id,
        staffName: staffMember.name,
        salonId: salonId,
        clockIn: serverTimestamp(),
        clockOut: null,
        date: today.toISOString().split('T')[0],
        clockedBy: `Owner (${ownerData.name})`,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'clockRecords'), clockRecord);
      
      setStaffClockStatus(prev => ({
        ...prev,
        [staffMember.id]: {
          clockId: docRef.id,
          clockIn: now,
          isClockedIn: true
        }
      }));
      
      showToast(`${staffMember.name} has been clocked in`, 'success');
      
    } catch (error) {
      console.error('Error clocking in staff:', error);
      showToast('Failed to clock in staff', 'error');
    }
  };

  const handleClockOutStaff = async (staffMember) => {
    try {
      const clockData = staffClockStatus[staffMember.id];
      if (!clockData) {
        showToast('No active clock record found', 'warning');
        return;
      }
      
      const now = new Date();
      let clockInTime = clockData.clockIn;
      
      if (clockInTime?.toDate) {
        clockInTime = clockInTime.toDate();
      } else if (clockInTime) {
        clockInTime = new Date(clockInTime);
      }
      
      const hours = (now - clockInTime) / (1000 * 60 * 60);
      
      await updateDoc(doc(db, 'clockRecords', clockData.clockId), {
        clockOut: serverTimestamp(),
        duration: hours.toFixed(2),
        clockedOutBy: `Owner (${ownerData.name})`
      });
      
      setStaffClockStatus(prev => {
        const updated = { ...prev };
        delete updated[staffMember.id];
        return updated;
      });
      
      showToast(`${staffMember.name} clocked out • ${hours.toFixed(2)} hours`, 'success');
      
    } catch (error) {
      console.error('Error clocking out staff:', error);
      showToast('Failed to clock out staff', 'error');
    }
  };

  const formatClockTime = (timestamp) => {
    if (!timestamp) return '--:--';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const generateUniqueCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleAddStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.phone.trim()) {
      showToast('Name and phone number are required', 'warning');
      return;
    }

    try {
      const uniqueCode = generateUniqueCode();
      const staffData = {
        name: newStaff.name.trim(),
        phone: newStaff.phone.trim(),
        email: newStaff.email.trim() || '',
        linkCode: uniqueCode,
        isActive: true,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(collection(db, 'salons', salonId, 'staff')), staffData);
      await fetchStaff();
      
      setNewStaff({ name: '', phone: '', email: '' });
      setShowAddForm(false);
      
      showToast('Staff added successfully!', 'success');
      
    } catch (error) {
      console.error('Error adding staff:', error);
      showToast('Failed to add staff', 'error');
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    setToast({
      message: `Remove ${staffName}?`,
      type: 'warning',
      action: {
        label: 'Remove',
        onClick: async () => {
          try {
            await deleteDoc(doc(db, 'salons', salonId, 'staff', staffId));
            await fetchStaff();
            showToast(`${staffName} has been removed`, 'success');
            setToast(null);
          } catch (error) {
            console.error('Error deleting staff:', error);
            showToast('Failed to delete staff', 'error');
            setToast(null);
          }
        }
      },
      cancelAction: {
        label: 'Cancel',
        onClick: () => setToast(null)
      }
    });
  };

  const copyToClipboard = (text, staffName) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${staffName}'s link copied`, 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  };

  if (loading) {
    return (
      <div className="staff-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading staff...</p>
      </div>
    );
  }

  return (
    <>
      <style>{toastStyles}</style>
      
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
              Staff Management
            </h2>
            <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
              Manage staff, clock in/out, and share access links
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="add-staff-btn"
          >
            <span>👤</span> Add Staff
          </button>
        </div>

        {/* Clock Status Summary */}
        <div className="staff-summary">
          <div className="staff-stats">
            <p className="staff-stat">Total Staff: {staff.length}</p>
            <p className="staff-stat">Clocked In: {Object.keys(staffClockStatus).length}</p>
          </div>
          <div className="status-indicators">
            <p className="status-indicator">
              <span className="status-dot clocked-in"></span>
              Clocked In
            </p>
            <p className="status-indicator">
              <span className="status-dot clocked-out"></span>
              Clocked Out
            </p>
          </div>
        </div>

        {/* Staff List */}
        {staff.length === 0 ? (
          <div className="empty-staff-state">
            <div className="empty-staff-icon">
              👤
            </div>
            <h3 className="empty-staff-title">
              No Staff Members Yet
            </h3>
            <p className="empty-staff-message">
              Add your first staff member to get started
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="add-staff-btn"
              style={{ margin: '0 auto' }}
            >
              Add First Staff Member
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {staff.map((member) => {
              const staffLink = `${window.location.origin}/staff/${member.linkCode}`;
              const isClockedIn = staffClockStatus[member.id]?.isClockedIn || false;
              const clockInTime = staffClockStatus[member.id]?.clockIn;
              
              return (
                <div 
                  key={member.id}
                  className={`staff-card ${isClockedIn ? 'clocked-in' : 'clocked-out'}`}
                >
                  {/* Clock status indicator */}
                  <div className={`clock-status-badge ${isClockedIn ? 'clocked-in' : 'clocked-out'}`}>
                    {isClockedIn ? 'CLOCKED IN' : 'CLOCKED OUT'}
                  </div>
                  
                  {/* Staff Info */}
                  <div className="staff-info">
                    <div className={`staff-avatar ${isClockedIn ? 'clocked-in' : 'clocked-out'}`}>
                      {member.name?.charAt(0) || 'S'}
                    </div>
                    <div className="staff-details">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h4 className="staff-name">
                            {member.name}
                          </h4>
                          <div className="staff-contact">
                            {member.phone && (
                              <span className="contact-item">
                                📞 {member.phone}
                              </span>
                            )}
                            {member.email && (
                              <span className="contact-item">
                                ✉️ {member.email}
                              </span>
                            )}
                          </div>
                        </div>
                        {isClockedIn && clockInTime && (
                          <div className="clock-time-display">
                            <p className="clock-time-label">
                              Since:
                            </p>
                            <p className="clock-time-value">
                              {formatClockTime(clockInTime)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clock In/Out Controls */}
                  <div className="staff-actions">
                    <button
                      onClick={() => isClockedIn ? handleClockOutStaff(member) : handleClockInStaff(member)}
                      className={`clock-btn ${isClockedIn ? 'clock-btn-out' : 'clock-btn-in'}`}
                    >
                      {isClockedIn ? (
                        <>
                          <span>⏰</span> Clock Out
                        </>
                      ) : (
                        <>
                          <span>⏰</span> Clock In
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteStaff(member.id, member.name)}
                      className="delete-btn"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  {/* Staff Link Display */}
                  <div className="staff-link-container">
                    <div className="staff-link-header">
                      <span className="staff-link-label">Staff Link:</span>
                      <button
                        onClick={() => copyToClipboard(staffLink, member.name)}
                        className="copy-link-btn"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="staff-link">
                      {staffLink}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Staff Form Modal */}
        {showAddForm && (
          <div className="staff-modal-overlay">
            <div className="staff-modal">
              {/* Modal Header */}
              <div className="modal-header">
                <h3 className="modal-title">
                  Add New Staff
                </h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="modal-close"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Name Field */}
                  <div className="form-group">
                    <label className="form-label required">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                      placeholder="Sarah Johnson"
                      className="form-input"
                      autoFocus
                    />
                  </div>

                  {/* Phone Field */}
                  <div className="form-group">
                    <label className="form-label required">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                      placeholder="1234567890"
                      className="form-input"
                    />
                    <span className="form-help">
                      Used for WhatsApp notifications
                    </span>
                  </div>

                  {/* Email Field (Optional) */}
                  <div className="form-group">
                    <label className="form-label">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                      placeholder="sarah@salon.com"
                      className="form-input"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="modal-actions">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="modal-cancel-btn"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddStaff}
                      className="modal-submit-btn"
                    >
                      Add Staff Member
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && !toast.action && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Toast with Actions */}
      {toast?.action && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1F2937',
          color: 'white',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          zIndex: 10000,
          minWidth: '300px',
          maxWidth: '90%',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '20px' }}>
              {toast.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span style={{ fontSize: '15px', fontWeight: '500', flex: 1 }}>
              {toast.message}
            </span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            {toast.cancelAction && (
              <button
                onClick={toast.cancelAction.onClick}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {toast.cancelAction.label}
              </button>
            )}
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                style={{
                  padding: '8px 16px',
                  background: toast.type === 'warning' ? '#DC2626' : '#10B981',
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  {toast.action.label}
                </button>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

// Settings Content Component
const SettingsContent = ({ salonData, ownerData }) => {
  const handleLogout = () => {
    localStorage.removeItem('salonOwner');
    window.location.href = '/owner/login';
  };

  const menuItems = [
    { icon: <FaCog />, label: 'Salon Settings', description: 'Update salon information and branding' },
    { icon: <FaUsers />, label: 'Staff Permissions', description: 'Manage staff access and roles' },
    { icon: <FaShoppingBag />, label: 'Subscription', description: 'Manage your plan and billing' },
    { icon: <FaCrown />, label: 'Premium Features', description: 'Upgrade for advanced features' },
  ];

  return (
    <div className="p-3">
      <div className="content-card mb-4">
        <h3 style={{ marginBottom: '20px' }}>Salon Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p className="text-muted mb-1">Salon Name</p>
            <p style={{ fontWeight: '500', fontSize: '16px' }}>{salonData.name}</p>
          </div>
          <div>
            <p className="text-muted mb-1">Owner Name</p>
            <p style={{ fontWeight: '500', fontSize: '16px' }}>{ownerData.name}</p>
          </div>
          <div>
            <p className="text-muted mb-1">Owner Email</p>
            <p style={{ fontWeight: '500', fontSize: '16px' }}>{ownerData.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <p className="text-muted mb-1">Primary Color</p>
              <div style={{
                width: '40px',
                height: '40px',
                background: salonData.primaryColor || '#3B82F6',
                borderRadius: '8px',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}></div>
            </div>
            <div>
              <p className="text-muted mb-1">Secondary Color</p>
              <div style={{
                width: '40px',
                height: '40px',
                background: salonData.secondaryColor || '#10B981',
                borderRadius: '8px',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-card mb-4">
        <h3 style={{ marginBottom: '20px' }}>Settings Menu</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {menuItems.map((item, index) => (
            <div 
              key={index}
              className="checklist-item"
              style={{ cursor: 'pointer', borderBottom: '1px solid #F1F3F4' }}
            >
              <div style={{ color: 'var(--primary-color)', fontSize: '20px' }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: '#6c757d', margin: 0 }}>{item.description}</p>
              </div>
              <FaChevronRight style={{ color: '#ADB5BD' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="content-card">
        <h3 style={{ marginBottom: '20px' }}>Account</h3>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            background: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          <FaSignOutAlt /> Logout Account
        </button>
      </div>
    </div>
  );
};

export default OwnerDashboard;