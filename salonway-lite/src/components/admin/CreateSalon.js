import React, { useState } from 'react';
import { FaArrowLeft, FaCheck, FaPalette, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const CreateSalon = ({ onCreate, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [createdData, setCreatedData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate password
    if (!formData.ownerPassword || formData.ownerPassword.length < 6) {
      alert('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    const salonData = {
      name: formData.name,
      ownerName: formData.ownerName,
      ownerEmail: formData.ownerEmail.toLowerCase().trim(),
      ownerPassword: formData.ownerPassword, // Admin-created password
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      status: 'active',
      setupCompleted: false,
      staffCount: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Submitting salon data:', salonData);
    
    const result = await onCreate(salonData);
    
    if (result.success) {
      setCreatedData({
        salonId: result.salonId,
        ownerPassword: formData.ownerPassword,
        ownerEmail: formData.ownerEmail,
        salonName: formData.name
      });
      setSuccess(true);
      setStep(3);
    } else {
      alert('Error: ' + result.error);
    }
    
    setLoading(false);
  };

   if (step === 1) {
    return (
      <div className="page">
        <div className="page-header">
          <button 
            onClick={onBack}
            className="btn btn-icon mb-3"
          >
            <FaArrowLeft />
          </button>
          <h1 className="page-title">Create Salon</h1>
          <p className="page-subtitle">Step 1 of 2: Salon & owner details</p>
        </div>

        <div className="card">
          <form onSubmit={() => setStep(2)}>
            <div className="mb-3">
              <label className="input-label">Salon Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="Sunrise Salon"
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="input-label">Owner Name *</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="input"
                placeholder="Sarah Johnson"
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="input-label">Owner Email *</label>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                className="input"
                placeholder="sarah@email.com"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="input-label">Owner Password *</label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                  zIndex: 1
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="ownerPassword"
                  value={formData.ownerPassword}
                  onChange={handleChange}
                  className="input"
                  placeholder="Create a password for the owner"
                  required
                  style={{ paddingLeft: '40px' }}
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    padding: '4px',
                    zIndex: 1
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <small style={{ color: '#6B7280', fontSize: '13px', display: 'block', marginTop: '6px' }}>
                Create a password for the salon owner to login (min. 6 characters)
              </small>
            </div>
            
            <button type="submit" className="btn btn-primary btn-full">
              Continue to Branding
            </button>
          </form>
        </div>
      </div>
    );
  }


  if (step === 2) {
    return (
      <div className="page">
        <div className="page-header">
          <button 
            onClick={() => setStep(1)}
            className="btn btn-icon mb-3"
          >
            <FaArrowLeft />
          </button>
          <h1 className="page-title">Branding</h1>
          <p className="page-subtitle">Step 2 of 2: Colors & styling</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <FaPalette className="text-primary mr-2" />
                <label className="input-label">Brand Colors</label>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-12 h-12 rounded-lg cursor-pointer mr-3"
                    />
                    <span className="font-mono text-sm">{formData.primaryColor}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="w-12 h-12 rounded-lg cursor-pointer mr-3"
                    />
                    <span className="font-mono text-sm">{formData.secondaryColor}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="flex items-center mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg mr-3"
                    style={{ backgroundColor: formData.primaryColor }}
                  ></div>
                  <div>
                    <div className="font-medium">{formData.name || 'Salon Name'}</div>
                    <div className="text-xs text-gray-500">Powered by SalonWay</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="w-full py-2 rounded-lg font-medium"
                  style={{ 
                    backgroundColor: formData.primaryColor,
                    color: 'white'
                  }}
                >
                  Sample Button
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary flex-1"
              >
                Back
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-2"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Salon'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  if (step === 3 && success && createdData) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">✅ Salon Created!</h1>
          <p className="page-subtitle">Share these details with the owner</p>
        </div>

        <div className="card">
          <div className="text-center mb-6">
            <div className="success-icon">
              <FaCheck />
            </div>
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-gray-600">
              <strong>{createdData.salonName}</strong> has been created
            </p>
          </div>
          
          <div className="credentials-card">
            <h3 className="font-semibold mb-3">Login Details</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Owner Email</div>
                <div className="font-medium p-3 bg-gray-50 rounded-lg">
                  {createdData.ownerEmail}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Owner Password</div>
                <div className="font-mono text-lg p-3 bg-blue-50 rounded-lg text-blue-700">
                  {createdData.ownerPassword}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Login URL</div>
                <div className="font-medium p-3 bg-gray-50 rounded-lg">
                  {window.location.origin}/owner/login
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <button 
              onClick={() => {
                const text = `Salon: ${createdData.salonName}\nLogin: ${createdData.ownerEmail}\nPassword: ${createdData.ownerPassword}\nURL: ${window.location.origin}/owner/login`;
                navigator.clipboard.writeText(text);
                alert('Credentials copied to clipboard!');
              }}
              className="btn btn-secondary btn-full"
            >
              Copy All Details
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
              className="btn btn-primary btn-full"
            >
              Create Another Salon
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CreateSalon;