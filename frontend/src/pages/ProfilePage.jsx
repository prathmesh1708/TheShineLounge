import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="profile-page-container app-mobile-dashboard" style={{ gap: '0.75rem' }}>
      
      {/* Profile Card */}
      <div className="profile-header-card section-card" style={{ marginBottom: 0 }}>
        <div className="profile-avatar-circle">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className="profile-user-info">
          <h2 className="profile-name">Vally Guest</h2>
          <span className="profile-email">vally.guest@shinelounge.com</span>
        </div>

        <span className="profile-badge-vip">
          V.I.P Member
        </span>
      </div>

      {/* Account Settings List */}
      <div className="profile-settings-card section-card" style={{ marginBottom: 0 }}>
        <h3 className="profile-settings-title">
          Account Settings
        </h3>

        <div className="settings-list-container">
          {[
            { label: 'Edit Profile Details', desc: 'Change email, phone, and name' },
            { label: 'Payment Options', desc: 'Manage saved credit cards & receipts' },
            { label: 'Lounge Preferences', desc: 'Favorite coffees, wash settings, and barbers' },
            { label: 'Notification Settings', desc: 'SMS, push notifications, and email alerts' }
          ].map((item, idx) => (
            <div key={idx} className="settings-item-row">
              <div className="settings-item-info">
                <h4 className="settings-item-label">{item.label}</h4>
                <p className="settings-item-desc">{item.desc}</p>
              </div>
              <span className="settings-item-arrow">›</span>
            </div>
          ))}
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

    </div>
  );
}
