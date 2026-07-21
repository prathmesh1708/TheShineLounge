import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockStaffMembers, mockAssignedJobs, mockCustomers, mockAttendanceRecords, mockStaffNotifications } from '../data/staffMockData';

const StaffContext = createContext();

export function StaffProvider({ children }) {
  // Currently Logged-in Staff (Default to STF-03 Rohan Deshmukh - Car Wash Lead)
  const [currentStaff, setCurrentStaff] = useState(mockStaffMembers[2]);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // State
  const [jobs, setJobs] = useState(mockAssignedJobs);
  const [customers, setCustomers] = useState(mockCustomers);
  const [attendance, setAttendance] = useState(mockAttendanceRecords);
  const [notifications, setNotifications] = useState(mockStaffNotifications);
  
  // Check-In State
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInPhoto, setCheckInPhoto] = useState('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80');
  const [checkInTime, setCheckInTime] = useState('08:45 AM');

  // Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPurpose, setCameraPurpose] = useState('check-in'); // 'check-in' | 'job-photo' | 'inspection'
  const [onCaptureCallback, setOnCaptureCallback] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Staff Login Handler
  const loginStaff = (employeeId, password) => {
    const found = mockStaffMembers.find(s => s.employeeId.toLowerCase() === employeeId.toLowerCase());
    if (found) {
      setCurrentStaff(found);
      setIsAuthenticated(true);
      showToast(`Welcome back, ${found.name}! (${found.role})`, 'success');
      return true;
    } else {
      // Fallback: Login with default
      setCurrentStaff(mockStaffMembers[2]);
      setIsAuthenticated(true);
      showToast(`Logged in as ${mockStaffMembers[2].name} (${mockStaffMembers[2].role})`, 'success');
      return true;
    }
  };

  // Logout Handler
  const logoutStaff = () => {
    setIsAuthenticated(false);
    showToast('Logged out successfully', 'info');
  };

  // Check In Handler with Photo
  const processCheckIn = (photoUrl) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIsCheckedIn(true);
    setCheckInPhoto(photoUrl);
    setCheckInTime(timeNow);

    const newRecord = {
      id: `ATT-${Date.now()}`,
      staffId: currentStaff.id,
      date: new Date().toISOString().split('T')[0],
      checkInTime: timeNow,
      checkOutTime: 'In Progress',
      status: 'Present',
      photoUrl: photoUrl,
      location: '19.0760° N, 72.8777° E (Thane Branch)'
    };

    setAttendance(prev => [newRecord, ...prev]);
    showToast('Check-In Successful! Selfie & Location Logged.', 'success');
  };

  // Check Out Handler
  const processCheckOut = () => {
    setIsCheckedIn(false);
    showToast('Checked-Out Successfully. Shift logged.', 'info');
  };

  // Update Job Status Stepper
  const updateJobStatus = (jobId, newStatus, newStepIndex, notes = '', photoUrl = null) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        const updatedPhotos = photoUrl ? [...(job.photos || []), photoUrl] : job.photos;
        return {
          ...job,
          status: newStatus,
          stepIndex: newStepIndex,
          notes: notes || job.notes,
          photos: updatedPhotos
        };
      }
      return job;
    }));
    showToast(`Job ${jobId} updated to "${newStatus}"`, 'success');
  };

  // Add New Customer
  const addCustomer = (customerData) => {
    const newCust = {
      id: `CUST-${Date.now().toString().slice(-3)}`,
      ...customerData,
      totalSpent: 0,
      loyaltyPoints: 100,
      joinDate: new Date().toISOString().split('T')[0],
      lastVisit: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast(`Registered new customer ${customerData.name}`, 'success');
    return newCust;
  };

  // Filter Jobs Relevant to Logged In Staff Role
  const staffJobs = jobs.filter(job => {
    if (currentStaff.serviceKey === 'global' || currentStaff.role === 'Super Admin' || currentStaff.role === 'Branch Manager' || currentStaff.role === 'Cashier') {
      return true;
    }
    return job.serviceKey === currentStaff.serviceKey || job.staffId === currentStaff.id;
  });

  return (
    <StaffContext.Provider
      value={{
        currentStaff,
        setCurrentStaff,
        isAuthenticated,
        loginStaff,
        logoutStaff,
        jobs: staffJobs,
        allJobs: jobs,
        updateJobStatus,
        customers,
        addCustomer,
        attendance,
        isCheckedIn,
        checkInPhoto,
        checkInTime,
        processCheckIn,
        processCheckOut,
        notifications,
        isCameraOpen,
        setIsCameraOpen,
        cameraPurpose,
        setCameraPurpose,
        onCaptureCallback,
        setOnCaptureCallback,
        toast,
        showToast
      }}
    >
      {children}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-all animate-bounce"
          style={{ backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#1e4a7e' : '#e07b2a' }}>
          <span>{toast.message}</span>
        </div>
      )}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  return useContext(StaffContext);
}
