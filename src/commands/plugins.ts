import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';

export const pluginCommand = new Command('plugins')
  .description('Manage contest plugins')
  .command('install <plugin>', 'Install a plugin')
  .command('list', 'List installed plugins')
  .command('run <plugin>', 'Run a plugin command');

// 插件接口
export interface OIContestPlugin {
  name: string;
  importers?: {
    [ojName: string]: (zipPath: string, contestDir: string) => Promise<void>;
  };
  exporters?: {
    [format: string]: (contestDir: string) => Promise<void>;
  };
  hooks?: {
    preGenPDF?: (config: any) => Promise<void>;
    postGenPDF?: (pdfPath: string) => Promise<void>;
  };
}