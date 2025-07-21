import { Command } from "commander";
import { loadConfig, saveConfig } from "../lib/config";
import chalk from "chalk";
import path from "path";
import fs from 'fs-extra'
import { contestInfoToMarkdown } from "../utils/utils";

export const genMarkdownCommand = new Command('genmd')
    .description('Generate contest markdown file with problems')
    .action(async () => {
        try {
            const contestDir = process.cwd();
            const config = await loadConfig(process.cwd());

            if (config.problems.length === 0) {
                console.error(chalk.red('Error: No problems added to contest'));
                process.exit(1);
            }

            console.log(chalk.bold.blue('\n📑 Generating Contest Markdown file\n'));

            const mdPath = path.join(contestDir, config.name + ".md");
            let mdcontent: string = "";
            //生成转换后的文件
            const mdContent =  await contestInfoToMarkdown(config);
            await fs.outputFile(mdPath,mdContent);
            console.log(chalk.green('✔️ markdown file generated success!'))
            console.log(chalk.cyan(`Location: ${mdPath}`));
        } catch (err: any) {
            console.error(chalk.red(`Error generating Markdown: ${err.message}`));
            process.exit(1);
        }
    });