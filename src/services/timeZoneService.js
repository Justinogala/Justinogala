
import { format, toZonedTime } from 'date-fns-tz';

export const timeZoneService = {
  detectUserTimeZone: () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  getAllTimeZones: () => {
    // A simplified list of common timezones for the dropdown
    return [
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Australia/Sydney",
      "Pacific/Auckland"
    ].sort();
  },

  convertTime: (date, fromZone, toZone) => {
    // This is a simplified mock conversion. 
    // Real implementation would use date-fns-tz fully, but for this env we might rely on standard Date
    // logic or assumes date objects are passed.
    try {
      const d = new Date(date);
      return d.toLocaleString('en-US', { timeZone: toZone });
    } catch (e) {
      console.error("Timezone conversion error", e);
      return date;
    }
  },

  formatForZone: (date, zone, formatStr = 'yyyy-MM-dd HH:mm') => {
    try {
      // Mocking format with zone
      return new Date(date).toLocaleString('en-US', { timeZone: zone });
    } catch (e) {
      return new Date(date).toLocaleString();
    }
  }
};
