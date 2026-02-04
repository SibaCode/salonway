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
  onSnapshot,
  limit 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  FaHome,
  FaUsers,
  FaCut,
  FaImage,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaBell,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaPlus,
  FaUser,
  FaCalendar,
  FaMoneyBill,
  FaShoppingBag,
  FaCrown,
  FaChevronRight,
  FaEnvelope,
  FaWhatsapp,
  FaCopy
} from 'react-icons/fa';
import './css/OwnerDashboard.css';
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
    { id: 'gallery', label: 'Gallery', icon: '🖼️', description: 'Manage photos & showcase work' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📊', description: 'View business insights' },
    { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Salon settings & preferences' },
    { id: 'subscription', label: 'Subscription', icon: '👑', description: 'Manage your plan' },
    { id: 'help', label: 'Help & Support', icon: '❓', description: 'Get help & tutorials' },
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
        <button className="notification-btn">
          <FaBell />
          <span className="notification-badge"></span>
        </button>
        
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
          
          <button className="notification-btn" style={{ position: 'relative' }}>
            <FaBell />
            <span className="notification-badge"></span>
          </button>
          
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
    <ServicesContent salonId={salonData.id} />
  )}
  
  {activeTab === 'clients' && (
    <ClientsContent salonId={salonData.id} salonData={salonData} />
  )}
  
  {activeTab === 'gallery' && (
    <GalleryContent salonId={salonData.id} />
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
    {
      title: 'Gallery Views',
      value: dashboardStats.galleryViews,
      icon: '👀',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      label: 'Today',
      onClick: () => setActiveTab && setActiveTab('gallery')
    }
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
              <div 
                className="stat-icon"
                style={{ 
                  background: stat.bgColor,
                  color: stat.color,
                  fontSize: '24px'
                }}
              >
                {stat.icon}
              </div>
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
const ClientsContent = ({ salonId, salonData }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'form' or 'manual'
  
  useEffect(() => {
    fetchConsultations();
  }, [salonId]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'consultations'),
        where('salonId', '==', salonId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const consultationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setConsultations(consultationsData);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewClient = async (clientData) => {
    try {
      const newConsultation = {
        ...clientData,
        salonId,
        createdAt: new Date(),
        status: 'new',
        source: 'manual', // Mark as manually added
        // Map form fields to match consultation structure
        clientName: clientData.name,
        clientPhone: clientData.phone,
        clientEmail: clientData.email,
        serviceNeeded: clientData.preferences,
        additionalInfo: clientData.notes
      };

      const docRef = await addDoc(collection(db, 'consultations'), newConsultation);
      
      setConsultations(prev => [{
        id: docRef.id,
        ...newConsultation
      }, ...prev]);
      
      setShowAddClient(false);
      alert('Client added successfully!');
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client');
    }
  };

  const updateConsultationStatus = async (consultationId, newStatus) => {
    try {
      await updateDoc(doc(db, 'consultations', consultationId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setConsultations(prev => prev.map(consult => 
        consult.id === consultationId ? { ...consult, status: newStatus } : consult
      ));
      
      if (selectedConsultation?.id === consultationId) {
        setSelectedConsultation(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteConsultation = async (consultationId) => {
    if (window.confirm('Are you sure you want to delete this client entry?')) {
      try {
        await deleteDoc(doc(db, 'consultations', consultationId));
        setConsultations(prev => prev.filter(consult => consult.id !== consultationId));
        if (selectedConsultation?.id === consultationId) {
          setSelectedConsultation(null);
        }
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const copyFormLink = () => {
    const formLink = `${window.location.origin}/client/${salonData.id}`;
    navigator.clipboard.writeText(formLink);
    alert('Form link copied! Share this with clients.');
  };

  // Filter consultations
  const filteredConsultations = consultations.filter(consult => {
    const matchesSearch = searchTerm === '' || 
      consult.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consult.clientPhone?.includes(searchTerm) ||
      consult.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || consult.status === statusFilter;
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'form' && consult.source !== 'manual') ||
      (typeFilter === 'manual' && consult.source === 'manual');
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique client count (by phone or email)
  const uniqueClientsCount = new Set(
    consultations
      .filter(c => c.clientPhone || c.clientEmail)
      .map(c => c.clientPhone || c.clientEmail)
  ).size;

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
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Client Management
          </h2>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
            Manage client forms and information
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={copyFormLink}
            style={{
              padding: '10px 20px',
              background: 'var(--primary-color, #007bff)',
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
            📝 Share Form
          </button>
          
          <button 
            onClick={() => setShowAddClient(true)}
            style={{
              padding: '10px 20px',
              background: '#28a745',
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
            ➕ Add Client
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>Total Entries</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>{consultations.length}</h3>
        </div>
        
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>Unique Clients</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#28a745' }}>
            {uniqueClientsCount}
          </h3>
        </div>
        
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>New (Unreviewed)</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#fd7e14' }}>
            {consultations.filter(c => c.status === 'new').length}
          </h3>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        background: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px'
      }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            minWidth: '120px'
          }}
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="contacted">Contacted</option>
          <option value="scheduled">Scheduled</option>
        </select>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            minWidth: '120px'
          }}
        >
          <option value="all">All Types</option>
          <option value="form">Form Submissions</option>
          <option value="manual">Manual Entries</option>
        </select>
      </div>

      {/* Consultations List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading client data...</p>
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#e9ecef',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 20px',
            color: '#6c757d'
          }}>
            📝
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#6c757d' }}>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'No matching entries' : 'No Client Entries Yet'}
          </h3>
          <p style={{ color: '#adb5bd', fontSize: '14px', margin: '0 0 20px 0' }}>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Add clients manually or share the form with clients'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowAddClient(true)}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ➕ Add First Client
            </button>
            <button 
              onClick={copyFormLink}
              style={{
                padding: '10px 20px',
                background: 'var(--primary-color, #007bff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📝 Get Form Link
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 120px 100px 80px',
            padding: '16px',
            background: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            fontWeight: '600',
            fontSize: '14px',
            color: '#495057'
          }}>
            <div>Client Information</div>
            <div>Service & Date</div>
            <div>Status</div>
            <div>Type</div>
            <div>Actions</div>
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredConsultations.map(consult => (
              <div 
                key={consult.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 120px 100px 80px',
                  padding: '16px',
                  borderBottom: '1px solid #f8f9fa',
                  alignItems: 'center',
                  ':hover': {
                    background: '#f8f9fa'
                  }
                }}
              >
                {/* Client Information */}
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {consult.clientName || 'Unknown Client'}
                    {consult.source === 'manual' && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: '#e9ecef',
                        color: '#6c757d',
                        borderRadius: '4px'
                      }}>
                        Manual
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>
                    📞 {consult.clientPhone || 'No phone'} 
                    {consult.clientEmail && ` • ✉️ ${consult.clientEmail}`}
                  </div>
                </div>
                
                {/* Service & Date */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {consult.serviceNeeded || 'General Consultation'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>
                    {consult.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}
                  </div>
                </div>
                
                {/* Status */}
                <div>
                  <select
                    value={consult.status || 'new'}
                    onChange={(e) => updateConsultationStatus(consult.id, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: 'white',
                      width: '100%',
                      color: consult.status === 'new' ? '#dc3545' : 
                             consult.status === 'reviewed' ? '#fd7e14' :
                             consult.status === 'contacted' ? '#17a2b8' :
                             consult.status === 'scheduled' ? '#28a745' : '#6c757d'
                    }}
                  >
                    <option value="new" style={{ color: '#dc3545' }}>New</option>
                    <option value="reviewed" style={{ color: '#fd7e14' }}>Reviewed</option>
                    <option value="contacted" style={{ color: '#17a2b8' }}>Contacted</option>
                    <option value="scheduled" style={{ color: '#28a745' }}>Scheduled</option>
                  </select>
                </div>
                
                {/* Type */}
                <div>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    background: consult.source === 'manual' ? '#e9ecef' : '#d1fae5',
                    color: consult.source === 'manual' ? '#6c757d' : '#065f46',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}>
                    {consult.source === 'manual' ? 'Manual' : 'Form'}
                  </span>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedConsultation(consult)}
                    style={{
                      padding: '6px 12px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <Modal onClose={() => setShowAddClient(false)}>
          <AddClientForm 
            onSubmit={addNewClient}
            onCancel={() => setShowAddClient(false)}
          />
        </Modal>
      )}

      {/* View Consultation/Client Details Modal */}
      {selectedConsultation && (
        <Modal onClose={() => setSelectedConsultation(null)}>
          <ConsultationDetails 
            consultation={selectedConsultation}
            onDelete={deleteConsultation}
            onClose={() => setSelectedConsultation(null)}
            onUpdateStatus={updateConsultationStatus}
          />
        </Modal>
      )}
    </div>
  );
};

// Add Client Form Component (adds to consultations)
const AddClientForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferences: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
        Add New Client
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
            Service Interest / Preferences
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
            Notes / Additional Information
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
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
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

// Modal Component (reuse from previous)
const Modal = ({ children, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  }}>
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative'
    }}>
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#6c757d'
        }}
      >
        ✕
      </button>
      {children}
    </div>
  </div>
);


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

// Client Details View Component (simplified)
const ClientDetails = ({ client, onDelete, onClose, onEdit }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
        Client Details
      </h3>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Name</strong>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{client.name}</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Phone</strong>
              <p style={{ margin: 0 }}>{client.phone || 'Not provided'}</p>
            </div>
            <div>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Email</strong>
              <p style={{ margin: 0 }}>{client.email || 'Not provided'}</p>
            </div>
          </div>
          
          {client.address && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Address</strong>
              <p style={{ margin: 0 }}>{client.address}</p>
            </div>
          )}
          
          {client.preferences && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Preferences</strong>
              <p style={{ margin: 0 }}>{client.preferences}</p>
            </div>
          )}
          
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Status</strong>
            <span style={{
              padding: '4px 12px',
              background: client.status === 'active' ? '#d1fae5' : 
                         client.status === 'vip' ? '#fef3c7' :
                         client.status === 'inactive' ? '#fee2e2' : '#e9ecef',
              color: client.status === 'active' ? '#065f46' : 
                     client.status === 'vip' ? '#92400e' :
                     client.status === 'inactive' ? '#dc2626' : '#495057',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {client.status?.toUpperCase() || 'ACTIVE'}
            </span>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Member Since</strong>
            <p style={{ margin: 0 }}>
              {client.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
            </p>
          </div>
          
          {client.notes && (
            <div>
              <strong style={{ display: 'block', marginBottom: '4px', color: '#6c757d' }}>Notes</strong>
              <p style={{ margin: 0 }}>{client.notes}</p>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onEdit}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Edit Client
            </button>
          </div>
          
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
                if (window.confirm('Are you sure you want to delete this client?')) {
                  onDelete(client.id);
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

// Services Content Component
const ServicesContent = ({ salonId }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [categories, setCategories] = useState([]); // Start with empty categories
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [toast, setToast] = useState(null); // Add toast state
  
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    duration: '30',
    imageUrl: '',
    isActive: true
  });

  // Simple toast function
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add toast styles to document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
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
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Filter services based on active category
  const filteredServices = activeCategory === 'All' 
    ? services 
    : services.filter(service => service.category === activeCategory);

  useEffect(() => {
    fetchServices();
  }, [salonId]);

  const fetchServices = async () => {
    try {
      const servicesSnapshot = await getDocs(collection(db, 'salons', salonId, 'services'));
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesList);
      
      // Extract unique categories from services
      const uniqueCategories = [...new Set(servicesList.map(service => service.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching services:', error);
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add new category
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }
    
    const categoryName = newCategoryName.trim();
    
    // Check if category already exists
    if (categories.includes(categoryName)) {
      showToast('Category already exists!', 'error');
      return;
    }
    
    // Add to categories list
    setCategories(prev => [...prev, categoryName]);
    
    // If this is the first category, set it as default
    if (categories.length === 0) {
      setNewService(prev => ({ ...prev, category: categoryName }));
    }
    
    setNewCategoryName('');
    setShowAddCategory(false);
    showToast(`"${categoryName}" category added!`);
  };

  // Delete category (only if no services use it)
  const handleDeleteCategory = (categoryToDelete) => {
    // Check if any services use this category
    const servicesInCategory = services.filter(service => service.category === categoryToDelete);
    
    if (servicesInCategory.length > 0) {
      showToast(`Cannot delete "${categoryToDelete}" category. ${servicesInCategory.length} service(s) are using it. Please reassign or delete those services first.`, 'error');
      return;
    }
    
    if (window.confirm(`Delete "${categoryToDelete}" category?`)) {
      setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
      
      // If the deleted category was selected, switch to "All"
      if (activeCategory === categoryToDelete) {
        setActiveCategory('All');
      }
      
      // If the deleted category was selected in newService, switch to first category or empty
      if (newService.category === categoryToDelete) {
        setNewService(prev => ({ ...prev, category: categories.length > 1 ? categories[0] : '' }));
      }
      
      showToast(`"${categoryToDelete}" category deleted`);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
      showToast('Please select an image file', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewService({...newService, imageUrl: reader.result});
        showToast('Image uploaded!');
      };
      reader.onerror = () => {
        showToast('Failed to read image', 'error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast('Failed to upload image', 'error');
    }
  };

  const handleSaveService = async () => {
    if (!newService.name.trim()) {
      showToast('Please enter service name', 'error');
      return;
    }

    if (!newService.price) {
      showToast('Please enter price', 'error');
      return;
    }

    if (!newService.category && categories.length > 0) {
      showToast('Please select a category', 'error');
      return;
    }

    try {
      const serviceData = {
        name: newService.name.trim(),
        category: newService.category || 'Uncategorized',
        description: newService.description.trim() || '',
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration) || 30,
        imageUrl: newService.imageUrl || '',
        isActive: true,
        createdAt: serverTimestamp(),
        salonId: salonId
      };

      if (editingService) {
        // Update existing service
        await updateDoc(doc(db, 'salons', salonId, 'services', editingService.id), serviceData);
        showToast('Service updated!');
      } else {
        // Add new service
        await addDoc(collection(db, 'salons', salonId, 'services'), serviceData);
        showToast('Service added!');
      }

      // Refresh and reset
      await fetchServices();
      setNewService({
        name: '',
        category: categories.length > 0 ? categories[0] : '',
        description: '',
        price: '',
        duration: '30',
        imageUrl: '',
        isActive: true
      });
      setEditingService(null);
      setShowAddForm(false);

    } catch (error) {
      console.error('Error saving service:', error);
      showToast('Failed to save service. Please try again.', 'error');
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!window.confirm(`Delete "${serviceName}"?`)) return;

    try {
      await deleteDoc(doc(db, 'salons', salonId, 'services', serviceId));
      await fetchServices();
      showToast('Service deleted');
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Failed to delete service.', 'error');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      category: service.category || '',
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration?.toString() || '30',
      imageUrl: service.imageUrl || '',
      isActive: service.isActive !== false
    });
    setShowAddForm(true);
  };
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading services...</p>
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
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Services Menu
          </h2>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
            Create your service catalog with prices and images
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
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
          <span>➕</span> Add Service
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '10px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setActiveCategory('All')}
          style={{
            padding: '8px 16px',
            background: activeCategory === 'All' ? 'var(--primary-color)' : 'white',
            color: activeCategory === 'All' ? 'white' : '#495057',
            border: '1px solid #e9ecef',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          All Services ({services.length})
        </button>
        {categories.map(cat => {
          const count = services.filter(s => s.category === cat).length;
          return (
            <div key={cat} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  background: activeCategory === cat ? 'var(--primary-color)' : 'white',
                  color: activeCategory === cat ? 'white' : '#495057',
                  border: '1px solid #e9ecef',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: count === 0 ? 0.5 : 1,
                  paddingRight: '32px'
                }}
                disabled={count === 0}
              >
                {cat} ({count})
              </button>
              {count === 0 && cat !== 'Hair' && cat !== 'Nails' && cat !== 'Beauty' && (
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Delete category"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        
        {/* Add Category Button */}
        <button
          onClick={() => setShowAddCategory(true)}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            color: 'var(--primary-color)',
            border: '2px dashed var(--primary-color)',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Add new category"
        >
          <span style={{ fontSize: '18px' }}>+</span> Add Category
        </button>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              Add New Category
            </h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name (e.g., Waxing, Kids)"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '16px'
              }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
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
                onClick={handleAddCategory}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid - REST OF THE CODE REMAINS THE SAME */}
      {filteredServices.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#e9ecef',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 20px',
            color: '#6c757d'
          }}>
            💼
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#6c757d' }}>
            No Services Yet
          </h3>
          <p style={{ color: '#adb5bd', fontSize: '14px', margin: '0 0 20px 0' }}>
            {activeCategory === 'All' 
              ? 'Create your first service to build your catalog' 
              : `No services in the ${activeCategory} category`}
          </p>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '12px 24px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {activeCategory === 'All' ? 'Create First Service' : `Add ${activeCategory} Service`}
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredServices.map(service => (
            <div 
              key={service.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #f1f3f4',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              {/* Service Image */}
              <div style={{
                height: '160px',
                background: service.imageUrl ? `url(${service.imageUrl}) center/cover` : '#f8f9fa',
                position: 'relative'
              }}>
                {!service.imageUrl && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '40px',
                    color: '#dee2e6'
                  }}>
                    💼
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: service.isActive ? '#10B981' : '#6c757d',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>

              {/* Service Details */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>
                      {service.name}
                    </h4>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        background: '#e9ecef',
                        color: '#495057',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {service.category}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#6c757d'
                      }}>
                        {service.duration || 30} min
                      </span>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700',
                    color: 'var(--primary-color)'
                  }}>
                    ${service.price}
                  </div>
                </div>

                {service.description && (
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#6c757d',
                    margin: '8px 0 12px 0',
                    lineHeight: '1.4'
                  }}>
                    {service.description.length > 80 
                      ? `${service.description.substring(0, 80)}...` 
                      : service.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  <button
                    onClick={() => handleEditService(service)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#e9ecef',
                      color: '#495057',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
  onClick={async () => {
    try {
      const docRef = doc(db, 'salons', salonId, 'services', service.id);
      await updateDoc(docRef, { isActive: !service.isActive });
      await fetchServices();
      showToast(`Service ${service.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error('Error toggling service status:', error);
      showToast('Failed to update service status', 'error');
    }
  }}
  style={{
    flex: 1,
    padding: '8px',
    background: service.isActive ? '#fee2e2' : '#d1fae5',
    color: service.isActive ? '#dc2626' : '#065f46',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  }}
>
  {service.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
</button>
                  <button
                    onClick={() => handleDeleteService(service.id, service.name)}
                    style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingService(null);
                  setNewService({
                    name: '',
                    category: categories[0] || 'Hair',
                    description: '',
                    price: '',
                    duration: '30',
                    imageUrl: '',
                    isActive: true
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Service Name */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                    placeholder="e.g., Women's Haircut, Manicure, Facial"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    autoFocus
                  />
                </div>

                {/* Category - Updated with Add Category button */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ 
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setShowAddCategory(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-color)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>+</span> Add New
                    </button>
                  </div>
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService({...newService, category: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '16px',
                      background: 'white'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Price & Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: e.target.value})}
                      placeholder="65"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Duration (minutes)
                    </label>
                    <select
                      value={newService.duration}
                      onChange={(e) => setNewService({...newService, duration: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'white'
                      }}
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    placeholder="Describe the service, what's included..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Service Image (Optional)
                  </label>
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: newService.imageUrl ? `url(${newService.imageUrl}) center/cover` : '#f9fafb',
                    height: '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
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
                    {!newService.imageUrl ? (
                      <div>
                        <div style={{ fontSize: '32px', color: '#9ca3af', marginBottom: '8px' }}>
                          📷
                        </div>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                          Click to upload image
                        </p>
                        <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
                          For service catalog
                        </p>
                      </div>
                    ) : (
                      <div style={{ 
                        background: 'rgba(0,0,0,0.5)', 
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px'
                      }}>
                        Change Image
                      </div>
                    )}
                  </div>
                  {newService.imageUrl && (
                    <button
                      onClick={() => setNewService({...newService, imageUrl: ''})}
                      style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingService(null);
                      setNewService({
                        name: '',
                        category: categories[0] || 'Hair',
                        description: '',
                        price: '',
                        duration: '30',
                        imageUrl: '',
                        isActive: true
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
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
                    onClick={handleSaveService}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {editingService ? 'Update Service' : 'Add Service'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
       {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Gallery Content Component
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

export default OwnerDashboard;