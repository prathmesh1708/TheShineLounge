// Mock database model for CarWash
class CarWashModel {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.serviceType = 'car-wash';
    this.customerName = data.customerName;
    this.dateTime = data.dateTime || new Date().toISOString();
    this.status = data.status || 'pending';
    this.notes = data.notes || '';
  }
}

module.exports = CarWashModel;
