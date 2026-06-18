export function validateTime(timeStr: string, label = 'Time') {
  const trimmed = timeStr ? timeStr.trim() : '';
  if (!trimmed) return { isValid: false, formatted: '', error: `${label} is required.` };
  const timeRegex = /^\d{1,2}[:;]\d{2}$/;
  if (!timeRegex.test(trimmed)) return { isValid: false, formatted: trimmed, error: `${label} must be numbers separated by : or ; (e.g. 05:45)` };
  const parts = trimmed.split(/[:;]/);
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || hours < 0 || hours > 23) return { isValid: false, formatted: trimmed, error: `${label} hour must be 0-23.` };
  if (isNaN(minutes) || minutes < 0 || minutes > 59) return { isValid: false, formatted: trimmed, error: `${label} minute must be 00-59.` };
  const normalized = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
  return { isValid: true, formatted: normalized };
}

export function validateEmail(emailStr: string) {
  if (!emailStr) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailStr.trim());
}

export function validatePhone(phoneStr: string) {
  if (!phoneStr) return true;
  const phoneRegex = /^[0-9+\s()\-]{7,20}$/;
  return phoneRegex.test(phoneStr.trim());
}

export function validateCoordinates(lat: any, lng: any) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) return { isValid: false, latNum: 0, lngNum: 0, error: 'Latitude must be between -90 and 90' };
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) return { isValid: false, latNum: 0, lngNum: 0, error: 'Longitude must be between -180 and 180' };
  return { isValid: true, latNum, lngNum };
}
