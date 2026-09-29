// Fills Staff.monthlySalary (whole rupees) from the old free-text `salary`
// field, e.g. "₹35,000 / month" -> 35000, and rewrites the text in one format.
//
// Only staff whose monthlySalary is still 0 are touched, so running it twice is
// harmless and it never overwrites an amount an admin has already set. Staff
// whose text holds no readable amount are listed at the end for manual entry.
//
//   npm run backfill:salary            (dry run: prints what would change)
//   npm run backfill:salary -- --apply (writes to MongoDB)

require('dotenv').config();
const mongoose = require('mongoose');
const { MONGO_URI } = require('../common/config/env');
const Staff = require('../models/Staff');
const { parseSalaryText, formatSalaryText } = require('./salaryAmount');

const APPLY = process.argv.includes('--apply');

const run = async () => {
  const conn = await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`);
  console.log(APPLY ? 'Mode: APPLY (writing changes)\n' : 'Mode: DRY RUN (pass --apply to write)\n');

  const candidates = await Staff.find({ $or: [{ monthlySalary: { $exists: false } }, { monthlySalary: 0 }] });

  let updated = 0;
  const unreadable = [];

  for (const staff of candidates) {
    const text = String(staff.salary || '').trim();
    if (!text) continue;

    const amount = parseSalaryText(text);
    if (!amount) {
      unreadable.push(`${staff.fullName} <${staff.email}>: "${text}"`);
      continue;
    }

    console.log(`${staff.fullName.padEnd(28)} "${text}" -> ${amount}`);
    if (APPLY) {
      await Staff.updateOne({ _id: staff._id }, { monthlySalary: amount, salary: formatSalaryText(amount) });
    }
    updated += 1;
  }

  console.log(`\n${APPLY ? 'Updated' : 'Would update'} ${updated} of ${candidates.length} staff without a numeric salary.`);
  if (unreadable.length) {
    console.log('\nCould not read an amount for these staff; set their salary from the admin panel:');
    unreadable.forEach((line) => console.log(`  - ${line}`));
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
