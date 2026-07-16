class CarWashStaffModel {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.role = data.role || 'technician';
    this.shiftTiming = data.shiftTiming || '9 AM - 5 PM';
    this.serviceId = data.serviceId || 'car-wash';
    this.status = data.status || 'active';
  }
}

module.exports = CarWashStaffModel;
