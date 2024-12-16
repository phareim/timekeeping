#!/usr/bin/env node

const { Command } = require("commander");
const fs = require("fs");
const path = require("path");

const program = new Command();

program.version("1.0.0").description("A simple CLI for timekeeping");

program
  .command("log")
  .description("Log hours to a project")
  .option("-h, --hours <number>", "Number of hours to log", parseFloat)
  .option("-p, --project <name>", "Project name")
  .option("-d, --date [date]", "Date in MM.DD or YYYY.MM.DD format")
  .action((options) => {
    if (options.hours == null || !options.project) {
      console.error("Both --hours and --project are required.");
      process.exit(1);
    }

    const date = options.date ? parseDate(options.date) : new Date();
    if (!date) {
      console.error("Invalid date format. Please use MM.DD or YYYY.MM.DD.");
      process.exit(1);
    }

    logTime(options.project, options.hours, date);
  });

program
  .command("report")
  .description("Print the timekeeping report")
  .option("-m, --month <month>", "Month number (1-12) to show report for")
  .option("-c, --complete", "Show complete history for all time")
  .action((options) => {
    printReport(options.month, options.complete);
  });

program
  .command("summary")
  .description(
    "Print summary of dates in the current month with less than 7.5 hours logged"
  )
  .option("-m, --month <month>", "Month number (1-12) to show summary for")
  .action((options) => {
    printSummary(options.month);
  });

program.parse(process.argv);

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

function logTime(project, hours, date) {
  const dataPath = path.join(__dirname, "timekeeping.json");
  let timeData = {};

  if (fs.existsSync(dataPath)) {
    try {
      timeData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch (error) {
      console.error("Error reading timekeeping data:", error);
      process.exit(1);
    }
  }

  // Use local date components to format the date string
  const dateString = date.toLocaleDateString("en-CA"); // Formats date as YYYY-MM-DD

  if (!timeData[project]) {
    timeData[project] = {};
  }

  if (!timeData[project][dateString]) {
    timeData[project][dateString] = 0;
  }

  timeData[project][dateString] += hours;

  try {
    fs.writeFileSync(dataPath, JSON.stringify(timeData, null, 2), "utf8");
    console.log(
      `Logged ${hours} hours to project "${project}" on ${dateString}.`
    );
  } catch (error) {
    console.error("Error writing timekeeping data:", error);
    process.exit(1);
  }
}

function printReport(monthOption, showComplete) {
  const dataPath = path.join(__dirname, "timekeeping.json");
  if (!fs.existsSync(dataPath)) {
    console.log("No timekeeping data found.");
    return;
  }

  try {
    const timeData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedMonth = monthOption ? parseInt(monthOption) - 1 : now.getMonth();

    if (!showComplete && (selectedMonth < 0 || selectedMonth > 11)) {
      console.error("Invalid month. Please specify a month between 1 and 12.");
      return;
    }

    // Filter data based on selected month or show complete history
    const filteredData = {};
    for (const project in timeData) {
      filteredData[project] = {};
      for (const date in timeData[project]) {
        const entryDate = new Date(date);
        if (showComplete || 
            (entryDate.getMonth() === selectedMonth && 
             entryDate.getFullYear() === currentYear)) {
          filteredData[project][date] = timeData[project][date];
        }
      }
    }

    const periodText = showComplete 
      ? "Complete History" 
      : `${new Date(currentYear, selectedMonth, 1).toLocaleString("default", { month: "long" })} ${currentYear}`;

    const weekdaysInPeriod = showComplete 
      ? Object.keys(Object.values(filteredData)[0] || {}).length 
      : getWeekdaysInMonth(currentYear, selectedMonth);
    const totalBillableHours = weekdaysInPeriod * 7.5;

    // Calculate total logged hours for the period
    let totalLoggedHours = 0;
    for (const project in filteredData) {
      for (const date in filteredData[project]) {
        totalLoggedHours += filteredData[project][date];
      }
    }

    console.log(`\nTimekeeping Report for ${periodText}:`);
    console.log("===================\n");

    // Print project details
    for (const project in filteredData) {
      let projectTotal = 0;
      for (const date in filteredData[project]) {
        projectTotal += filteredData[project][date];
      }
      
      if (projectTotal > 0) {
        const billablePercentage = ((projectTotal / totalBillableHours) * 100).toFixed(2);
        const loggedPercentage = ((projectTotal / totalLoggedHours) * 100).toFixed(2);

        console.log(`Project: ${project}`);
        console.log("-------------------");
        console.log(`\x1b[33m  Total Hours:\t\t\t ${projectTotal.toFixed(1)} hours\x1b[0m`);
        console.log(`  Percentage of Billable Hours:\t ${billablePercentage}%`);
        console.log(`  Percentage of Logged Hours:\t ${loggedPercentage}%`);
        console.log();
      }
    }

    // Calculate billable percentage
    if (!showComplete) {
      const startOfMonth = new Date(currentYear, selectedMonth, 1);
      const now = new Date();
      const daysElapsed = selectedMonth === now.getMonth() 
        ? Math.floor((now - startOfMonth) / (1000 * 60 * 60 * 24)) + 1
        : getDaysInMonth(currentYear, selectedMonth);
      
      const weekdaysElapsed = Array.from({ length: daysElapsed })
        .map((_, i) => new Date(currentYear, selectedMonth, i + 1))
        .filter((date) => date.getDay() !== 0 && date.getDay() !== 6).length;
      
      const billableHoursSoFar = weekdaysElapsed * 7.5;
      const billablePercentageSoFar = ((totalLoggedHours / billableHoursSoFar) * 100).toFixed(2);

      console.log("===================");
      console.log(`Billable Percentage: ${billablePercentageSoFar}%`);
      console.log("===================\n");
    }
  } catch (error) {
    console.error("Error reading timekeeping data:", error);
  }
}

function printSummary(monthOption) {
  const dataPath = path.join(__dirname, "timekeeping.json");
  let timeData = {};

  if (fs.existsSync(dataPath)) {
    try {
      timeData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch (error) {
      console.error("Error reading timekeeping data:", error);
      return;
    }
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const selectedMonth = monthOption ? parseInt(monthOption) - 1 : now.getMonth(); // 0-based month

  if (selectedMonth < 0 || selectedMonth > 11) {
    console.error("Invalid month. Please specify a month between 1 and 12.");
    return;
  }

  const daysInMonth = getDaysInMonth(currentYear, selectedMonth);

  console.log("\n======================================");
  console.log(
    `Summary for ${new Date(currentYear, selectedMonth, 1).toLocaleString("default", {
      month: "long",
    })} ${currentYear}:`
  );
  console.log("======================================\n");
  let sumHours = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, selectedMonth, day);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

    // Format date as YYYY-MM-DD using local time
    const dateString = date.toLocaleDateString("en-CA");

    // Sum total hours for this date across all projects
    let totalHours = 0;
    let projects = "";
    for (const project in timeData) {
      if (timeData[project][dateString]) {
        totalHours += timeData[project][dateString];
        if (!projects.includes(project)) {
          if (projects.length > 0) {
            projects += ", ";
          }
          projects += `${project}(${timeData[project][dateString]})`;
        }
      }
    }

    // Determine the color based on the conditions
    let colorStart = "";
    let colorEnd = "\x1b[0m"; // Reset color

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Saturdays and Sundays in cyan
      colorStart = "\x1b[36m"; // Cyan text
    } else if (totalHours <= 0) {
      colorStart = "\x1b[31m"; // Red text
    } else if (totalHours < 7.5) {
      // Weekdays with less than 7.5 hours in yellow
      colorStart = "\x1b[33m"; // Yellow text
    } else if (totalHours > 7.5) {
      // Weekdays with less than 7.5 hours in yellow
      colorStart = "\x1b[32m"; // Green text
    }
    sumHours += totalHours;
    console.log(
      `${colorStart}${dateString}: ${totalHours.toFixed(1).padStart(4, " ")} hours`,
      projects.length > 0 ? "\t--> " + projects : "",
      `${colorEnd}`
    );
  }
  console.log("\n======================================");
  console.log(`Total billable hours logged: ${sumHours}.`);
  console.log("======================================\n");
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