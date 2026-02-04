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
        { id: 'gallery', label: 'Gallery', icon: '🖼️' },
        { id: 'reports', label: 'Reports', icon: '📊' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
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
      value: `$${dashboardStats.todayRevenue}`,
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
      {liveFeed.length > 0 && (
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
      )}
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
      { id: 'all', label: 'All', icon: '📡', count: liveFeed.length },
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
                    ${item.price}
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
      {recentWork.length > 0 ? (
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
      )}
    </>
  );
};
const ClientsContent = ({ salonId, salonData }) => {
  const [clientForms, setClientForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  
  useEffect(() => {
    fetchClientForms();
  }, [salonId]);

  const fetchClientForms = async () => {
    try {
      const q = query(
        collection(db, 'consultations'),
        where('salonId', '==', salonId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const forms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setClientForms(forms);
    } catch (error) {
      console.error('Error fetching client forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormLink = () => {
    return `${window.location.origin}/client/${salonData.id}`;
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(getFormLink());
    alert('Form link copied!');
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header with form link */}
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
            Client Forms
          </h2>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
            Manage consultations & client information
          </p>
        </div>
        
        <button 
          onClick={copyFormLink}
          style={{
            padding: '10px 20px',
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
          📝 Share Form Link
        </button>
      </div>

      {/* Client forms list */}
      {clientForms.length === 0 ? (
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
            No Client Forms Yet
          </h3>
          <p style={{ color: '#adb5bd', fontSize: '14px', margin: '0 0 20px 0' }}>
            Share the form link with clients to collect their information
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {clientForms.map(form => (
            <div 
              key={form.id}
              className="content-card"
              onClick={() => setSelectedForm(form)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                    {form.clientName || 'Unknown Client'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6c757d' }}>
                    {form.clientPhone || 'No phone provided'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6c757d' }}>
                    {form.createdAt?.toDate?.().toLocaleDateString() || 'Today'}
                  </p>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    background: form.status === 'new' ? '#fef3c7' : '#d1fae5',
                    color: form.status === 'new' ? '#92400e' : '#065f46',
                    borderRadius: '12px'
                  }}>
                    {form.status === 'new' ? 'NEW' : 'REVIEWED'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
// Create ReportsContent component:
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

  useEffect(() => {
    fetchStaff();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const generateUniqueCode = () => {
    // Generate 6-character alphanumeric code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleAddStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.phone.trim()) {
      alert('Name and phone number are required');
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
        createdAt: new Date().toISOString()
      };

      // Add to Firestore
      await addDoc(collection(db, 'salons', salonId, 'staff'), staffData);
      
      // Refresh staff list
      await fetchStaff();
      
      // Reset form and close
      setNewStaff({ name: '', phone: '', email: '' });
      setShowAddForm(false);
      
      // Show success with link
      const staffLink = `${window.location.origin}/staff/${uniqueCode}`;
      alert(`Staff added successfully!\n\nShare this link with them:\n${staffLink}\n\nThey can use it to clock in/out.`);
      
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff. Please try again.');
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to remove ${staffName}?`)) {
      return;
    }

    try {
      // In MVP, we'll just delete from Firestore
      // Later we can do soft delete (isActive: false)
      await deleteDoc(doc(db, 'salons', salonId, 'staff', staffId));
      
      // Refresh staff list
      await fetchStaff();
      alert(`${staffName} has been removed.`);
      
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff. Please try again.');
    }
  };

  const copyToClipboard = (text, event) => {
    if (event && event.currentTarget) {
      navigator.clipboard.writeText(text);
      
      // Change button appearance to show success
      const btn = event.currentTarget;
      const originalText = btn.textContent;
      const originalBackground = btn.style.background;
      const originalColor = btn.style.color;
      
      btn.textContent = 'Copied!';
      btn.style.background = '#10B981';
      btn.style.color = 'white';
      
      // Revert after 1.5 seconds
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = originalBackground;
        btn.style.color = originalColor;
      }, 1500);
    } else {
      // Fallback if no event
      navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#6c757d', marginTop: '10px' }}>Loading staff...</p>
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
            Staff Members
          </h2>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
            Add staff and share their clock-in links
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
          <span>👤</span> Add Staff
        </button>
      </div>

      {/* Add Staff Form Modal */}
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
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            overflow: 'hidden'
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
                Add New Staff
              </h3>
              <button 
                onClick={() => setShowAddForm(false)}
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
                {/* Name Field */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    placeholder="Sarah Johnson"
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

                {/* Phone Field */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    placeholder="1234567890"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                  <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Used for WhatsApp notifications
                  </small>
                </div>

                {/* Email Field (Optional) */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    placeholder="sarah@salon.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => setShowAddForm(false)}
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
                    onClick={handleAddStaff}
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
                    Add Staff Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff List */}
      {staff.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6',
          color: '#1a1a1a',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#e9ecef',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 16px'
          }}>
            👤
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' , color: '#1a1a1a'}}>
            No Staff Members Yet
          </h3>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: '0 0 20px 0' }}>
            Add your first staff member to get started
          </p>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '10px 20px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Add First Staff Member
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {staff.map((member) => {
            const staffLink = `${window.location.origin}/staff/${member.linkCode}`;
            return (
              <div 
                key={member.id}
                style={{
                  background: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '12px',
                  padding: '16px',
                  position: 'relative',
                  color: '#1a1a1a' 
                }}
              >
                {/* Staff Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--primary-color)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a1a1a' ,
                    fontWeight: '600',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    {member.name?.charAt(0) || 'S'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '500' ,color: '#1a1a1a' }}>
                      {member.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {member.phone && (
                        <span style={{ fontSize: '14px', color: '#495057', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📞 {member.phone}
                        </span>
                      )}
                      {member.email && (
                        <span style={{ fontSize: '14px', color: '#495057', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✉️ {member.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Staff Link Display */}
                <div style={{ 
                  marginBottom: '12px', 
                  padding: '8px', 
                  background: '#f8f9fa', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {staffLink}
                </div>

                {/* Action Buttons - ONLY COPY & DELETE */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => copyToClipboard(staffLink, e)}  // ✅ Pass event as second parameter
                    style={{
                      flex: 2,
                      padding: '8px',
                      background: '#e9ecef',
                      color: '#495057',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    📋 Copy Link
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(member.id, member.name)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Services Content Component
const ServicesContent = ({ salonId }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [categories] = useState(['Hair', 'Nails', 'Beauty', 'Spa', 'Makeup', 'Massage', 'Bridal']);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [newService, setNewService] = useState({
    name: '',
    category: 'Hair',
    description: '',
    price: '',
    duration: '30',
    imageUrl: '',
    isActive: true
  });

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
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload (mock for now - in production use Firebase Storage)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For MVP: Use a mock URL or base64
    // In production: Upload to Firebase Storage
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewService({...newService, imageUrl: reader.result});
    };
    reader.readAsDataURL(file);
  };

  const handleSaveService = async () => {
    if (!newService.name.trim() || !newService.price) {
      alert('Please fill in service name and price');
      return;
    }

    try {
      const serviceData = {
        name: newService.name.trim(),
        category: newService.category,
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
        alert('Service updated!');
      } else {
        // Add new service
        await addDoc(collection(db, 'salons', salonId, 'services'), serviceData);
        alert('Service added!');
      }

      // Refresh and reset
      await fetchServices();
      setNewService({
        name: '',
        category: 'Hair',
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
      alert('Failed to save service. Please try again.');
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!window.confirm(`Delete "${serviceName}"?`)) return;

    try {
      await deleteDoc(doc(db, 'salons', salonId, 'services', serviceId));
      await fetchServices();
      alert('Service deleted');
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service.');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      category: service.category || 'Hair',
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
        paddingBottom: '10px'
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
            <button
              key={cat}
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
                opacity: count === 0 ? 0.5 : 1
              }}
              disabled={count === 0}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
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
                    onClick={() => {
                      // Toggle active status
                      const docRef = doc(db, 'salons', salonId, 'services', service.id);
                      updateDoc(docRef, { isActive: !service.isActive });
                      fetchServices();
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
                    category: 'Hair',
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

                {/* Category */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Category *
                  </label>
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
                        category: 'Hair',
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