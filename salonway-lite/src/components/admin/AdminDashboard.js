// src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  FaHome,
  FaUsers,
  FaPlus,
  FaCog,
  FaSignOutAlt,
  FaDollarSign,
  FaChevronRight,
  FaStore,
  FaCheckCircle,
  FaLock 
} from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch salons from Firebase
  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching salons...');
      const querySnapshot = await getDocs(collection(db, 'salons'));
      const salonList = [];
      
      querySnapshot.forEach((doc) => {
        salonList.push({ 
          id: doc.id, 
          ...doc.data()
        });
      });
      
      console.log(`✅ Loaded ${salonList.length} salons`);
      setSalons(salonList);
      
    } catch (error) {
      console.error('❌ Error fetching salons:', error);
      alert(`Firestore error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  const handleCreateSalon = async (salonData) => {
    try {
      console.log('🎯 Creating salon...');
      
      // Generate secure password
      const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };
      
      const ownerPassword = generatePassword();
      
      // Store salon with password (in production, hash this!)
      const salonToSave = {
        name: salonData.name,
        ownerName: salonData.ownerName,
        ownerEmail: salonData.ownerEmail.toLowerCase().trim(), // Normalize
        ownerPassword: ownerPassword, // Plain text for now
        primaryColor: salonData.primaryColor,
        secondaryColor: salonData.secondaryColor,
        status: 'active',
        setupCompleted: false,
        staffCount: 0,
        revenue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'salons'), salonToSave);
      
      console.log('✅ Salon created!');
      
      return {
        success: true,
        salonId: docRef.id,
        tempPassword: ownerPassword
      };
      
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  };

  // Reset password function
  const handleResetPassword = async (salonId) => {
    const newPassword = prompt('Enter new password for this salon owner:');
    
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    if (!window.confirm(`Reset password to: ${newPassword}\n\nAre you sure?`)) {
      return;
    }
    
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'salons', salonId), {
        ownerPassword: newPassword,
        updatedAt: new Date().toISOString()
      });
      
      alert('Password updated successfully!');
      
      // Refresh salon list
      await fetchSalons();
      
      // Update selected salon if it's the one being viewed
      if (selectedSalon && selectedSalon.id === salonId) {
        setSelectedSalon({
          ...selectedSalon,
          ownerPassword: newPassword
        });
      }
      
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error resetting password. Please try again.');
    }
  };

  // CreateSalon component
  const CreateSalon = ({ onCreate, onBack }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      name: '',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981'
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdData, setCreatedData] = useState(null);

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const generatePassword = () => {
      return Math.random().toString(36).slice(-10);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setCreateLoading(true);
      
      const tempPassword = generatePassword();
      const salonData = {
        ...formData,
        tempPassword
      };
      
      console.log('📤 Submitting salon data:', salonData);
      
      const result = await onCreate(salonData);
      console.log('📥 Result from onCreate:', result);
      
      if (result.success) {
        setCreatedData({
          salonId: result.salonId,
          tempPassword,
          ownerEmail: formData.ownerEmail,
          salonName: formData.name
        });
        setSuccess(true);
        setStep(3);
      } else {
        alert(`Error: ${result.error}`);
      }
      
      setCreateLoading(false);
    };

    // Step 1: Basic Info
    if (step === 1) {
      return (
        <div style={{ padding: '20px' }}>
          <button onClick={onBack} style={{ marginBottom: '20px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
            ← Back to Dashboard
          </button>
          
          <h1 style={{ marginBottom: '10px' }}>Create Salon</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Step 1: Basic information</p>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Salon Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="Sunrise Salon"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Owner Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="Sarah Johnson"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Owner Email *</label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="sarah@email.com"
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Owner Password *</label>
                <div style={{ position: 'relative' }}>
                  <FaLock style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF'
                  }} />
                  <input
                    type="password"
                    name="ownerPassword"
                    value={formData.ownerPassword}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
                    placeholder="Create a password for the owner"
                    required
                  />
                </div>
                <small style={{ color: '#6B7280', fontSize: '12px' }}>Create a password for the salon owner to login</small>
              </div>
              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Step 2: Branding
    if (step === 2) {
      return (
        <div style={{ padding: '20px' }}>
          <button onClick={() => setStep(1)} style={{ marginBottom: '20px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
            ← Back
          </button>
          
          <h1 style={{ marginBottom: '10px' }}>Branding</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Step 2: Choose colors</p>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Primary Color</label>
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  style={{ width: '100%', height: '50px', borderRadius: '8px', cursor: 'pointer' }}
                />
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Secondary Color</label>
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  style={{ width: '100%', height: '50px', borderRadius: '8px', cursor: 'pointer' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                
                <button 
                  type="submit"
                  disabled={createLoading}
                  style={{
                    flex: 2,
                    padding: '15px',
                    background: createLoading ? '#9CA3AF' : '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: createLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {createLoading ? 'Creating...' : 'Create Salon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // Step 3: Success
    if (step === 3 && success && createdData) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', color: '#10B981', margin: '30px 0' }}>✓</div>
          
          <h1 style={{ marginBottom: '10px' }}>Salon Created!</h1>
          <p style={{ color: '#666', marginBottom: '40px' }}>Share these details with the owner</p>
          
          <div style={{ 
            background: '#F0F9FF', 
            padding: '25px', 
            borderRadius: '12px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#1E40AF' }}>Login Details</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '5px' }}>Owner Email</div>
              <div style={{ fontSize: '16px', fontWeight: '500', padding: '12px', background: 'white', borderRadius: '8px' }}>
                {createdData.ownerEmail}
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '5px' }}>Temporary Password</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                fontFamily: 'monospace',
                padding: '12px', 
                background: '#EFF6FF', 
                borderRadius: '8px',
                color: '#1E40AF',
                letterSpacing: '1px'
              }}>
                {createdData.tempPassword}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '5px' }}>Login URL</div>
              <div style={{ fontSize: '16px', fontWeight: '500', padding: '12px', background: 'white', borderRadius: '8px' }}>
                {window.location.origin}/owner/login
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => {
                const text = `Salon: ${createdData.salonName}\nLogin: ${createdData.ownerEmail}\nPassword: ${createdData.tempPassword}\nURL: ${window.location.origin}/owner/login`;
                navigator.clipboard.writeText(text);
                alert('Copied to clipboard!');
              }}
              style={{
                flex: 1,
                padding: '15px',
                background: '#F3F4F6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Copy Details
            </button>
            
            <button 
              onClick={() => {
                setStep(1);
                setSuccess(false);
                setFormData({
                  name: '',
                  ownerName: '',
                  ownerEmail: '',
                  ownerPassword: '',
                  primaryColor: '#3B82F6',
                  secondaryColor: '#10B981'
                });
                onBack();
              }}
              style={{
                flex: 1,
                padding: '15px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // SalonDetailsModal Component
  const SalonDetailsModal = ({ salon, onClose, onResetPassword }) => {
    const [showPassword, setShowPassword] = useState(false);
    
    if (!salon) return null;
    
    return (
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
          overflow: 'auto'
        }}>
          {/* Header */}
          <div style={{
            background: salon.primaryColor || '#3B82F6',
            color: 'white',
            padding: '24px',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Salon Details</h2>
              <button 
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Salon Info */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                Salon Information
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Salon Name</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{salon.name}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Status</div>
                  <span style={{
                    padding: '4px 12px',
                    background: (salon.status || 'active') === 'active' ? '#10B98120' : '#F59E0B20',
                    color: (salon.status || 'active') === 'active' ? '#065F46' : '#92400E',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {salon.status || 'active'}
                  </span>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Created</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    {salon.createdAt ? new Date(salon.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Owner Credentials */}
            <div style={{ 
              marginBottom: '24px',
              background: '#F9FAFB',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  Owner Credentials
                </h3>
                <button
                  onClick={() => onResetPassword(salon.id)}
                  style={{
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Reset Password
                </button>
              </div>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Owner Name</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{salon.ownerName}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Owner Email</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{salon.ownerEmail}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Login Password</div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ 
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      letterSpacing: '1px',
                      color: showPassword ? '#111827' : '#9CA3AF'
                    }}>
                      {showPassword ? (salon.ownerPassword || 'No password set') : '••••••••'}
                    </div>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>
                    Share these credentials with the salon owner
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Login URL</div>
                  <div style={{ 
                    background: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {window.location.origin}/owner/login
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  const text = `Salon: ${salon.name}\nOwner: ${salon.ownerName}\nEmail: ${salon.ownerEmail}\nPassword: ${salon.ownerPassword}\nLogin URL: ${window.location.origin}/owner/login`;
                  navigator.clipboard.writeText(text);
                  alert('Credentials copied to clipboard!');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Copy All Details
              </button>
              
              <button
                onClick={() => {
                  const message = `Hi ${salon.ownerName},\n\nYour salon "${salon.name}" has been set up!\n\nLogin Details:\nEmail: ${salon.ownerEmail}\nPassword: ${salon.ownerPassword}\nURL: ${window.location.origin}/owner/login\n\nBest regards,\nSalonWay Admin`;
                  window.open(`mailto:${salon.ownerEmail}?subject=Your SalonWay Login Details&body=${encodeURIComponent(message)}`, '_blank');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Email Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Dashboard
  const renderDashboard = () => {
    // Make sure 'salons' is defined and accessible here
    const currentSalons = salons || [];
    
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ marginBottom: '5px' }}>Dashboard</h1>
          <p style={{ color: '#666' }}>Manage salon accounts</p>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '5px' }}>{currentSalons.length}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Salons</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '5px' }}>
              {currentSalons.reduce((sum, salon) => sum + (salon.staffCount || 0), 0)}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Active Staff</div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => setActiveTab('create')}
          style={{
            width: '100%',
            padding: '18px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <FaPlus /> Add New Salon
        </button>

        {/* Recent Salons */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Salons</h2>
              <span style={{ fontSize: '14px', color: '#666' }}>{currentSalons.length} total</span>
            </div>
          </div>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid #E5E7EB',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ color: '#666' }}>Loading salons...</p>
            </div>
          ) : currentSalons.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FaStore style={{ fontSize: '48px', color: '#9CA3AF', marginBottom: '20px' }} />
              <p style={{ color: '#666', marginBottom: '20px' }}>No salons created yet</p>
              <button 
                onClick={() => setActiveTab('create')}
                style={{
                  padding: '12px 24px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Create First Salon
              </button>
            </div>
          ) : (
            <div>
              {currentSalons.slice(0, 5).map((salon) => (
                <div 
                  key={salon.id} 
                  style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedSalon(salon);
                    setShowDetailsModal(true);
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: salon.primaryColor || '#3B82F6',
                    marginRight: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {salon.name?.charAt(0) || 'S'}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{salon.name || 'Unnamed Salon'}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>{salon.ownerEmail}</div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <span style={{ 
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: '#10B98120',
                        color: '#10B981',
                        borderRadius: '12px'
                      }}>
                        {salon.staffCount || 0} staff
                      </span>
                      <span style={{ 
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: '#F59E0B20',
                        color: '#F59E0B',
                        borderRadius: '12px'
                      }}>
                        ${salon.revenue || 0}
                      </span>
                    </div>
                  </div>
                  
                  <FaChevronRight style={{ color: '#9CA3AF' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Bottom Navigation
  const BottomNav = () => (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: 'white',
      borderTop: '1px solid #E5E7EB',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '0 10px',
      zIndex: 100
    }}>
      <button 
        onClick={() => setActiveTab('dashboard')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: activeTab === 'dashboard' ? '#3B82F6' : '#6B7280',
          cursor: 'pointer',
          padding: '10px'
        }}
      >
        <FaHome style={{ fontSize: '20px', marginBottom: '4px' }} />
        <span style={{ fontSize: '11px', fontWeight: '500' }}>Home</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('salons')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: activeTab === 'salons' ? '#3B82F6' : '#6B7280',
          cursor: 'pointer',
          padding: '10px'
        }}
      >
        <FaUsers style={{ fontSize: '20px', marginBottom: '4px' }} />
        <span style={{ fontSize: '11px', fontWeight: '500' }}>Salons</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('create')}
        style={{
          position: 'absolute',
          bottom: '25px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}
      >
        <FaPlus />
      </button>
      
      <button 
        onClick={() => setActiveTab('settings')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: activeTab === 'settings' ? '#3B82F6' : '#6B7280',
          cursor: 'pointer',
          padding: '10px'
        }}
      >
        <FaCog style={{ fontSize: '20px', marginBottom: '4px' }} />
        <span style={{ fontSize: '11px', fontWeight: '500' }}>Settings</span>
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', paddingBottom: '70px' }}>
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'create' && (
        <CreateSalon 
          onCreate={handleCreateSalon}
          onBack={() => setActiveTab('dashboard')}
        />
      )}
      {activeTab === 'settings' && (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ marginBottom: '5px' }}>Settings</h1>
            <p style={{ color: '#666' }}>Admin preferences</p>
          </div>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '15px',
                background: '#F3F4F6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>
      )}
      {activeTab === 'consultations' && (
  <ConsultationsContent salonId={salonData.id} />
)}
      {/* Salon Details Modal */}
      {showDetailsModal && selectedSalon && (
        <SalonDetailsModal
          salon={selectedSalon}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSalon(null);
          }}
          onResetPassword={handleResetPassword}
        />
      )}
      
      <BottomNav />
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;