function formatVehicleName(brand = '', model = '', defaultName = 'Vehicle') {
  const b = (brand || '').trim();
  const m = (model || '').trim();

  if (!b && !m) return defaultName;
  if (!b) return m;
  if (!m) return b;
  if (b.toLowerCase() === m.toLowerCase()) return m;
  if (m.toLowerCase().startsWith(b.toLowerCase())) return m;
  if (b.toLowerCase().endsWith(m.toLowerCase())) return b;

  return `${b} ${m}`;
}

module.exports = { formatVehicleName };
