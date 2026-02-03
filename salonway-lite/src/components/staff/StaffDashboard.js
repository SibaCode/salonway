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
  updateDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import './css/StaffDashboard.css';

const StaffDashboard = () => {
  const { code } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [salon, setSalon] = useState(null);
  const [clockStatus, setClockStatus] = useState({
    isClockedIn: false,
    currentShift: null
  });
  const [showLogWork, setShowLogWork] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [newWork, setNewWork] = useState({
    service: '',
    price: '',
    client: ''
  });

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
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (code) findStaff();
  }, [code]);

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
    }
  };

  // 1. CLOCK IN
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
      
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Could not clock in. Try again.');
    }
  };

  // 2. CLOCK OUT
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
      
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Could not clock out. Try again.');
    }
  };

  // 3. LOG WORK
  const handleLogWork = async () => {
    if (!newWork.service || !newWork.price) {
      alert('Enter service and price');
      return;
    }

    try {
      const workRecord = {
        staffId: staff.id,
        staffName: staff.name,
        salonId: salon.id,
        service: newWork.service,
        price: parseFloat(newWork.price),
        client: newWork.client || '',
        date: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, 'workLogs'), workRecord);
      
      setNewWork({ service: '', price: '', client: '' });
      setShowLogWork(false);
      alert('Work logged! ✅');
      
    } catch (error) {
      console.error('Error logging work:', error);
      alert('Could not log work. Try again.');
    }
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
      {/* HEADER */}
      <header className="staff-header">
        <div className="salon-logo" style={{ background: primaryColor }}>
          {salon.name?.charAt(0) || 'S'}
        </div>
        <div>
          <h1>{salon.name}</h1>
          <p>{staff.name}</p>
        </div>
      </header>

      {/* MAIN SECTION */}
      <main className="staff-main">
        
        {/* 1. CLOCK IN/OUT */}
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

        {/* 2. QUICK ACTIONS */}
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
            onClick={() => setShowClientForm(true)}
            style={{ background: primaryColor }}
          >
            📝 Client Form
          </button>
        </section>

        {/* 3. TODAY'S SUMMARY */}
        <section className="summary-section">
          <h3>Today</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Status</span>
              <span className="value" style={{ color: clockStatus.isClockedIn ? secondaryColor : '#6b7280' }}>
                {clockStatus.isClockedIn ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Hours</span>
              <span className="value">0</span>
            </div>
            <div className="summary-item">
              <span className="label">Work</span>
              <span className="value">0</span>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL 1: LOG WORK */}
      {showLogWork && (
        <div className="modal" onClick={() => setShowLogWork(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>💼 Log Work</h2>
            
            <div className="form-group">
              <label>Service</label>
              <input
                type="text"
                value={newWork.service}
                onChange={e => setNewWork({...newWork, service: e.target.value})}
                placeholder="Haircut, Color, etc."
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                value={newWork.price}
                onChange={e => setNewWork({...newWork, price: e.target.value})}
                placeholder="65"
              />
            </div>
            
            <div className="form-group">
              <label>Client (optional)</label>
              <input
                type="text"
                value={newWork.client}
                onChange={e => setNewWork({...newWork, client: e.target.value})}
                placeholder="Client name"
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
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CLIENT FORM */}
      {showClientForm && (
        <div className="modal" onClick={() => setShowClientForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>📝 Client Form</h2>
            <p>Share this link with your client:</p>
            
            <div className="link-box">
              {window.location.origin}/client/{salon.id}
            </div>
            
            <p className="small-note">
              Client fills the form, you get their info.
            </p>
            
            <button 
              className="btn-close"
              onClick={() => setShowClientForm(false)}
              style={{ background: primaryColor }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function
const formatTime = (timestamp) => {
  if (!timestamp) return '--:--';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

export default StaffDashboard;