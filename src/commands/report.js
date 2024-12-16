const { getTimeData, getWeekdaysInMonth, getDaysInMonth, exitGracefully } = require('../utils');

async function printReport(database, monthOption, showComplete) {
  try {
    const timeData = await getTimeData(database);
    
    if (!timeData) {
      console.log("No timekeeping data found.");
      return;
    }

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
    exitGracefully();
  } catch (error) {
    console.error("Error reading timekeeping data:", error);
    process.exit(1);
  }
}

function setupReportCommand(program, database) {
  program
    .command("report")
    .description("Print the timekeeping report")
    .option("-m, --month <month>", "Month number (1-12) to show report for")
    .option("-c, --complete", "Show complete history for all time")
    .action(async (options) => {
      await printReport(database, options.month, options.complete);
    });
}

module.exports = setupReportCommand; 