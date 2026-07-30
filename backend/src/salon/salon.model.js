// Model for Salon Bookings and Services
class SalonModel {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.serviceType = 'salon';
    this.name = data.name || data.customerName || 'Salon Service';
    this.category = data.category || 'Hair Cut';
    this.price = Number(data.price) || 0;
    this.duration = data.duration || '30 mins';
    this.rating = Number(data.rating) || 4.9;
    this.reviewsCount = Number(data.reviewsCount) || 10;
    this.tagline = data.tagline || '';
    this.description = data.description || '';
    this.image = data.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600';
    this.features = data.features || [];
    this.inclusions = data.inclusions || [];
    this.status = data.status || 'active';
    this.icon = data.icon || '💇‍♂️';
    this.customerName = data.customerName || '';
    this.dateTime = data.dateTime || new Date().toISOString();
    this.notes = data.notes || '';
  }
}

module.exports = SalonModel;

