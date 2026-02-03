// src/components/common/Input.js
import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-control"
        style={{
          height: '48px',
          borderRadius: '12px',
          border: '1px solid #dee2e6'
        }}
        {...props}
      />
    </div>
  );
};

export default Input;