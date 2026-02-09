import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom'; // ADD useSearchParams
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './css/ClientConsultation.css';

const ClientConsultation = () => {
  const { salonId } = useParams();
  const [searchParams] = useSearchParams(); // ADD THIS LINE
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    emergencyContact: '',
    
    // Health Information
    allergies: '',
    isPregnant: false,
    medicalConditions: '',
    medications: '',
    previousReactions: '',
    
    // Service Details
    desiredService: '',
    previousHistory: '',
    photoReference: '',
    specialRequests: '',
    
    // Consent
    consentService: false,
    consentPhotos: false,
    consentData: false,
  });

  // Get staffId from URL
  const staffId = searchParams.get('staffId');
  const [assignedStaffName, setAssignedStaffName] = useState('');

  // Get salon data AND staff name
  useEffect(() => {
    const fetchSalon = async () => {
      if (!salonId) return;
      
      try {
        // Fetch salon data
        const salonDoc = await getDoc(doc(db, 'salons', salonId));
        if (salonDoc.exists()) {
          setSalon({ id: salonDoc.id, ...salonDoc.data() });
        }

        // If staffId exists in URL, fetch staff name
        if (staffId) {
          try {
            const staffDoc = await getDoc(doc(db, 'salons', salonId, 'staff', staffId));
            if (staffDoc.exists()) {
              setAssignedStaffName(staffDoc.data().name);
              console.log('Form assigned to staff:', staffDoc.data().name);
            }
          } catch (staffError) {
            console.error('Error fetching staff:', staffError);
          }
        }

      } catch (error) {
        console.error('Error fetching salon:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalon();
  }, [salonId, staffId]); // Add staffId to dependencies

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Validate required fields
    if (!formData.fullName || !formData.phone || !formData.consentService) {
      alert('Please fill in required fields and give consent');
      return;
    }

    try {
      const consultationData = {
        status: 'new',
        createdAt: serverTimestamp(),
        salonId: salonId,
        salonName: salon?.name || '',
        accessCode: accessCode,
        date: new Date().toISOString().split('T')[0],
        
        // STAFF ASSIGNMENT - ADD THIS
        assignedStaffId: staffId || '', // Save staffId from URL
        assignedStaffName: assignedStaffName || '', // Save staff name
        
        // Client Info
        clientName: formData.fullName,
        clientPhone: formData.phone,
        clientEmail: formData.email || '',
        dateOfBirth: formData.dateOfBirth || '',
        emergencyContact: formData.emergencyContact || '',
        
        // Health Info
        allergies: formData.allergies || '',
        isPregnant: formData.isPregnant,
        medicalConditions: formData.medicalConditions || '',
        medications: formData.medications || '',
        previousReactions: formData.previousReactions || '',
        
        // Service Info
        desiredService: formData.desiredService || '',
        previousHistory: formData.previousHistory || '',
        photoReference: formData.photoReference || '',
        specialRequests: formData.specialRequests || '',
        
        // Consent
        consentService: formData.consentService,
        consentPhotos: formData.consentPhotos,
        consentData: formData.consentData,
        
        // System
        source: 'online_form',
        submittedAt: new Date().toISOString()
      };

      console.log('Submitting form with staff assignment:', {
        assignedStaffId: staffId,
        assignedStaffName: assignedStaffName
      });

      // Save to Firestore
      await addDoc(collection(db, 'consultations'), consultationData);
      
      // Show success
      setSubmitted(true);
      
      // Optional: Reset form after delay
      setTimeout(() => {
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          dateOfBirth: '',
          emergencyContact: '',
          allergies: '',
          isPregnant: false,
          medicalConditions: '',
          medications: '',
          previousReactions: '',
          desiredService: '',
          previousHistory: '',
          photoReference: '',
          specialRequests: '',
          consentService: false,
          consentPhotos: false,
          consentData: false,
        });
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your form. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading consultation form...</p>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="error-container">
        <h2>Salon Not Found</h2>
        <p>This consultation link is not valid.</p>
      </div>
    );
  }

  const primaryColor = salon.primaryColor || '#3B82F6';
  const secondaryColor = salon.secondaryColor || '#10B981';

  if (submitted) {
    return (
      <div className="success-container" style={{ '--primary': primaryColor }}>
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Thank You!</h2>
          <p>Your consultation form has been submitted to {salon.name}.</p>
          
          {/* Show which staff it's assigned to */}
          {assignedStaffName && (
            <div className="staff-assignment-notice">
              <div className="staff-info">
                <strong>Form assigned to:</strong>
                <p>{assignedStaffName}</p>
              </div>
              <p className="staff-note">
                {assignedStaffName} will contact you directly about your appointment.
              </p>
            </div>
          )}
          
          <p className="success-note">
            A staff member will contact you shortly to discuss your service.
          </p>
          <div className="success-contact">
            <p>For immediate assistance, contact:</p>
            <p className="salon-info">{salon.name}</p>
            {salon.phone && <p>📞 {salon.phone}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consultation-container" style={{ 
      '--primary': primaryColor,
      '--secondary': secondaryColor 
    }}>
      {/* Header with Staff Assignment Notice */}
      {assignedStaffName && (
        <div className="staff-banner" style={{ background: primaryColor }}>
          <div className="staff-banner-content">
            <div className="staff-avatar">
              {assignedStaffName.charAt(0)}
            </div>
            <div className="staff-banner-info">
              <h3>Form for {assignedStaffName}</h3>
              <p>Your consultation will be handled directly by your stylist</p>
            </div>
          </div>
        </div>
      )}

      <header className="consultation-header">
        <div className="salon-branding">
          {salon.logoUrl ? (
            <img src={salon.logoUrl} alt={salon.name} className="salon-logo" />
          ) : (
            <div className="salon-logo-placeholder" style={{ background: primaryColor }}>
              {salon.name?.charAt(0) || 'S'}
            </div>
          )}
          <div>
            <h1>{salon.name}</h1>
            <p className="salon-tagline">Client Consultation Form</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="consultation-form">
        {/* Section 1: Personal Information */}
        <section className="form-section">
          <h2 className="section-title" style={{ borderLeftColor: primaryColor }}>
            Personal Information
          </h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="required">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Sarah Johnson"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="required">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="123-456-7890"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sarah@example.com"
              />
            </div>
            
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group full-width">
              <label>Emergency Contact</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="Name & Phone Number"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Health Information */}
        <section className="form-section">
          <h2 className="section-title" style={{ borderLeftColor: secondaryColor }}>
            Health & Safety Information
          </h2>
          <p className="section-description">
            This information helps us provide safe and appropriate services.
          </p>
          
          <div className="form-group">
            <label>Allergies (hair dye, chemicals, latex, etc.)</label>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="List any allergies..."
              rows="2"
            />
          </div>
          
          <div className="form-group">
            <label>Medical Conditions (skin conditions, pregnancy, etc.)</label>
            <textarea
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={handleChange}
              placeholder="Any medical conditions we should know about..."
              rows="2"
            />
          </div>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPregnant"
                checked={formData.isPregnant}
                onChange={handleChange}
              />
              <span>Are you pregnant or breastfeeding?</span>
            </label>
          </div>
          
          <div className="form-group">
            <label>Current Medications</label>
            <textarea
              name="medications"
              value={formData.medications}
              onChange={handleChange}
              placeholder="Any medications you're currently taking..."
              rows="2"
            />
          </div>
          
          <div className="form-group">
            <label>Previous Reactions to Salon Services</label>
            <textarea
              name="previousReactions"
              value={formData.previousReactions}
              onChange={handleChange}
              placeholder="Any past reactions to hair color, treatments, etc..."
              rows="2"
            />
          </div>
        </section>

        {/* Section 3: Service Details */}
        <section className="form-section">
          <h2 className="section-title" style={{ borderLeftColor: primaryColor }}>
            Service Details
          </h2>
          
          <div className="form-group">
            <label>Desired Service</label>
            <input
              type="text"
              name="desiredService"
              value={formData.desiredService}
              onChange={handleChange}
              placeholder="e.g., Hair Color, Cut, Treatment"
            />
          </div>
          
          <div className="form-group">
            <label>Previous Hair/Skin History</label>
            <textarea
              name="previousHistory"
              value={formData.previousHistory}
              onChange={handleChange}
              placeholder="Recent treatments, color, chemical services..."
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Photo Reference or Description</label>
            <textarea
              name="photoReference"
              value={formData.photoReference}
              onChange={handleChange}
              placeholder="Describe or paste image link of desired look..."
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Special Requests or Concerns</label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              placeholder="Anything else we should know..."
              rows="2"
            />
          </div>
        </section>

        {/* Section 4: Consent */}
        <section className="form-section consent-section">
          <h2 className="section-title" style={{ borderLeftColor: secondaryColor }}>
            Consent & Agreement
          </h2>
          
          <div className="consent-box">
            <div className="checkbox-group">
              <label className="checkbox-label required">
                <input
                  type="checkbox"
                  name="consentService"
                  checked={formData.consentService}
                  onChange={handleChange}
                  required
                />
                <span>
                  I consent to the salon service and understand the associated risks.
                  I confirm that all health information provided is accurate.
                </span>
              </label>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="consentPhotos"
                  checked={formData.consentPhotos}
                  onChange={handleChange}
                />
                <span>
                  I consent to photos of my service being used for salon portfolio
                  and marketing (optional).
                </span>
              </label>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="consentData"
                  checked={formData.consentData}
                  onChange={handleChange}
                />
                <span>
                  I consent to my information being stored digitally for service
                  records and future appointments.
                </span>
              </label>
            </div>
          </div>
          
          <div className="privacy-note">
            <p>
              <strong>Privacy Note:</strong> Your information is securely stored and only
              accessible to {salon.name} staff. We never share your data with third parties.
            </p>
          </div>
        </section>

        {/* Submit Button */}
        <div className="submit-section">
          <button
            type="submit"
            className="submit-button"
            style={{ background: primaryColor }}
          >
            Submit Consultation Form
          </button>
          
          {/* Show staff assignment info */}
          {assignedStaffName && (
            <p className="staff-submit-note">
              This form will be sent directly to <strong>{assignedStaffName}</strong>
            </p>
          )}
          
          <p className="form-footer">
            A staff member from {salon.name} will contact you within 24 hours.
          </p>
        </div>
      </form>

      {/* Salon Info Footer */}
      <footer className="consultation-footer">
        <div className="footer-content">
          <div className="salon-contact">
            <h3>{salon.name}</h3>
            {salon.address && <p>📍 {salon.address}</p>}
            {salon.phone && <p>📞 {salon.phone}</p>}
            {salon.email && <p>✉️ {salon.email}</p>}
          </div>
          <div className="footer-note">
            <p>Digital Consultation Form • {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientConsultation;