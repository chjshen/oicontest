// src/commands/genlemon.ts
import { Command } from 'commander';
import { loadConfig, saveConfig } from '../lib/config';
import { generateLemonPackage } from '../lib/lemon';
import chalk from 'chalk';

export const genLemonCommand = new Command('genlemon')
  .description('Generate LEMON evaluation package')
  .action(async () => {
    try {
      const config = await loadConfig(process.cwd());
      
      if (config.problems.length === 0) {
        console.error(chalk.red('Error: No problems added to contest'));
        process.exit(1);
      }
      // 检查所有题目是否都已验证
      if (!(config.status && config.status.problemsVerified)) {
        console.error(chalk.bold.red('All problems must be verified before generating the LEMON package.'));
        process.exit(1);
      }
      // 必须先生成 PDF（html）
      if (!(config.status && config.status.pdfGenerated)) {
        console.error(chalk.bold.red('You must generate the HTML (genhtml) before generating the LEMON package.'));
        process.exit(1);
      }
      console.log(chalk.bold.blue('\n🍋 Generating LEMON Package\n'));
      
      const outputPath = await generateLemonPackage(config);
      
      // 更新状态
      config.status.lemonGenerated = true;
      await saveConfig(process.cwd(), config);
      
      console.log(chalk.green.bold('\n✅ LEMON package generated successfully!'));
      console.log(chalk.cyan(`  Location: ${outputPath}`));
    } catch (err:any) {
      console.error(chalk.red(`Error generating LEMON package: ${err.message}`));
      process.exit(1);
    }
  });