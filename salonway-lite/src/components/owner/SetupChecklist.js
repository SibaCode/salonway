// src/components/owner/SetupChecklist.js
import React, { useState } from 'react';
import { FaCheckCircle, FaUserPlus, FaClipboardList, FaImages, FaLink, FaArrowRight } from 'react-icons/fa';

const SetupChecklist = ({ salonData, onComplete, onBack }) => {
  const [completedSteps, setCompletedSteps] = useState({
    addStaff: false,
    setupServices: false,
    uploadImages: false,
    getLinks: false
  });

  const handleStepComplete = (step) => {
    setCompletedSteps(prev => ({
      ...prev,
      [step]: true
    }));
  };

  const allCompleted = Object.values(completedSteps).every(step => step);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F9FAFB',
      padding: '20px'
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#6B7280',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '30px'
        }}
      >
        <FaArrowRight style={{ transform: 'rotate(180deg)' }} />
        Back
      </button>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: salonData?.primaryColor || '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'white',
            fontSize: '32px'
          }}>
            ✨
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
            Welcome to {salonData?.name || 'Your Salon'}!
          </h1>
          <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '16px' }}>
            Complete these 4 simple steps to set up your salon and get started.
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            height: '6px',
            background: '#E5E7EB',
            borderRadius: '3px',
            marginBottom: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(Object.values(completedSteps).filter(Boolean).length / 4) * 100}%`,
              height: '100%',
              background: salonData?.primaryColor || '#3B82F6',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6B7280' }}>
            <span>0%</span>
            <span>{Object.values(completedSteps).filter(Boolean).length}/4 completed</span>
            <span>100%</span>
          </div>
        </div>

        {/* Checklist Items */}
        <div style={{ marginBottom: '40px' }}>
          {/* Step 1 */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px',
            border: completedSteps.addStaff ? `2px solid ${salonData?.primaryColor || '#3B82F6'}` : '2px solid #E5E7EB',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: completedSteps.addStaff ? 
                    `${salonData?.primaryColor || '#3B82F6'}20` : '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: completedSteps.addStaff ? 
                    (salonData?.primaryColor || '#3B82F6') : '#9CA3AF'
                }}>
                  <FaUserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>
                    Add Your First Staff Member
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>
                    Add staff and generate unique access links for them
                  </p>
                </div>
              </div>
              {completedSteps.addStaff ? (
                <FaCheckCircle style={{ color: salonData?.primaryColor || '#3B82F6', fontSize: '24px' }} />
              ) : (
                <button
                  onClick={() => handleStepComplete('addStaff')}
                  style={{
                    background: salonData?.primaryColor || '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>

          {/* Step 2 */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px',
            border: completedSteps.setupServices ? `2px solid ${salonData?.primaryColor || '#3B82F6'}` : '2px solid #E5E7EB',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: completedSteps.setupServices ? 
                    `${salonData?.primaryColor || '#3B82F6'}20` : '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: completedSteps.setupServices ? 
                    (salonData?.primaryColor || '#3B82F6') : '#9CA3AF'
                }}>
                  <FaClipboardList size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>
                    Set Up Services
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>
                    Add services with prices and durations
                  </p>
                </div>
              </div>
              {completedSteps.setupServices ? (
                <FaCheckCircle style={{ color: salonData?.primaryColor || '#3B82F6', fontSize: '24px' }} />
              ) : (
                <button
                  onClick={() => handleStepComplete('setupServices')}
                  style={{
                    background: salonData?.primaryColor || '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>

          {/* Step 3 */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px',
            border: completedSteps.uploadImages ? `2px solid ${salonData?.primaryColor || '#3B82F6'}` : '2px solid #E5E7EB',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: completedSteps.uploadImages ? 
                    `${salonData?.primaryColor || '#3B82F6'}20` : '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: completedSteps.uploadImages ? 
                    (salonData?.primaryColor || '#3B82F6') : '#9CA3AF'
                }}>
                  <FaImages size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>
                    Upload Catalogue Images
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>
                    Add photos to showcase your work
                  </p>
                </div>
              </div>
              {completedSteps.uploadImages ? (
                <FaCheckCircle style={{ color: salonData?.primaryColor || '#3B82F6', fontSize: '24px' }} />
              ) : (
                <button
                  onClick={() => handleStepComplete('uploadImages')}
                  style={{
                    background: salonData?.primaryColor || '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>

          {/* Step 4 */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px',
            border: completedSteps.getLinks ? `2px solid ${salonData?.primaryColor || '#3B82F6'}` : '2px solid #E5E7EB',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: completedSteps.getLinks ? 
                    `${salonData?.primaryColor || '#3B82F6'}20` : '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: completedSteps.getLinks ? 
                    (salonData?.primaryColor || '#3B82F6') : '#9CA3AF'
                }}>
                  <FaLink size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>
                    Get Your Share Links
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>
                    Get links for staff access and client forms
                  </p>
                </div>
              </div>
              {completedSteps.getLinks ? (
                <FaCheckCircle style={{ color: salonData?.primaryColor || '#3B82F6', fontSize: '24px' }} />
              ) : (
                <button
                  onClick={() => handleStepComplete('getLinks')}
                  style={{
                    background: salonData?.primaryColor || '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <button
          onClick={onComplete}
          disabled={!allCompleted}
          style={{
            width: '100%',
            padding: '18px',
            background: !allCompleted ? '#E5E7EB' : (salonData?.primaryColor || '#3B82F6'),
            color: !allCompleted ? '#9CA3AF' : 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: !allCompleted ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          {allCompleted ? (
            <>
              <FaCheckCircle /> Complete Setup & Go to Dashboard
            </>
          ) : (
            'Complete all steps to continue'
          )}
        </button>
      </div>
    </div>
  );
};

export default SetupChecklist;