// Model for CarDetailing Bookings and Services
class CarDetailingModel {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.serviceType = 'car-detailing';
    this.name = data.name || data.customerName || 'Car Detailing Treatment';
    this.category = data.category || 'Paint Protection';
    this.price = Number(data.price) || 0;
    this.duration = data.duration || '60 mins';
    this.rating = Number(data.rating) || 5.0;
    this.reviewsCount = Number(data.reviewsCount) || 10;
    this.tagline = data.tagline || '';
    this.description = data.description || '';
    this.image = data.image || 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800';
    this.features = data.features || [];
    this.inclusions = data.inclusions || [];
    this.status = data.status || 'active';
    this.customerName = data.customerName || '';
    this.dateTime = data.dateTime || new Date().toISOString();
    this.notes = data.notes || '';
  }
}

module.exports = CarDetailingModel;

