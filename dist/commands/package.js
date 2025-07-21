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
exports.packageCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
exports.packageCommand = new commander_1.Command('package')
    .description('Generate contest directory structure readme.txt and zip the contest directory')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestDir = process.cwd();
        const parentDir = path_1.default.dirname(contestDir);
        const contestName = path_1.default.basename(contestDir);
        const readmePath = path_1.default.join(contestDir, 'readme.txt');
        const zipPath = path_1.default.join(parentDir, `${contestName}.zip`);
        const now = new Date();
        // 1. 生成目录结构说明
        let readmeContent = `OIContest Package\n=================\n\n`;
        readmeContent += `本包为信息学竞赛/题库项目“${contestName}”的完整目录结构归档。\n`;
        readmeContent += `导出时间: ${now.toISOString()}\n`;
        readmeContent += `\n用途：\n- 便于命题人、教研组、竞赛组委会等同行之间分发、交流、归档整套 contest 资料\n- 便于快速了解题库/比赛的目录结构和内容组成\n\n使用说明：\n- 解压本 zip 包后，即可获得完整的 contest 目录结构\n- 目录下的 readme.txt 为本说明文件\n- 题目描述、数据、题解、附加文件等均在各自子目录下\n\n目录结构如下：\n\n`;
        readmeContent += yield generateTree(contestDir, '', contestDir);
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
        yield fs_extra_1.default.writeFile(readmePath, readmeContent, 'utf-8');
        console.log(chalk_1.default.green(`readme.txt generated at ${readmePath}`));
        // 2. 打包整个 contest 目录
        yield zipDirectory(contestDir, zipPath);
        console.log(chalk_1.default.green(`Contest directory zipped to ${zipPath}`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Package failed: ${err.message}`));
        process.exit(1);
    }
}));
function generateTree(dir, prefix, root) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = '';
        const items = yield fs_extra_1.default.readdir(dir);
        const entries = yield Promise.all(items.map((item) => __awaiter(this, void 0, void 0, function* () {
            const fullPath = path_1.default.join(dir, item);
            const stat = yield fs_extra_1.default.stat(fullPath);
            return { item, fullPath, stat };
        })));
        for (let i = 0; i < entries.length; i++) {
            const { item, fullPath, stat } = entries[i];
            const isLast = i === entries.length - 1;
            const branch = isLast ? '└── ' : '├── ';
            result += `${prefix}${branch}${item}`;
            if (stat.isDirectory()) {
                result += '/\n';
                result += yield generateTree(fullPath, prefix + (isLast ? '    ' : '│   '), root);
            }
            else {
                result += `\n`;
            }
        }
        return result;
    });
}
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
