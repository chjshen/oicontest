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
exports.exportExamCommand = void 0;
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
// 工具函数：递归复制目录
function copyDir(src, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield fs_extra_1.default.pathExists(src)) {
            yield fs_extra_1.default.ensureDir(dest);
            yield fs_extra_1.default.copy(src, dest);
        }
    });
}
// 工具函数：处理html中的本地图片/链接为相对路径
function fixHtmlLinks(htmlPath, problemId) {
    return __awaiter(this, void 0, void 0, function* () {
        let html = yield fs_extra_1.default.readFile(htmlPath, 'utf-8');
        // 替换绝对路径为 ./additional/problemid/xxx
        html = html.replace(/(["'])((?:\/|[A-Za-z]:\\)[^"']*additional_file[\/\\][^"']+)/g, (match, quote, url) => {
            // 只保留 additional_file 及后面的部分
            const idx = url.indexOf('additional_file');
            if (idx !== -1) {
                const rel = `./additional/${problemId}/` + url.substring(idx + 'additional_file'.length + 1).replace(/\\/g, '/');
                return quote + rel;
            }
            return match;
        });
        yield fs_extra_1.default.writeFile(htmlPath, html, 'utf-8');
    });
}
exports.exportExamCommand = new commander_1.Command('exportexam')
    .description('Export student.zip and teacher.zip for exam use')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const contestDir = process.cwd();
    const config = yield (0, config_1.loadConfig)(contestDir);
    const htmlDir = path_1.default.join(contestDir, 'html');
    const pdfDir = path_1.default.join(contestDir, 'pdf');
    const outputStudentZip = path_1.default.join(contestDir, 'student.zip');
    const outputTeacherZip = path_1.default.join(contestDir, 'teacher.zip');
    const tempStudentDir = path_1.default.join(contestDir, '__student_tmp__');
    const tempTeacherDir = path_1.default.join(contestDir, '__teacher_tmp__');
    try {
        // 1. 检查 PDF/HTML 是否存在
        let pdfFound = false;
        for (const p of config.problems) {
            const pdfPath1 = path_1.default.join(pdfDir, `${p.id}.pdf`);
            const pdfPath2 = path_1.default.join(contestDir, `${p.id}.pdf`);
            if ((yield fs_extra_1.default.pathExists(pdfPath1)) || (yield fs_extra_1.default.pathExists(pdfPath2))) {
                pdfFound = true;
                break;
            }
        }
        if (!pdfFound) {
            console.log(chalk_1.default.red('未找到任何题目的 PDF 文件。请先用 oicontest genhtml 生成 HTML 并打印 PDF 到 pdf/ 目录或当前目录。'));
            return;
        }
        // 清理临时目录
        yield fs_extra_1.default.remove(tempStudentDir);
        yield fs_extra_1.default.remove(tempTeacherDir);
        yield fs_extra_1.default.ensureDir(tempStudentDir);
        yield fs_extra_1.default.ensureDir(tempTeacherDir);
        // 2. 复制 additional_file
        for (const p of config.problems) {
            const addiSrc = path_1.default.join(contestDir, 'problem', p.id, 'additional_file');
            const addiDest = path_1.default.join(tempStudentDir, 'additional', p.id);
            yield copyDir(addiSrc, addiDest);
        }
        // 3. 复制 html
        if (yield fs_extra_1.default.pathExists(htmlDir)) {
            yield fs_extra_1.default.copy(htmlDir, path_1.default.join(tempStudentDir, 'html'));
            // 修正 html 路径
            for (const p of config.problems) {
                const htmlPath = path_1.default.join(tempStudentDir, 'html', `${p.id}.html`);
                if (yield fs_extra_1.default.pathExists(htmlPath)) {
                    yield fixHtmlLinks(htmlPath, p.id);
                }
            }
        }
        // 4. 复制 pdf
        yield fs_extra_1.default.ensureDir(path_1.default.join(tempStudentDir, 'pdf'));
        for (const p of config.problems) {
            const pdfPath1 = path_1.default.join(pdfDir, `${p.id}.pdf`);
            const pdfPath2 = path_1.default.join(contestDir, `${p.id}.pdf`);
            let found = false;
            if (yield fs_extra_1.default.pathExists(pdfPath1)) {
                yield fs_extra_1.default.copy(pdfPath1, path_1.default.join(tempStudentDir, 'pdf', `${p.id}.pdf`));
                found = true;
            }
            else if (yield fs_extra_1.default.pathExists(pdfPath2)) {
                yield fs_extra_1.default.copy(pdfPath2, path_1.default.join(tempStudentDir, 'pdf', `${p.id}.pdf`));
                found = true;
            }
            if (!found) {
                console.log(chalk_1.default.yellow(`题目 ${p.id} 未找到 PDF 文件。`));
            }
        }
        // 5. 打包 student.zip
        yield zipDir(tempStudentDir, outputStudentZip);
        console.log(chalk_1.default.green(`student.zip 已生成: ${outputStudentZip}`));
        // 6. 生成 teacher.zip
        // 先复制 student.zip 内容
        yield fs_extra_1.default.copy(tempStudentDir, tempTeacherDir);
        // 复制 solution 和 std.cpp
        for (const p of config.problems) {
            // solution
            const solSrc = path_1.default.join(contestDir, 'problem', p.id, 'solution');
            const solDest = path_1.default.join(tempTeacherDir, 'solution', p.id, 'solution');
            yield copyDir(solSrc, solDest);
            // std.cpp
            const stdSrc = path_1.default.join(contestDir, 'problem', p.id, 'src', 'std.cpp');
            const stdDest = path_1.default.join(tempTeacherDir, 'solution', p.id, 'std');
            if (yield fs_extra_1.default.pathExists(stdSrc)) {
                yield fs_extra_1.default.ensureDir(stdDest);
                yield fs_extra_1.default.copy(stdSrc, path_1.default.join(stdDest, 'std.cpp'));
            }
        }
        yield zipDir(tempTeacherDir, outputTeacherZip);
        console.log(chalk_1.default.green(`teacher.zip 已生成: ${outputTeacherZip}`));
        // 清理临时目录
        yield fs_extra_1.default.remove(tempStudentDir);
        yield fs_extra_1.default.remove(tempTeacherDir);
    }
    catch (e) {
        console.error(chalk_1.default.red('导出失败:'), e.message);
        yield fs_extra_1.default.remove(tempStudentDir);
        yield fs_extra_1.default.remove(tempTeacherDir);
    }
}));
// 工具函数：zip 目录
function zipDir(srcDir, zipPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const output = fs_extra_1.default.createWriteStream(zipPath);
            const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
            output.on('close', () => resolve());
            archive.on('error', err => reject(err));
            archive.pipe(output);
            archive.directory(srcDir, false);
            archive.finalize();
        });
    });
}
