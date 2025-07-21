import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';

export const packageCommand = new Command('package')
  .description('Generate contest directory structure readme.txt and zip the contest directory')
  .action(async () => {
    try {
      const contestDir = process.cwd();
      const parentDir = path.dirname(contestDir);
      const contestName = path.basename(contestDir);
      const readmePath = path.join(contestDir, 'readme.txt');
      const zipPath = path.join(parentDir, `${contestName}.zip`);
      const now = new Date();
      // 1. 生成目录结构说明
      let readmeContent = `OIContest Package\n=================\n\n`;
      readmeContent += `本包为信息学竞赛/题库项目“${contestName}”的完整目录结构归档。\n`;
      readmeContent += `导出时间: ${now.toISOString()}\n`;
      readmeContent += `\n用途：\n- 便于命题人、教研组、竞赛组委会等同行之间分发、交流、归档整套 contest 资料\n- 便于快速了解题库/比赛的目录结构和内容组成\n\n使用说明：\n- 解压本 zip 包后，即可获得完整的 contest 目录结构\n- 目录下的 readme.txt 为本说明文件\n- 题目描述、数据、题解、附加文件等均在各自子目录下\n\n目录结构如下：\n\n`;
      readmeContent += await generateTree(contestDir, '', contestDir);
      // 追加目录说明
      readmeContent += `\n目录说明：\n`;
      readmeContent += `- oicontest.json         ：比赛全局配置文件\n`;
      readmeContent += `- problem/               ：所有题目目录\n`;
      readmeContent += `- problem/<id>/          ：单个题目目录\n`;
      readmeContent += `- problem/<id>/config.json   ：单题配置信息\n`;
      readmeContent += `- problem/<id>/status.json   ：单题状态信息\n`;
      readmeContent += `- problem/<id>/problem.md    ：题目描述\n`;
      readmeContent += `- problem/<id>/testdata/     ：测试数据目录\n`;
      readmeContent += `- problem/<id>/src/          ：题目源代码、标准程序等\n`;
      readmeContent += `- problem/<id>/solution/     ：题解目录\n`;
      readmeContent += `- problem/<id>/additional_file/ ：附加文件（图片、数据等）\n`;
      readmeContent += `- html/                  ：生成的 HTML 题面\n`;
      readmeContent += `- output/                ：LEMON 评测包\n`;
      readmeContent += `- pdf/                   ：PDF 题面（如有，已经弃用）\n`;
      readmeContent += `- readme.txt             ：本说明文件\n`;
      await fs.writeFile(readmePath, readmeContent, 'utf-8');
      console.log(chalk.green(`readme.txt generated at ${readmePath}`));
      // 2. 打包整个 contest 目录
      await zipDirectory(contestDir, zipPath);
      console.log(chalk.green(`Contest directory zipped to ${zipPath}`));
    } catch (err: any) {
      console.error(chalk.red(`Package failed: ${err.message}`));
      process.exit(1);
    }
  });

async function generateTree(dir: string, prefix: string, root: string): Promise<string> {
  let result = '';
  const items = await fs.readdir(dir);
  const entries = await Promise.all(items.map(async (item) => {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    return { item, fullPath, stat };
  }));
  for (let i = 0; i < entries.length; i++) {
    const { item, fullPath, stat } = entries[i];
    const isLast = i === entries.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    result += `${prefix}${branch}${item}`;
    if (stat.isDirectory()) {
      result += '/\n';
      result += await generateTree(fullPath, prefix + (isLast ? '    ' : '│   '), root);
    } else {
      result += `\n`;
    }
  }
  return result;
}

async function zipDirectory(source: string, out: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);
    archive.directory(source, false);
    archive.on('error', err => reject(err));
    stream.on('close', () => resolve());
    archive.pipe(stream);
    archive.finalize();
  });
} 