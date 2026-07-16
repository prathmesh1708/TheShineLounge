import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ServiceIcon from './ServiceIcon';

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const shineRef = useRef(null);

  const { id, name, tagline, accentColor } = service;

  // Convert hex color to custom inline style rgb variables
  const getRGB = (hex) => {
    let c = hex.substring(1);
    let rgb = parseInt(c, 16);
    let r = (rgb >> 16) & 0xff;
    let g = (rgb >> 8) & 0xff;
    let b = (rgb >> 0) & 0xff;
    return `${r}, ${g}, ${b}`;
  };

  const handleMouseEnter = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    // Lift Card and change border color
    gsap.to(cardRef.current, {
      y: -6,
      borderColor: accentColor,
      boxShadow: `0 12px 30px rgba(${getRGB(accentColor)}, 0.12)`,
      duration: 0.3,
      overwrite: 'auto'
    });

    // Reset and sweep the shine overlay
    gsap.fromTo(
      shineRef.current,
      { left: '-150%' },
      { left: '150%', duration: 0.75, ease: 'power2.inOut', overwrite: 'auto' }
    );
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Just clear border color in case
      gsap.to(cardRef.current, { borderColor: 'rgba(255, 255, 255, 0.08)', duration: 0.2 });
      return;
    }

    gsap.to(cardRef.current, {
      y: 0,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: 'none',
      duration: 0.3,
      overwrite: 'auto'
    });
  };

  const handleTap = (e) => {
    e.preventDefault();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      navigate(`/${id}`);
      return;
    }

    // GSAP Tap Animation: Scale down, then scale up, then navigate
    const tl = gsap.timeline({
      onComplete: () => {
        navigate(`/${id}`);
      }
    });

    tl.to(cardRef.current, {
      scale: 0.95,
      y: 0,
      duration: 0.1,
      ease: 'power2.out'
    }).to(cardRef.current, {
      scale: 1,
      y: -6,
      duration: 0.15,
      ease: 'power2.in'
    });
  };

  return (
    <div
      ref={cardRef}
      className="service-card"
      style={{
        '--accent-color': accentColor,
        '--accent-color-rgb': getRGB(accentColor)
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleTap}
    >
      <div ref={shineRef} className="shine-sweep-overlay" />
      
      <div className="service-card-header">
        <div className="service-card-icon-container">
          <ServiceIcon name={id} size={26} />
        </div>
        <span className="service-card-arrow">→</span>
      </div>
      
      <h3 className="service-card-title">{name}</h3>
      <p className="service-card-tagline">{tagline}</p>
    </div>
  );
}
