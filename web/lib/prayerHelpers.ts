// Ported from mobile/src/utils/prayerHelpers.ts
export function getHijriDate(): string {
  const today = new Date();
  let day = today.getDate();
  let month = today.getMonth() + 1;
  let year = today.getFullYear();

  if (year < 1900) return '14 Ramadan 1447';

  let jd = 0;
  if (month < 3) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = Math.floor(a / 4);
  const c = 2 - a + b;
  const e = Math.floor(365.25 * (year + 4716));
  const f = Math.floor(30.6001 * (month + 1));
  jd = c + day + e + f - 1524.5;

  const epoch = 1948439.5;
  const cycle = 10631;
  const cycleDays = 354.367;
  const cycleYears = 30;

  const daysSinceEpoch = jd - epoch;
  const cycleNumber = Math.floor(daysSinceEpoch / cycle);
  let daysInCycle = daysSinceEpoch % cycle;

  let hijriYear = Math.floor(daysInCycle / cycleDays) + cycleNumber * cycleYears + 1;
  let daysInYear = Math.floor(daysInCycle % cycleDays);

  if (daysInYear < 0) {
    daysInYear += 354;
    hijriYear -= 1;
  }

  const hijriMonths = [
    'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhu al-Qi'dah", "Dhu al-Hijjah"
  ];

  let hijriMonthIdx = 0;
  let daysRemaining = daysInYear;
  const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  for (let i = 0; i < 12; i++) {
    const len = monthLengths[i];
    if (daysRemaining <= len) {
      hijriMonthIdx = i;
      break;
    }
    daysRemaining -= len;
  }

  const hijriDay = Math.floor(daysRemaining) || 1;
  const hijriMonth = hijriMonths[hijriMonthIdx];
  return `${hijriDay} ${hijriMonth} ${Math.floor(hijriYear)} AH`;
}

interface TimePair {
  adhan: string;
  iqamah: string;
}

interface Timetable {
  sunrise: string;
  fajr: TimePair;
  dhuhr: TimePair;
  asr: TimePair;
  maghrib: TimePair;
  isha: TimePair;
}

export interface NextPrayerInfo {
  name: string;
  type: 'Adhan' | 'Iqamah';
  time: string;
  secondsRemaining: number;
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

export function getNextPrayer(timetable: Timetable): NextPrayerInfo | null {
  if (!timetable) return null;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  const prayers = [
    { name: 'Fajr', times: timetable.fajr },
    { name: 'Dhuhr', times: timetable.dhuhr },
    { name: 'Asr', times: timetable.asr },
    { name: 'Maghrib', times: timetable.maghrib },
    { name: 'Isha', times: timetable.isha }
  ];

  for (const prayer of prayers) {
    const adhanMins = timeToMinutes(prayer.times.adhan);
    const iqamahMins = timeToMinutes(prayer.times.iqamah);

    if (currentMinutes < adhanMins) {
      const diffMins = adhanMins - currentMinutes;
      const secondsRemaining = diffMins * 60 - currentSeconds;
      return { name: prayer.name, type: 'Adhan', time: prayer.times.adhan, secondsRemaining };
    }
    if (currentMinutes < iqamahMins) {
      const diffMins = iqamahMins - currentMinutes;
      const secondsRemaining = diffMins * 60 - currentSeconds;
      return { name: prayer.name, type: 'Iqamah', time: prayer.times.iqamah, secondsRemaining };
    }
  }

  const minsToMidnight = (24 * 60) - currentMinutes;
  const tomorrowFajrMins = timeToMinutes(timetable.fajr.adhan);
  const secondsRemaining = (minsToMidnight + tomorrowFajrMins) * 60 - currentSeconds;
  return { name: 'Fajr', type: 'Adhan', time: timetable.fajr.adhan, secondsRemaining };
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
