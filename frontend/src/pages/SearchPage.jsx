import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import image assets
import toastImg from '../assets/images/gourmet_toast.png';
import cappuccinoImg from '../assets/images/classic_cappuccino.png';
import carWashImg from '../assets/images/car_wash_premium.png';
import dogWashImg from '../assets/images/dog_wash_premium.png';
import salonImg from '../assets/images/salon_haircut_premium.png';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } }
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  
  // Flat list of all products & services across all modules with images
  const allItems = [
    { name: 'Sourdough Avocado Toast', category: 'Café', price: '₹11.00', path: '/cafe', image: toastImg },
    { name: 'Classic Cappuccino', category: 'Café', price: '₹4.50', path: '/cafe', image: cappuccinoImg },
    { name: 'Madagascar Vanilla Latte', category: 'Café', price: '₹5.00', path: '/cafe', image: cappuccinoImg },
    { name: 'Single Wash Package', category: 'Car Wash', price: '₹18.00', path: '/car-wash', image: carWashImg },
    { name: 'Monthly Unlimited Membership', category: 'Car Wash', price: '₹39.00', path: '/car-wash', image: carWashImg },
    { name: 'Exterior Hand Polish', category: 'Detailing', price: '₹85.00', path: '/car-detailing', image: carWashImg },
    { name: 'Ceramic Coating Shield', category: 'Detailing', price: '₹299.00', path: '/car-detailing', image: carWashImg },
    { name: 'Express Dog Wash (10 Min)', category: 'Dog Wash', price: '₹15.00', path: '/dog-wash', image: dogWashImg },
    { name: 'Executive Haircut & Shave', category: 'Men\'s Salon', price: '₹45.00', path: '/salon', image: salonImg }
  ];

  const filtered = allItems.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="search-page-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem', 
      maxWidth: '550px', 
      margin: '0 auto', 
      paddingBottom: '6rem',
      marginTop: '-0.75rem'
    }}>

      {/* Search Input */}
      <div className="search-group-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            placeholder="Search coffee, wash, detailing..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-field"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 className="form-label" style={{ marginBottom: '0.15rem' }}>Search Results ({filtered.length})</h3>
        
        {filtered.length > 0 ? (
          <motion.div 
            style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filtered.map((item, idx) => (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="gourmet-item-row" 
                onClick={() => navigate(item.path)}
                style={{ cursor: 'pointer', padding: '0.85rem 1.15rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '0.65rem', 
                      objectFit: 'cover',
                      border: '1px solid var(--border-color)' 
                    }} 
                  />
                  <div className="gourmet-item-info">
                    <h4 className="gourmet-item-name">{item.name}</h4>
                    <span className="gourmet-item-category">{item.category}</span>
                  </div>
                </div>
                <div className="gourmet-item-price-col">
                  <span className="gourmet-price-badge">{item.price}</span>
                  <span style={{ fontSize: '0.9rem', color: '#148F87', fontWeight: 600 }}>View →</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-muted" style={{ fontSize: '0.95rem', textAlign: 'center', marginTop: '2rem' }}>
            No products or services match your search query.
          </p>
        )}
      </div>
    </div>
  );
}
