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
  orderBy, 
  deleteDoc,  // ADD THIS
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
        onClick={() => setActiveTab('gallery')}
        className={`nav-btn ${activeTab === 'gallery' ? 'active' : ''}`}
      >
        <span className="nav-icon">🖼️</span>
        <span className="nav-label">Gallery</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('links')}
        className={`nav-btn ${activeTab === 'links' ? 'active' : ''}`}
      >
        <span className="nav-icon">🔗</span>
        <span className="nav-label">Links</span>
      </button>
    </nav>
  );

// In OwnerDashboard.js, replace the return statement with this responsive layout:

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
        { id: 'gallery', label: 'Gallery', icon: '🖼️' },
        { id: 'links', label: 'Links', icon: '🔗' },
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
          />
        )}
        
        {activeTab === 'staff' && (
          <StaffContent salonId={salonData.id} ownerData={ownerData} />
        )}
        
        {activeTab === 'services' && (
          <ServicesContent salonId={salonData.id} />
        )}
        
        {activeTab === 'gallery' && (
          <GalleryContent salonId={salonData.id} />
        )}
        
        {activeTab === 'links' && (
          <LinksContent salonId={salonData.id} salonData={salonData} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsContent salonData={salonData} ownerData={ownerData} />
        )}
      </main>

      {/* Mobile Bottom Navigation (only on mobile) */}
      <div className="mobile-only">
        <BottomNav />
      </div>
    </div>
  </div>
);

  if (!ownerData || !salonData) {
    return null;
  }

  return (
    <div className="owner-dashboard">
      {/* Header */}
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

      {/* Main Content */}
      <main>
        {activeTab === 'dashboard' && (
          <DashboardContent 
            salonData={salonData} 
            ownerData={ownerData}
            salonId={salonData.id}
          />
        )}
        
        {activeTab === 'staff' && (
          <StaffContent salonId={salonData.id} ownerData={ownerData} />
        )}
        
        {activeTab === 'services' && (
          <ServicesContent salonId={salonData.id} />
        )}
        
        {activeTab === 'gallery' && (
          <GalleryContent salonId={salonData.id} />
        )}
        
        {activeTab === 'links' && (
          <LinksContent salonId={salonData.id} salonData={salonData} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsContent salonData={salonData} ownerData={ownerData} />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

// Dashboard Content Component
const DashboardContent = ({ salonData, ownerData, salonId }) => {
  const [dashboardStats, setDashboardStats] = useState({
    staffActive: 0,
    todayRevenue: 0,
    formResponses: 0,
    galleryViews: 0
  });
    const [activeStaff, setActiveStaff] = useState([]);

  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);
  const fetchDashboardData = async () => {
    try {
      // 1. Count staff active now (clocked in today & not clocked out)
      const staffSnapshot = await getDocs(collection(db, 'salons', salonId, 'staff'));
      const staffActive = staffSnapshot.size;

      // 2. Get active staff (clocked in)
      try {
        const q = query(
          collection(db, 'clockRecords'),
          where('salonId', '==', salonId),
          where('clockOut', '==', null)
        );
        
        const snapshot = await getDocs(q);
        const active = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActiveStaff(active);
        
        // Update staffActive count to only show actually clocked-in staff
        dashboardStats.staffActive = active.length;
      } catch (error) {
        console.log('No clock records yet:', error);
        setActiveStaff([]);
      }

      // 3. Calculate today's revenue - start with 0 for now
      const todayRevenue = 0;

      // 4. Count today's form responses - start with 0 for now
      const formResponses = 0;

      // 5. Count today's gallery views - start with 0 for now
      const galleryViews = 0;

      setDashboardStats({
        staffActive: dashboardStats.staffActive,
        todayRevenue,
        formResponses,
        galleryViews
      });

      // 6. Build live feed from recent activities
      await buildLiveFeed();

    } catch (error) {
      console.log('No data yet, showing zeros:', error);
      // Keep zeros if no data
    } finally {
      setLoading(false);
    }
  };
  // const fetchDashboardData = async () => {
  //   try {
  //     // 1. Count staff active now (clocked in today & not clocked out)
  //     // For now, use total staff count (we'll implement clock-in later)
  //     const staffSnapshot = await getDocs(collection(db, 'salons', salonId, 'staff'));
  //     const staffActive = staffSnapshot.size;

  //     // 2. Calculate today's revenue - start with 0 for now
  //     const todayRevenue = 0;

  //     // 3. Count today's form responses - start with 0 for now
  //     const formResponses = 0;

  //     // 4. Count today's gallery views - start with 0 for now
  //     const galleryViews = 0;

  //     setDashboardStats({
  //       staffActive,
  //       todayRevenue,
  //       formResponses,
  //       galleryViews
  //     });

  //     // 5. Build live feed from recent activities
  //     await buildLiveFeed();

  //   } catch (error) {
  //     console.log('No data yet, showing zeros:', error);
  //     // Keep zeros if no data
  //   } finally {
  //     setLoading(false);
  //   }
  // };
// useEffect(() => {
//   const fetchActiveStaff = async () => {
//     try {
//       const q = query(
//         collection(db, 'clockRecords'),
//         where('salonId', '==', salonId),
//         where('clockOut', '==', null)
//       );
      
//       const snapshot = await getDocs(q);
//       const active = snapshot.docs.map(doc => doc.data());
//       setActiveStaff(active);
//     } catch (error) {
//       console.error('Error fetching active staff:', error);
//     }
//   };
  
//   fetchActiveStaff();
//   // Refresh every 30 seconds
//   const interval = setInterval(fetchActiveStaff, 30000);
//   return () => clearInterval(interval);
// }, [salonId]);
  const buildLiveFeed = async () => {
    const feed = [];
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    try {
      // For now, show sample feed
      const sampleFeed = [
        { id: 1, time: '10:30 AM', type: 'service', message: 'Sarah completed haircut - $85', icon: '💇' },
        { id: 2, time: '10:15 AM', type: 'clock', message: 'Mike clocked in', icon: '⏰' },
        { id: 3, time: '10:00 AM', type: 'form', message: 'New client submitted form', icon: '📝' },
        { id: 4, time: '09:45 AM', type: 'clock', message: 'John clocked in (late)', icon: '⏰' },
        { id: 5, time: '09:30 AM', type: 'gallery', message: 'Gallery viewed from Instagram', icon: '👀' },
        { id: 6, time: '09:15 AM', type: 'payment', message: 'Payment received - $45', icon: '💰' }
      ];
      
      setLiveFeed(sampleFeed);

    } catch (error) {
      console.log('Error building live feed:', error);
      // Show sample feed if no data
      const sampleFeed = [
        { id: 1, time: '10:30 AM', type: 'service', message: 'Sarah completed haircut - $85', icon: '💇' },
        { id: 2, time: '10:15 AM', type: 'clock', message: 'Mike clocked in', icon: '⏰' },
        { id: 3, time: '10:00 AM', type: 'form', message: 'New client submitted form', icon: '📝' },
        { id: 4, time: '09:45 AM', type: 'clock', message: 'John clocked in (late)', icon: '⏰' }
      ];
      setLiveFeed(sampleFeed);
    }
  };

  // Stats items for the grid
  const statItems = [
    {
      title: 'Staff Active',
     value: activeStaff.length, // Use activeStaff.length instead of dashboardStats.staffActive
      icon: '👥',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      label: 'Now'
    },
    {
      title: "Today's Revenue",
      value: `$${dashboardStats.todayRevenue}`,
      icon: '💰',
      color: '#10B981',
      bgColor: '#ECFDF5',
      label: ''
    },
    {
      title: 'Form Responses',
      value: dashboardStats.formResponses,
      icon: '📝',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      label: 'New'
    },
    {
      title: 'Gallery Views',
      value: dashboardStats.galleryViews,
      icon: '👀',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      label: 'Today'
    }
  ];

  // Quick action buttons
  const quickActions = [
    { label: 'Add Staff', icon: '👥', action: 'staff' },
    { label: 'Add Service', icon: '💼', action: 'services' },
    { label: 'Upload', icon: '📸', action: 'gallery' },
    { label: 'View Forms', icon: '👁️', action: 'forms' }
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
          <div key={index} className="stat-card">
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
      <div className="content-card" style={{ margin: '0 20px 20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📡</span> Live Feed
        </h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="loading-spinner" style={{ width: '30px', height: '30px', margin: '0 auto 10px' }}></div>
              <p style={{ color: '#6c757d', fontSize: '14px' }}>Loading live feed...</p>
            </div>
          ) : liveFeed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ color: '#6c757d', fontSize: '14px' }}>No activity yet today.</p>
              <p style={{ color: '#adb5bd', fontSize: '12px', marginTop: '8px' }}>
                Activity will appear here when staff clock in or complete services.
              </p>
            </div>
          ) : (
            liveFeed.map((item) => (
              <div 
                key={item.id} 
                className="activity-item"
                style={{ 
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f3f4',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ 
                  width: '32px',
                  height: '32px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0
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
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#6c757d'
                  }}>
                    {item.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {/* <div style={{ padding: '0 20px 20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1a1a1a' }}>
          Quick Actions
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => console.log(`Navigate to: ${action.action}`)}
              style={{
                padding: '16px',
                background: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '24px' }}>{action.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#495057' }}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div> */}
    </>
  );
};

// Staff Content Component
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
const ServicesContent = ({ salonId }) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <FaCut />
    </div>
    <h3>No Services Yet</h3>
    <p>Create your service menu to start accepting bookings</p>
    <button className="empty-state-btn">
      <FaPlus style={{ marginRight: '8px' }} /> Add Service
    </button>
  </div>
);

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