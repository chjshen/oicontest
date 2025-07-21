import { Command } from "commander";
import { loadConfig, saveConfig } from "../lib/config";
import chalk from "chalk";
import path from "path";
import fs from 'fs-extra';
import { contestInfoToMarkdown } from "../utils/utils";
import { convertMarkdownToHtml } from "../lib/mdToHtml";
import open from "open";
export const genHtmlCommand = new Command('genhtml')
    .description('Generate contest html files.')
    .action(async () => {
        try {
            const contestDir = process.cwd();
            const config = await loadConfig(process.cwd());
            //没有完成所有题目的验证不能生成html后转pdf
            console.log(chalk.bold.blue('\n🌐 Generating Contest information to Html file\n'));
            if(!(config.status && config.status.problemsVerified))
            {
                console.error(chalk.bold.red(`All problems can not generate HTML files without validation complete`));
                process.exit(1);
            }
            
            
            console.log(chalk.green(`✓ All problems validation complete`));
            //先将contest信息转换成markdown格式

            const mdContent = await contestInfoToMarkdown(config);
            //生成转换后的文件
            const mdPath = path.join(contestDir,config.name+".md");
            await fs.outputFile(mdPath,mdContent);
            //转换成html
            let htmlStr = await convertMarkdownToHtml(mdContent,config.description);
            // 插入复制按钮CSS和JS
            const copyBtnCss = `<style>\n.copy-btn { position: absolute; right: 8px; top: 8px; padding: 2px 8px; font-size: 12px; cursor: pointer; background: #eee; border: 1px solid #ccc; border-radius: 4px; z-index: 10; }\n.copy-btn:active { background: #ddd; }\n@media print { .copy-btn { display: none !important; } }\n.pre-block { position: relative; }\n</style>`;
            const copyBtnJs = `<script>\ndocument.querySelectorAll('pre > code').forEach(function(codeBlock) {\n  var pre = codeBlock.parentElement;\n  pre.classList.add('pre-block');\n  var btn = document.createElement('button');\n  btn.innerText = '复制';\n  btn.className = 'copy-btn';\n  btn.onclick = function() {\n    navigator.clipboard.writeText(codeBlock.innerText);\n    btn.innerText = '已复制!';\n    setTimeout(() => btn.innerText = '复制', 1000);\n  };\n  pre.appendChild(btn);\n});\n</script>`;
            // 简单插入到<head>和</body>前
            htmlStr = htmlStr.replace(/<head>/i, '<head>' + copyBtnCss);
            htmlStr = htmlStr.replace(/<\/body>/i, copyBtnJs + '</body>');
            const htmlPath = path.join(contestDir, 'html', config.description + ".html");
            //生成转换后的文件
            await fs.outputFile(htmlPath,htmlStr);
            //将需要的CDN文件转换成本地文件
            // Update status
            config.status.pdfGenerated = true;
            await saveConfig(process.cwd(), config);
            
            console.log(chalk.green.bold('\n✅ Html generated successfully!'));
            console.log(chalk.cyan(`html Location: ${htmlPath}, now open this file to preview, you can print it to pdf file.`));
            await open(htmlPath);
        } catch (err: any) {
            console.error(chalk.red(`Error generating Html: ${err.message}`));
            process.exit(1);
        }
    });