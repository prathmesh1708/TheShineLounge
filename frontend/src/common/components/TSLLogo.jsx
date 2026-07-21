import React from 'react';
import tslLogo from '../../assets/images/tsl_logo.png';

export default function TSLLogo({ className = "w-full h-full object-contain" }) {
  return (
    <img 
      src={tslLogo} 
      alt="The Shine Lounge Logo" 
      className={className} 
    />
  );
}
