"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCommand = void 0;
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
// @ts-ignore
const jsdom_1 = require("jsdom");
exports.exportCommand = new commander_1.Command('export')
    .description('Export student.zip and teacher.zip for exam use')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestDir = process.cwd();
        const config = yield (0, config_1.loadConfig)(contestDir);
        const htmlDir = path_1.default.join(contestDir, 'html');
        const pdfDir = path_1.default.join(contestDir, 'pdf');
        const additionalDir = path_1.default.join(contestDir, 'problem');
        const studentZipPath = path_1.default.join(contestDir, 'student.zip');
        const teacherZipPath = path_1.default.join(contestDir, 'teacher.zip');
        const tempStudentDir = path_1.default.join(contestDir, '.export_student_tmp');
        const tempTeacherDir = path_1.default.join(contestDir, '.export_teacher_tmp');
        // 清理临时目录
        yield fs_extra_1.default.remove(tempStudentDir);
        yield fs_extra_1.default.remove(tempTeacherDir);
        yield fs_extra_1.default.ensureDir(tempStudentDir);
        yield fs_extra_1.default.ensureDir(tempTeacherDir);
        // 1. 检查 PDF/HTML 文件
        let pdfFound = false;
        let htmlFound = false;
        const htmlFiles = [];
        const pdfFiles = [];
        if (yield fs_extra_1.default.pathExists(htmlDir)) {
            for (const file of yield fs_extra_1.default.readdir(htmlDir)) {
                if (file.endsWith('.html')) {
                    htmlFound = true;
                    htmlFiles.push(path_1.default.join(htmlDir, file));
                }
            }
        }
        // 只查找 contest 根目录下的 pdf
        for (const file of yield fs_extra_1.default.readdir(contestDir)) {
            if (file.endsWith('.pdf')) {
                pdfFound = true;
                pdfFiles.push(path_1.default.join(contestDir, file));
            }
        }
        if (!htmlFound) {
            console.log(chalk_1.default.red('No HTML files found in html/ directory. Please run oicontest genhtml first.'));
            return;
        }
        if (!pdfFound) {
            console.log(chalk_1.default.red('No PDF files found in contest directory.'));
            console.log(chalk_1.default.yellow('请用浏览器打开 html/ 下的 HTML 文件，打印为 PDF 并放在 contest 目录下。'));
            return;
        }
        // 2. 复制 HTML 文件并处理图片/链接路径和 CSS
        const htmlTargetDir = path_1.default.join(tempStudentDir);
        const assetsTargetDir = path_1.default.join(tempStudentDir, 'assets');
        yield fs_extra_1.default.ensureDir(htmlTargetDir);
        yield fs_extra_1.default.ensureDir(assetsTargetDir);
        // 收集dist/templates/html/static目录下所有文件，复制到assets
        const cssSourceDir = path_1.default.resolve(__dirname, '../../templates/html/static');
        const cssFiles = [];
        if (yield fs_extra_1.default.pathExists(cssSourceDir)) {
            for (const file of yield fs_extra_1.default.readdir(cssSourceDir)) {
                cssFiles.push(file);
                yield fs_extra_1.default.copy(path_1.default.join(cssSourceDir, file), path_1.default.join(assetsTargetDir, file));
            }
        }
        for (const htmlFile of htmlFiles) {
            const htmlContent = yield fs_extra_1.default.readFile(htmlFile, 'utf-8');
            const dom = new jsdom_1.JSDOM(htmlContent);
            const document = dom.window.document;
            // 处理图片
            document.querySelectorAll('img').forEach((img) => {
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
            document.querySelectorAll('a').forEach((a) => {
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
            document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
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
            yield fs_extra_1.default.writeFile(path_1.default.join(htmlTargetDir, path_1.default.basename(htmlFile)), dom.serialize(), 'utf-8');
        }
        // 3. 复制 PDF 文件
        const pdfTargetDir = path_1.default.join(tempStudentDir);
        yield fs_extra_1.default.ensureDir(pdfTargetDir);
        for (const pdfFile of pdfFiles) {
            yield fs_extra_1.default.copy(pdfFile, path_1.default.join(pdfTargetDir, path_1.default.basename(pdfFile)));
        }
        // 4. 复制 additional_file
        const additionalTargetDir = path_1.default.join(tempStudentDir, 'additional');
        yield fs_extra_1.default.ensureDir(additionalTargetDir);
        for (const p of config.problems) {
            const addSrc = path_1.default.join(contestDir, 'problem', p.id, 'additional_file');
            const addDst = path_1.default.join(additionalTargetDir, p.id);
            if (yield fs_extra_1.default.pathExists(addSrc)) {
                yield fs_extra_1.default.copy(addSrc, addDst);
            }
        }
        // 5. 打包 student.zip
        yield zipDirectory(tempStudentDir, studentZipPath);
        console.log(chalk_1.default.green(`student.zip generated at ${studentZipPath}`));
        // 6. 复制 student.zip 内容到 teacher 临时目录
        yield fs_extra_1.default.copy(tempStudentDir, tempTeacherDir);
        // 7. 复制 solution 和 std.cpp
        const solutionDir = path_1.default.join(tempTeacherDir, 'solution');
        yield fs_extra_1.default.ensureDir(solutionDir);
        for (const p of config.problems) {
            const solSrc = path_1.default.join(contestDir, 'problem', p.id, 'solution');
            const stdSrc = path_1.default.join(contestDir, 'problem', p.id, 'src', 'std.cpp');
            const solDst = path_1.default.join(solutionDir, p.id);
            const stdDst = path_1.default.join(solutionDir, p.id);
            if (yield fs_extra_1.default.pathExists(solSrc)) {
                yield fs_extra_1.default.copy(solSrc, solDst);
            }
            if (yield fs_extra_1.default.pathExists(stdSrc)) {
                yield fs_extra_1.default.ensureDir(stdDst);
                yield fs_extra_1.default.copy(stdSrc, path_1.default.join(stdDst, 'std.cpp'));
            }
        }
        // 8. 打包 teacher.zip
        yield zipDirectory(tempTeacherDir, teacherZipPath);
        console.log(chalk_1.default.green(`teacher.zip generated at ${teacherZipPath}`));
        // 9. 清理临时目录
        yield fs_extra_1.default.remove(tempStudentDir);
        yield fs_extra_1.default.remove(tempTeacherDir);
        console.log(chalk_1.default.green('Export complete!'));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Export failed: ${err.message}`));
        process.exit(1);
    }
}));
function zipDirectory(source, out) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
            const stream = fs_extra_1.default.createWriteStream(out);
            archive.directory(source, false);
            archive.on('error', err => reject(err));
            stream.on('close', () => resolve());
            archive.pipe(stream);
            archive.finalize();
        });
    });
}
