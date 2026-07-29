import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

import { useTheme } from '../common/context/ThemeContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeModal, setActiveModal] = useState(null); // 'edit-profile', 'payment', 'preferences', 'notifications'

  // Mock states that update dynamically
  const [profile, setProfile] = useState({
    name: 'Vally Guest',
    email: 'vally.guest@shinelounge.com',
    phone: '+91 98765 43210'
  });

  const [preferences, setPreferences] = useState({
    coffee: 'Nitro Vanilla Sweet Cream',
    wash: 'Shine Monthly Pass',
    barber: 'Marcus Sterling'
  });

  const [notifications, setNotifications] = useState({
    sms: true,
    push: false,
    email: true
  });

  const [cards] = useState([
    { brand: 'Visa', last4: '4820', expiry: '12/28', type: 'Primary' },
    { brand: 'Mastercard', last4: '9901', expiry: '06/29', type: 'Backup' }
  ]);

  const [receipts] = useState([
    { id: 'REC-2026-9028', date: 'July 18, 2026', amount: '₹18.00', service: 'Car Wash' },
    { id: 'REC-2026-4412', date: 'July 17, 2026', amount: '₹35.00', service: 'Men\'s Salon' }
  ]);

  // Temp form states
  const [tempProfile, setTempProfile] = useState({ ...profile });
  const [tempPrefs, setTempPrefs] = useState({ ...preferences });
  const [tempNotifs, setTempNotifs] = useState({ ...notifications });

  const handleOpenModal = (modalType) => {
    setTempProfile({ ...profile });
    setTempPrefs({ ...preferences });
    setTempNotifs({ ...notifications });
    setActiveModal(modalType);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    setProfile(tempProfile);
    setActiveModal(null);
    alert('Profile details updated successfully!');
  };

  const savePreferences = (e) => {
    e.preventDefault();
    setPreferences(tempPrefs);
    setActiveModal(null);
    alert('Lounge preferences updated successfully!');
  };

  const saveNotifications = (e) => {
    e.preventDefault();
    setNotifications(tempNotifs);
    setActiveModal(null);
    alert('Notification settings updated successfully!');
  };

  // --- Sub-view Renders ---
  
  const renderEditProfile = () => (
    <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Edit Profile</h3>
      
      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label className="form-label">Full Name</label>
        <input 
          type="text" 
          value={tempProfile.name}
          onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
          className="form-input"
          required
        />
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label className="form-label">Email Address</label>
        <input 
          type="email" 
          value={tempProfile.email}
          onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
          className="form-input"
          required
        />
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label className="form-label">Mobile Number</label>
        <input 
          type="tel" 
          value={tempProfile.phone}
          onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
          className="form-input"
          required
        />
      </div>

      <button type="submit" className="form-submit-btn" style={{ width: '100%', marginTop: '0.5rem' }}>
        Save Changes
      </button>
    </form>
  );

  const renderPaymentOptions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Payment Options</h3>
      
      {/* Saved Cards */}
      <div>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Saved Cards</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cards.map((card, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.15rem', border: '1px solid var(--border-color)', borderRadius: '1rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💳</span>
                <div>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{card.brand} •••• {card.last4}</h5>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expires {card.expiry}</span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', background: card.type === 'Primary' ? 'rgba(20,143,135,0.1)' : 'rgba(35,31,29,0.05)', color: card.type === 'Primary' ? '#148F87' : 'var(--text-main)', borderRadius: '0.5rem' }}>
                {card.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History / Receipts */}
      <div>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Recent Receipts</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {receipts.map((receipt, idx) => (
            <div 
              key={idx} 
              onClick={() => alert(`Receipt ${receipt.id} PDF downloaded successfully!`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid rgba(35,31,29,0.05)', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
            >
              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{receipt.service} ({receipt.id})</h5>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{receipt.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{receipt.amount}</span>
                <span style={{ fontSize: '0.85rem', color: '#148F87' }}>⬇️</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <form onSubmit={savePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Lounge Preferences</h3>
      
      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label className="form-label">Preferred Brew</label>
        <select 
          value={tempPrefs.coffee}
          onChange={(e) => setTempPrefs({ ...tempPrefs, coffee: e.target.value })}
          className="form-select"
        >
          <option>Nitro Vanilla Sweet Cream</option>
          <option>Classic Cappuccino</option>
          <option>Commuter Cold Brew</option>
          <option>Espresso Double Shot</option>
        </select>
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label className="form-label">Favorite Wash Option</label>
        <select 
          value={tempPrefs.wash}
          onChange={(e) => setTempPrefs({ ...tempPrefs, wash: e.target.value })}
          className="form-select"
        >
          <option>Shine Monthly Pass</option>
          <option>VIP Annual Elite</option>
          <option>Express Wash</option>
        </select>
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label className="form-label">Regular Stylist</label>
        <select 
          value={tempPrefs.barber}
          onChange={(e) => setTempPrefs({ ...tempPrefs, barber: e.target.value })}
          className="form-select"
        >
          <option>Marcus Sterling</option>
          <option>Leo Martinez</option>
          <option>Dominic Vance</option>
          <option>Adrian Brooks</option>
        </select>
      </div>

      <button type="submit" className="form-submit-btn" style={{ width: '100%', marginTop: '0.5rem' }}>
        Save Preferences
      </button>
    </form>
  );

  const renderNotifications = () => (
    <form onSubmit={saveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Notification Settings</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[
          { key: 'sms', label: 'SMS Booking Alerts', desc: 'Get slot confirmations via text message' },
          { key: 'push', label: 'Push Notifications', desc: 'Realtime updates when your wash/coffee is ready' },
          { key: 'email', label: 'Email Invoices', desc: 'Receive GST invoices and transaction history' }
        ].map((item) => (
          <div 
            key={item.key}
            onClick={() => setTempNotifs({ ...tempNotifs, [item.key]: !tempNotifs[item.key] })}
            style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', padding: '0.85rem 1rem', border: '1px solid rgba(35,31,29,0.05)', borderRadius: '1rem', background: '#ffffff', cursor: 'pointer' }}
          >
            <div style={{ flexGrow: 1, paddingRight: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.label}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.desc}</p>
            </div>
            
            {/* Custom toggle pill */}
            <div style={{ 
              width: '44px', 
              height: '24px', 
              borderRadius: '999px', 
              background: tempNotifs[item.key] ? '#148F87' : 'rgba(35,31,29,0.1)', 
              position: 'relative',
              transition: 'background-color 0.2s ease-in-out'
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '3px',
                left: tempNotifs[item.key] ? '23px' : '3px',
                transition: 'left 0.2s ease-in-out',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} />
            </div>
          </div>
        ))}
      </div>

      <button type="submit" className="form-submit-btn" style={{ width: '100%', marginTop: '0.5rem' }}>
        Save Settings
      </button>
    </form>
  );

  return (
    <div className="profile-page-container app-mobile-dashboard" style={{ gap: '0.75rem', position: 'relative' }}>
      
      {/* Profile Card */}
      <div className="profile-header-card section-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
        <div className="profile-avatar-circle" style={{ width: '48px', height: '48px', flexShrink: 0, boxShadow: '0 4px 12px rgba(193, 154, 91, 0.15)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className="profile-user-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start', textAlign: 'left', flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 className="profile-name" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{profile.name}</h2>
            <span className="profile-badge-vip" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', margin: 0 }}>
              V.I.P
            </span>
          </div>
          <span className="profile-email" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile.email}</span>
        </div>
      </div>

      {/* Account Settings List */}
      <div className="profile-settings-card section-card" style={{ marginBottom: 0 }}>
        <h3 className="profile-settings-title">
          Account Settings
        </h3>

        <div className="settings-list-container">
          {[
            { id: 'edit-profile', label: 'Edit Profile Details', desc: 'Change email, phone, and name' },
            { id: 'payment', label: 'Payment Options', desc: 'Manage saved credit cards & receipts' },
            { id: 'preferences', label: 'Lounge Preferences', desc: 'Favorite coffees, wash settings, and barbers' },
            { id: 'notifications', label: 'Notification Settings', desc: 'SMS, push notifications, and email alerts' }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="settings-item-row"
              onClick={() => handleOpenModal(item.id)}
            >
              <div className="settings-item-info">
                <h4 className="settings-item-label">{item.label}</h4>
                <p className="settings-item-desc">{item.desc}</p>
              </div>
              <span className="settings-item-arrow">›</span>
            </div>
          ))}

          {/* Theme Mode Toggle Row */}
          <div 
            className="settings-item-row"
            onClick={toggleTheme}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div className="settings-item-info">
              <h4 className="settings-item-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Theme Mode</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '9999px', 
                  backgroundColor: 'rgba(255, 140, 26, 0.15)', 
                  color: '#FF8C1A', 
                  border: '1px solid rgba(255, 140, 26, 0.3)',
                  fontWeight: 800 
                }}>
                  {isDark ? '🌙 Dark' : '☀️ Light'}
                </span>
              </h4>
              <p className="settings-item-desc">Switch between Obsidian Dark and Clean Light mode</p>
            </div>
            
            <div style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              background: isDark ? '#FF8C1A' : 'rgba(156, 163, 175, 0.4)',
              position: 'relative',
              transition: 'background-color 0.25s ease-in-out',
              flexShrink: 0
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#FFFFFF',
                position: 'absolute',
                top: '3px',
                left: isDark ? '23px' : '3px',
                transition: 'left 0.25s ease-in-out',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-actions-box" style={{ marginTop: 0 }}>
        <button 
          className="profile-signout-btn" 
          onClick={() => {
            alert('Logout successful (demonstration only).');
            navigate('/');
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Modal Sub-views - Rendered via React Portal under document.body for full-screen backdrop coverage */}
      {createPortal(
        <AnimatePresence>
          {activeModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(35, 31, 29, 0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem'
            }} onClick={() => setActiveModal(null)}>
              
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                style={{
                  background: 'linear-gradient(135deg, #FAF9F6 0%, #F5F2EB 100%)',
                  width: '90%',
                  maxWidth: '400px',
                  borderRadius: '1.5rem',
                  padding: '2rem 1.5rem',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                  border: '1px solid var(--border-color)',
                  position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button 
                  onClick={() => setActiveModal(null)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(35,31,29,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  ✕
                </button>

                {/* Modal Content */}
                {activeModal === 'edit-profile' && renderEditProfile()}
                {activeModal === 'payment' && renderPaymentOptions()}
                {activeModal === 'preferences' && renderPreferences()}
                {activeModal === 'notifications' && renderNotifications()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
