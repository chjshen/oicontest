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
exports.getTemplate = getTemplate;
exports.writeFileWithDir = writeFileWithDir;
exports.readYaml = readYaml;
exports.writeYaml = writeYaml;
exports.checkFileExists = checkFileExists;
exports.countSubdirectories = countSubdirectories;
exports.loadJsonFile = loadJsonFile;
exports.verifyProblems = verifyProblems;
exports.contestInfoToMarkdown = contestInfoToMarkdown;
const js_yaml_1 = __importDefault(require("js-yaml"));
const mkdirp_1 = require("mkdirp");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const handleMardown_1 = require("./handleMardown");
//@ts-ignore
const path = require("path");
// 获取模板内容
function getTemplate(templateDir, templateName) {
    return fs_extra_1.default.readFileSync(path.join(templateDir, templateName), "utf-8");
}
// 写入文件，如果目录不存在则创建
function writeFileWithDir(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs_extra_1.default.existsSync(dir)) {
        mkdirp_1.mkdirp.sync(dir);
    }
    fs_extra_1.default.writeFileSync(filePath, content);
}
// 读取 YAML 文件
function readYaml(filePath) {
    try {
        return js_yaml_1.default.load(fs_extra_1.default.readFileSync(filePath, "utf-8"));
    }
    catch (e) {
        console.error(chalk_1.default.red(`Error reading YAML file ${filePath}: ${e.message}`));
        return null;
    }
}
// 写入 YAML 文件
function writeYaml(filePath, data) {
    writeFileWithDir(filePath, js_yaml_1.default.dump(data));
}
// 检查文件是否存在
function checkFileExists(filePath) {
    return fs_extra_1.default.existsSync(filePath);
}
function countSubdirectories(directoryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const items = yield fs_extra_1.default.readdir(directoryPath);
            let subdirCount = 0;
            // 并行检查所有项目
            const results = yield Promise.all(items.map((item) => __awaiter(this, void 0, void 0, function* () {
                const fullPath = path.join(directoryPath, item);
                const stats = yield fs_extra_1.default.stat(fullPath);
                return stats.isDirectory();
            })));
            // 统计目录数量
            results.forEach(isDirectory => {
                if (isDirectory)
                    subdirCount++;
            });
            return subdirCount;
        }
        catch (error) {
            console.error(`无法读取目录: ${directoryPath}`, error);
            return -1;
        }
    });
}
function loadJsonFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs_extra_1.default.existsSync(filePath)) {
            throw new Error(`JSON file not found. Are you in a contest directory?`);
        }
        return fs_extra_1.default.readJSON(filePath);
    });
}
function verifyProblems(problemDir) {
    return __awaiter(this, void 0, void 0, function* () {
        //验证题目
        //1.读取各题目的status.json,返回已经验证的数量
        const items = yield fs_extra_1.default.readdir(problemDir);
        console.error(items);
        let verifiedCount = 0;
        // 并行检查所有项目
        const results = yield Promise.all(items.map((item) => __awaiter(this, void 0, void 0, function* () {
            const fullPath = path.join(problemDir, item, "status.json");
            console.error(fullPath);
            return fullPath;
        })));
        // 统计数量
        // 由于 loadJsonFile 是异步函数，需要使用 await
        // 因为 forEach 不支持 await，改用 for...of 循环
        for (const fullPath of results) {
            try {
                const status = yield loadJsonFile(fullPath);
                if (status.ischecked && status.ischecked.status)
                    verifiedCount++;
            }
            catch (err) {
                // 可以选择忽略错误或记录日志
                console.error(`Error loading ${fullPath}:`, err);
            }
        }
        return verifiedCount;
    });
}
function contestInfoToMarkdown(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const contestDir = process.cwd();
        //先将contest信息转换成markdown格式
        if (config.problems.length === 0) {
            console.error(chalk_1.default.red('Error: No problems added to contest'));
            process.exit(1);
        }
        let mdContent = "";
        //add title
        let mdTitle = "# " + config.description + '\n\n' + `开始时间: ${config.startTime.padEnd(20)}` +
            `时长: ${(config.duration.toString() + '分钟').padEnd(10)}` +
            `题目数量: ${config.problems.length} 题`;
        const headers = ['题目名称', '提交目录', "提交源程序名", '输入文件名', '输出文件名', '时间限制', '内存限制', '分值'];
        let mdProblemsTable = "\n|";
        for (const s of headers)
            mdProblemsTable += s + "|";
        mdProblemsTable += "\n|";
        headers.forEach(() => {
            mdProblemsTable += "---|";
        });
        for (const problem of config.problems) {
            const values = [
                problem.title,
                problem.id,
                problem.id + ".cpp",
                problem.id + ".in",
                problem.id + ".out",
                problem.timeLimit.toString() + 'ms',
                problem.memoryLimit.toString() + 'MB',
                problem.maxScore.toString(),
            ];
            mdProblemsTable += "\n|";
            values.forEach((s) => {
                mdProblemsTable += s + "|";
            });
        }
        //加入注意事项
        const notice = yield fs_extra_1.default.readFile(path.join(__dirname, "../templates", "notice.md"));
        mdContent = "\n" + notice + "\n\n";
        for (const p of config.problems) {
            let mdfile = path.resolve(contestDir, "problem", p.id, "problem.md");
            if (!fs_extra_1.default.existsSync(mdfile))
                mdfile = path.resolve(contestDir, "problem", p.id, "problem_zh.md");
            if (!fs_extra_1.default.existsSync(mdfile)) {
                console.error(chalk_1.default.red(`题目文件${mdfile}未找到！`));
                process.exit(1);
            }
            const problemConfig = yield fs_extra_1.default.readJSON(path.join(contestDir, "problem", p.id, "config.json"));
            mdContent = mdContent + "\n-----------------\n\n# " + problemConfig.title + "\n\n";
            //将里面的所有图片转换成绝对路径
            mdContent += yield (0, handleMardown_1.convertMarkdownImagePaths)(mdfile);
        }
        const mdAll = mdTitle + "\n" + mdProblemsTable + mdContent;
        //转换成html
        return mdAll;
    });
}
