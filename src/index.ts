#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { addProblemCommand } from './commands/addproblem';
import { delProblemCommand } from './commands/delproblem';
import { listProblemCommand } from './commands/listproblem';
import { editCommand } from './commands/edit';
import { genPDFCommand } from './commands/genpdf';
import { genLemonCommand } from './commands/genlemon';
import { importCommand } from './commands/import';
import { swapIndexCommand } from './commands/swapindex';
import { genMarkdownCommand} from './commands/genmd';
import { genHtmlCommand} from './commands/genhtml';
import { exportCommand } from './commands/export';
import { packageCommand } from './commands/package';

// @ts-ignore
const { version } = require('../package.json');

const program = new Command();

program
  .name('oicontest')
  .description('OI Contest Management Tool')
  .version(version);

program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(addProblemCommand);
program.addCommand(delProblemCommand);
program.addCommand(listProblemCommand);
program.addCommand(editCommand);
program.addCommand(genPDFCommand);
program.addCommand(genLemonCommand);
program.addCommand(importCommand);
program.addCommand(swapIndexCommand);
program.addCommand(genMarkdownCommand);

program.addCommand(genHtmlCommand);
program.addCommand(exportCommand);
program.addCommand(packageCommand);

program.parse(process.argv);