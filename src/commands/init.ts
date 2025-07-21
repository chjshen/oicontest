import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { initConfig } from '../lib/config';
import chalk from 'chalk';
import moment from 'moment';

export const initCommand = new Command('init')
  .description('Initialize a new OI contest interactively')
  .action(async () => {
    console.log(chalk.bold.blue('\n🏁 OI Contest Initialization\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Contest directory name:',
        validate: input => input.trim() !== '' || 'Name cannot be empty'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Contest description (for PDF):',
        default: (answers: { name: any; }) => answers.name,
        validate: input => input.trim() !== '' || 'Description cannot be empty'
      },
      {
        type: 'input',
        name: 'startTime',
        message: 'Start time (YYYY-MM-DD HH:mm):',
        default: () => moment().add(1, 'day').format('YYYY-MM-DD 09:00'),
        validate: input => {
          if (!moment(input, 'YYYY-MM-DD HH:mm', true).isValid()) {
            return 'Invalid date format. Use YYYY-MM-DD HH:mm (e.g. 2023-10-15 09:00)';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'duration',
        message: 'Contest duration (minutes):',
        default: '180',
        validate: input => !isNaN(Number(input)) || 'Please enter a valid number'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: 'Unknown'
      }
    ]);

    const dirPath = path.resolve(answers.name);
    
    if (fs.existsSync(dirPath)) {
      console.error(chalk.red(`\nError: Directory "${answers.name}" already exists`));
      process.exit(1);
    }

    // Create directory structure
    fs.ensureDirSync(path.join(dirPath, 'problem'));
    fs.ensureDirSync(path.join(dirPath, 'pdf'));
    fs.ensureDirSync(path.join(dirPath, 'output'));
    
    // Initialize config
    const config = await initConfig(
      dirPath,
      answers.name,
      answers.description,
      answers.startTime,
      parseInt(answers.duration),
      answers.author
    );

    console.log(chalk.green.bold('\n✅ Contest initialized successfully!'));
    console.log(chalk.cyan(`  Directory: ${dirPath}`));
    console.log(chalk.cyan(`  Description: ${answers.description}`));
    console.log(chalk.cyan(`  Start time: ${answers.startTime}`));
    console.log(chalk.cyan(`  Duration: ${config.duration} minutes`));
    console.log(chalk.cyan(`  Author: ${config.author}`));
  });