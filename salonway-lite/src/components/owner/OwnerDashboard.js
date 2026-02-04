// src/components/owner/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc,
  query, 
  where, 
  orderBy, updateDoc,serverTimestamp,
  deleteDoc,  // ADD THIS
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

// First, add this toast notification component at the top of your file (after imports)
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

// Then update your StaffContent component

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ownerData, setOwnerData] = useState(null);
  const [salonData, setSalonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeServices: 0,
    monthlyRevenue: 0,
    todayAppointments: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const owner = JSON.parse(localStorage.getItem('salonOwner'));
      if (!owner) {
        navigate('/owner/login');
        return;
      }

      // Fetch salon data
      const salonRef = doc(db, 'salons', owner.salonId);
      const salonSnap = await getDoc(salonRef);

      if (salonSnap.exists()) {
        const data = { id: salonSnap.id, ...salonSnap.data() };
        setSalonData(data);
        setOwnerData(owner);
        
        // Set CSS variables for salon colors
        document.documentElement.style.setProperty('--primary-color', data.primaryColor || '#3B82F6');
        document.documentElement.style.setProperty('--secondary-color', data.secondaryColor || '#10B981');
        
        // Fetch stats
        await fetchStats(owner.salonId);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (salonId) => {
    try {
      // Fetch staff count
      const staffSnapshot = await getDocs(collection(db, 'salons', salonId, 'staff'));
      const staffCount = staffSnapshot.size;
      
      // Fetch services count
      const servicesSnapshot = await getDocs(collection(db, 'salons', salonId, 'services'));
      const servicesCount = servicesSnapshot.size;
      
      // For now, use mock data - in production, fetch real data
      setStats({
        totalStaff: staffCount,
        activeServices: servicesCount,
        monthlyRevenue: 0, // Start with 0
        todayAppointments: 0 // Start with 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set all zeros if there's an error
      setStats({
        totalStaff: 0,
        activeServices: 0,
        monthlyRevenue: 0,
        todayAppointments: 0
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('salonOwner');
    navigate('/owner/login');
  };

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
        // { id: 'catalogue', label: 'Catalogue', icon: '🏢' }

        // { id: 'gallery', label: 'Gallery', icon: '🖼️' },
        // { id: 'reports', label: 'Reports', icon: '📊' },
        // { id: 'settings', label: 'Settings', icon: '⚙️' },
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
        {/* <button className="notification-btn">
          <FaBell />
          <span className="notification-badge"></span>
        </button> */}
        
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
          
          {/* <button className="notification-btn" style={{ position: 'relative' }}>
            <FaBell />
            <span className="notification-badge"></span>
          </button> */}
          
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
  
 {/* {activeTab === 'catalogue' && (
  <CatalogueSettings 
    salonData={salonData} 
    ownerData={ownerData}
    salonId={salonData.id}
  />
)} */}
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
  const [activeStaff, setActiveStaff] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);
  const [recentWork, setRecentWork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLiveFeedTab, setActiveLiveFeedTab] = useState('all'); // Add this line
  
  // Add filtered live feed based on active tab
  const filteredLiveFeed = activeLiveFeedTab === 'all' 
    ? liveFeed 
    : liveFeed.filter(item => item.type === activeLiveFeedTab);
  useEffect(() => {
    fetchDashboardData();
    
    // Check every 10 seconds for new data
    const interval = setInterval(fetchDashboardData, 10000);
    
    return () => clearInterval(interval);
  }, [salonId]);

  // SIMPLE function - gets all data and filters manually
  const fetchDashboardData = async () => {
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
      
      const activeStaffList = salonClockRecords.filter(record => !record.clockOut);
      setActiveStaff(activeStaffList);
      
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
      // In the fetchDashboardData function, update the work log activity creation:
      salonWorkLogs.forEach(log => {
        activities.push({
          id: `work_${log.id}`,
          type: 'service',
          message: `${log.staffName} completed ${log.serviceName || 'service'}`,
          icon: getServiceIcon(log.serviceCategory),
          time: getTimeAgo(log.timestamp),
          timestamp: log.timestamp?.toDate?.() || new Date(),
          price: log.servicePrice // Add this line
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
      
      // 5. Update dashboard stats
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
  };

  // Helper function to get time ago
  const getTimeAgo = (timestamp) => {
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
  };

  // Helper function to get service icon
  const getServiceIcon = (category) => {
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
  };

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
    // {
    //   title: 'Gallery Views',
    //   value: dashboardStats.galleryViews,
    //   icon: '👀',
    //   color: '#EF4444',
    //   bgColor: '#FEE2E2',
    //   label: 'Today',
    //   onClick: () => setActiveTab && setActiveTab('gallery')
    // }
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
              {/* <div 
                className="stat-icon"
                style={{ 
                  background: stat.bgColor,
                  color: stat.color,
                  fontSize: '24px'
                }}
              >
                {stat.icon}
              </div> */}
            </div>
          </div>
        ))}
      </div>

      {/* Live Feed Section */}
     {/* Live Feed Section with Tabs */}
<div className="content-card" style={{ margin: '0 20px 20px' }}>
 
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        <span style={{ fontSize: '20px' }}>📡</span> Live Feed
      </h3>
      {/* {liveFeed.length > 0 && (
        <span style={{
          fontSize: '12px',
          background: '#3B82F6',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontWeight: '500'
        }}>
          {liveFeed.length} activities
        </span>
      )} */}
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

      {/* Recent Work Section */}
      {/* {recentWork.length > 0 ? (
        <div className="content-card" style={{ margin: '0 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span style={{ fontSize: '20px' }}>💼</span> Today's Services
              <span style={{ 
                fontSize: '12px',
                background: '#10B981',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {recentWork.length}
              </span>
            </h3>
            <div style={{ fontSize: '14px', color: '#10B981', fontWeight: '600' }}>
              Total: R{dashboardStats.todayRevenue}
            </div>
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {recentWork.map((work) => {
              const timeAgo = getTimeAgo(work.timestamp);
              
              return (
                <div 
                  key={work.id}
                  className="activity-item"
                  style={{ 
                    padding: '12px 0',
                    borderBottom: '1px solid #f1f3f4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ 
                    width: '40px',
                    height: '40px',
                    background: '#d1fae5',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    color: '#065f46'
                  }}>
                    {getServiceIcon(work.serviceCategory)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#1a1a1a'
                      }}>
                        {work.serviceName}
                      </p>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        color: '#10B981',
                        fontWeight: '700'
                      }}>
                        R{work.servicePrice}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <strong>By</strong> {work.staffName}
                        </span>
                        {work.client && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            👥 {work.client}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#64748b'
                        }}>
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !loading && (
        <div className="content-card" style={{ margin: '0 20px 20px' }}>
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: '40px', color: '#e2e8f0', marginBottom: '12px' }}>
              💼
            </div>
            <p style={{ color: '#6c757d', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              No services logged today
            </p>
            <p style={{ color: '#adb5bd', fontSize: '12px' }}>
              When staff log work, it will appear here
            </p>
          </div>
        </div>
      )} */}
    </>
  );
};

// Add Client Form Component
const AddClientForm = ({ onSubmit, onCancel, primaryColor, secondaryColor, borderColor }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    visitDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#212529' }}>
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#212529' }}>
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#212529' }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#212529' }}>
            Service
          </label>
          <input
            type="text"
            value={formData.service}
            onChange={(e) => setFormData({...formData, service: e.target.value})}
            placeholder="Optional"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#212529' }}>
            Visit Date
          </label>
          <input
            type="date"
            value={formData.visitDate}
            onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#212529' }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: secondaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Add Client
          </button>
        </div>
      </div>
    </form>
  );
};

// Client Details Component
const ClientDetails = ({ client, onDelete, onClose, onUpdateStatus, primaryColor, secondaryColor, borderColor, isMobile }) => {
  const isFormSubmission = client.source === 'online_form';

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#212529' }}>
        Client Details
      </h3>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Header Info */}
        <div style={{ 
          background: `${primaryColor}10`,
          padding: '20px',
          borderRadius: '8px',
          borderLeft: `4px solid ${primaryColor}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#212529' }}>
                {client.clientName || 'Unknown Client'}
              </h4>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: secondaryColor }}>
                <span>📞 {client.clientPhone || 'No phone'}</span>
                {client.clientEmail && <span>✉️ {client.clientEmail}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '12px',
                padding: '4px 8px',
                background: isFormSubmission ? `${primaryColor}20` : `${secondaryColor}20`,
                color: isFormSubmission ? primaryColor : secondaryColor,
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                {isFormSubmission ? 'Form Submission' : 'Walk-in Client'}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: secondaryColor }}>
              {client.date || client.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}
            </div>
            <select
              value={client.status || 'new'}
              onChange={(e) => onUpdateStatus(client.id, e.target.value)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                minWidth: '120px'
              }}
            >
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="contacted">Contacted</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Service Information */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#212529' }}>Service Information</h4>
          <div style={{ 
            background: `${secondaryColor}08`,
            padding: '16px',
            borderRadius: '6px',
            border: `1px solid ${borderColor}`
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: secondaryColor, marginBottom: '4px' }}>Desired Service</div>
              <div style={{ fontSize: '15px', color: '#212529' }}>{client.desiredService || 'Not specified'}</div>
            </div>
            
            {client.specialRequests && client.specialRequests !== 'n' && (
              <div>
                <div style={{ fontSize: '12px', color: secondaryColor, marginBottom: '4px' }}>Special Requests</div>
                <div style={{ fontSize: '15px', color: '#212529' }}>{client.specialRequests}</div>
              </div>
            )}
          </div>
        </div>

        {/* Medical Information (if available) */}
        {(client.allergies || client.medicalConditions || client.medications) && (
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#212529' }}>Medical Information</h4>
            <div style={{ 
              background: `${secondaryColor}08`,
              padding: '16px',
              borderRadius: '6px',
              border: `1px solid ${borderColor}`
            }}>
              {client.allergies && client.allergies !== 'b' && client.allergies !== 'n' && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: secondaryColor, marginBottom: '4px' }}>Allergies</div>
                  <div style={{ fontSize: '15px', color: '#212529' }}>{client.allergies}</div>
                </div>
              )}
              
              {client.medicalConditions && client.medicalConditions !== 'b' && client.medicalConditions !== 'n' && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: secondaryColor, marginBottom: '4px' }}>Medical Conditions</div>
                  <div style={{ fontSize: '15px', color: '#212529' }}>{client.medicalConditions}</div>
                </div>
              )}
              
              {client.medications && client.medications !== 'b' && client.medications !== 'n' && (
                <div>
                  <div style={{ fontSize: '12px', color: secondaryColor, marginBottom: '4px' }}>Medications</div>
                  <div style={{ fontSize: '15px', color: '#212529' }}>{client.medications}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consents */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#212529' }}>Consents</h4>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            <div style={{ 
              padding: '12px',
              background: client.consentData ? `${primaryColor}10` : `${secondaryColor}10`,
              borderRadius: '6px',
              border: `1px solid ${client.consentData ? primaryColor : borderColor}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: secondaryColor, marginBottom: '4px' }}>Data Consent</div>
              <div style={{ 
                fontSize: '13px', 
                color: client.consentData ? primaryColor : secondaryColor,
                fontWeight: '500'
              }}>
                {client.consentData ? '✓ Given' : '✗ Not Given'}
              </div>
            </div>
            
            <div style={{ 
              padding: '12px',
              background: client.consentPhotos ? `${primaryColor}10` : `${secondaryColor}10`,
              borderRadius: '6px',
              border: `1px solid ${client.consentPhotos ? primaryColor : borderColor}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: secondaryColor, marginBottom: '4px' }}>Photo Consent</div>
              <div style={{ 
                fontSize: '13px', 
                color: client.consentPhotos ? primaryColor : secondaryColor,
                fontWeight: '500'
              }}>
                {client.consentPhotos ? '✓ Given' : '✗ Not Given'}
              </div>
            </div>
            
            <div style={{ 
              padding: '12px',
              background: client.consentService ? `${primaryColor}10` : `${secondaryColor}10`,
              borderRadius: '6px',
              border: `1px solid ${client.consentService ? primaryColor : borderColor}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: secondaryColor, marginBottom: '4px' }}>Service Consent</div>
              <div style={{ 
                fontSize: '13px', 
                color: client.consentService ? primaryColor : secondaryColor,
                fontWeight: '500'
              }}>
                {client.consentService ? '✓ Given' : '✗ Not Given'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '8px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: secondaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this client?')) {
                onDelete(client.id);
              }
            }}
            style={{
              padding: '12px 24px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Updated Modal Component with better styling
const Modal = ({ children, onClose, title }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: window.innerWidth < 768 ? '16px' : '20px'
  }}>
    <div style={{
      background: 'white',
      borderRadius: window.innerWidth < 768 ? '20px' : '24px',
      padding: 0,
      width: '100%',
      maxWidth: window.innerWidth < 768 ? '100%' : '700px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      animation: 'modalSlideIn 0.3s ease-out'
    }}>
      {/* Modal Header */}
      <div style={{
        padding: window.innerWidth < 768 ? '20px 20px 16px' : '24px 24px 20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: window.innerWidth < 768 ? '18px' : '20px', 
          fontWeight: '700'
        }}>
          {title}
        </h2>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            fontSize: '20px',
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          ✕
        </button>
      </div>
      
      {/* Modal Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: window.innerWidth < 768 ? '20px' : '24px'
      }}>
        {children}
      </div>
      
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  </div>
);

// Add Walkin Client Form - Simplified for mobile
const AddWalkinClientForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    visitDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [activeTab, setActiveTab] = useState('basic');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please fill in at least name and phone number');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '12px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'basic' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
            color: activeTab === 'basic' ? 'white' : '#666',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Basic Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('service')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'service' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
            color: activeTab === 'service' ? 'white' : '#666',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Service Details
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter client's full name"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#fafafa',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Enter phone number"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#fafafa',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email address (optional)"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#fafafa',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
              />
            </div>
          </div>
        )}

        {/* Service Details Tab */}
        {activeTab === 'service' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                Service Received/Requested
              </label>
              <input
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({...formData, service: e.target.value})}
                placeholder="e.g., Haircut, Coloring, Treatment"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#fafafa',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                Visit Date
              </label>
              <input
                type="date"
                value={formData.visitDate}
                onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#fafafa',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#333'
              }}>
                Notes / Special Requests
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="4"
                placeholder="Any special requests or additional notes..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #f0f0f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#fafafa',
                  resize: 'vertical',
                  transition: 'all 0.2s ease',
                  minHeight: '100px'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '16px',
              background: '#f8f9fa',
              color: '#666',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e9ecef'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f8f9fa'}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '16px',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Add Client
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </form>
  );
};



// Consultation Details Component
const ConsultationDetails = ({ consultation, onDelete, onClose, onUpdateStatus }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
        {consultation.source === 'manual' ? 'Client Details' : 'Consultation Form'}
      </h3>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          {/* Basic Info */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#495057' }}>Client Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Name</strong>
                <p style={{ margin: 0 }}>{consultation.clientName || 'Not provided'}</p>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Source</strong>
                <span style={{
                  padding: '4px 8px',
                  background: consultation.source === 'manual' ? '#e9ecef' : '#d1fae5',
                  color: consultation.source === 'manual' ? '#6c757d' : '#065f46',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {consultation.source === 'manual' ? 'Manual Entry' : 'Online Form'}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Phone</strong>
                <p style={{ margin: 0 }}>{consultation.clientPhone || 'Not provided'}</p>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Email</strong>
                <p style={{ margin: 0 }}>{consultation.clientEmail || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          {/* Service & Status */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#495057' }}>Service Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Service Needed</strong>
                <p style={{ margin: 0 }}>{consultation.serviceNeeded || 'Not specified'}</p>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Status</strong>
                <select
                  value={consultation.status || 'new'}
                  onChange={(e) => onUpdateStatus(consultation.id, e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                    width: '100%'
                  }}
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="contacted">Contacted</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Form Responses (for form submissions) */}
          {consultation.consultationResponses && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#495057' }}>Form Responses</h4>
              <div style={{ 
                background: 'white', 
                padding: '16px', 
                borderRadius: '6px',
                border: '1px solid #dee2e6'
              }}>
                {Object.entries(consultation.consultationResponses).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f8f9fa' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', color: '#495057', fontSize: '14px' }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </strong>
                    <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>{value || 'Not answered'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Additional Info / Notes */}
          {(consultation.additionalInfo || consultation.notes) && (
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#495057' }}>
                {consultation.source === 'manual' ? 'Notes' : 'Additional Information'}
              </h4>
              <div style={{ 
                background: 'white', 
                padding: '16px', 
                borderRadius: '6px',
                border: '1px solid #dee2e6'
              }}>
                <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                  {consultation.additionalInfo || consultation.notes}
                </p>
              </div>
            </div>
          )}
          
          {/* Timestamps */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #dee2e6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6c757d' }}>
              <span>Submitted: {consultation.createdAt?.toDate?.().toLocaleString() || 'Unknown'}</span>
              {consultation.updatedAt && (
                <span>Updated: {consultation.updatedAt?.toDate?.().toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div></div> {/* Empty spacer */}
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this entry?')) {
                  onDelete(consultation.id);
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};




// Edit Client Form (simplified)
const EditClientForm = ({ client, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: client.name || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    notes: client.notes || '',
    preferences: client.preferences || '',
    status: client.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
        Edit Client
      </h3>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Preferences
          </label>
          <input
            type="text"
            value={formData.preferences}
            onChange={(e) => setFormData({...formData, preferences: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="vip">VIP</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows="3"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              background: '#e9ecef',
              color: '#495057',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Update Client
          </button>
        </div>
      </div>
    </form>
  );
};




const ReportsContent = ({ salonId }) => {
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    fetchWorkLogs();
  }, [dateRange]);

  const fetchWorkLogs = async () => {
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
    } finally {
      setLoading(false);
    }
  };

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

// Staff Content Component - ULTRA SIMPLE MVP
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

  useEffect(() => {
    fetchStaff();
    fetchClockStatus();
  }, []);

 const showToast = (message, type = 'success') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};

  const hideToast = () => {
    setToast(null);
  };

  const fetchStaff = async () => {
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
  };

  const fetchClockStatus = async () => {
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
  };

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

      await addDoc(collection(db, 'salons', salonId, 'staff'), staffData);
      await fetchStaff();
      
      setNewStaff({ name: '', phone: '', email: '' });
      setShowAddForm(false);
      
      const staffLink = `${window.location.origin}/staff/${uniqueCode}`;
      showToast('Staff added successfully!', 'success');
      
      // Copy link automatically
     
      
    } catch (error) {
      console.error('Error adding staff:', error);
      showToast('Failed to add staff', 'error');
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    // Custom confirmation modal instead of window.confirm
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
            setToast(null); // Clear the confirmation toast
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
      {toast && (
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
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const GalleryContent = ({ salonId }) => (
  <div className="p-3">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Gallery 🖼️</h2>
      <button className="empty-state-btn" style={{ padding: '10px 16px' }}>
        <span style={{ marginRight: '8px' }}>📸</span> Upload Photo
      </button>
    </div>
    
    <div className="empty-state">
      <div className="empty-state-icon" style={{ fontSize: '48px' }}>
        🖼️
      </div>
      <h3>No Photos Yet</h3>
      <p>Upload photos to showcase your work</p>
      <button className="empty-state-btn">
        <span style={{ marginRight: '8px' }}>📸</span> Upload First Photo
      </button>
    </div>
  </div>
);

// Links Content Component
const LinksContent = ({ salonId, salonData }) => (
  <div className="p-3">
    <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 24px 0' }}>Links 🔗</h2>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Staff Links Card */}
      <div className="content-card">
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>👥</span> Staff Access Links
        </h3>
        <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '12px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6c757d' }}>
            Add staff members to see their links here
          </p>
        </div>
        <button className="setup-btn" style={{ width: '100%' }}>
          👥 Go to Staff Management
        </button>
      </div>

      {/* Client Form Link Card */}
      <div className="content-card">
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📝</span> Client Form Link
        </h3>
        <div style={{ 
          padding: '12px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          wordBreak: 'break-all',
          marginBottom: '12px',
          color: '#1a1a1a' 
        }}>
          salonway.com/c/{salonData?.id || 'your-salon'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="setup-btn" style={{ flex: 1 }}>
            📋 Copy
          </button>
          <button className="setup-btn" style={{ flex: 1, background: '#25D366' }}>
            📱 WhatsApp
          </button>
        </div>
      </div>

      {/* Public Gallery Link Card */}
      <div className="content-card">
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🖼️</span> Public Gallery Link
        </h3>
        <div style={{ 
          padding: '12px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          wordBreak: 'break-all',
          marginBottom: '12px'
        }}>
          salonway.com/g/{salonData?.id || 'your-salon'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="setup-btn" style={{ flex: 1 }}>
            📋 Copy
          </button>
          <button className="setup-btn" style={{ flex: 1, background: '#25D366' }}>
            📱 WhatsApp
          </button>
        </div>
      </div>
    </div>
  </div>
);

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
const CatalogueSettings = ({ salonData, ownerData, salonId }) => {
  const [catalogueSettings, setCatalogueSettings] = useState({
    showContactInfo: true,
    showBusinessHours: true,
    showServices: true,
    showAboutSection: true,
    salonDescription: '',
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '10:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    contactEmail: ownerData.email || '',
    contactPhone: salonData.phone || '',
    address: salonData.address || '',
    logoUrl: salonData.logoUrl || ''
  });

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // Add toast state

  useEffect(() => {
    fetchServices();
    loadCatalogueSettings();
  }, []);

  // Toast function
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchServices = async () => {
    try {
      const servicesSnapshot = await getDocs(collection(db, 'salons', salonId, 'services'));
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogueSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'salons', salonId, 'catalogue', 'settings'));
      if (settingsDoc.exists()) {
        setCatalogueSettings(prev => ({
          ...prev,
          ...settingsDoc.data()
        }));
      }
    } catch (error) {
      console.log('No catalogue settings found, using defaults');
    }
  };

  const saveCatalogueSettings = async () => {
    try {
      await setDoc(doc(db, 'salons', salonId, 'catalogue', 'settings'), catalogueSettings);
      showToast('Catalogue settings saved!', 'success');
    } catch (error) {
      console.error('Error saving catalogue settings:', error);
      showToast('Failed to save settings', 'error');
    }
  };

  const getCatalogueLink = () => {
    return `${window.location.origin}/catalogue/${salonId}`;
  };

  const copyCatalogueLink = () => {
    navigator.clipboard.writeText(getCatalogueLink());
    showToast('Catalogue link copied!', 'success');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For now, use base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setCatalogueSettings(prev => ({
        ...prev,
        logoUrl: reader.result
      }));
      showToast('Logo uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#6c757d', marginTop: '10px' }}>Loading catalogue settings...</p>
      </div>
    );
  }

  return (
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
            Business Catalogue
          </h2>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
            Customize your public business profile
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={copyCatalogueLink}
            style={{
              padding: '10px 16px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔗 Copy Link
          </button>
          
          <button 
            onClick={saveCatalogueSettings}
            style={{
              padding: '10px 16px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="content-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👁️ Preview
        </h3>
        <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '16px' }}>
          Your clients will see this at: <code style={{ background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>{getCatalogueLink()}</code>
        </p>
        
        <div style={{ 
          border: '2px dashed #e9ecef', 
          borderRadius: '12px', 
          padding: '20px',
          background: '#f8fafc',
          textAlign: 'center'
        }}>
          <p style={{ color: '#6c757d', marginBottom: '16px' }}>
            Preview will show here (coming soon)
          </p>
          <button 
            onClick={() => window.open(getCatalogueLink(), '_blank')}
            style={{
              padding: '10px 20px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            👁️ Open Public View
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Logo & Basic Info */}
        <div className="content-card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Salon Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Logo Upload */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Salon Logo
              </label>
              <div style={{
                width: '120px',
                height: '120px',
                border: '2px dashed #d1d5db',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: catalogueSettings.logoUrl ? `url(${catalogueSettings.logoUrl}) center/cover` : '#f9fafb',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                {!catalogueSettings.logoUrl ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', color: '#9ca3af', marginBottom: '8px' }}>
                      🏢
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                      Click to upload logo
                    </p>
                  </div>
                ) : (
                  <div style={{ 
                    background: 'rgba(0,0,0,0.5)', 
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    Change Logo
                  </div>
                )}
              </div>
            </div>

            {/* Salon Description */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Salon Description
              </label>
              <textarea
                value={catalogueSettings.salonDescription}
                onChange={(e) => setCatalogueSettings(prev => ({ ...prev, salonDescription: e.target.value }))}
                placeholder="Welcome to our salon! We specialize in..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={catalogueSettings.contactPhone}
                  onChange={(e) => setCatalogueSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="123-456-7890"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={catalogueSettings.contactEmail}
                  onChange={(e) => setCatalogueSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="hello@salon.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Address
              </label>
              <input
                type="text"
                value={catalogueSettings.address}
                onChange={(e) => setCatalogueSettings(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street, City"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              🕒 Business Hours
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={catalogueSettings.showBusinessHours}
                onChange={(e) => setCatalogueSettings(prev => ({ ...prev, showBusinessHours: e.target.checked }))}
                style={{ width: '16px', height: '16px' }}
              />
              Show on catalogue
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(catalogueSettings.businessHours).map(([day, hours]) => (
              <div key={day} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '120px' }}>
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => {
                        const updatedHours = { ...catalogueSettings.businessHours };
                        updatedHours[day].closed = !e.target.checked;
                        setCatalogueSettings(prev => ({ ...prev, businessHours: updatedHours }));
                      }}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                      {day}
                    </span>
                  </label>
                  
                  {!hours.closed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => {
                          const updatedHours = { ...catalogueSettings.businessHours };
                          updatedHours[day].open = e.target.value;
                          setCatalogueSettings(prev => ({ ...prev, businessHours: updatedHours }));
                        }}
                        style={{
                          padding: '8px',
                          border: '1px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => {
                          const updatedHours = { ...catalogueSettings.businessHours };
                          updatedHours[day].close = e.target.value;
                          setCatalogueSettings(prev => ({ ...prev, businessHours: updatedHours }));
                        }}
                        style={{
                          padding: '8px',
                          border: '1px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  ) : (
                    <span style={{ color: '#dc2626', fontWeight: '500' }}>
                      Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Display Settings */}
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              💼 Services Display
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={catalogueSettings.showServices}
                onChange={(e) => setCatalogueSettings(prev => ({ ...prev, showServices: e.target.checked }))}
                style={{ width: '16px', height: '16px' }}
              />
              Show services
            </label>
          </div>

          <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '16px' }}>
            {services.length} services will be displayed on your catalogue
          </p>
          
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '16px'
          }}>
            {services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                No services added yet. Add services in the Services tab.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {services.slice(0, 5).map(service => (
                  <div key={service.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    {service.imageUrl && (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: `url(${service.imageUrl}) center/cover`,
                        borderRadius: '6px',
                        flexShrink: 0
                      }}></div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
                        {service.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>
                        ${service.price} • {service.duration || 30} min
                      </p>
                    </div>
                  </div>
                ))}
                
                {services.length > 5 && (
                  <div style={{ textAlign: 'center', padding: '12px', color: '#6c757d', fontSize: '14px' }}>
                    + {services.length - 5} more services...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Display Options */}
        <div className="content-card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Display Options
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>Show Contact Information</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>Phone, email, address</p>
              </div>
              <input
                type="checkbox"
                checked={catalogueSettings.showContactInfo}
                onChange={(e) => setCatalogueSettings(prev => ({ ...prev, showContactInfo: e.target.checked }))}
                style={{ width: '20px', height: '20px' }}
              />
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>Show About Section</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>Salon description</p>
              </div>
              <input
                type="checkbox"
                checked={catalogueSettings.showAboutSection}
                onChange={(e) => setCatalogueSettings(prev => ({ ...prev, showAboutSection: e.target.checked }))}
                style={{ width: '20px', height: '20px' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#10B981' : 
                    toast.type === 'error' ? '#EF4444' : 
                    toast.type === 'warning' ? '#F59E0B' : '#3B82F6',
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
          <span style={{ fontSize: '18px' }}>
            {toast.type === 'success' ? '✅' :
             toast.type === 'error' ? '❌' :
             toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>
            {toast.message}
          </span>
          <button 
            onClick={() => setToast(null)}
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
      )}

      {/* Add CSS animation for toast */}
      <style>{`
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
      `}</style>
    </div>
  );
};
export default OwnerDashboard;