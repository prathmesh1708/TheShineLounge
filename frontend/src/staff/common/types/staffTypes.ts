// TypeScript Interfaces for The Shine Lounge Staff Panel

export interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
  variant?: string;
  color: string;
  fuelType: 'Petrol' | 'Diesel' | 'EV' | 'CNG';
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  vehicles: Vehicle[];
  loyaltyPoints: number;
  totalSpent: number;
  segment: 'Active Member' | 'High-Value VIP' | 'Regular Customer' | 'New Customer' | 'Expired Member';
  joinDate: string;
  lastVisit: string;
  notes?: string;
}

export interface StaffUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'Super Admin' | 'Branch Manager' | 'Car Wash Lead' | 'Detailing Specialist' | 'Dog Groomer' | 'Café Manager' | 'Drive-Thru Lead' | 'Salon Master' | 'Cashier';
  department: 'Car Wash' | 'Car Detailing' | 'Dog Wash' | 'Café' | 'Drive-Through Café' | 'Men\'s Salon' | 'Management' | 'Operations';
  serviceKey: 'car-wash' | 'car-detailing' | 'dog-wash' | 'cafe' | 'drive-through-cafe' | 'salon' | 'global';
  avatar: string;
  salary: string;
  status: 'Active' | 'On Shift' | 'On Break' | 'Off Duty';
  leaveBalance: {
    casual: number;
    sick: number;
    earned: number;
  };
}

export interface BookingJob {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  serviceKey: string;
  serviceName: string;
  planName: string;
  vehicleNo: string;
  vehicleModel: string;
  staffId: string;
  staffName: string;
  date: string;
  timeSlot: string;
  amount: number;
  gst: number;
  total: number;
  paymentMode: 'UPI' | 'Card' | 'Cash' | 'Membership Pass';
  paymentStatus: 'Paid' | 'Pending';
  status: string; // e.g. "Pending", "Vehicle Received", "Work Started", "Completed"
  stepIndex: number;
  notes?: string;
  photos?: string[];
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'Present' | 'Late' | 'Absent' | 'Half-Day';
  photoUrl?: string;
  location: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  type: 'Casual' | 'Sick' | 'Earned';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
}

export interface InvoiceItem {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  vehicleNo: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  paymentMethod: 'UPI' | 'Card' | 'Cash' | 'Split Payment';
  status: 'Paid' | 'Pending';
  createdAt: string;
  staffName: string;
}
