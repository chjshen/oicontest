import { Command } from 'commander';
import inquirer from 'inquirer';
import { loadConfig, saveConfig } from '../lib/config';
import chalk from 'chalk';
import moment from 'moment';
import fs from 'fs-extra';
import path from 'path';

export const editCommand = new Command('edit')
  .description('Edit contest information or problem ID')
  .action(async () => {
    try {
      const config = await loadConfig(process.cwd());
      
      console.log(chalk.bold.blue('\n✏️ Edit Menu\n'));
      
      const { editType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'editType',
          message: 'What do you want to edit?',
          choices: [
            { name: 'Edit contest information', value: 'contest' },
            { name: 'Edit problem ID', value: 'problemId' }
          ]
        }
      ]);
      
      if (editType === 'contest') {
        await editContestInfo(config);
      } else {
        await editProblemId(config);
      }
    } catch (err:unknown) {
      console.error(chalk.red(`Error editing: ${(err as Error).message}`));
      process.exit(1);
    }
  });

async function editContestInfo(config: any) {
  const oldName = config.name;
  const currentDir = process.cwd();
  const parentDir = path.dirname(currentDir);
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Contest directory name:',
      default: config.name
    },
    {
      type: 'input',
      name: 'description',
      message: 'Contest description (for PDF):',
      default: config.description
    },
    {
      type: 'input',
      name: 'startTime',
      message: 'Start time (YYYY-MM-DD HH:mm):',
      default: config.startTime,
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
      default: config.duration.toString(),
      validate: input => !isNaN(Number(input)) || 'Please enter a valid number'
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author:',
      default: config.author
    }
  ]);
  
  const newName = answers.name;
  const newDirPath = path.join(parentDir, newName);
  
  config.name = newName;
  config.description = answers.description;
  config.duration = parseInt(answers.duration);
  config.author = answers.author;
  config.startTime = moment(answers.startTime, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm');
  
  await saveConfig(currentDir, config);
  
  if (oldName !== newName) {
    try {
      if (await fs.pathExists(newDirPath)) {
        console.log(chalk.yellow(`\n⚠️  Directory "${newName}" already exists. Cannot rename.`));
        console.log(chalk.cyan(`  Keeping current directory name: ${oldName}`));
        console.log(chalk.cyan(`  Config updated with new name: ${newName}`));
      } else {
        await fs.move(currentDir, newDirPath);
        console.log(chalk.green(`\n✅ Directory renamed from "${oldName}" to "${newName}"`));
        console.log(chalk.cyan(`  New path: ${newDirPath}`));
        process.chdir(newDirPath);
        console.log(chalk.cyan(`  Working directory changed to: ${newDirPath}`));
      }
    } catch (renameError) {
      console.log(chalk.yellow(`\n⚠️  Failed to rename directory: ${(renameError as Error).message}`));
      console.log(chalk.cyan(`  Config updated with new name: ${newName}`));
      console.log(chalk.cyan(`  Directory remains: ${oldName}`));
    }
  }
  
  console.log(chalk.green.bold('\n✅ Contest information updated successfully!'));
  console.log(chalk.cyan(`  Directory Name: ${config.name}`));
  console.log(chalk.cyan(`  Description: ${config.description}`));
  console.log(chalk.cyan(`  Start Time: ${config.startTime}`));
  console.log(chalk.cyan(`  Duration: ${config.duration} minutes`));
  console.log(chalk.cyan(`  Author: ${config.author}`));
}

async function editProblemId(config: any) {
  const contestDir = process.cwd();
  if (!config.problems || config.problems.length === 0) {
    console.log(chalk.yellow('No problems found in this contest.'));
    return;
  }
  // 选择题目
  const { selectedId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedId',
      message: 'Select the problem to edit ID:',
      choices: config.problems.map((p: any) => ({
        name: `[${p.id}] ${p.title}`,
        value: p.id
      }))
    }
  ]);
  const oldId = selectedId;
  const oldProblemDir = path.join(contestDir, 'problem', oldId);
  // 输入新ID
  const { newId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'newId',
      message: `Enter new ID for problem [${oldId}]:`,
      validate: (input: string) => {
        if (!input.trim()) return 'ID cannot be empty';
        if (input === oldId) return 'New ID is the same as the old ID';
        if (config.problems.some((p: any) => p.id === input)) return 'ID already exists!';
        return true;
      }
    }
  ]);
  const newProblemDir = path.join(contestDir, 'problem', newId);
  // 重命名目录
  try {
    await fs.move(oldProblemDir, newProblemDir);
  } catch (e) {
    console.error(chalk.red(`Failed to rename problem directory: ${(e as Error).message}`));
    return;
  }
  // 修改 config.json
  const configJsonPath = path.join(newProblemDir, 'config.json');
  if (await fs.pathExists(configJsonPath)) {
    const problemConfig = await fs.readJson(configJsonPath);
    problemConfig.id = newId;
    await fs.writeJson(configJsonPath, problemConfig, { spaces: 2 });
  }
  // 修改 status.json
  const statusJsonPath = path.join(newProblemDir, 'status.json');
  if (await fs.pathExists(statusJsonPath)) {
    try {
      const statusConfig = await fs.readJson(statusJsonPath);
      if (statusConfig.id) statusConfig.id = newId;
      await fs.writeJson(statusJsonPath, statusConfig, { spaces: 2 });
    } catch {}
  }
  // 更新 oicontest.json
  for (const p of config.problems as any[]) {
    if (p.id === oldId) {
      p.id = newId;
      break;
    }
  }
  await saveConfig(contestDir, config);
  console.log(chalk.green.bold(`\n✅ Problem ID updated from "${oldId}" to "${newId}"!`));
}