import React, { createContext, useContext, useState, useEffect } from 'react';
import serviceApi from '../../../common/services/serviceApi';
import apiClient from '../../../common/utils/apiClient';
import {
  initialDashboardStats,
  revenueTrendData,
  serviceRevenueData,
  paymentModeData,
  initialServices,
  initialBanners,
  initialMemberships,
  initialStaff,
  initialBookings,
  initialCustomers,
  initialInventory,
  initialCoupons,
  initialNotifications
} from '../data/adminMockData';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // Global State
  const [stats, setStats] = useState(initialDashboardStats);
  const [services, setServices] = useState(initialServices);
  const [banners, setBanners] = useState(initialBanners);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [staffList, setStaffList] = useState(initialStaff);
  const [bookings, setBookings] = useState(initialBookings);
  const [customers, setCustomers] = useState(initialCustomers);
  const [inventory, setInventory] = useState(initialInventory);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [notifications, setNotifications] = useState(initialNotifications);

  // Business Settings State
  const [settings, setSettings] = useState({
    businessName: 'The Shine Lounge',
    tagline: 'Premium Multi-Service Automotive & Lifestyle Lounge',
    address: 'Plot 42, Senapati Bapat Marg, Lower Parel, Mumbai 400013',
    contactPhone: '+91 98200 99999',
    contactEmail: 'admin@theshinelounge.com',
    workingHours: '08:00 AM - 10:00 PM (Mon - Sun)',
    gstRate: 18,
    currency: 'INR (₹)',
    invoicePrefix: 'TSL-INV-2026-',
    backupFrequency: 'Daily (02:00 AM IST)'
  });

  // Simple Toast System
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchBookingsList = async () => {
    try {
      const res = await apiClient.get('/bookings');
      if (res.data && res.data.bookings) {
        const mapped = res.data.bookings.map(b => ({
          _id: b._id,
          id: b.bookingId,
          customerName: b.customerName,
          serviceKey: b.serviceKey,
          serviceName: b.serviceName,
          plan: b.packageName,
          timeSlot: `${b.date} | ${b.timeSlot}`,
          total: b.price,
          status: b.status,
          staffAssigned: b.assignedStaffName || 'Not Assigned',
          assignedStaffId: b.assignedStaffId,
          stepIndex: b.stepIndex,
          notes: b.notes,
          photos: b.photos
        }));

        // Merge with initialBookings mock seeds
        const merged = [...mapped, ...initialBookings.filter(ib => !mapped.some(m => m.id === ib.id))];
        setBookings(merged);
      }
    } catch (err) {
      console.warn('Could not fetch bookings list:', err.message);
    }
  };

  useEffect(() => {
    fetchBookingsList();

    // Poll for live booking updates from staff every 5 seconds
    const interval = setInterval(fetchBookingsList, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- CRUD ACTIONS ---

  // 1. Services & Plans
  const toggleServiceStatus = async (id) => {
    setServices(prev => prev.map(s => (s.id === id || s.key === id || s._id === id) ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
    showToast('Service status updated');

    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === id || s.slug === id || s.serviceName.toLowerCase().includes(String(id).toLowerCase()));
        if (target) {
          await serviceApi.toggleServiceStatus(target._id);
        }
      }
    } catch (err) {
      console.warn('API sync status error:', err.message);
    }
  };

  const updateServicePrice = async (id, newPrice) => {
    const numPrice = Number(newPrice);
    setServices(prev => prev.map(s => (s.id === id || s.key === id || s._id === id) ? { ...s, price: numPrice } : s));
    showToast('Service price updated successfully');

    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === id || s.slug === id || s.slug === 'car-wash' || s.serviceName.toLowerCase().includes(String(id).toLowerCase()));
        if (target) {
          const updatedPricing = [...(target.pricing || [])];
          if (updatedPricing.length > 0) {
            updatedPricing[0].price = numPrice;
          } else {
            updatedPricing.push({ title: 'Single Wash', price: numPrice });
          }
          await serviceApi.updateService(target._id, { pricing: updatedPricing });
        }
      }
    } catch (err) {
      console.warn('API sync price error:', err.message);
    }
  };

  const addServicePlan = async (serviceId, newPlan) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId || s.key === serviceId) {
        return {
          ...s,
          plans: [...(s.plans || []), { id: `p-${Date.now()}`, ...newPlan }]
        };
      }
      return s;
    }));
    showToast('New sub-service plan added!');

    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === serviceId || s.slug === serviceId || s.serviceName.toLowerCase().includes(String(serviceId).toLowerCase()));
        if (target) {
          await serviceApi.addPlan(target._id, {
            name: newPlan.name,
            price: Number(newPlan.price),
            description: newPlan.description || '',
            duration: newPlan.billing || 'per service'
          });
        }
      }
    } catch (err) {
      console.warn('API sync add plan error:', err.message);
    }
  };

  const deleteServicePlan = async (serviceId, planId) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId || s.key === serviceId) {
        return {
          ...s,
          plans: (s.plans || []).filter(p => p.id !== planId && p._id !== planId)
        };
      }
      return s;
    }));
    showToast('Plan removed', 'error');

    try {
      const res = await serviceApi.getServices();
      if (res.success && res.services) {
        const target = res.services.find(s => s._id === serviceId || s.slug === serviceId || s.serviceName.toLowerCase().includes(String(serviceId).toLowerCase()));
        if (target) {
          await serviceApi.deletePlan(target._id, planId);
        }
      }
    } catch (err) {
      console.warn('API sync delete plan error:', err.message);
    }
  };

  // 2. Banners
  const addBanner = (newBanner) => {
    setBanners(prev => [
      ...prev,
      { id: `ban-${Date.now()}`, ...newBanner, status: 'active', order: prev.length + 1 }
    ]);
    showToast('Promotional banner added successfully!');
  };

  const toggleBannerStatus = (id) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
    showToast('Banner visibility toggled');
  };

  const updateBanner = (id, updatedFields) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...updatedFields } : b));
    showToast('Promotional banner updated successfully!');
  };

  const deleteBanner = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    showToast('Banner deleted', 'error');
  };

  // 3. Notifications
  const composeNotification = (newNotif) => {
    setNotifications(prev => [
      {
        id: `NOTIF-${Date.now().toString().slice(-4)}`,
        ...newNotif,
        sentAt: newNotif.scheduleLater ? `Scheduled (${newNotif.scheduledDate})` : 'Just now',
        readRate: newNotif.scheduleLater ? '0%' : '100%',
        status: newNotif.scheduleLater ? 'Scheduled' : 'Sent'
      },
      ...prev
    ]);
    showToast(newNotif.scheduleLater ? 'Notification scheduled successfully!' : 'Broadcast notification sent!');
  };

  // 4. Memberships
  const updateMembershipStatus = (id, newStatus) => {
    setMemberships(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    showToast(`Membership status changed to ${newStatus}`);
  };

  const renewMembership = (id) => {
    setMemberships(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: 'Active',
          washesUsed: 0,
          startDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
        };
      }
      return m;
    }));
    showToast('Membership renewed for 30 days!');
  };

  // 5. Bookings
  const updateBookingStatus = async (id, newStatus) => {
    // 1. Optimistically update local state
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    showToast(`Booking ${id} status updated to ${newStatus}`);

    // 2. Call PUT /bookings/:id in the backend
    try {
      const match = bookings.find(b => b.id === id);
      if (match && match._id) {
        await apiClient.put(`/bookings/${match._id}`, { status: newStatus });
        fetchBookingsList();
      }
    } catch (err) {
      console.warn('Error updating booking status in backend:', err.message);
    }
  };

  const assignStaffToBooking = async (id, staffName) => {
    // Find the staff user object from the staffList to get their ID
    const staffUser = staffList.find(s => s.fullName === staffName || s.name === staffName || s.employeeId === staffName);
    const staffId = staffUser?.id || staffUser?._id || null;

    // 1. Optimistically update local state
    setBookings(prev => prev.map(b => b.id === id ? { ...b, staffAssigned: staffName, assignedStaffId: staffId } : b));
    showToast(`Assigned ${staffName} to booking ${id}`);

    // 2. Call PUT /bookings/:id in the backend
    try {
      const match = bookings.find(b => b.id === id);
      if (match && match._id) {
        await apiClient.put(`/bookings/${match._id}`, { 
          assignedStaffId: staffId, 
          assignedStaffName: staffName 
        });
        fetchBookingsList();
      }
    } catch (err) {
      console.warn('Error assigning staff in backend:', err.message);
    }
  };

  const addBooking = async (bookingData) => {
    const newId = `B-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const gstVal = Number((bookingData.amount * 0.18).toFixed(2));
    const totalVal = Number((bookingData.amount + gstVal).toFixed(2));
    
    // Save to backend DB
    try {
      const payload = {
        bookingId: newId,
        serviceKey: bookingData.serviceKey || 'car-wash',
        serviceName: bookingData.serviceName || 'Car Wash',
        packageName: bookingData.plan || 'Executive Wash',
        price: totalVal,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        timeSlot: bookingData.timeSlot || '02:00 PM - 02:30 PM',
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail || 'customer@example.com',
        vehicleNo: bookingData.vehicleNo || 'MH-01-AB-1234',
        vehicleType: bookingData.vehicleType || 'SUV'
      };

      await apiClient.post('/bookings', payload);
      fetchBookingsList();
      showToast(`New booking ${newId} created!`);
    } catch (err) {
      console.warn('Error creating booking in backend, using local fallback:', err.message);
      // Fallback local update
      setBookings(prev => [
        {
          id: newId,
          ...bookingData,
          gst: gstVal,
          total: totalVal,
          status: 'Pending',
          date: new Date().toISOString().split('T')[0]
        },
        ...prev
      ]);
      showToast(`New booking ${newId} created (local fallback)!`);
    }
  };

  // 6. Staff
  const addStaff = (newStaff) => {
    setStaffList(prev => [
      ...prev,
      {
        id: `STF-${(prev.length + 1).toString().padStart(2, '0')}`,
        ...newStaff,
        status: 'Active',
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: newStaff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      }
    ]);
    showToast('New staff member added!');
  };

  const toggleStaffStatus = (id) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s));
    showToast('Staff status updated');
  };

  // 7. Customers
  const addCustomer = (customerData) => {
    setCustomers(prev => [
      {
        id: `CUST-${(prev.length + 1).toString().padStart(3, '0')}`,
        ...customerData,
        segment: 'New Customer',
        totalSpent: 0,
        loyaltyPoints: 100,
        lastVisit: 'Just now',
        totalBookings: 0
      },
      ...prev
    ]);
    showToast('Customer profile registered');
  };

  // 8. Inventory
  const addInventoryItem = (item) => {
    setInventory(prev => [
      ...prev,
      {
        id: `INV-${Date.now().toString().slice(-3)}`,
        ...item,
        status: item.currentStock <= item.minStock ? 'Low Stock' : 'In Stock'
      }
    ]);
    showToast('Product added to inventory');
  };

  const updateStock = (id, changeQty) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const updatedQty = Math.max(0, item.currentStock + changeQty);
        return {
          ...item,
          currentStock: updatedQty,
          status: updatedQty <= item.minStock ? 'Low Stock' : 'In Stock'
        };
      }
      return item;
    }));
    showToast('Stock level updated');
  };

  // 9. Coupons
  const addCoupon = (coupon) => {
    setCoupons(prev => [
      ...prev,
      {
        id: `CPN-${(prev.length + 1).toString().padStart(2, '0')}`,
        ...coupon,
        usedCount: 0,
        status: 'Active'
      }
    ]);
    showToast(`Promo code ${coupon.code} created!`);
  };

  const toggleCouponStatus = (id) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Expired' : 'Active' } : c));
    showToast('Coupon status updated');
  };

  // 10. Settings Update
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Business & Tax settings saved!');
  };

  return (
    <AdminContext.Provider value={{
      stats,
      revenueTrendData,
      serviceRevenueData,
      paymentModeData,
      services,
      banners,
      memberships,
      staffList,
      bookings,
      customers,
      inventory,
      coupons,
      notifications,
      settings,
      toast,
      showToast,
      // Actions
      toggleServiceStatus,
      updateServicePrice,
      addServicePlan,
      deleteServicePlan,
      addBanner,
      toggleBannerStatus,
      updateBanner,
      deleteBanner,
      composeNotification,
      updateMembershipStatus,
      renewMembership,
      updateBookingStatus,
      assignStaffToBooking,
      addBooking,
      addStaff,
      toggleStaffStatus,
      addCustomer,
      addInventoryItem,
      updateStock,
      addCoupon,
      toggleCouponStatus,
      updateSettings
    }}>
      {children}
      {/* Toast Render */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#e07b2a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
