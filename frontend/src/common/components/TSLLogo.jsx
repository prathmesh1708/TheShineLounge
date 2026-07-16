import React from 'react';

export default function TSLLogo({ accentColor, isService }) {
  // If isService is true, we use the service's custom accent color.
  // Otherwise, we use the classic logo colors (blue and orange) from the original image.
  const color1 = isService ? accentColor : '#1e5396'; // Blue / Service Accent
  const color2 = isService ? accentColor : '#f58025'; // Orange / Service Accent

  return (
    <svg 
      viewBox="0 0 100 100" 
      width="100%" 
      height="100%" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      {/* Outer White Circular Badge background */}
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
      
      {/* Outer colored ring matching the logo image */}
      <circle cx="50" cy="50" r="43" fill="none" stroke={color1} strokeWidth="5.5" />
      
      {/* Inner TSL Shield Emblem */}
      <g transform="translate(0, 2)">
        {/* T Shape (Top and Left - Blue or Accent) */}
        <path 
          d="M 23 37 L 70 37 L 62 44 L 38 44 L 47 70 L 39 70 Z" 
          fill={color1} 
        />
        <path 
          d="M 23 37 L 38 44 L 20 62 L 20 50 Z" 
          fill={color1} 
        />
        <path 
          d="M 20 62 L 39 70 L 50 82 L 48 83 L 35 72 Z" 
          fill={color1} 
        />
        
        {/* S Shape (Middle - Orange or Accent) */}
        <path 
          d="M 42 46 L 63 46 L 50 58 L 62 70 L 50 82 L 44 76 L 53 67 L 41 55 Z" 
          fill={color2}
        />
        
        {/* L Shape & Right Frame (Right - Blue or Accent) */}
        <path 
          d="M 66 38 L 78 50 L 78 62 L 68 72 L 64 65 L 71 58 L 71 48 L 61 40 Z" 
          fill={color1}
        />
        <path 
          d="M 78 62 L 50 82 L 62 70 L 70 70 Z" 
          fill={color1}
        />
      </g>
    </svg>
  );
}
