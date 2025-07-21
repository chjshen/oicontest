import { Command } from 'commander';
import { loadConfig } from '../lib/config';
import chalk from 'chalk';
import { loadJsonFile } from '../utils/utils';
//@ts-ignore
const path = require('path')
const fs = require('fs');

export const listProblemCommand = new Command('listproblem')
  .description('List all problems in the contest')
  .action(async () => {
    try {
      const contestDir = process.cwd();
      const config = await loadConfig(process.cwd());
      
      if (config.problems.length === 0) {
        console.log(chalk.yellow('No problems added to this contest'));
        return;
      }
      
      console.log(chalk.bold.blue('\n📋 Problem List\n'));
      //ischecked
      let verifiedArray:string[] = [];
      const problems = config.problems;
      for(const p of problems)
      {
        const fullPath = path.join(contestDir,"problem",p.id,"status.json");
        try{
          const status = await loadJsonFile(fullPath);
          if(status.ischecked && status.ischecked.status)
            verifiedArray.push(p.id);
        }
        catch(e)
        {
          console.error(chalk.red("load json file error:"), e);
        }
      }
      const tableData = config.problems.map(p => ({
        ID: (p.id),
        Title: p.title,
        'Time Limit': `${p.timeLimit}ms`,
        'Memory Limit': `${p.memoryLimit}MB`,
        Score: p.maxScore,
        verified:verifiedArray.includes(p.id)?'✅':('❌')
      }));
      
      
      // Simple table output
      console.log(chalk.green(`Total: ${verifiedArray.length} verified`))
      // console.log('ID           Title                   Time   Memory   Score  verified');
      // console.log('-----------------------------------------------------------------------');
      
      console.table(tableData);
      // tableData.forEach((p,index) => {
      //   console.log(
      //     `${(p.ID).padEnd(13)}${(p.Title).padEnd(24)}${p['Time Limit'].padEnd(7)}${p['Memory Limit'].padEnd(9)}${p.Score.toString().padEnd(6)} ${verifiedArray.includes(p.ID)?chalk.green('✓'):chalk.red('✗')}`
      // );
      // });
      
      // console.log(('-----------------------------------------------------------------------'));
      console.log(chalk.bold(`Total: ${config.problems.length} problems`));
    } catch (err) {
      console.error(chalk.red('Error: Not in a contest directory or config missing'));
      process.exit(1);
    }
  });