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
  addedVia,
  imageUrl
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
    // A newer photo replaces the old one; a blank never wipes an existing one.
    if (imageUrl) existing.imageUrl = String(imageUrl).trim();
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
    imageUrl: imageUrl ? String(imageUrl).trim() : '',
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

// The photo of a car is saved on every record that carries the plate -- the
// registry, the owner's profile, sales/bookings and membership passes -- so each
// screen can show it without a join. Failure here must never fail a save.
const syncVehicleImage = async (plateNumber, imageUrl) => {
  const url = String(imageUrl || '').trim();
  const plateNorm = normalizePlate(plateNumber);
  if (!url || !plateNorm) return;
  try {
    const Booking = require('../models/Booking');
    const OfflineSale = require('../models/OfflineSale');
    const MembershipPass = require('../models/MembershipPass');
    const User = require('../models/User');
    const matches = (p) => normalizePlate(p) === plateNorm;
    // Narrows the scan to documents whose plate could match, ignoring separators.
    const plateRx = new RegExp(plateNorm.split('').join('[^A-Za-z0-9]*'), 'i');

    await RegisteredVehicle.updateMany({ plateNormalized: plateNorm }, { $set: { imageUrl: url } });

    // Embedded arrays are matched on the normalised plate in JS because stored
    // plates carry whatever separators the operator typed.
    const patchDocs = async (Model, filterKey) => {
      const docs = await Model.find({ [`${filterKey}.plateNumber`]: plateRx }).select(filterKey);
      for (const d of docs) {
        let changed = false;
        for (const v of d[filterKey] || []) {
          if (matches(v.plateNumber) && v.imageUrl !== url) {
            v.imageUrl = url;
            changed = true;
          }
        }
        if (changed) await d.save({ validateBeforeSave: false });
      }
    };
    await patchDocs(Booking, 'vehicles');
    await patchDocs(OfflineSale, 'vehicles');
    await patchDocs(User, 'vehicles');

    const passes = await MembershipPass.find({ isDeleted: { $ne: true }, boundVehicles: plateRx });
    for (const pass of passes) {
      if (!(pass.boundVehicles || []).some((b) => plateRx.test(b))) continue;
      const others = (pass.vehicleImages || []).filter((x) => !matches(x.plateNumber));
      pass.vehicleImages = [...others, { plateNumber: String(plateNumber).toUpperCase().trim(), imageUrl: url }];
      await pass.save({ validateBeforeSave: false });
    }
  } catch (err) {
    console.warn('Could not sync vehicle image:', err.message);
  }
};

module.exports = { upsertRegisteredVehicle, tryUpsertRegisteredVehicle, syncVehicleImage };
