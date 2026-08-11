import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

import { useTheme } from '../common/context/ThemeContext';
import { useAuth } from '../common/context/AuthContext';
import apiClient from '../common/utils/apiClient';
import CustomerAuthModal from '../common/components/CustomerAuthModal';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, isAuthenticated, isCustomer, isStaff, logout, updateUser } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'edit-profile', 'payment', 'preferences', 'notifications'

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // User state initialized from AuthContext
  const isRealCustomer = isAuthenticated && (user?.role === 'user' || user?.role === 'customer' || (!user?.role && user?.role !== 'staff' && user?.role !== 'admin'));

  const [profile, setProfile] = useState({
    name: user ? (user.fullName || user.name || 'Customer') : 'Guest Explorer',
    email: user ? (user.email || '') : 'guest@theshinelounge.com',
    phone: user ? (user.mobile || '') : ''
  });

  // Keep profile state perfectly synced with AuthContext user updates
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.fullName || user.name || 'Customer',
        email: user.email || '',
        phone: user.mobile || ''
      });
    } else {
      setProfile({
        name: 'Guest Explorer',
        email: 'guest@theshinelounge.com',
        phone: ''
      });
    }
  }, [user]);

  const [preferences, setPreferences] = useState({
    coffee: 'Nitro Vanilla Sweet Cream',
    wash: 'Shine Monthly Pass',
    barber: 'Marcus Sterling'
  });

  const [notifications, setNotifications] = useState({
    sms: true,
    push: false,
    email: true,
    expiryNotif: true,
    reminders: true,
    promoOffers: false
  });

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [invoiceModalItem, setInvoiceModalItem] = useState(null);

  const [dbService, setDbService] = useState(null);

  useEffect(() => {
    const fetchMyBookings = async () => {
      if (!isAuthenticated) {
        setLoadingBookings(false);
        return;
      }
      try {
        let userEmail = (user?.email || profile?.email || '').toLowerCase();
        const stored = localStorage.getItem('tsl_user');
        if (stored) {
          try { userEmail = (JSON.parse(stored).email || userEmail).toLowerCase(); } catch (e) {}
        }

        const res = await apiClient.get('/bookings');
        if (res.data && res.data.bookings) {
          const allB = res.data.bookings;
          const filtered = userEmail
            ? allB.filter(b => (b.customerEmail || '').toLowerCase() === userEmail)
            : [];
          setBookings(filtered);
        }
      } catch (err) {
        console.warn('Could not load user bookings on profile page:', err.message);
      } finally {
        setLoadingBookings(false);
      }
    };

    const fetchServiceData = async () => {
      try {
        const cached = localStorage.getItem('tsl_car_wash_service');
        if (cached) {
          setDbService(JSON.parse(cached));
        }
        const res = await apiClient.get('/services/car-wash');
        if (res.data && res.data.service) {
          setDbService(res.data.service);
        }
      } catch (err) {
        console.warn('Could not load service details for limit computation');
      }
    };

    fetchMyBookings();
    fetchServiceData();

    // Listen to live real-time updates from Admin panel updates
    const handleLiveUpdate = (e) => {
      if (e?.detail) {
        if (e.detail.slug === 'car-wash') {
          setDbService(e.detail);
        }
      } else {
        const cached = localStorage.getItem('tsl_car_wash_service');
        if (cached) {
          try { 
            const parsed = JSON.parse(cached);
            if (parsed.slug === 'car-wash' || !parsed.slug) {
              setDbService(parsed);
            }
          } catch (err) {}
        }
      }
      fetchMyBookings();
    };

    window.addEventListener('storage', handleLiveUpdate);
    window.addEventListener('tsl_service_updated', handleLiveUpdate);

    return () => {
      window.removeEventListener('storage', handleLiveUpdate);
      window.removeEventListener('tsl_service_updated', handleLiveUpdate);
    };
  }, [isAuthenticated, user]);

  const [cards] = useState([
    { brand: 'Visa', last4: '4820', expiry: '12/28', type: 'Primary' },
    { brand: 'Mastercard', last4: '9901', expiry: '06/29', type: 'Backup' }
  ]);

  const [receipts] = useState([
    { id: 'REC-2026-9028', date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), amount: '₹18.00', service: 'Car Wash' },
    { id: 'REC-2026-4412', date: new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), amount: '₹35.00', service: 'Men\'s Salon' }
  ]);

  // Temp form states
  const [tempProfile, setTempProfile] = useState({ ...profile });
  const [tempPrefs, setTempPrefs] = useState({ ...preferences });
  const [tempNotifs, setTempNotifs] = useState({ ...notifications });

  // Feedback & Support State
  const [feedbackTab, setFeedbackTab] = useState('new'); // 'new' or 'history'
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({
    category: 'General Feedback',
    rating: 5,
    message: '',
    name: user ? (user.fullName || user.name || '') : '',
    email: user ? (user.email || '') : '',
    phone: user ? (user.mobile || '') : ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchMyFeedbacks = async () => {
    try {
      const email = user ? (user.email || profile.email || '') : (profile.email || '');
      const res = await apiClient.get(`/users/my-feedback?email=${encodeURIComponent(email)}`);
      if (res.data && res.data.success) {
        setMyFeedbacks(res.data.feedbacks || []);
      } else {
        const localData = JSON.parse(localStorage.getItem('tsl_user_feedbacks') || '[]');
        setMyFeedbacks(localData);
      }
    } catch (e) {
      const localData = JSON.parse(localStorage.getItem('tsl_user_feedbacks') || '[]');
      setMyFeedbacks(localData);
    }
  };

  const handleOpenModal = (modalType) => {
    setTempProfile({ ...profile });
    setTempPrefs({ ...preferences });
    setTempNotifs({ ...notifications });
    if (modalType === 'feedback-support') {
      setFeedbackForm({
        category: 'General Feedback',
        rating: 5,
        message: '',
        name: user ? (user.fullName || user.name || profile.name || '') : (profile.name || ''),
        email: user ? (user.email || profile.email || '') : (profile.email || ''),
        phone: user ? (user.mobile || profile.phone || '') : (profile.phone || '')
      });
      setFeedbackSubmitted(false);
      setFeedbackTab('new');
      fetchMyFeedbacks();
    }
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

  const activeMembership = bookings.find(b => 
    b.packageName && 
    (b.packageName.toLowerCase().includes('membership') || b.packageName.toLowerCase().includes('pass'))
  );

  const getDates = (membership) => {
    if (!membership) return { start: '', expiry: '' };
    
    let start;
    const dateStr = membership.date || '';
    if (dateStr && !dateStr.includes('July 18') && !isNaN(Date.parse(dateStr))) {
      start = new Date(dateStr);
    } else {
      start = new Date();
    }

    const isYearly = (membership.packageName || '').toLowerCase().includes('yearly');
    const expiry = new Date(start);
    if (isYearly) {
      expiry.setFullYear(start.getFullYear() + 1);
    } else {
      expiry.setDate(start.getDate() + 30);
    }
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return {
      start: start.toLocaleDateString('en-US', options),
      expiry: expiry.toLocaleDateString('en-US', options)
    };
  };

  const matchedMembership = (activeMembership && dbService?.memberships)
    ? dbService.memberships.find(
        m => {
          const mName = (m.name || m.title || '').toLowerCase().trim();
          const passName = (activeMembership.packageName || '').toLowerCase().trim();
          return mName && (passName.includes(mName) || mName.includes(passName));
        }
      )
    : (dbService?.memberships && dbService.memberships.length > 0 ? dbService.memberships[0] : null);

  const washesLimit = activeMembership 
    ? (matchedMembership?.visitLimit !== undefined
        ? (matchedMembership.visitLimit === 999 ? 'Unlimited' : Number(matchedMembership.visitLimit) || 30)
        : ((activeMembership.packageName || '').toLowerCase().includes('yearly') ? 'Unlimited' : 30))
    : (dbService?.memberships && dbService.memberships[0]?.visitLimit ? dbService.memberships[0].visitLimit : 30);

  const washSessions = bookings.filter(b => 
    b.serviceKey === 'car-wash' && 
    (!b.packageName || !b.packageName.toLowerCase().includes('membership'))
  );

  const washesUsedCount = washSessions.length;

  const handleRenewMembership = async () => {
    if (!activeMembership) return;
    const confirmRenew = window.confirm(`Confirm renewal of your ${activeMembership.packageName}? Amount: ₹${activeMembership.price} (Incl. GST) will be charged to your primary Visa card ending in 4820.`);
    if (!confirmRenew) return;

    try {
      // Simulate booking transaction
      const payload = {
        bookingId: `B-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceKey: activeMembership.serviceKey || 'car-wash',
        serviceName: activeMembership.serviceName || 'Car Wash',
        packageName: activeMembership.packageName,
        price: activeMembership.price,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        timeSlot: '09:00 AM - 09:30 AM',
        customerName: profile.name,
        customerEmail: profile.email,
        vehicleNo: 'TSL-3000',
        vehicleType: 'Tesla Model 3'
      };
      
      const res = await apiClient.post('/bookings', payload);
      if (res.data && res.data.success) {
        alert('🎉 Membership renewed successfully! Receipt generated.');
        // Refresh bookings
        const refresh = await apiClient.get('/bookings');
        if (refresh.data && refresh.data.bookings) {
          const uEmail = (profile.email || user?.email || '').toLowerCase().trim();
          setBookings(refresh.data.bookings.filter(b => (b.customerEmail || '').toLowerCase().trim() === uEmail));
        }
      }
    } catch (err) {
      alert('Error renewing membership: ' + err.message);
    }
  };

  const handleUpgradeMembership = async () => {
    if (!activeMembership) return;
    const confirmUpgrade = window.confirm(`Confirm upgrade to Yearly Elite Membership? Amount: ₹19,999 (plus 18% GST) will be charged to your primary Visa card.`);
    if (!confirmUpgrade) return;

    try {
      const payload = {
        bookingId: `B-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceKey: 'car-wash',
        serviceName: 'Car Wash',
        packageName: 'Yearly Membership',
        price: 23599, // 19999 + 18% GST
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        timeSlot: '09:00 AM - 09:30 AM',
        customerName: profile.name,
        customerEmail: profile.email,
        vehicleNo: 'TSL-3000',
        vehicleType: 'Tesla Model 3'
      };
      
      const res = await apiClient.post('/bookings', payload);
      if (res.data && res.data.success) {
        alert('🎉 Upgraded to Yearly Elite Membership successfully!');
        // Refresh bookings
        const refresh = await apiClient.get('/bookings');
        if (refresh.data && refresh.data.bookings) {
          const uEmail = (profile.email || user?.email || '').toLowerCase().trim();
          setBookings(refresh.data.bookings.filter(b => (b.customerEmail || '').toLowerCase().trim() === uEmail));
        }
      }
    } catch (err) {
      alert('Error upgrading membership: ' + err.message);
    }
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
          { key: 'email', label: 'Email Invoices', desc: 'Receive GST invoices and transaction history' },
          { key: 'expiryNotif', label: 'Receive Membership Expiry Notification', desc: 'Alerts when your membership plan is expiring soon' },
          { key: 'reminders', label: 'Receive Renewal Reminders', desc: 'Reminders to renew your active subscriptions' },
          { key: 'promoOffers', label: 'Receive Promotional Offers', desc: 'Exclusive deals, discounts, and menu highlights' }
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

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.message || !feedbackForm.message.trim()) {
      alert('Please write your feedback or message before submitting.');
      return;
    }
    setSubmittingFeedback(true);
    try {
      const res = await apiClient.post('/users/feedback', feedbackForm);
      if (res.data && res.data.success) {
        setFeedbackSubmitted(true);
        fetchMyFeedbacks();
      } else {
        setFeedbackSubmitted(true);
        fetchMyFeedbacks();
      }
    } catch (err) {
      console.warn('Feedback submission notice:', err.message);
      setFeedbackSubmitted(true);
      fetchMyFeedbacks();
    } finally {
      try {
        const existing = JSON.parse(localStorage.getItem('tsl_user_feedbacks') || '[]');
        existing.unshift({
          ...feedbackForm,
          timestamp: new Date().toISOString(),
          id: 'FB-' + Date.now(),
          status: 'Pending'
        });
        localStorage.setItem('tsl_user_feedbacks', JSON.stringify(existing));
      } catch (e) {}
      setSubmittingFeedback(false);
    }
  };

  const renderFeedbackSupport = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Feedback & Help Support
          </h3>
          <button
            type="button"
            onClick={fetchMyFeedbacks}
            style={{ fontSize: '0.7rem', color: '#148F87', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            🔄 Refresh
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          We value your experience! Share your feedback or view admin replies to your support tickets.
        </p>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(35,31,29,0.04)', padding: '0.25rem', borderRadius: '0.75rem' }}>
        <button
          type="button"
          onClick={() => { setFeedbackTab('new'); setFeedbackSubmitted(false); }}
          style={{
            flex: 1,
            padding: '0.4rem 0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: feedbackTab === 'new' ? '#ffffff' : 'transparent',
            color: feedbackTab === 'new' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: feedbackTab === 'new' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          ✍️ New Message
        </button>
        <button
          type="button"
          onClick={() => { setFeedbackTab('history'); fetchMyFeedbacks(); }}
          style={{
            flex: 1,
            padding: '0.4rem 0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: feedbackTab === 'history' ? '#ffffff' : 'transparent',
            color: feedbackTab === 'history' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: feedbackTab === 'history' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          💬 My Tickets ({myFeedbacks.length})
        </button>
      </div>

      {feedbackTab === 'history' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {myFeedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
              No support tickets found yet.
            </div>
          ) : (
            myFeedbacks.map((item, idx) => (
              <div key={item._id || item.id || idx} style={{ padding: '0.85rem', borderRadius: '0.85rem', border: '1px solid rgba(35,31,29,0.08)', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-orange)', backgroundColor: 'rgba(255, 140, 26, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '0.4rem' }}>
                    {item.category || 'Feedback'}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '0.4rem',
                    backgroundColor: item.status === 'Replied' || item.status === 'Resolved' ? 'rgba(20, 143, 135, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: item.status === 'Replied' || item.status === 'Resolved' ? '#148F87' : '#d97706'
                  }}>
                    {item.status || 'Pending'}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, margin: 0 }}>
                  "{item.message}"
                </p>

                {item.replyMessage ? (
                  <div style={{ marginTop: '0.35rem', padding: '0.65rem 0.75rem', borderRadius: '0.65rem', backgroundColor: 'rgba(20, 143, 135, 0.08)', border: '1px solid rgba(20, 143, 135, 0.2)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#148F87', display: 'block', marginBottom: '0.15rem' }}>
                      👑 Admin Response ({item.repliedBy || 'Admin Support'}):
                    </span>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600, margin: 0 }}>
                      "{item.replyMessage}"
                    </p>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.1rem' }}>
                    ⏳ Awaiting response from lounge admin team...
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      ) : feedbackSubmitted ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 143, 135, 0.1)',
            color: '#148F87',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            fontWeight: 800
          }}>
            ✓
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Thank You!</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '280px', margin: 0, lineHeight: 1.4 }}>
            Your feedback & support request has been submitted. Our team will review your message promptly.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => setFeedbackSubmitted(false)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl flex-1 transition-all"
            >
              Write Another Message
            </button>
            <button
              type="button"
              onClick={() => { setFeedbackTab('history'); fetchMyFeedbacks(); }}
              className="form-submit-btn flex-1"
              style={{ width: 'auto', marginTop: 0 }}
            >
              View My Tickets
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Category */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="form-label">Category</label>
            <select
              value={feedbackForm.category}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
              className="form-select"
            >
              <option>General Feedback</option>
              <option>Help & Support Request</option>
              <option>Service Quality / Experience</option>
              <option>Bug or Technical Issue</option>
              <option>Feature Suggestion</option>
            </select>
          </div>

          {/* Interactive Rating */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="form-label">Rate Your Experience</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.6rem',
                    cursor: 'pointer',
                    padding: '0 0.1rem',
                    transition: 'transform 0.15s ease',
                    opacity: star <= feedbackForm.rating ? 1 : 0.25,
                    transform: star <= feedbackForm.rating ? 'scale(1.1)' : 'scale(1)'
                  }}
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  ⭐
                </button>
              ))}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-orange)', marginLeft: '0.25rem' }}>
                {feedbackForm.rating === 5 && 'Excellent 🌟'}
                {feedbackForm.rating === 4 && 'Very Good 😊'}
                {feedbackForm.rating === 3 && 'Average 😐'}
                {feedbackForm.rating === 2 && 'Needs Improvement 🙁'}
                {feedbackForm.rating === 1 && 'Poor 😠'}
              </span>
            </div>
          </div>

          {/* Feedback / Support Message */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="form-label">Your Message / Feedback *</label>
            <textarea
              rows={3}
              value={feedbackForm.message}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
              className="form-input"
              placeholder="Write your feedback, questions, or details about the support you need..."
              style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', fontSize: '0.85rem' }}
              required
            />
          </div>

          {/* Contact Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.25rem', borderTop: '1px dashed rgba(35,31,29,0.1)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contact Information</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Name</label>
                <input
                  type="text"
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Email</label>
                <input
                  type="email"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  placeholder="Your Email"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingFeedback}
            className="form-submit-btn"
            style={{ width: '100%', marginTop: '0.25rem', opacity: submittingFeedback ? 0.7 : 1 }}
          >
            {submittingFeedback ? 'Sending Feedback...' : '💬 Submit Feedback & Support'}
          </button>
        </form>
      )}
    </div>
  );

  const renderWashHistory = () => {

    const washBookings = bookings.filter(b => 
      b.serviceKey === 'car-wash' && 
      (!b.packageName || !b.packageName.toLowerCase().includes('membership'))
    );
    return (
      <div className="space-y-4 text-xs text-left">
        <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2">Complete Wash History</h3>
        {washBookings.length === 0 ? (
          <div className="text-center py-6 text-gray-400 font-bold">No wash sessions recorded yet.</div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {washBookings.map((wash) => (
              <div key={wash._id || wash.bookingId} className="bg-white border rounded-xl p-3 flex justify-between items-center shadow-2xs">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-xs">{wash.packageName || wash.serviceName}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{wash.date} • {wash.timeSlot}</p>
                  <p className="text-[9px] text-amber-600 font-bold mt-1">Specialist: {wash.assignedStaffName || 'Assigned Agent'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  wash.status === 'Completed' || wash.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {wash.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPaymentHistory = () => {
    const membershipPayments = bookings.filter(b => 
      b.packageName && 
      (b.packageName.toLowerCase().includes('membership') || b.packageName.toLowerCase().includes('pass'))
    );
    return (
      <div className="space-y-4 text-xs text-left">
        <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2">Membership Payment History</h3>
        {membershipPayments.length === 0 ? (
          <div className="text-center py-6 text-gray-400 font-bold">No membership purchases recorded.</div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {membershipPayments.map((pay) => (
              <div key={pay._id || pay.bookingId} className="bg-white border rounded-xl p-3 flex justify-between items-center shadow-2xs">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-xs">{pay.packageName}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Purchased on {pay.date}</p>
                  <p className="text-[10px] text-emerald-700 font-black mt-1">₹{pay.price} (Incl. GST)</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceModalItem(pay);
                    setActiveModal('invoice');
                  }}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[9px] rounded-lg transition-all"
                >
                  📄 Invoice
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGSTInvoice = () => {
    if (!invoiceModalItem) return null;
    const item = invoiceModalItem;
    const totalAmount = Number(item.price || 2499);
    const taxRate = 0.18;
    const taxableAmount = Math.round(totalAmount / (1 + taxRate));
    const gstAmount = totalAmount - taxableAmount;
    const cgst = Math.round(gstAmount / 2);
    const sgst = Math.round(gstAmount / 2);
    return (
      <div className="space-y-4 text-xs text-left" id="gst-invoice-content">
        <div className="flex justify-between items-start border-b pb-3">
          <div>
            <h3 className="font-black text-xs text-gray-900 tracking-wider">TAX INVOICE</h3>
            <p className="text-[9px] text-gray-400 mt-1">Invoice: INV-{item._id ? item._id.substring(18) : '2026-9028'}</p>
            <p className="text-[9px] text-gray-400">Date: {item.date}</p>
          </div>
          <div className="text-right">
            <h4 className="font-black text-amber-600 text-xs tracking-tighter">THE SHINE LOUNGE</h4>
            <p className="text-[8px] text-gray-400">GSTIN: 27AAAAA1111A1Z1</p>
            <p className="text-[8px] text-gray-400">Maharashtra, IN</p>
          </div>
        </div>

        <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 space-y-0.5">
          <p className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Billed To</p>
          <p className="font-bold text-gray-800 text-[10px]">{profile.name}</p>
          <p className="text-gray-500 text-[9px]">{profile.email} • {profile.phone}</p>
        </div>

        <table className="w-full text-left border-collapse text-[9px]">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 font-bold">
              <th className="py-2 px-1">Description</th>
              <th className="py-2 px-1 text-center">HSN/SAC</th>
              <th className="py-2 px-1 text-right">Taxable</th>
              <th className="py-2 px-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b font-semibold text-gray-700">
              <td className="py-2 px-1">{item.packageName || item.packageName || 'Monthly Membership'}</td>
              <td className="py-2 px-1 text-center">998714</td>
              <td className="py-2 px-1 text-right">₹{taxableAmount}</td>
              <td className="py-2 px-1 text-right">₹{taxableAmount}</td>
            </tr>
          </tbody>
        </table>

        <div className="space-y-1.5 text-[9px] font-bold text-gray-700 ml-auto max-w-[180px] border-t pt-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Taxable Value:</span>
            <span>₹{taxableAmount}</span>
          </div>
          <div className="flex justify-between text-gray-400 font-medium">
            <span>CGST (9%):</span>
            <span>₹{cgst}</span>
          </div>
          <div className="flex justify-between text-gray-400 font-medium">
            <span>SGST (9%):</span>
            <span>₹{sgst}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 font-black text-gray-900 text-xs">
            <span>Invoice Total:</span>
            <span className="text-amber-600">₹{totalAmount}</span>
          </div>
        </div>

        <div className="pt-2 flex gap-2 no-print">
          <button 
            type="button"
            onClick={() => window.print()}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-center select-none active:scale-[0.98] transition-all"
          >
            🖨️ Print / Save GST PDF
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page-container app-mobile-dashboard" style={{ gap: '0.75rem', position: 'relative' }}>
      
      {/* Staff / Admin Session Warning Banners */}
      {user && user.role === 'staff' && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between text-xs shadow-xs mb-2">
          <div>
            <span className="font-extrabold text-amber-900 block text-xs">⚠️ Signed in as Staff Member ({user.email})</span>
            <p className="text-amber-700 text-[11px] mt-0.5">Staff accounts use the Staff Portal. Sign out to log in as a customer or browse as guest.</p>
          </div>
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-xs transition-all text-xs flex-shrink-0"
          >
            Sign Out Staff
          </button>
        </div>
      )}

      {user && user.role === 'admin' && (
        <div className="bg-purple-50 border border-purple-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs shadow-xs mb-2 gap-3">
          <div>
            <span className="font-extrabold text-purple-900 block text-xs">👑 Signed in as Super Admin ({user.email})</span>
            <p className="text-purple-700 text-[11px] mt-0.5">You are currently in Admin Mode. Click below to switch back to your Customer Account (Mohit) or sign out.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                const cToken = localStorage.getItem('tsl_customer_token');
                const cUser = localStorage.getItem('tsl_customer_user');
                if (cToken && cUser) {
                  localStorage.setItem('tsl_token', cToken);
                  localStorage.setItem('tsl_user', cUser);
                  window.location.reload();
                } else {
                  logout();
                  window.location.href = '/login';
                }
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-xs transition-all text-xs"
            >
              Switch to Customer
            </button>
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold rounded-xl transition-all text-xs"
            >
              Sign Out Admin
            </button>
          </div>
        </div>
      )}

      {/* Profile Header Card for Logged-In Customer */}
      {isRealCustomer && (
        <div className="profile-header-card section-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.15rem 1.25rem' }}>
          <div className="profile-avatar-circle" style={{ width: '48px', height: '48px', flexShrink: 0, boxShadow: '0 4px 12px rgba(193, 154, 91, 0.15)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div className="profile-user-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start', textAlign: 'left', flexGrow: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 className="profile-name" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {user?.fullName || user?.name || profile.name}
              </h2>
              <span className="profile-badge-vip" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', margin: 0 }}>
                V.I.P
              </span>
            </div>
            <span className="profile-email" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {user?.email || profile.email}
            </span>
          </div>

          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
          >
            Logout
          </button>
        </div>
      )}

      {/* Dynamic Active Membership Dashboard Section */}
      {activeMembership ? (
        <div className="section-card border-amber-500/40 shadow-md" style={{ marginBottom: 0, padding: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1.15rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', tracking: '0.05em', color: 'var(--primary-orange)', backgroundColor: 'rgba(255, 140, 26, 0.08)', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 140, 26, 0.15)' }}>
                Active Subscription
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-main)' }}>
                {activeMembership.packageName}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="text-xs text-gray-700 font-bold block">ID: {activeMembership.bookingId || 'B-9028'}</span>
              <span className="text-xs text-emerald-700 font-extrabold block">Paid: ₹{activeMembership.price}</span>
            </div>
          </div>

          {/* Membership Info Grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
            {/* Start and Expiry Dates */}
            <div className="bg-slate-100/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Validity Period</span>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600 font-bold">Started:</span>
                <span className="text-slate-900 font-bold">{getDates(activeMembership).start}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600 font-bold">Expires:</span>
                <span className="text-red-700 font-black">{getDates(activeMembership).expiry}</span>
              </div>
            </div>

            {/* Washes Meter */}
            <div className="bg-slate-100/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] text-slate-700 font-extrabold uppercase tracking-wider block mb-1">Wash Usage Meter</span>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600 font-bold">Total Washes Used:</span>
                <span className="text-amber-800 font-black">
                  {washesLimit === 'Unlimited' ? `${washesUsedCount} (Unlimited)` : `${Math.min(washesUsedCount, Number(washesLimit) || 4)} of ${washesLimit || 4} washes`}
                </span>
              </div>
              {/* Progress bar */}
              {washesLimit !== 'Unlimited' ? (
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(Math.min(washesUsedCount, Number(washesLimit) || 4) / (Number(washesLimit) || 4)) * 100}%` }}
                  />
                </div>
              ) : (
                <div className="text-[10px] text-emerald-700 font-black mt-1">
                  ✨ Elite Unlimited Pass Active
                </div>
              )}
            </div>
          </div>

          {/* Membership Actions Row */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 justify-between items-center text-[10px] font-bold">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRenewMembership}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                🔄 Renew
              </button>
              {!(activeMembership.packageName || '').toLowerCase().includes('yearly') && (
                <button
                  type="button"
                  onClick={handleUpgradeMembership}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold rounded-xl transition-all"
                >
                  ⚡ Upgrade Plan
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleOpenModal('wash-history')}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 border rounded-xl hover:bg-gray-50 transition-all"
              >
                🚗 Wash Log
              </button>
              <button
                type="button"
                onClick={() => handleOpenModal('payment-history')}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 border rounded-xl hover:bg-gray-50 transition-all"
              >
                💳 Payments
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoiceModalItem(activeMembership);
                  setActiveModal('invoice');
                }}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition-all"
              >
                📄 GST Invoice
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="section-card bg-amber-50/20 border border-dashed border-amber-300 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left" style={{ marginBottom: 0 }}>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">Become a Lounge Member</h4>
            <p className="text-[11px] text-gray-500 font-semibold leading-relaxed max-w-sm">
              Save up to 45% with our Monthly or Yearly Pass. Enjoy unlimited washes, ceramic protection, and premium complimentary coffee.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/car-wash')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs select-none active:scale-[0.98] transition-all whitespace-nowrap"
          >
            Explore Plans
          </button>
        </div>
      )}

      {/* Account Settings List */}
      <div className="profile-settings-card section-card" style={{ marginBottom: 0 }}>
        <h3 className="profile-settings-title">
          Account Settings
        </h3>

        <div className="settings-list-container">
          {[
            { id: 'edit-profile', label: 'Edit Profile Details', desc: 'Change email, phone, and name' },
            { id: 'notifications', label: 'Notification Settings', desc: 'SMS, push notifications, and email alerts' },
            { id: 'feedback-support', label: 'Feedback & Help Support', desc: 'Share feedback, report an issue, or ask for help' }
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
        {isAuthenticated ? (
          <button 
            className="profile-signout-btn" 
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
          >
            Sign Out
          </button>
        ) : (
          <button 
            className="profile-signout-btn" 
            style={{ color: '#148F87', borderColor: '#148F87' }}
            onClick={() => navigate('/login')}
          >
            🔐 Sign In
          </button>
        )}
      </div>

      {/* Customer Auth Modal for Guest Sign In / Register */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          window.location.reload();
        }}
      />

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
                {activeModal === 'feedback-support' && renderFeedbackSupport()}
                {activeModal === 'wash-history' && renderWashHistory()}
                {activeModal === 'payment-history' && renderPaymentHistory()}
                {activeModal === 'invoice' && renderGSTInvoice()}

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
