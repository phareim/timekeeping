const { ref, set } = require('firebase/database');
const { parseDate, getTimeData, exitGracefully } = require('../utils');

async function logTime(database, project, hours, date) {
  try {
    const dateString = date.toLocaleDateString("en-CA"); // Formats date as YYYY-MM-DD
    
    // Hent eksisterende data først
    let timeData = await getTimeData(database) || {};

    // Oppdater eller opprett prosjekt og dato
    if (!timeData[project]) {
      timeData[project] = {};
    }
    if (!timeData[project][dateString]) {
      timeData[project][dateString] = 0;
    }
    timeData[project][dateString] += hours;

    // Lagre til Firebase
    await set(ref(database, 'timeData'), timeData);
    console.log(`Logged ${hours} hours to project "${project}" on ${dateString}.`);
    exitGracefully();
  } catch (error) {
    console.error("Error writing timekeeping data:", error);
    process.exit(1);
  }
}

function setupLogCommand(program, database) {
  program
    .command("log")
    .description("Log hours to a project")
    .option("-h, --hours <number>", "Number of hours to log", parseFloat)
    .option("-p, --project <name>", "Project name")
    .option("-d, --date [date]", "Date in MM.DD or YYYY.MM.DD format")
    .action(async (options) => {
      if (options.hours == null || !options.project) {
        console.error("Both --hours and --project are required.");
        process.exit(1);
      }

      const date = options.date ? parseDate(options.date) : new Date();
      if (!date) {
        console.error("Invalid date format. Please use MM.DD or YYYY.MM.DD.");
        process.exit(1);
      }

      await logTime(database, options.project, options.hours, date);
    });
}

module.exports = setupLogCommand; 