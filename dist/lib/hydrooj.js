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
exports.checkProblemFiles = checkProblemFiles;
exports.importHydroOJ = importHydroOJ;
const adm_zip_1 = __importDefault(require("adm-zip"));
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils/utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * 校验题目目录下必要文件完整性
 * @param basePath 题目根目录
 * @returns 缺失时返回错误信息，否则返回null
 */
function checkProblemFiles(basePath) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. 检查 problem*.md
        // 正则表达式中的*表示前面的字符可以重复0次或多次
        // 但 /^problem*\.md$/ 实际上会匹配 "probl.md", "proble.md", "problemm.md" 等
        // 如果想匹配以 "problem" 开头、以 ".md" 结尾的文件名，应该用 /^problem.*\.md$/
        const mdFiles = (yield fs_extra_1.default.readdir(basePath)).filter((f) => /^problem.*\.md$/.test(f));
        if (mdFiles.length === 0)
            return '缺少 problem*.md 文件';
        // 2. 检查 problem.yaml
        if (!(yield fs_extra_1.default.pathExists(path_1.default.join(basePath, 'problem.yaml'))))
            return '缺少 problem.yaml 文件';
        // 3. 检查 testdata 目录
        const testdataPath = path_1.default.join(basePath, 'testdata');
        if (!(yield fs_extra_1.default.pathExists(testdataPath)) || !(yield fs_extra_1.default.stat(testdataPath)).isDirectory())
            return '缺少 testdata 目录';
        // 4. 检查 testdata/config.yaml
        if (!(yield fs_extra_1.default.pathExists(path_1.default.join(testdataPath, 'config.yaml'))))
            return 'testdata 目录下缺少 config.yaml';
        // 5. 检查输入输出文件配对
        const files = yield fs_extra_1.default.readdir(testdataPath);
        const ins = files.filter((f) => f.endsWith('.in')).map((f) => f.replace(/\.in$/, ''));
        const outs = files.filter((f) => f.endsWith('.ans') || f.endsWith('.out')).map((f) => f.replace(/\.(ans|out)$/, ''));
        const pairs = ins.filter((name) => outs.includes(name));
        if (pairs.length === 0)
            return 'testdata 目录下没有配对的输入输出文件（如 1.in 和 1.ans/1.out）';
        return null;
    });
}
/**
 * 获取不与本地已存在题目目录冲突的唯一题目ID
 * @param baseId 原始题目ID
 * @param problemRoot 题库根目录
 */
function getUniqueId(baseId, problemRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        let uniqueId = baseId;
        let idx = 1;
        while (yield fs_extra_1.default.pathExists(path_1.default.join(problemRoot, uniqueId))) {
            uniqueId = `${baseId}_${idx}`;
            idx++;
        }
        return uniqueId;
    });
}
/**
 * 从 HydroOJ 导出包导入题目到当前 contest 目录。
 * 1. 校验压缩包存在
 * 2. 记录导入前 contest 配置和题目快照，便于失败回滚
 * 3. 解包并提取所有题目ID
 * 4. 针对每个题目：
 *    - 解包到本地目录
 *    - 提取描述、配置、测试数据等
 *    - 校验必要文件完整性
 *    - 生成 config.json（如缺失）
 *    - 生成 status.json（所有状态均为true）
 *    - 组装 ProblemConfig
 * 5. 全部成功则返回题目列表，否则回滚并报错
 */
function importHydroOJ(zipPath, contestDir) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. 校验zip包是否存在
        if (!(yield fs_extra_1.default.pathExists(zipPath))) {
            throw new Error(`File not found: ${zipPath}`);
        }
        // 2. 记录导入前的题目目录快照和配置备份，便于失败时回滚
        const problemRoot = path_1.default.join(contestDir, 'problem');
        const beforeProblems = (yield fs_extra_1.default.pathExists(problemRoot)) ? yield fs_extra_1.default.readdir(problemRoot) : [];
        const configPath = path_1.default.join(contestDir, 'oicontest.json');
        let configBackup = null;
        if (yield fs_extra_1.default.pathExists(configPath)) {
            configBackup = yield fs_extra_1.default.readFile(configPath);
        }
        // 3. 读取zip包内容，准备解压
        const zip = new adm_zip_1.default(zipPath);
        const entries = zip.getEntries();
        let createdProblems = [];
        const problems = [];
        try {
            console.log(chalk_1.default.blue(`Importing HydroOJ package: ${path_1.default.basename(zipPath)}`));
            // 4. 判断单题/多题模式
            //    单题模式：zip根目录下有problem.md等，直接解压到一个题目目录
            //    多题模式：zip下有多个题目目录，每个目录为一个题目
            let isSingleProblem = false;
            for (const entry of entries) {
                // 判断是否为单题模式：必须同时有 problem.md 或 problem_zh.md，且有 problem.yaml 和 testdata 目录
                let hasProblemMd = false;
                let hasProblemYaml = false;
                let hasTestdataDir = false;
                for (const entry of entries) {
                    const entryName = entry.entryName;
                    if (entryName === 'problem.md' || entryName === 'problem_zh.md') {
                        hasProblemMd = true;
                    }
                    if (entryName === 'problem.yaml') {
                        hasProblemYaml = true;
                    }
                }
                if (hasProblemMd && hasProblemYaml) {
                    isSingleProblem = true;
                }
            }
            // 5. 构造题目ID映射表，确保本地目录唯一且不覆盖已有题目
            let mapping = [];
            if (isSingleProblem) {
                // 单题模式：用zip文件名作为题目ID
                const baseName = path_1.default.basename(zipPath, path_1.default.extname(zipPath));
                const uniqueId = yield getUniqueId(baseName, problemRoot);
                mapping.push({ origId: baseName, uniqueId });
            }
            else {
                // 多题模式：每个一级目录为一个题目
                const problemSet = new Set();
                for (const entry of entries) {
                    if (!entry.isDirectory) {
                        const parts = entry.entryName.split('/');
                        if (parts.length >= 2) {
                            problemSet.add(parts[0]);
                        }
                    }
                }
                for (const origId of problemSet) {
                    const uniqueId = yield getUniqueId(origId, problemRoot);
                    mapping.push({ origId, uniqueId });
                }
            }
            // 6. 依次处理每个题目：解压、校验、生成配置
            for (const { origId, uniqueId } of mapping) {
                console.log(chalk_1.default.cyan(`\nProcessing problem: ${uniqueId}`));
                const basePath = path_1.default.join(contestDir, 'problem', uniqueId);
                yield fs_extra_1.default.ensureDir(basePath); // 确保题目目录存在
                createdProblems.push(uniqueId);
                // 6.1 解压：
                // 单题模式直接解压全部内容，多题模式只解压origId目录下内容
                if (isSingleProblem) {
                    zip.extractAllTo(basePath, true);
                }
                else {
                    for (const entry of entries) {
                        if (entry.entryName.startsWith(`${origId}/`)) {
                            const relPath = entry.entryName.substring(origId.length + 1);
                            if (!relPath)
                                continue;
                            const destPath = path_1.default.join(basePath, relPath);
                            if (entry.isDirectory) {
                                yield fs_extra_1.default.ensureDir(destPath);
                            }
                            else {
                                yield fs_extra_1.default.ensureDir(path_1.default.dirname(destPath));
                                const fileContent = zip.readFile(entry);
                                if (fileContent !== null) {
                                    yield fs_extra_1.default.outputFile(destPath, fileContent);
                                }
                            }
                        }
                    }
                }
                // 6.2 校验题目目录完整性，缺失必要文件则抛出异常
                const errMsg = yield checkProblemFiles(basePath);
                if (errMsg)
                    throw new Error(`题目 ${uniqueId} 校验失败：${errMsg}`);
                // 自动补全 solution 目录，并复制模板题解
                const solutionDir = path_1.default.join(basePath, 'solution');
                if (!(yield fs_extra_1.default.pathExists(solutionDir))) {
                    yield fs_extra_1.default.ensureDir(solutionDir);
                    // 拷贝模板题解
                    const templateSol = path_1.default.resolve(__dirname, '../templates/solution/stdsol.md');
                    const destSol = path_1.default.join(solutionDir, 'stdsol.md');
                    if (yield fs_extra_1.default.pathExists(templateSol)) {
                        yield fs_extra_1.default.copyFile(templateSol, destSol);
                    }
                }
                // 6.3 读取本地problem.yaml和testdata/config.yaml，生成config.json
                let problemTitle = uniqueId;
                let timeLimit = 1000;
                let memoryLimit = 256;
                const problemYamlPath = path_1.default.join(basePath, 'problem.yaml');
                if (yield fs_extra_1.default.pathExists(problemYamlPath)) {
                    try {
                        const yaml = require('js-yaml');
                        const yamlData = yaml.load(yield fs_extra_1.default.readFile(problemYamlPath, 'utf8'));
                        if (yamlData && yamlData.title)
                            problemTitle = yamlData.title;
                    }
                    catch (e) {
                        console.warn(chalk_1.default.yellow(`  Failed to parse problem.yaml: ${e.message}`));
                    }
                }
                const testdataConfigPath = path_1.default.join(basePath, 'testdata', 'config.yaml');
                if (yield fs_extra_1.default.pathExists(testdataConfigPath)) {
                    try {
                        const yaml = require('js-yaml');
                        const yamlData = yaml.load(yield fs_extra_1.default.readFile(testdataConfigPath, 'utf8'));
                        if (yamlData && (yamlData.time || yamlData.timeLimit))
                            timeLimit = yamlData.time || yamlData.timeLimit;
                        if (yamlData && (yamlData.memory || yamlData.memoryLimit))
                            memoryLimit = yamlData.memory || yamlData.memoryLimit;
                    }
                    catch (e) {
                        console.warn(chalk_1.default.yellow(`  Failed to parse testdata/config.yaml: ${e.message}`));
                    }
                }
                // 6.4 生成config.json（如已存在且id与uniqueId相同则跳过，否则重写）
                const configPath = path_1.default.join(basePath, 'config.json');
                let skipConfig = false;
                if (yield fs_extra_1.default.pathExists(configPath)) {
                    try {
                        const oldConfig = yield fs_extra_1.default.readJson(configPath);
                        if (oldConfig && oldConfig.id === uniqueId) {
                            skipConfig = true;
                        }
                    }
                    catch (_a) { }
                }
                if (!skipConfig) {
                    const configJson = {
                        id: uniqueId,
                        index: yield (0, utils_1.countSubdirectories)(path_1.default.join(contestDir, 'problem')),
                        title: problemTitle,
                        timeLimit,
                        memoryLimit,
                        maxScore: 100
                    };
                    yield fs_extra_1.default.outputJson(configPath, configJson, { spaces: 2 });
                }
                // 6.5 生成完整的题目状态文件 status.json，所有状态均为true（如已存在则跳过）
                const statusFileName = path_1.default.join(basePath, "status.json");
                if (!(yield fs_extra_1.default.pathExists(statusFileName))) {
                    const problemStatus = {
                        dir: { desc: "目录完整", status: true },
                        isvalidated: { desc: "验证输入数据", status: true },
                        isgenerated: { desc: "评测数据", status: true },
                        ischecked: { desc: "是否检查完整", status: true }
                    };
                    yield fs_extra_1.default.writeFile(statusFileName, JSON.stringify(problemStatus, null, 2), "utf-8");
                }
                // 6.6 组装 ProblemConfig 加入返回列表
                const nextIndex = yield (0, utils_1.countSubdirectories)(path_1.default.join(contestDir, 'problem'));
                problems.push({
                    id: uniqueId,
                    index: nextIndex,
                    title: problemTitle,
                    timeLimit,
                    memoryLimit,
                    maxScore: 100
                });
            }
            // 7. 全部成功则返回题目列表，否则回滚
            if (problems.length === 0) {
                throw new Error('No valid problems found in the import package');
            }
            console.log(chalk_1.default.green(`\n✅ Successfully imported ${problems.length} problems`));
            return problems;
        }
        catch (e) {
            // 8. 回滚：删除新建题目目录，恢复 contest 配置
            for (const p of createdProblems) {
                // 只删除本次新建且不在导入前目录快照中的目录，避免误删原有题目
                if (!beforeProblems.includes(p)) {
                    const dir = path_1.default.join(problemRoot, p);
                    if (yield fs_extra_1.default.pathExists(dir))
                        yield fs_extra_1.default.rm(dir, { recursive: true, force: true });
                }
            }
            if (configBackup)
                yield fs_extra_1.default.writeFile(configPath, configBackup);
            console.error(chalk_1.default.red(`导入失败，已恢复到导入前状态：${e.message}`));
            process.exit(1);
        }
    });
}
