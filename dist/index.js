#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const status_1 = require("./commands/status");
const addproblem_1 = require("./commands/addproblem");
const delproblem_1 = require("./commands/delproblem");
const listproblem_1 = require("./commands/listproblem");
const edit_1 = require("./commands/edit");
const genpdf_1 = require("./commands/genpdf");
const genlemon_1 = require("./commands/genlemon");
const import_1 = require("./commands/import");
const swapindex_1 = require("./commands/swapindex");
const genmd_1 = require("./commands/genmd");
const genhtml_1 = require("./commands/genhtml");
const export_1 = require("./commands/export");
const package_1 = require("./commands/package");
// @ts-ignore
const { version } = require('../package.json');
const program = new commander_1.Command();
program
    .name('oicontest')
    .description('OI Contest Management Tool')
    .version(version);
program.addCommand(init_1.initCommand);
program.addCommand(status_1.statusCommand);
program.addCommand(addproblem_1.addProblemCommand);
program.addCommand(delproblem_1.delProblemCommand);
program.addCommand(listproblem_1.listProblemCommand);
program.addCommand(edit_1.editCommand);
program.addCommand(genpdf_1.genPDFCommand);
program.addCommand(genlemon_1.genLemonCommand);
program.addCommand(import_1.importCommand);
program.addCommand(swapindex_1.swapIndexCommand);
program.addCommand(genmd_1.genMarkdownCommand);
program.addCommand(genhtml_1.genHtmlCommand);
program.addCommand(export_1.exportCommand);
program.addCommand(package_1.packageCommand);
program.parse(process.argv);
