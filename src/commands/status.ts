import { Command } from 'commander';
import { loadConfig, saveConfig } from '../lib/config';
import chalk from 'chalk';
import { loadJsonFile, verifyProblems } from '../utils/utils';
//@ts-ignore
const fs = require('fs');
const path = require('path');

export const statusCommand = new Command('status')
  .description('Show current contest status')
  .action(async () => {
    try {
      const contestDir = process.cwd();
      let config = await loadConfig(contestDir);
      //题目是否验证
      // const verified = await verifyProblems(path.resolve(contestDir,"problem"));
      let verified:number= 0;
      const items = config.problems;
      let verifiyArray:string[] = [];
      for(const p of items)
      {
        try{
          const status = await loadJsonFile(path.join(contestDir, "problem", p.id,"status.json"));
          if(status.ischecked && status.ischecked.status){
            verified = verified + 1;
            verifiyArray.push(p.id);
          }
        }catch(e){
          console.error("read status json file error:",e);
        }
      }
      
      
      const problemNum = config.problems.length;
      if(verified === problemNum) config.status.problemsVerified = true;
      await saveConfig(contestDir, config);
      

      console.log(chalk.bold.blue('\n📊 Contest Status\n'));
      console.log(chalk.bold(`Name: ${chalk.cyan(config.name)}`));
      console.log(chalk.bold(`Author: ${chalk.cyan(config.author)}`));
      console.log(chalk.bold(`Start Time: ${chalk.cyan(config.startTime)}`));
      console.log(chalk.bold(`Duration: ${chalk.cyan(config.duration)} minutes\n`));

      
      console.log(chalk.bold('Progress:'));
      console.log(`  ${config.status.initialized ? chalk.green('✓') : chalk.red('✗')} Initialized`);
      console.log(`  ${config.status.problemsAdded ? chalk.green('✓') : chalk.red('✗')} Problems Added(Extant ${problemNum} problems)`);
      console.log(`  ${config.status.problemsVerified ? chalk.green('✓') : chalk.red('✗')} All problems Verified`);
      console.log(`  ${config.status.pdfGenerated ? chalk.green('✓') : chalk.red('✗')} PDF Generated`);
      console.log(`  ${config.status.lemonGenerated ? chalk.green('✓') : chalk.red('✗')} LEMON Package Generated\n`);

      console.log(chalk.bold(`Problems (${config.problems.length}):`));
      console.table(config.problems.map((p)=>({
        ID:p.id,
        title:p.title,
        timeLimit:p.timeLimit,
        memoryLimit:p.memoryLimit,
        verified:verifiyArray.includes(p.id) ? '✓':'✗',
      })));
      config.problems.forEach(p => {
        
        console.log(`  - ${(p.id.padEnd(12))}: ${p.title.padEnd(22)}${p.timeLimit}ms/${p.memoryLimit}MB verified: ${ verifiyArray.includes(p.id) ? chalk.green('✓'):chalk.red('✗')}`);
      });
    } catch (err) {
      console.error(chalk.red('Error: Not in a contest directory or config missing'));
      process.exit(1);
    }
  });
        