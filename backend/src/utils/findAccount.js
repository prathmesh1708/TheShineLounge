const User = require('../models/User');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');

// One definition of "where a login can live".
//
// Accounts are spread over three collections: customers in `users`, the super
// admin in `admins`, and -- since staff were split out -- employees in `staff`.
// The auth endpoints each walked their own User -> Admin chain and none of them
// learned about Staff, so a staff member created through the admin UI was
// written to a collection that nothing authenticating ever read. They got
// "Invalid email or password" against a row that was sitting right there.
//
// Order matters only for the rare address that exists in more than one
// collection; User first preserves the previous behaviour.
const MODELS = [Admin, Staff, User];

const findAccountByEmail = async (email, { withPassword = false } = {}) => {
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!cleanEmail) return null;

  for (const Model of MODELS) {
    const query = Model.findOne({ email: cleanEmail, isDeleted: { $ne: true } });
    if (withPassword) query.select('+password');
    const found = await query;
    if (found) return found;
  }
  return null;
};

const findAccountById = async (id) => {
  if (!id) return null;

  for (const Model of MODELS) {
    const found = await Model.findOne({ _id: id, isDeleted: { $ne: true } });
    if (found) return found;
  }
  return null;
};

module.exports = { findAccountByEmail, findAccountById };
