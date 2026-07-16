// Mock database model for CarDetailing
class CarDetailingModel {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.serviceType = 'car-detailing';
    this.customerName = data.customerName;
    this.dateTime = data.dateTime || new Date().toISOString();
    this.status = data.status || 'pending';
    this.notes = data.notes || '';
  }
}

module.exports = CarDetailingModel;
