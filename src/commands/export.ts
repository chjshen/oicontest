import { Command } from 'commander';
import { loadConfig } from '../lib/config';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
// @ts-ignore
import { JSDOM } from 'jsdom';

export const exportCommand = new Command('export')
  .description('Export student.zip and teacher.zip for exam use')
  .action(async () => {
    try {
      const contestDir = process.cwd();
      const config = await loadConfig(contestDir);
      const htmlDir = path.join(contestDir, 'html');
      const pdfDir = path.join(contestDir, 'pdf');
      const additionalDir = path.join(contestDir, 'problem');
      const studentZipPath = path.join(contestDir, 'student.zip');
      const teacherZipPath = path.join(contestDir, 'teacher.zip');
      const tempStudentDir = path.join(contestDir, '.export_student_tmp');
      const tempTeacherDir = path.join(contestDir, '.export_teacher_tmp');

      // 清理临时目录
      await fs.remove(tempStudentDir);
      await fs.remove(tempTeacherDir);
      await fs.ensureDir(tempStudentDir);
      await fs.ensureDir(tempTeacherDir);

      // 1. 检查 PDF/HTML 文件
      let pdfFound = false;
      let htmlFound = false;
      const htmlFiles: string[] = [];
      const pdfFiles: string[] = [];
      if (await fs.pathExists(htmlDir)) {
        for (const file of await fs.readdir(htmlDir)) {
          if (file.endsWith('.html')) {
            htmlFound = true;
            htmlFiles.push(path.join(htmlDir, file));
          }
        }
      }
      // 只查找 contest 根目录下的 pdf
      for (const file of await fs.readdir(contestDir)) {
        if (file.endsWith('.pdf')) {
          pdfFound = true;
          pdfFiles.push(path.join(contestDir, file));
        }
      }
      if (!htmlFound) {
        console.log(chalk.red('No HTML files found in html/ directory. Please run oicontest genhtml first.'));
        return;
      }
      if (!pdfFound) {
        console.log(chalk.red('No PDF files found in contest directory.'));
        console.log(chalk.yellow('请用浏览器打开 html/ 下的 HTML 文件，打印为 PDF 并放在 contest 目录下。'));
        return;
      }

      // 2. 复制 HTML 文件并处理图片/链接路径和 CSS
      const htmlTargetDir = path.join(tempStudentDir);
      const assetsTargetDir = path.join(tempStudentDir, 'assets');
      await fs.ensureDir(htmlTargetDir);
      await fs.ensureDir(assetsTargetDir);
      // 收集dist/templates/html/static目录下所有文件，复制到assets
      const cssSourceDir = path.resolve(__dirname, '../../templates/html/static');
      const cssFiles: string[] = [];
      if (await fs.pathExists(cssSourceDir)) {
        for (const file of await fs.readdir(cssSourceDir)) {
          cssFiles.push(file);
          await fs.copy(path.join(cssSourceDir, file), path.join(assetsTargetDir, file));
        }
      }
      for (const htmlFile of htmlFiles) {
        const htmlContent = await fs.readFile(htmlFile, 'utf-8');
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        // 处理图片
        document.querySelectorAll('img').forEach((img: any) => {
          const src = img.getAttribute('src');
          if (src && src.startsWith('/')) {
            // 绝对路径，转换为相对 additional 路径
            const match = src.match(/problem\/(.+?)\/additional_file\/(.+)$/);
            if (match) {
              const pid = match[1];
              const fname = match[2];
              img.setAttribute('src', `./additional/${pid}/${fname}`);
            }
          }
        });
        // 处理 a 标签
        document.querySelectorAll('a').forEach((a: any) => {
          const href = a.getAttribute('href');
          if (href && href.startsWith('/')) {
            const match = href.match(/problem\/(.+?)\/additional_file\/(.+)$/);
            if (match) {
              const pid = match[1];
              const fname = match[2];
              a.setAttribute('href', `./additional/${pid}/${fname}`);
            }
          }
        });
        // 处理css引用
        document.querySelectorAll('link[rel="stylesheet"]').forEach((link: any) => {
          const href = link.getAttribute('href');
          if (href && (href.endsWith('.css') || href.includes('.css?'))) {
            const cssName = href.split('/').pop().split('?')[0];
            if (cssFiles.includes(cssName)) {
              link.setAttribute('href', `./assets/${cssName}`);
            }
          }
        });
        // 插入复制按钮CSS和JS
        const copyBtnCss = `<style>\n.copy-btn { position: absolute; right: 8px; top: 8px; padding: 2px 8px; font-size: 12px; cursor: pointer; background: #eee; border: 1px solid #ccc; border-radius: 4px; z-index: 10; }\n.copy-btn:active { background: #ddd; }\n@media print { .copy-btn { display: none !important; } }\n.pre-block { position: relative; }\n</style>`;
        const copyBtnJs = `<script>\ndocument.querySelectorAll('pre > code').forEach(function(codeBlock) {\n  var pre = codeBlock.parentElement;\n  pre.classList.add('pre-block');\n  var btn = document.createElement('button');\n  btn.innerText = '复制';\n  btn.className = 'copy-btn';\n  btn.onclick = function() {\n    navigator.clipboard.writeText(codeBlock.innerText);\n    btn.innerText = '已复制!';\n    setTimeout(() => btn.innerText = '复制', 1000);\n  };\n  pre.appendChild(btn);\n});\n</script>`;
        // 插入到head和body末尾
        if (document.head) {
          document.head.insertAdjacentHTML('beforeend', copyBtnCss);
        }
        if (document.body) {
          document.body.insertAdjacentHTML('beforeend', copyBtnJs);
        }
        await fs.writeFile(path.join(htmlTargetDir, path.basename(htmlFile)), dom.serialize(), 'utf-8');
      }

      // 3. 复制 PDF 文件
      const pdfTargetDir = path.join(tempStudentDir);
      await fs.ensureDir(pdfTargetDir);
      for (const pdfFile of pdfFiles) {
        await fs.copy(pdfFile, path.join(pdfTargetDir, path.basename(pdfFile)));
      }

      // 4. 复制 additional_file
      const additionalTargetDir = path.join(tempStudentDir, 'additional');
      await fs.ensureDir(additionalTargetDir);
      for (const p of config.problems) {
        const addSrc = path.join(contestDir, 'problem', p.id, 'additional_file');
        const addDst = path.join(additionalTargetDir, p.id);
        if (await fs.pathExists(addSrc)) {
          await fs.copy(addSrc, addDst);
        }
      }

      // 5. 打包 student.zip
      await zipDirectory(tempStudentDir, studentZipPath);
      console.log(chalk.green(`student.zip generated at ${studentZipPath}`));

      // 6. 复制 student.zip 内容到 teacher 临时目录
      await fs.copy(tempStudentDir, tempTeacherDir);

      // 7. 复制 solution 和 std.cpp
      const solutionDir = path.join(tempTeacherDir, 'solution');
      await fs.ensureDir(solutionDir);
      for (const p of config.problems) {
        const solSrc = path.join(contestDir, 'problem', p.id, 'solution');
        const stdSrc = path.join(contestDir, 'problem', p.id, 'src', 'std.cpp');
        const solDst = path.join(solutionDir, p.id);
        const stdDst = path.join(solutionDir, p.id);
        if (await fs.pathExists(solSrc)) {
          await fs.copy(solSrc, solDst);
        }
        if (await fs.pathExists(stdSrc)) {
          await fs.ensureDir(stdDst);
          await fs.copy(stdSrc, path.join(stdDst, 'std.cpp'));
        }
      }

      // 8. 打包 teacher.zip
      await zipDirectory(tempTeacherDir, teacherZipPath);
      console.log(chalk.green(`teacher.zip generated at ${teacherZipPath}`));

      // 9. 清理临时目录
      await fs.remove(tempStudentDir);
      await fs.remove(tempTeacherDir);
      console.log(chalk.green('Export complete!'));
    } catch (err: any) {
      console.error(chalk.red(`Export failed: ${err.message}`));
      process.exit(1);
    }
  });

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