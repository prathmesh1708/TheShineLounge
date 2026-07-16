import React from 'react';

export default function Button({ children, onClick, type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`form-submit-btn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
