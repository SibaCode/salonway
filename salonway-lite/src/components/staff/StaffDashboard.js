import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import './css/StaffDashboard.css';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

 
  return (
    <div className="toast-notification">
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button onClick={onClose} className="toast-close">×</button>
    </div>
  );
};

const StaffDashboard = () => {
  const { code } = useParams();
  const [services, setServices] = useState([]);
  const [todaysWork, setTodaysWork] = useState([]);
  const [todaysForms, setTodaysForms] = useState([]);
  const [allMyForms, setAllMyForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [salon, setSalon] = useState(null);
  const [clockStatus, setClockStatus] = useState({
    isClockedIn: false,
    currentShift: null
  });
  
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalClients: 0,
    todayEarnings: 0,
    todayClients: 0
  });
  
  const [toast, setToast] = useState(null);
  const [showLogWork, setShowLogWork] = useState(false);
  const [showShareForm, setShowShareForm] = useState(false);
  const [showFormDetails, setShowFormDetails] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [newWork, setNewWork] = useState({
    serviceId: '',
    service: '',
    price: '',
    client: '',
    notes: '',
    serviceCategory: ''
  });
  
  const [clientForms, setClientForms] = useState([]);
  const [currentClientForm, setCurrentClientForm] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Find staff by code
  useEffect(() => {
    const findStaff = async () => {
      try {
        const salonsSnapshot = await getDocs(collection(db, 'salons'));
        
        for (const salonDoc of salonsSnapshot.docs) {
          const salonId = salonDoc.id;
          const staffQuery = query(
            collection(db, 'salons', salonId, 'staff'),
            where('linkCode', '==', code)
          );
          
          const staffSnapshot = await getDocs(staffQuery);
          
          if (!staffSnapshot.empty) {
            const staffData = {
              id: staffSnapshot.docs[0].id,
              ...staffSnapshot.docs[0].data(),
              salonId: salonId
            };
            
            const salonSnap = await getDoc(doc(db, 'salons', salonId));
            if (salonSnap.exists()) {
              setStaff(staffData);
              setSalon({ id: salonSnap.id, ...salonSnap.data() });
              await checkClockStatus(staffData.id, salonId);
              loadServices(salonId);
              listenToClientForms(salonId);
              loadTodaysWork(staffData.id, salonId);
              loadMyForms(staffData.id, salonId);
              loadStats(staffData.id, salonId);
              
              showToast(`Welcome back, ${staffData.name}!`, 'success');
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load dashboard. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (code) findStaff();
  }, [code]);

  // Load services
  const loadServices = async (salonId) => {
    try {
      const servicesSnapshot = await getDocs(
        collection(db, 'salons', salonId, 'services')
      );
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesList);
    } catch (error) {
      console.error('Error loading services:', error);
      showToast('Failed to load services', 'error');
    }
  };

  // Check clock status
  const checkClockStatus = async (staffId, salonId) => {
    try {
      const q = query(
        collection(db, 'clockRecords'),
        where('staffId', '==', staffId),
        where('salonId', '==', salonId),
        where('clockOut', '==', null)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setClockStatus({
          isClockedIn: true,
          currentShift: {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          }
        });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      showToast('Error checking clock status', 'error');
    }
  };

  // Load today's work - SIMPLIFIED
  const loadTodaysWork = async (staffId, salonId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Simple query that doesn't need composite index
      const workQuery = query(
        collection(db, 'workLogs'),
        where('staffId', '==', staffId)
      );
      
      const snapshot = await getDocs(workQuery);
      const allWork = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter in JavaScript
      const todayWork = allWork.filter(work => 
        work.salonId === salonId && work.date === today
      );
      
      // Sort by timestamp
      todayWork.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return dateB - dateA;
      });
      
      setTodaysWork(todayWork);
    } catch (error) {
      console.error('Error loading work:', error);
      showToast('Error loading work log', 'error');
    }
  };

  // Load forms served by this staff - SIMPLIFIED
  const loadMyForms = async (staffId, salonId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Simple query
      const formsQuery = query(
        collection(db, 'consultations'),
        where('salonId', '==', salonId)
      );
      
      const snapshot = await getDocs(formsQuery);
      const allForms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter in JavaScript
      const myForms = allForms.filter(form => 
        form.servedByStaffId === staffId
      );
      
      const todayForms = myForms.filter(form => 
        form.dateServed === today
      );
      
      // Sort by reviewedAt
      myForms.sort((a, b) => {
        const dateA = a.reviewedAt?.toDate ? a.reviewedAt.toDate() : new Date(a.reviewedAt || 0);
        const dateB = b.reviewedAt?.toDate ? b.reviewedAt.toDate() : new Date(b.reviewedAt || 0);
        return dateB - dateA;
      });
      
      setTodaysForms(todayForms);
      setAllMyForms(myForms);
      
    } catch (error) {
      console.error('Error loading my forms:', error);
      showToast('Error loading your forms', 'error');
    }
  };

  // Load stats
  const loadStats = async (staffId, salonId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get work logs
      const workQuery = query(
        collection(db, 'workLogs'),
        where('staffId', '==', staffId)
      );
      
      const workSnapshot = await getDocs(workQuery);
      let totalEarnings = 0;
      let todayEarnings = 0;
      const uniqueClients = new Set();
      const todayClients = new Set();
      
      workSnapshot.docs.forEach(doc => {
        const work = doc.data();
        if (work.salonId === salonId) {
          const price = parseFloat(work.servicePrice) || 0;
          totalEarnings += price;
          
          if (work.date === today) {
            todayEarnings += price;
          }
          
          if (work.client && work.client.trim() !== '') {
            uniqueClients.add(work.client.trim().toLowerCase());
            if (work.date === today) {
              todayClients.add(work.client.trim().toLowerCase());
            }
          }
        }
      });
      
      // Get forms
      const formsQuery = query(
        collection(db, 'consultations'),
        where('salonId', '==', salonId)
      );
      
      const formsSnapshot = await getDocs(formsQuery);
      formsSnapshot.docs.forEach(doc => {
        const form = doc.data();
        if (form.servedByStaffId === staffId && form.clientName) {
          uniqueClients.add(form.clientName.trim().toLowerCase());
          if (form.dateServed === today) {
            todayClients.add(form.clientName.trim().toLowerCase());
          }
        }
      });
      
      setStats({
        totalEarnings: totalEarnings.toFixed(2),
        totalClients: uniqueClients.size,
        todayEarnings: todayEarnings.toFixed(2),
        todayClients: todayClients.size
      });
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Listen for NEW client forms - SIMPLIFIED
  const listenToClientForms = (salonId) => {
    const q = query(
      collection(db, 'consultations'),
      where('salonId', '==', salonId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const forms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter new forms in JavaScript
      const newForms = forms.filter(form => 
        !form.status || form.status === 'new'
      );
      
      // Sort by createdAt
      newForms.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setClientForms(newForms);
      
      if (newForms.length > clientForms.length && clientForms.length > 0) {
        const newForm = newForms[0];
        showToast(`New client form from ${newForm.clientName || 'a client'}`, 'info');
      }
    }, (error) => {
      console.error("Listener error:", error);
      showToast('Error loading client forms', 'error');
    });

    return unsubscribe;
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '--:--';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '--:--';
    }
  };

  // Format full date
  const formatFullDate = (timestamp) => {
    if (!timestamp) return '--/--/----';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '--/--/----';
    }
  };

  // CLOCK IN
  const handleClockIn = async () => {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const record = {
        staffId: staff.id,
        staffName: staff.name,
        salonId: salon.id,
        clockIn: serverTimestamp(),
        clockOut: null,
        date: today.toISOString().split('T')[0],
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'clockRecords'), record);
      
      setClockStatus({
        isClockedIn: true,
        currentShift: { id: docRef.id, ...record, clockIn: now }
      });
      
      showToast('Clocked in successfully!', 'success');
      
    } catch (error) {
      console.error('Error clocking in:', error);
      showToast('Could not clock in. Try again.', 'error');
    }
  };

  // CLOCK OUT
  const handleClockOut = async () => {
    try {
      const now = new Date();
      let clockInTime = clockStatus.currentShift.clockIn;
      
      if (clockInTime.toDate) {
        clockInTime = clockInTime.toDate();
      } else if (clockInTime) {
        clockInTime = new Date(clockInTime);
      }
      
      const hours = (now - clockInTime) / (1000 * 60 * 60);
      
      await updateDoc(doc(db, 'clockRecords', clockStatus.currentShift.id), {
        clockOut: serverTimestamp(),
        duration: hours.toFixed(2)
      });
      
      setClockStatus({ isClockedIn: false, currentShift: null });
      
      showToast(`Clocked out! Worked ${hours.toFixed(2)} hours today.`, 'success');
      
    } catch (error) {
      console.error('Error clocking out:', error);
      showToast('Could not clock out. Try again.', 'error');
    }
  };

  // LOG WORK
  const handleLogWork = async () => {
    if (!newWork.serviceId || !newWork.price) {
      showToast('Please select a service and enter price', 'warning');
      return;
    }

    try {
      const selectedService = services.find(s => s.id === newWork.serviceId);
      const clientName = newWork.client || 'Walk-in';
      
      const workRecord = {
        staffId: staff.id,
        staffName: staff.name,
        salonId: salon.id,
        serviceId: newWork.serviceId,
        serviceName: selectedService?.name || newWork.service,
        servicePrice: parseFloat(newWork.price),
        serviceCategory: selectedService?.category || newWork.serviceCategory,
        client: clientName,
        date: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp(),
        status: 'completed',
        notes: newWork.notes || ''
      };
      
      // Save to Firestore
      await addDoc(collection(db, 'workLogs'), workRecord);
      
      // Update local state
      setTodaysWork([workRecord, ...todaysWork]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalEarnings: (parseFloat(prev.totalEarnings) + parseFloat(newWork.price)).toFixed(2),
        todayEarnings: (parseFloat(prev.todayEarnings) + parseFloat(newWork.price)).toFixed(2),
        totalClients: prev.totalClients + (clientName !== 'Walk-in' ? 1 : 0),
        todayClients: prev.todayClients + (clientName !== 'Walk-in' ? 1 : 0)
      }));
      
      // Reset form and close modal
      setNewWork({
        serviceId: '',
        service: '',
        price: '',
        client: '',
        notes: '',
        serviceCategory: ''
      });
      setShowLogWork(false);
      
      showToast('Work logged successfully!', 'success');
      
    } catch (error) {
      console.error('Error logging work:', error);
      showToast('Failed to log work. Please try again.', 'error');
    }
  };

  // CLAIM FORM
  const claimForm = async (formId, formData) => {
    try {
      await updateDoc(doc(db, 'consultations', formId), {
        status: 'claimed',
        claimedBy: staff.name,
        claimedById: staff.id,
        claimedAt: serverTimestamp()
      });
      
      setClientForms(prev => prev.filter(form => form.id !== formId));
      showToast('Form claimed successfully!', 'success');
      
    } catch (error) {
      console.error('Error claiming form:', error);
      showToast('Error claiming form.', 'error');
    }
  };

  // MARK FORM AS SERVED
  const markFormAsServed = async (formId, formData) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await updateDoc(doc(db, 'consultations', formId), {
        status: 'served',
        servedBy: staff.name,
        servedByStaffId: staff.id,
        servedAt: serverTimestamp(),
        dateServed: today,
        reviewedAt: serverTimestamp()
      });
      
      setCurrentClientForm(null);
      setShowFormDetails(null);
      
      // Update local state
      const servedForm = {
        id: formId,
        ...formData,
        servedBy: staff.name,
        servedByStaffId: staff.id,
        servedAt: new Date(),
        dateServed: today,
        status: 'served'
      };
      
      setTodaysForms(prev => [servedForm, ...prev]);
      setAllMyForms(prev => [servedForm, ...prev]);
      setClientForms(prev => prev.filter(form => form.id !== formId));
      
      if (formData.clientName) {
        setStats(prev => ({
          ...prev,
          totalClients: prev.totalClients + 1,
          todayClients: prev.todayClients + 1
        }));
      }
      
      showToast('Client form marked as served!', 'success');
      
    } catch (error) {
      console.error('Error marking as served:', error);
      showToast('Error updating form status.', 'error');
    }
  };

  // START SERVICE (alias for markFormAsServed)
  const startService = (formId) => {
    markFormAsServed(formId, showFormDetails);
  };

  // GET FORM LINK
  const getFormLink = () => {
    return `${window.location.origin}/client/${salon.id}`;
  };

  // COPY FORM LINK
  const copyFormLink = () => {
    navigator.clipboard.writeText(getFormLink())
      .then(() => {
        showToast('Form link copied to clipboard!', 'success');
      })
      .catch(() => {
        showToast('Failed to copy link. Please copy manually.', 'error');
      });
  };

  // Generate QR Code URL (simple)
  const getQRCodeUrl = () => {
    const formLink = getFormLink();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formLink)}`;
  };

  // SHARE VIA WHATSAPP
  const shareViaWhatsApp = () => {
    const message = `Hi! Please fill out this consultation form for your appointment: ${getFormLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    showToast('Opening WhatsApp...', 'info');
  };

  // SHARE VIA SMS
  const shareViaSMS = () => {
    const message = `Salon consultation form: ${getFormLink()}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    showToast('Opening Messages...', 'info');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!staff || !salon) {
    return (
      <div className="error-screen">
        <h2>Invalid Link</h2>
        <p>Ask your manager for a valid link.</p>
      </div>
    );
  }

  const primaryColor = salon.primaryColor || '#3B82F6';
  const secondaryColor = salon.secondaryColor || '#10B981';

  return (
    <div className="staff-simple" style={{ 
      '--primary': primaryColor,
      '--secondary': secondaryColor 
    }}>
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast}
        />
      )}

      {/* HEADER */}
      <header className="staff-header">
        <div className="salon-logo" style={{ background: primaryColor }}>
          {salon.name?.charAt(0) || 'S'}
        </div>
        <div>
          <h1>{salon.name}</h1>
          <p>{staff.name}</p>
        </div>
        <button 
          className="stats-btn"
          onClick={() => setShowStats(true)}
          style={{ 
            marginLeft: 'auto',
            background: secondaryColor,
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          📊 Stats
        </button>
      </header>

      {/* MAIN SECTION */}
      <main className="staff-main">
        
        {/* CLOCK IN/OUT */}
        <section className="clock-section">
          {clockStatus.isClockedIn ? (
            <div className="status-box active">
              <p>⏰ Working since {formatTime(clockStatus.currentShift?.clockIn)}</p>
              <button 
                className="clock-btn out" 
                onClick={handleClockOut}
                style={{ background: '#ef4444' }}
              >
                CLOCK OUT
              </button>
            </div>
          ) : (
            <div className="status-box">
              <p>Ready to start?</p>
              <button 
                className="clock-btn in" 
                onClick={handleClockIn}
                style={{ background: primaryColor }}
              >
                CLOCK IN
              </button>
            </div>
          )}
        </section>

        {/* QUICK STATS */}
        <section className="quick-stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">💰</div>
              <div className="stat-details">
                <div className="stat-label">Today</div>
                <div className="stat-value">R{stats.todayEarnings}</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-details">
                <div className="stat-label">Clients</div>
                <div className="stat-value">{stats.todayClients}</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📋</div>
              <div className="stat-details">
                <div className="stat-label">Forms</div>
                <div className="stat-value">{todaysForms.length}</div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="actions-section">
          <button 
            className="action-btn"
            onClick={() => setShowLogWork(true)}
            style={{ background: secondaryColor }}
          >
            💼 Log Work
          </button>
          
          <button 
            className="action-btn"
            onClick={() => setShowShareForm(true)}
            style={{ background: primaryColor }}
          >
            📝 Share Form
          </button>
        </section>

        {/* AVAILABLE CLIENT FORMS */}
        {clientForms.length > 0 ? (
          <section className="forms-notification">
            <div className="notification-header">
              <span className="notification-badge">{clientForms.length}</span>
              <h3>Available Client Forms</h3>
            </div>
            
            <div className="forms-list">
              {clientForms.map((form) => (
                <div 
                  key={form.id}
                  className="form-card"
                  onClick={() => setShowFormDetails({...form, isAvailable: true})}
                >
                  <div className="form-client">
                    <strong>{form.clientName || 'Unknown Client'}</strong>
                    <span className="form-time">
                      {form.createdAt?.toDate 
                        ? formatDate(form.createdAt) 
                        : 'Just now'}
                    </span>
                  </div>
                  <div className="form-details">
                    {form.desiredService && (
                      <span className="form-service">{form.desiredService}</span>
                    )}
                    {form.allergies && (
                      <span className="form-warning">⚠️ Allergies</span>
                    )}
                  </div>
                  <div className="form-arrow">→</div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="no-forms-message">
            <p>No new client forms available.</p>
          </div>
        )}

        {/* TODAY'S WORK LOG */}
        <section className="summary-section">
          <div className="section-header">
            <h3>Today's Services</h3>
            <span className="badge">{todaysWork.length}</span>
          </div>
          
          {todaysWork.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💼</div>
              <p>No services logged today</p>
            </div>
          ) : (
            <div className="work-list">
              {todaysWork.map(work => (
                <div key={work.id} className="work-item">
                  <div className="work-icon">
                    {work.serviceCategory === 'Hair' ? '💇' : 
                     work.serviceCategory === 'Nails' ? '💅' : 
                     work.serviceCategory === 'Beauty' ? '💄' : '💼'}
                  </div>
                  <div className="work-details">
                    <div className="work-service">{work.serviceName}</div>
                    <div className="work-client">{work.client || 'Walk-in'}</div>
                  </div>
                  <div className="work-price">R{work.servicePrice}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* TODAY'S FORMS SERVED */}
        {todaysForms.length > 0 && (
          <section className="summary-section">
            <div className="section-header">
              <h3>Today's Forms Served</h3>
              <span className="badge">{todaysForms.length}</span>
            </div>
            
            <div className="forms-list">
              {todaysForms.map((form) => (
                <div 
                  key={form.id}
                  className="form-card served"
                  onClick={() => setShowFormDetails({...form, isServed: true})}
                >
                  <div className="form-client">
                    <strong>{form.clientName || 'Client'}</strong>
                    <span className="form-time">
                      {form.servedAt?.toDate 
                        ? formatTime(form.servedAt) 
                        : 'Today'}
                    </span>
                  </div>
                  <div className="form-details">
                    {form.desiredService && (
                      <span className="form-service">{form.desiredService}</span>
                    )}
                    <span className="served-badge">✅ Served</span>
                  </div>
                  <div className="form-arrow">→</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* LOG WORK MODAL */}
      {showLogWork && (
        <div className="modal" onClick={() => setShowLogWork(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>💼 Log Work</h2>
            
            <div className="form-group">
              <label>Service *</label>
              <select
                value={newWork.serviceId || ''}
                onChange={(e) => {
                  const selectedService = services.find(s => s.id === e.target.value);
                  setNewWork({
                    ...newWork,
                    serviceId: e.target.value,
                    service: selectedService?.name || '',
                    price: selectedService?.price || '',
                    serviceCategory: selectedService?.category || ''
                  });
                }}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - R{service.price} ({service.duration}min)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Price (R) *</label>
              <input
                type="number"
                value={newWork.price}
                onChange={(e) => setNewWork({...newWork, price: e.target.value})}
                placeholder="65"
              />
            </div>
            
            <div className="form-group">
              <label>Client Name (Optional)</label>
              <input
                type="text"
                value={newWork.client}
                onChange={(e) => setNewWork({...newWork, client: e.target.value})}
                placeholder="Leave empty for walk-in"
              />
            </div>
            
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={newWork.notes}
                onChange={(e) => setNewWork({...newWork, notes: e.target.value})}
                placeholder="Any special requests or details..."
                rows="3"
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
              />
            </div>
            
            <div className="modal-buttons">
              <button 
                className="btn-cancel"
                onClick={() => setShowLogWork(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-save"
                onClick={handleLogWork}
                style={{ background: secondaryColor }}
              >
                Save Work
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATS MODAL */}
      {showStats && (
        <div className="modal" onClick={() => setShowStats(false)}>
          <div className="modal-content stats-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 {staff.name}'s Performance</h2>
              <button 
                className="close-btn"
                onClick={() => setShowStats(false)}
              >
                ×
              </button>
            </div>
            
            <div className="stats-grid-detailed">
              {/* <div className="stat-card">
                <div className="stat-card-icon" style={{ background: '#DCFCE7', color: '#166534' }}>
                  💰
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Total Earnings</div>
                  <div className="stat-card-value">R{stats.totalEarnings}</div>
                </div>
              </div> */}
              
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  👥
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Total Clients</div>
                  <div className="stat-card-value">{stats.totalClients}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: '#DBEAFE', color: '#1E40AF' }}>
                  📋
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Forms Served</div>
                  <div className="stat-card-value">{allMyForms.length}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: '#FCE7F3', color: '#9D174D' }}>
                  💼
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Services Done</div>
                  <div className="stat-card-value">{todaysWork.length}</div>
                </div>
              </div>
            </div>
            
            {/* Recent Forms Served */}
            <div className="recent-forms-section">
              <h3>Recent Forms Served</h3>
              {allMyForms.length === 0 ? (
                <div className="empty-state-small">
                  <p>No forms served yet</p>
                </div>
              ) : (
                <div className="recent-forms-list">
                  {allMyForms.slice(0, 5).map((form, index) => (
                    <div key={form.id} className="recent-form-item">
                      <div className="recent-form-client">
                        <div className="client-avatar">
                          {form.clientName?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="client-name">{form.clientName || 'Client'}</div>
                          <div className="form-date">{formatFullDate(form.servedAt)}</div>
                        </div>
                      </div>
                      {form.desiredService && (
                        <span className="service-tag">{form.desiredService}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHARE FORM MODAL */}
      {showShareForm && (
        <div className="modal" onClick={() => setShowShareForm(false)}>
          <div className="modal-content share-form-modal" onClick={e => e.stopPropagation()}>
            <div className="share-form-header">
              <h2>Share Client Form</h2>
              <button 
                className="close-btn"
                onClick={() => setShowShareForm(false)}
              >
                ×
              </button>
            </div>
            
            <p>Share this with your client:</p>
            
            <div className="qr-code-container">
              <img 
                src={getQRCodeUrl()} 
                alt="QR Code" 
                className="qr-code"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="qr-fallback">
                      <div>QR Code</div>
                      <small>Scan to open form</small>
                    </div>
                  `;
                }}
              />
              <p className="qr-note">Scan with phone camera</p>
            </div>
            
            <div className="link-container">
              <label>Or copy this link:</label>
              <div className="link-box">
                {getFormLink()}
                <button 
                  className="copy-link-btn"
                  onClick={copyFormLink}
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="share-buttons">
              <button
                className="share-btn whatsapp"
                onClick={shareViaWhatsApp}
              >
                📱 Share on WhatsApp
              </button>
              
              <button
                className="share-btn sms"
                onClick={shareViaSMS}
              >
                💬 Share via SMS
              </button>
            </div>
            
            <div className="share-instructions">
              <p><strong>Instructions for client:</strong></p>
              <p>1. Scan QR code or click link</p>
              <p>2. Fill health & service information</p>
              <p>3. Submit form</p>
              <p>4. Form will appear here automatically</p>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT FORM DETAILS MODAL */}
      {showFormDetails && (
        <div className="modal" onClick={() => setShowFormDetails(null)}>
          <div className="modal-content client-form-modal" onClick={e => e.stopPropagation()}>
            <div className="client-form-header">
              <h2>{showFormDetails.clientName || 'Client'}'s Consultation</h2>
              <button 
                className="close-btn"
                onClick={() => setShowFormDetails(null)}
              >
                ×
              </button>
            </div>
            
            {/* Show status badge */}
            {showFormDetails.isServed ? (
              <div className="status-badge served">
                ✅ Served by {showFormDetails.servedBy || 'you'}
              </div>
            ) : showFormDetails.status === 'claimed' ? (
              <div className="status-badge claimed">
                🟡 Claimed by {showFormDetails.claimedBy}
              </div>
            ) : (
              <div className="status-badge available">
                🔵 Available
              </div>
            )}
            
            <div className="quick-info">
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{showFormDetails.clientPhone || 'Not provided'}</span>
              </div>
              {showFormDetails.desiredService && (
                <div className="info-item">
                  <span className="info-label">Service:</span>
                  <span className="info-value">{showFormDetails.desiredService}</span>
                </div>
              )}
            </div>
            
            {(showFormDetails.allergies || showFormDetails.medicalConditions || showFormDetails.isPregnant) && (
              <div className="health-warning">
                <h3>⚠️ Health & Safety</h3>
                {showFormDetails.allergies && (
                  <div className="warning-item">
                    <strong>Allergies:</strong> {showFormDetails.allergies}
                  </div>
                )}
                {showFormDetails.medicalConditions && (
                  <div className="warning-item">
                    <strong>Medical Conditions:</strong> {showFormDetails.medicalConditions}
                  </div>
                )}
                {showFormDetails.isPregnant && (
                  <div className="warning-item alert">
                    ⚠️ PREGNANT OR BREASTFEEDING
                  </div>
                )}
              </div>
            )}
            
            {(showFormDetails.previousHistory || showFormDetails.specialRequests) && (
              <div className="service-details">
                <h3>💼 Service Details</h3>
                {showFormDetails.previousHistory && (
                  <div className="detail-item">
                    <strong>Previous History:</strong> {showFormDetails.previousHistory}
                  </div>
                )}
                {showFormDetails.specialRequests && (
                  <div className="detail-item">
                    <strong>Special Requests:</strong> "{showFormDetails.specialRequests}"
                  </div>
                )}
              </div>
            )}
            
            <div className="consent-check">
              <div className="consent-item">
                <input type="checkbox" id="consentCheck" defaultChecked />
                <label htmlFor="consentCheck">
                  I have reviewed client's health information and consent
                </label>
              </div>
            </div>
            
            <div className="client-form-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowFormDetails(null)}
              >
                Close
              </button>
              
              {showFormDetails.isAvailable && !showFormDetails.isServed && (
                <>
                  <button
                    className="btn-warning"
                    onClick={() => claimForm(showFormDetails.id, showFormDetails)}
                    style={{ background: '#F59E0B' }}
                  >
                    🟡 Claim Form
                  </button>
                  
                  <button
                    className="btn-primary"
                    onClick={() => startService(showFormDetails.id)}
                    style={{ background: secondaryColor }}
                  >
                    ✅ Start Service
                  </button>
                </>
              )}
              
              {showFormDetails.isServed && (
                <button
                  className="btn-primary"
                  disabled
                  style={{ background: '#10B981' }}
                >
                  ✅ Already Served
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;