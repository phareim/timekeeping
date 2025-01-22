const { getDatabase, ref, get, child } = require('firebase/database');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.timekeeping', 'config.json');

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading config file:', error);
  }
  return {};
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function parseDate(dateStr) {
  const dateRegex = /^(?:\d{2}\.\d{2}|\d{4}\.\d{2}\.\d{2})$/;
  if (!dateRegex.test(dateStr)) {
    return null;
  }

  let year, month, day;
  if (dateStr.length === 5) {
    [month, day] = dateStr.split(".").map(Number);
    year = new Date().getFullYear();
  } else {
    [year, month, day] = dateStr.split(".").map(Number);
  }

  // Adjust month for JavaScript Date (0-indexed)
  month -= 1;

  return new Date(year, month, day);
}

function getWeekdaysInMonth(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  let weekdays = 0;

  for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdays++;
    }
  }

  return weekdays;
}

async function getTimeData(database) {
  const snapshot = await database.ref('timeData').get();
  return snapshot.exists() ? snapshot.val() : null;
}

function exitGracefully() {
  // Gi Firebase tid til å fullføre operasjoner før vi avslutter
  setTimeout(() => {
    process.exit(0);
  }, 100);
}

module.exports = {
  getDaysInMonth,
  parseDate,
  getWeekdaysInMonth,
  getTimeData,
  exitGracefully,
  getConfig
}; 