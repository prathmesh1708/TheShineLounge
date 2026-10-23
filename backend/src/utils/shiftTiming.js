// Converts 'HH:mm' 24-hour time to 12-hour format with AM/PM (e.g., '09:00' -> '09:00 AM', '18:00' -> '06:00 PM')
const formatTimeTo12Hour = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const match = timeStr.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${strHours}:${minutes} ${ampm}`;
};

// Returns a normalized { shiftStartTime, shiftEndTime, shiftTiming } object
const normalizeShiftTiming = (data = {}) => {
  let startTime = data.shiftStartTime || '';
  let endTime = data.shiftEndTime || '';

  // If already full timing string like '09:00 AM - 06:00 PM' and no start/end provided, extract if possible
  if ((!startTime || !endTime) && data.shiftTiming) {
    const parts = data.shiftTiming.split('-').map(p => p.trim());
    if (parts.length === 2) {
      if (!startTime) startTime = parse12HourTo24(parts[0]) || '09:00';
      if (!endTime) endTime = parse12HourTo24(parts[1]) || '18:00';
    }
  }

  if (!startTime) startTime = '09:00';
  if (!endTime) endTime = '18:00';

  const formattedStart = formatTimeTo12Hour(startTime) || startTime;
  const formattedEnd = formatTimeTo12Hour(endTime) || endTime;
  const shiftTiming = `${formattedStart} - ${formattedEnd}`;

  return {
    shiftStartTime: startTime,
    shiftEndTime: endTime,
    shiftTiming
  };
};

// Converts '09:00 AM' -> '09:00', '06:00 PM' -> '18:00'
const parse12HourTo24 = (time12Str) => {
  if (!time12Str) return '';
  const match = time12Str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12Str;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3].toUpperCase();
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${hours < 10 ? '0' + hours : hours}:${minutes}`;
};

module.exports = {
  formatTimeTo12Hour,
  normalizeShiftTiming,
  parse12HourTo24
};
