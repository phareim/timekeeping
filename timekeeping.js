#!/usr/bin/env node

const { Command } = require("commander");
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8jxsHi70N1aHQtqNHDjgwy-VsXu0Kvcw",
  authDomain: "timekeep-2b61b.firebaseapp.com",
  databaseURL: "https://timekeep-2b61b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "timekeep-2b61b",
  storageBucket: "timekeep-2b61b.firebasestorage.app",
  messagingSenderId: "418981440882",
  appId: "1:418981440882:web:bd9c9baff20946817b41eb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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