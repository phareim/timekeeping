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
  .action(() => {
    printReport();
  });

program
  .command("summary")
  .description(
    "Print summary of dates in the current month with less than 7.5 hours logged"
  )
  .action(() => {
    printSummary();
  });

program.parse(process.argv);

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
  const dateString = date.toLocaleDateString('en-CA'); // Formats date as YYYY-MM-DD

  if (!timeData[project]) {
    timeData[project] = {};
  }

  if (!timeData[project][dateString]) {
    timeData[project][dateString] = 0;
  }

  timeData[project][dateString] += hours;

  // Removed the check for negative total hours

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

function printReport() {
  const dataPath = path.join(__dirname, "timekeeping.json");
  if (!fs.existsSync(dataPath)) {
    console.log("No timekeeping data found.");
    return;
  }

  try {
    const timeData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    console.log("Timekeeping Report:");
    console.log("===================");
    for (const project in timeData) {
      console.log(`Project: ${project}`);
      console.log("-------------------");
      for (const date in timeData[project]) {
        console.log(`  Date: ${date}, Hours: ${timeData[project][date]}`);
      }
      console.log();
    }
  } catch (error) {
    console.error("Error reading timekeeping data:", error);
  }
}

function printSummary() {
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
  const currentMonth = now.getMonth(); // 0-based month

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  console.log("\n======================================");
  console.log(
    `Summary for ${now.toLocaleString("default", {
      month: "long",
    })} ${currentYear}:`
  );
  console.log("======================================\n");
  let sumHours = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

    // Format date as YYYY-MM-DD using local time
    const dateString = date.toLocaleDateString('en-CA');

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
          projects += project+"("+timeData[project][dateString]+")";
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
    }
    sumHours += totalHours;
    console.log(
      `${colorStart}${dateString}: ${totalHours.toFixed(1).padStart(4, ' ')} hours`,
      projects.length > 0 ? "\t--> " + projects : "", ` ${colorEnd}`
    );
  }
  console.log("\n======================================");
  console.log(`Total billable hours logged: ${sumHours}.`);
  console.log("======================================\n");
}
