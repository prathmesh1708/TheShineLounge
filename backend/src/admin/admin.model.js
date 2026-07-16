class AdminModel {
  constructor(data) {
    this.id = data.id || 'admin-super';
    this.name = data.name || 'Super Admin';
    this.email = data.email || 'admin@theshinelounge.com';
    this.role = 'super-admin';
    this.permissions = ['manage_services', 'manage_staff', 'view_reports'];
  }
}

module.exports = AdminModel;
