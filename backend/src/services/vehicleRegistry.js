const RegisteredVehicle = require('../models/RegisteredVehicle');
const { normalizePlate } = require('../utils/plateNormalizer');

// Single place that writes the registeredvehicles collection.
//
// The admin "Registered Vehicles" screen reads this collection, and it used to
// be written only when an admin attached a vehicle to a customer by hand. Every
// other route a plate can arrive by -- a customer booking, a POS offline sale --
// left nothing behind, so the screen sat empty while the bookings it claims to
// summarise plainly had plates on them. Both paths now call this.
//
// Upsert on the normalised plate: the same car turning up on a second booking
// should enrich the existing row, never create a twin.
const upsertRegisteredVehicle = async ({
  plateNumber,
  brand,
  model,
  category,
  year,
  ownerName,
  ownerEmail,
  ownerPhone,
  customerId,
  addedVia
} = {}) => {
  const cleanPlate = String(plateNumber || '').toUpperCase().trim();
  if (!cleanPlate) return null;

  const plateNorm = normalizePlate(cleanPlate);
  if (!plateNorm) return null;

  const existing = await RegisteredVehicle.findOne({
    plateNormalized: plateNorm,
    isDeleted: { $ne: true }
  });

  let cleanBrand = (brand || '').trim();
  let cleanModel = (model || '').trim();

  // If brand and model are identical, avoid duplicate storage
  if (cleanBrand && cleanModel && cleanBrand.toLowerCase() === cleanModel.toLowerCase()) {
    cleanBrand = '';
  }

  if (existing) {
    // Only fill gaps. A booking carrying a blank vehicleType must not wipe the
    // brand someone typed in on the customer record.
    if (cleanBrand) existing.brand = cleanBrand;
    if (cleanModel) existing.model = cleanModel;
    if (existing.brand && existing.model && existing.brand.toLowerCase() === existing.model.toLowerCase()) {
      existing.brand = '';
    }
    if (category) existing.category = category;
    if (year) existing.year = year;
    if (ownerName && existing.ownerName === 'Customer') existing.ownerName = ownerName;
    if (ownerEmail && !existing.ownerEmail) existing.ownerEmail = ownerEmail;
    if (ownerPhone && !existing.ownerPhone) existing.ownerPhone = ownerPhone;
    if (customerId && !existing.customerId) existing.customerId = customerId;
    await existing.save();
    return existing;
  }

  return RegisteredVehicle.create({
    vehicleId: `VEH-${cleanPlate.replace(/[^A-Z0-9]/g, '')}`,
    plateNumber: cleanPlate,
    plateNormalized: plateNorm,
    brand: cleanBrand,
    model: cleanModel,
    category: category || 'Car',
    year: year || '',
    ownerName: ownerName || 'Customer',
    ownerEmail: (ownerEmail || '').toLowerCase().trim(),
    ownerPhone: ownerPhone || '',
    customerId: customerId || null,
    addedVia: addedVia || 'staff'
  });
};

// Registering a vehicle must never be the reason a booking or a sale fails to
// save. The money movement is the important part; the registry is derived data.
const tryUpsertRegisteredVehicle = async (payload) => {
  try {
    return await upsertRegisteredVehicle(payload);
  } catch (err) {
    console.warn('Could not register vehicle:', err.message);
    return null;
  }
};

module.exports = { upsertRegisteredVehicle, tryUpsertRegisteredVehicle };
