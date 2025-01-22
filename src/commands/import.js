const fs = require("fs");
const path = require("path");
const { getTimeData, exitGracefully } = require('../utils');

async function importData(database) {
  try {
    const dataPath = path.join(__dirname, "../../timekeeping.json");
    
    if (!fs.existsSync(dataPath)) {
      console.error("No local timekeeping.json file found.");
      return;
    }

    // Les lokal fil
    const localData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    
    // Hent eksisterende data fra Firebase
    const existingData = await getTimeData(database) || {};

    // Slå sammen data (eksisterende Firebase-data beholdes hvis det ikke overskrives)
    const mergedData = { ...existingData, ...localData };

    // Last opp til Firebase
    await database.ref('timeData').set(mergedData);
    console.log("Successfully imported local data to Firebase!");
    
    // Lag backup av lokal fil
    const backupPath = path.join(__dirname, `../../timekeeping_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(localData, null, 2), "utf8");
    console.log(`Local file backed up to: ${backupPath}`);
    exitGracefully();
  } catch (error) {
    console.error("Error importing data:", error);
    process.exit(1);
  }
}

function setupImportCommand(program, database) {
  program
    .command("import")
    .description("Import data from local timekeeping.json file to Firebase")
    .action(async () => {
      await importData(database);
    });
}

module.exports = setupImportCommand; 