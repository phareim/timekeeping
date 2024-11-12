# Timekeeping CLI

A simple command-line interface (CLI) tool for logging hours to projects. This tool allows you to easily track the time spent on different projects with optional date specifications.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)
- [License](#license)

## Installation

1. **Ensure Node.js is installed**: You need Node.js to run this CLI tool. You can download it from [nodejs.org](https://nodejs.org/).

2. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/timekeeping-cli.git
   cd timekeeping-cli
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Make the script executable**:
   ```bash
   chmod +x timekeeping.js
   ```

## Usage

Run the CLI tool using the following command:
```bash
./timekeeping.js [options]
```

## Options

- `-h, --hours <number>`: Number of hours to log (required).
- `-p, --project <name>`: Project name (required).
- `-d, --date [date]`: Date in `MM.DD` or `YYYY.MM.DD` format (optional).

## Examples

1. Log 2 hours to `my_project` for the current date:
   ```bash
   ./timekeeping.js -h 2 -p my_project
   ```

2. Log 3.5 hours to `another_project` for September 15th:
   ```bash
   ./timekeeping.js --hours 3.5 --project another_project --date 09.15
   ```

3. Log 4 hours to `my_project` for September 16th, 2023:
   ```bash
   ./timekeeping.js -h 4 -p my_project -d 2023.09.16
   ```

4. Subtract 1 hour from `my_project` for September 16th, 2023:
   ```bash
   ./timekeeping.js -h -1 -p my_project -d 2023.09.16
   ```
