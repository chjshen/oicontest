import { Command } from 'commander';

import * as path from 'path';
import inquirer from 'inquirer';
import { loadConfig, saveConfig } from '../lib/config';
import chalk from 'chalk';
//@ts-ignore
const fs = require('fs');

export const delProblemCommand = new Command('delproblem')
  .description('Delete a problem from the contest')
  .action(async () => {
    try {
      const config = await loadConfig(process.cwd());
      
      if (config.problems.length === 0) {
        console.log(chalk.yellow('No problems available to delete'));
        return;
      }
      
      console.log(chalk.bold.blue('\n🗑️ Delete Problem\n'));
      
      const { problemId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'problemId',
          message: 'Select problem to delete:',
          choices: config.problems.map(p => ({
            name: `${p.id} - ${p.title}`,
            value: p.id
          }))
        }
      ]);
      
      const problem = config.problems.find(p => p.id === problemId);
      if (!problem) {
        console.error(chalk.red(`Problem "${problemId}" not found`));
        process.exit(1);
      }
      
      // Confirm deletion
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete problem "${problemId} - ${problem.title}"?`,
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('Deletion canceled'));
        return;
      }
      
      // Remove from config
      config.problems = config.problems.filter(p => p.id !== problemId);
      
      // Delete problem directory
      const problemDir = path.join('problem', problemId);
      
      if (await fs.existsSync(problemDir)) {
        await fs.rmSync(problemDir,{ recursive: true, force: true });
        console.log(chalk.cyan(`Deleted directory: ${problemDir}`));
      }
      // Update status
      config.status.problemsAdded = config.problems.length > 0;
      await saveConfig(process.cwd(), config);
      
      console.log(chalk.green.bold(`\n✅ Problem "${problemId}" deleted successfully!`));
    } catch (err: unknown) {
      console.error(chalk.red(`Error deleting problem: ${(err as Error).message}`));
      process.exit(1); 
    }
  });