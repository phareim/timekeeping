const { getTimeData, getDaysInMonth, exitGracefully } = require('../utils');

async function printSummary(database, monthOption) {
  try {
    const timeData = await getTimeData(database);
    
    if (!timeData) {
      console.log("No timekeeping data found.");
      return;
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
    let sumPotentialHours = 0;
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
      let colorStart = "";
      let colorReset = "\x1b[0m";

    const weekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (weekend) {
        colorStart = "\x1b[36m";
      } else if (totalHours <= 0) {
        colorStart = "\x1b[31m";
      } else if (totalHours < 7.5) {
        colorStart = "\x1b[33m";
      } else if (totalHours > 7.5) {
        colorStart = "\x1b[32m";
      }
      sumHours += totalHours;
      sumPotentialHours += weekend ? 0 : 7.5;
      console.log(
        `${colorStart}${dateString}: ${totalHours.toFixed(1).padStart(4, " ")} hours`,
        projects.length > 0 ? "\t--> " + projects : "",
        `${colorReset}`
      );
    }
    console.log("\n======================================");
    console.log(`Total billable hours logged: ${sumHours}.`);
    console.log(`Total weekday working hours: ${sumPotentialHours.toFixed(1)}.`);
    console.log(`Billable percentage: ${((sumHours / sumPotentialHours) * 100).toFixed(1)}%.`);
    console.log("======================================\n");
    exitGracefully();
  } catch (error) {
    console.error("Error reading timekeeping data:", error);
    process.exit(1);
  }
}

function setupSummaryCommand(program, database) {
  program
    .command("summary")
    .description("Print summary of dates in the current month with less than 7.5 hours logged")
    .option("-m, --month <month>", "Month number (1-12) to show summary for")
    .action(async (options) => {
      await printSummary(database, options.month);
    });
}

module.exports = setupSummaryCommand; 