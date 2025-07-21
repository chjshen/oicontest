"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginCommand = void 0;
const commander_1 = require("commander");
exports.pluginCommand = new commander_1.Command('plugins')
    .description('Manage contest plugins')
    .command('install <plugin>', 'Install a plugin')
    .command('list', 'List installed plugins')
    .command('run <plugin>', 'Run a plugin command');
