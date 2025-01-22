#!/usr/bin/env node

const { Command } = require("commander");
const admin = require('firebase-admin');
const path = require('path');
const os = require('os');

// Initialize Firebase Admin
const serviceAccount = require(path.join(os.homedir(), '.timekeeping', 'service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://timekeep-2b61b-default-rtdb.europe-west1.firebasedatabase.app"
});

const database = admin.database();

// Set up Commander
const program = new Command();
program.version("1.0.0").description("A simple CLI for timekeeping");

// Import commands
const setupLogCommand = require('./src/commands/log');
const setupReportCommand = require('./src/commands/report');
const setupSummaryCommand = require('./src/commands/summary');
const setupImportCommand = require('./src/commands/import');

// Set up commands
setupLogCommand(program, database);
setupReportCommand(program, database);
setupSummaryCommand(program, database);
setupImportCommand(program, database);

// Parse command line arguments
program.parse(process.argv);