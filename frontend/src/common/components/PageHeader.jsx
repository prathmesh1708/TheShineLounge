import React from 'react';
import ServiceIcon from './ServiceIcon';

export default function PageHeader({ id, name, tagline, accentColor }) {
  // Convert hex color to custom inline style rgb variables
  const getRGB = (hex) => {
    let c = hex.substring(1);
    let rgb = parseInt(c, 16);
    let r = (rgb >> 16) & 0xff;
    let g = (rgb >> 8) & 0xff;
    let b = (rgb >> 0) & 0xff;
    return `${r}, ${g}, ${b}`;
  };

  return (
    <div 
      className="page-header-container"
      style={{
        '--accent-color': accentColor,
        '--accent-color-rgb': getRGB(accentColor)
      }}
    >
      <div className="page-header-icon-box">
        <ServiceIcon name={id} size={36} />
      </div>
      <div className="page-header-text">
        <h1 className="page-header-title">{name}</h1>
        <p className="page-header-tagline">{tagline}</p>
      </div>
    </div>
  );
}
