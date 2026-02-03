// src/components/owner/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
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
  FaChevronRight
} from 'react-icons/fa';
import './OwnerDashboard.css';

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
        monthlyRevenue: 1250,
        todayAppointments: 3
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        <FaHome className="nav-icon" />
        <span className="nav-label">Dashboard</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('staff')}
        className={`nav-btn ${activeTab === 'staff' ? 'active' : ''}`}
      >
        <FaUsers className="nav-icon" />
        <span className="nav-label">Staff</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('create')}
        className="add-salon-btn"
      >
        <FaPlus />
      </button>
      
      <button 
        onClick={() => setActiveTab('services')}
        className={`nav-btn ${activeTab === 'services' ? 'active' : ''}`}
      >
        <FaCut className="nav-icon" />
        <span className="nav-label">Services</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('settings')}
        className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
      >
        <FaCog className="nav-icon" />
        <span className="nav-label">Settings</span>
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

  return (
    <div className="owner-dashboard">
      {/* Header */}
      <header className="owner-header">
        <div className="owner-header-left">
          <h1>
            {activeTab === 'dashboard' ? 'Dashboard' : 
             activeTab === 'staff' ? 'Staff' :
             activeTab === 'services' ? 'Services' :
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
            stats={stats}
          />
        )}
        
        {activeTab === 'staff' && (
          <StaffContent salonId={salonData.id} />
        )}
        
        {activeTab === 'services' && (
          <ServicesContent salonId={salonData.id} />
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
const DashboardContent = ({ salonData, ownerData, stats }) => {
  const [setupChecklist, setSetupChecklist] = useState([
    { id: 1, label: 'Add staff members', completed: false, action: 'staff' },
    { id: 2, label: 'Create service menu', completed: false, action: 'services' },
    { id: 3, label: 'Upload gallery images', completed: false, action: 'gallery' },
    { id: 4, label: 'Customize salon colors', completed: true, action: 'settings' }
  ]);

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'staff', icon: <FaUsers />, action: 'New staff member added', time: '2 hours ago' },
    { id: 2, type: 'service', icon: <FaCut />, action: 'Haircut service updated', time: 'Yesterday' },
    { id: 3, type: 'booking', icon: <FaCalendar />, action: 'New appointment booked', time: '2 days ago' }
  ]);

  const handleSetupAction = (action) => {
    // This would navigate to the relevant section
    console.log(`Navigate to: ${action}`);
  };

  const statItems = [
    {
      title: 'Total Staff',
      value: stats.totalStaff,
      icon: <FaUsers />,
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      title: 'Services',
      value: stats.activeServices,
      icon: <FaCut />,
      color: '#10B981',
      bgColor: '#ECFDF5'
    },
    {
      title: 'Revenue',
      value: `$${stats.monthlyRevenue}`,
      icon: <FaMoneyBill />,
      color: '#F59E0B',
      bgColor: '#FEF3C7'
    },
    {
      title: 'Appointments',
      value: stats.todayAppointments,
      icon: <FaCalendar />,
      color: '#EF4444',
      bgColor: '#FEE2E2'
    }
  ];

  return (
    <>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h2>Welcome to {salonData.name}! 👋</h2>
        <p>Manage your staff, services, and bookings all in one place.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statItems.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <div className="stat-text">
                <h3>{stat.title}</h3>
                <div className="stat-value">{stat.value}</div>
              </div>
              <div 
                className="stat-icon"
                style={{ 
                  background: stat.bgColor,
                  color: stat.color
                }}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Setup Checklist */}
        <div className="content-card">
          <h3>
            <FaCheckCircle /> Setup Checklist
          </h3>
          <div>
            {setupChecklist.map((item) => (
              <div key={item.id} className="checklist-item">
                <div className={`checkbox ${item.completed ? 'completed' : 'incomplete'}`}>
                  {item.completed && <FaCheckCircle />}
                </div>
                <span className={`checklist-text ${item.completed ? 'completed' : ''}`}>
                  {item.label}
                </span>
                {!item.completed && (
                  <button 
                    className="setup-btn"
                    onClick={() => handleSetupAction(item.action)}
                  >
                    Set up
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="content-card">
          <h3>
            <FaClock /> Recent Activity
          </h3>
          <div>
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.icon}
                </div>
                <div className="activity-content">
                  <h4>{activity.action}</h4>
                  <p>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// Staff Content Component
const StaffContent = ({ salonId }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading staff...</p>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FaUsers />
        </div>
        <h3>No Staff Members</h3>
        <p>Add your first staff member to get started</p>
        <button className="empty-state-btn">
          <FaPlus style={{ marginRight: '8px' }} /> Add Staff
        </button>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Staff Members</h2>
        <button className="empty-state-btn" style={{ padding: '10px 16px' }}>
          <FaPlus style={{ marginRight: '8px' }} /> Add Staff
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {staff.map((member) => (
          <div 
            key={member.id}
            className="stat-card"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <div 
              className="owner-avatar"
              style={{ 
                background: member.color || '#6c757d',
                width: '50px',
                height: '50px'
              }}
            >
              {member.name?.charAt(0) || 'S'}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '500' }}>
                {member.name}
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                {member.role || 'Staff Member'}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: '#E9ECEF',
                  borderRadius: '12px',
                  color: '#495057'
                }}>
                  {member.services || 0} services
                </span>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: member.status === 'active' ? '#D4EDDA' : '#F8D7DA',
                  borderRadius: '12px',
                  color: member.status === 'active' ? '#155724' : '#721C24'
                }}>
                  {member.status || 'inactive'}
                </span>
              </div>
            </div>
            <FaChevronRight style={{ color: '#ADB5BD' }} />
          </div>
        ))}
      </div>
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