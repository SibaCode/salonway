// src/components/common/Button.js
import React from 'react';

const Button = ({ 
  children, 
  loading = false, 
  disabled = false,
  className = '', 
  type = 'button',
  variant = 'primary',
  onClick,
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const disabledClass = disabled ? 'disabled' : '';
  
  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        minHeight: '56px',
        borderRadius: '16px',
        ...props.style
      }}
      {...props}
    >
      {loading ? (
        <div className="d-flex align-items-center justify-content-center">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          Loading...
        </div>
      ) : children}
    </button>
  );
};

export default Button;