// Mock database model for Salon
class SalonModel {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.serviceType = 'salon';
    this.customerName = data.customerName;
    this.dateTime = data.dateTime || new Date().toISOString();
    this.status = data.status || 'pending';
    this.notes = data.notes || '';
  }
}

module.exports = SalonModel;
