import { Command } from 'commander';

import inquirer from 'inquirer';
import { loadConfig, saveConfig } from '../lib/config';
import { importHydroOJ } from '../lib/hydrooj';
import chalk from 'chalk';
import AdmZip from 'adm-zip';
import path from 'path';

export const importCommand = new Command('import')
  .description('Import problems from external OJ platforms')
  .argument('<zipPath>', 'Path to the import zip file')
  .action(async (zipPath: string) => {
    try {
      const config = await loadConfig(process.cwd());
      // 检查文件存在和格式
      if (!zipPath.endsWith('.zip')) {
        console.error(chalk.red('Only ZIP files are supported'));
        process.exit(1);
      }
      // 如果zip文件名包含hydrooj，直接用hydrooj导入
      const lowerName = path.basename(zipPath).toLowerCase();
      if (lowerName.includes('hydro')) {
        const importedProblems = await importHydroOJ(zipPath, process.cwd());
        config.problems.push(...importedProblems);
        config.status.problemsAdded = true;
        await saveConfig(process.cwd(), config);
        console.log(chalk.green.bold('\n✅ Import completed successfully!'));
        console.log(chalk.cyan(`  Imported ${importedProblems.length} problems`));
        return;
      }
      // 否则走原有交互流程
      console.log(chalk.bold.blue('\n📥 Import Problems from OJ Platforms\n'));
      // 选择导入平台
      const { platform } = await inquirer.prompt([
        {
          type: 'list',
          name: 'platform',
          message: 'Select platform to import from:',
          choices: ['HydroOJ', 'Other (Coming Soon)']
        }
      ]);
      // 获取导入文件路径
      const { filePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Enter path to import file:',
          default: zipPath,
          validate: input => {
            const fs = require('fs');
            if (!fs.existsSync(input)) {
              return 'File does not exist';
            }
            if (!input.endsWith('.zip')) {
              return 'Only ZIP files are supported';
            }
            return true;
          }
        }
      ]);
      let importedProblems: any[] = [];
      switch (platform) {
        case 'HydroOJ':
          importedProblems = await importHydroOJ(filePath, process.cwd());
          break;
        default:
          console.log(chalk.yellow('Only HydroOJ import is currently supported'));
          return;
      }
      // 更新配置
      config.problems.push(...importedProblems);
      config.status.problemsAdded = true;
      await saveConfig(process.cwd(), config);
      console.log(chalk.green.bold('\n✅ Import completed successfully!'));
      console.log(chalk.cyan(`  Imported ${importedProblems.length} problems`));
    } catch (err: any) {
      console.error(chalk.red(`Import error: ${err.message}`));
      process.exit(1);
    }
  });