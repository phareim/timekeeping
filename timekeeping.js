#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .version('1.0.0')
  .description('A simple CLI for timekeeping')
  .option('-h, --hours <number>', 'Number of hours to log', parseFloat)
  .option('-p, --project <name>', 'Project name')
  .option('-d, --date [date]', 'Date in MM.DD or YYYY.MM.DD format')
  .action((options) => {
    if (!options.hours || !options.project) {
      console.error('Both --hours and --project are required.');
      process.exit(1);
    }

    const date = options.date ? parseDate(options.date) : new Date();
    if (!date) {
      console.error('Invalid date format. Please use MM.DD or YYYY.MM.DD.');
      process.exit(1);
    }

    logTime(options.project, options.hours, date);
  });

program.parse(process.argv);

function parseDate(dateStr) {
  const dateRegex = /^(?:\d{2}\.\d{2}|\d{4}\.\d{2}\.\d{2})$/;
  if (!dateRegex.test(dateStr)) {
    return null;
  }

  let year, month, day;
  if (dateStr.length === 5) {
    [month, day] = dateStr.split('.').map(Number);
    year = new Date().getFullYear();
  } else {
    [year, month, day] = dateStr.split('.').map(Number);
  }

  // Adjust month for JavaScript Date (0-indexed)
  month -= 1;

  return new Date(year, month, day);
}

function logTime(project, hours, date) {
  const dataPath = path.join(__dirname, 'timekeeping.json');
  let timeData = {};

  if (fs.existsSync(dataPath)) {
    try {
      timeData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (error) {
      console.error('Error reading timekeeping data:', error);
      process.exit(1);
    }
  }

  const dateString = date.toISOString().split('T');
  if (!timeData[project]) {
    timeData[project] = {};
  }

  if (!timeData[project][dateString]) {
    timeData[project][dateString] = 0;
  }

  timeData[project][dateString] += hours;

  try {
    fs.writeFileSync(dataPath, JSON.stringify(timeData, null, 2), 'utf8');
    console.log(`Logged ${hours} hours to project "${project}" on ${dateString}.`);
  } catch (error) {
    console.error('Error writing timekeeping data:', error);
    process.exit(1);
  }
}