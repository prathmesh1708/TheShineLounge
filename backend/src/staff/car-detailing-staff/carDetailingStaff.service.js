const CarDetailingStaffModel = require('./carDetailingStaff.model');

// In-memory staff list for testing
const staffDb = [];

const addStaff = async (staffData) => {
  const staff = new CarDetailingStaffModel(staffData);
  staffDb.push(staff);
  return staff;
};

const fetchStaffById = async (id) => {
  return staffDb.find(s => s.id === id);
};

const modifyStaff = async (id, staffData) => {
  const index = staffDb.findIndex(s => s.id === id);
  if (index === -1) return null;
  staffDb[index] = { ...staffDb[index], ...staffData };
  return staffDb[index];
};

const removeStaff = async (id) => {
  const index = staffDb.findIndex(s => s.id === id);
  if (index === -1) return false;
  staffDb.splice(index, 1);
  return true;
};

const fetchStaffList = async () => {
  return staffDb;
};

module.exports = {
  addStaff,
  fetchStaffById,
  modifyStaff,
  removeStaff,
  fetchStaffList
};
