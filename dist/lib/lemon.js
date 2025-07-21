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
exports.generateLemonPackage = generateLemonPackage;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const archiver_1 = __importDefault(require("archiver"));
/**
 * 生成 LEMON 评测包
 *
 * LEMON 是一个开源的在线评测系统，支持多种编程语言和评测方式。
 * 此函数将 OIContest 的题目数据转换为 LEMON 系统可识别的格式。
 *
 * @param config 比赛配置信息
 * @returns Promise<string> 生成的 ZIP 包路径
 */
function generateLemonPackage(config) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.cyan('🍋 Generating LEMON evaluation package...'));
        try {
            // 第一步：创建 LEMON 包的基础目录结构
            const { contestDir, dataDir, sourceDir } = yield createLemonDirectoryStructure(config);
            // 第二步：处理每个题目的测试数据和配置
            yield processAllProblems(config.problems, dataDir, sourceDir);
            // 第三步：创建比赛级别的配置文件
            yield createContestConfig(config, contestDir);
            // 第四步：将整个目录打包成 ZIP 文件
            const zipPath = yield createLemonZipPackage(contestDir, config.name + "_lemon");
            console.log(chalk_1.default.green(`✅ LEMON package generated successfully!`));
            console.log(chalk_1.default.cyan(`  Package path: ${zipPath}`));
            console.log(chalk_1.default.cyan(`  Package size: ${yield getFileSize(zipPath)}`));
            return zipPath;
        }
        catch (error) {
            console.error(chalk_1.default.red(`❌ Failed to generate LEMON package: ${error.message}`));
            throw error;
        }
    });
}
/**
 * 创建 LEMON 包的基础目录结构
 *
 * LEMON 系统要求特定的目录结构：
 * - contest_name/
 *   - data/          # 存放所有题目的测试数据
 *   - source/        # 存放源代码（可选）
 *   - contest.json   # 比赛配置文件
 *
 * @param config 比赛配置
 * @returns 创建的目录路径信息
 */
function createLemonDirectoryStructure(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const contestDir = path_1.default.join(process.cwd(), 'output', config.name);
        const dataDir = path_1.default.join(contestDir, 'data');
        const sourceDir = path_1.default.join(contestDir, 'source');
        // 确保目录存在，如果不存在则创建
        yield fs_extra_1.default.ensureDir(dataDir);
        yield fs_extra_1.default.ensureDir(sourceDir);
        console.log(chalk_1.default.cyan(`  📁 Created contest directory: ${contestDir}`));
        console.log(chalk_1.default.cyan(`  📁 Created data directory: ${dataDir}`));
        console.log(chalk_1.default.cyan(`  📁 Created source directory: ${sourceDir}`));
        return { contestDir, dataDir, sourceDir };
    });
}
/**
 * 处理所有题目的测试数据和配置
 *
 * 对每个题目执行以下操作：
 * 1. 复制测试数据文件（.in 和 .out）
 * 2. 重命名为 LEMON 要求的格式（1.in, 1.out, 2.in, 2.out...）
 * 3. 复制校验器（如果有）
 * 4. 复制标准答案文件（如果有）
 * 5. 创建题目配置文件
 *
 * @param problems 题目列表
 * @param dataDir LEMON 数据目录
 * @param sourceDir LEMON 源码目录
 */
function processAllProblems(problems, dataDir, sourceDir) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.cyan(`\n  📝 Processing ${problems.length} problems...`));
        for (const problem of problems) {
            try {
                yield processSingleProblem(problem, dataDir, sourceDir);
            }
            catch (error) {
                console.error(chalk_1.default.red(`  ❌ Failed to process problem ${problem.id}: ${error.message}`));
                // 继续处理其他题目，不中断整个流程
            }
        }
    });
}
/**
 * 处理单个题目的所有数据
 *
 * @param problemConfig 题目配置
 * @param lemonDataDir LEMON 数据目录
 * @param lemonSourceDir LEMON 源码目录
 */
function processSingleProblem(problemConfig, lemonDataDir, lemonSourceDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const lemonProblemDir = path_1.default.join(lemonDataDir, problemConfig.id);
        yield fs_extra_1.default.ensureDir(lemonProblemDir);
        console.log(chalk_1.default.cyan(`  🔧 Processing problem: ${problemConfig.id} - ${problemConfig.title}`));
        // 处理测试数据文件
        const testCount = yield processTestData(problemConfig, lemonProblemDir);
        // 处理校验器
        yield processChecker(problemConfig, lemonProblemDir);
        // 处理标准答案文件
        yield processStandardSolution(problemConfig, lemonSourceDir);
        // 创建题目配置文件
        //await createProblemConfig(problemConfig, lemonProblemDir, testCount);
        console.log(chalk_1.default.green(`  ✅ Problem ${problemConfig.id} processed successfully (${testCount} files)`));
    });
}
/**
 * 处理题目的测试数据文件
 *
 * 直接将 OIContest 的 testdata 目录中的所有文件复制到 LEMON 包中：
 * - 复制所有文件，保持原始文件名
 * - 不进行重命名转换
 * - 保持原有的文件结构
 *
 * @param problem 题目配置
 * @param problemDir 题目目录
 * @returns 复制的文件数量
 */
function processTestData(problem, problemDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const testdataSrcDir = path_1.default.join(process.cwd(), 'problem', problem.id, 'testdata');
        if (!(yield fs_extra_1.default.pathExists(testdataSrcDir))) {
            console.log(chalk_1.default.yellow(`  ⚠️  No testdata directory found for problem ${problem.id}`));
            return 0;
        }
        try {
            // 直接复制整个 testdata 目录的内容到目标目录
            yield fs_extra_1.default.copy(testdataSrcDir, problemDir);
            // 统计复制的文件数量
            const copiedFiles = yield fs_extra_1.default.readdir(problemDir);
            const fileCount = copiedFiles.length;
            console.log(chalk_1.default.cyan(`  📄 Copied ${fileCount} files from testdata: ${copiedFiles.join(', ')}`));
            return fileCount;
        }
        catch (error) {
            console.error(chalk_1.default.red(`  ❌ Failed to copy testdata for problem ${problem.id}: ${error.message}`));
            return 0;
        }
    });
}
/**
 * 处理题目的校验器文件
 *
 * 如果题目有自定义校验器，将其复制到 LEMON 包中。
 * LEMON 支持自定义校验器来判断答案的正确性。
 *
 * @param problemConfig 题目配置
 * @param lemonProblemDir 题目目录
 */
function processChecker(problemConfig, lemonProblemDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const checkerPath = path_1.default.join(process.cwd(), 'problem', problemConfig.id, 'src', 'checker.cpp');
        if (yield fs_extra_1.default.pathExists(checkerPath)) {
            try {
                yield fs_extra_1.default.copyFile(checkerPath, path_1.default.join(lemonProblemDir, 'checker.cpp'));
                console.log(chalk_1.default.cyan(`  🔍 Added custom checker for problem ${problemConfig.id}`));
            }
            catch (error) {
                console.error(chalk_1.default.red(`  ❌ Failed to copy checker for problem ${problemConfig.id}: ${error.message}`));
            }
        }
        else {
            console.log(chalk_1.default.cyan(`  🔍 Using default checker for problem ${problemConfig.id}`));
        }
    });
}
/**
 * 处理题目的标准答案文件
 *
 * 如果题目有标准答案文件（std.cpp），将其复制到 LEMON 包的 source/std 目录下。
 * 标准答案文件用于参考和对比。
 *
 * @param problemConfig 题目配置
 * @param lemonSourceDir LEMON 源码目录
 */
function processStandardSolution(problemConfig, lemonSourceDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const stdSolutionPath = path_1.default.join(process.cwd(), 'problem', problemConfig.id, 'src', 'std.cpp');
        if (yield fs_extra_1.default.pathExists(stdSolutionPath)) {
            try {
                // 创建标准答案目录结构：source/std/problemid/
                const stdDir = path_1.default.join(lemonSourceDir, 'std', problemConfig.id);
                yield fs_extra_1.default.ensureDir(stdDir);
                // 复制标准答案文件并重命名为 problemid.cpp
                const targetPath = path_1.default.join(stdDir, `${problemConfig.id}.cpp`);
                yield fs_extra_1.default.copyFile(stdSolutionPath, targetPath);
                console.log(chalk_1.default.cyan(`  📝 Added standard solution for problem ${problemConfig.id}`));
            }
            catch (error) {
                console.error(chalk_1.default.red(`  ❌ Failed to copy standard solution for problem ${problemConfig.id}: ${error.message}`));
            }
        }
        else {
            console.log(chalk_1.default.cyan(`  📝 No standard solution found for problem ${problemConfig.id}`));
        }
    });
}
/**
 * 创建题目的配置文件
 *
 * 为每个题目创建 problem.json 配置文件，包含：
 * - 题目基本信息（ID、标题）
 * - 评测参数（时间限制、内存限制）
 * - 分值设置
 * - 测试用例数量
 *
 * @param problem 题目配置
 * @param problemDir 题目目录
 * @param testCount 测试用例数量
 */
function createProblemConfig(problem, problemDir, testCount) {
    return __awaiter(this, void 0, void 0, function* () {
        const problemConfig = {
            id: problem.id,
            title: problem.title,
            timeLimit: problem.timeLimit / 1000, // 转换为秒（LEMON 使用秒为单位）
            memoryLimit: problem.memoryLimit, // MB（LEMON 使用 MB 为单位）
            maxScore: problem.maxScore,
            testPoints: testCount,
            // 可以添加更多 LEMON 特定的配置项
            checker: 'checker.cpp', // 校验器文件名
            inputFile: '', // 输入文件名（空表示标准输入）
            outputFile: '' // 输出文件名（空表示标准输出）
        };
        const configPath = path_1.default.join(problemDir, 'problem.json');
        yield fs_extra_1.default.writeJson(configPath, problemConfig, { spaces: 2 });
        console.log(chalk_1.default.cyan(`  ⚙️  Created problem config: ${configPath}`));
    });
}
/**
 * 创建比赛级别的配置文件
 *
 * 创建 contest.json 文件，包含整个比赛的基本信息：
 * - 比赛名称和描述
 * - 比赛时长和开始时间
 * - 作者信息
 * - 题目列表
 *
 * @param config 比赛配置
 * @param contestDir 比赛目录
 */
function createContestConfig(config, contestDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const contestConfig = {
            name: config.name,
            description: config.description,
            duration: config.duration, // 分钟
            startTime: config.startTime, // 格式：YYYY-MM-DD HH:mm
            author: config.author,
            problems: config.problems.map(p => ({
                id: p.id,
                title: p.title,
                maxScore: p.maxScore,
                index: p.index // 题目顺序
            })),
            // LEMON 系统特定的配置
            contestType: 'OI', // 比赛类型：OI（信息学奥林匹克）
            allowPartialScore: true, // 允许部分得分
            showScore: true, // 显示得分
            showRanking: true // 显示排名
        };
        const configPath = path_1.default.join(contestDir, 'contest.json');
        yield fs_extra_1.default.writeJson(configPath, contestConfig, { spaces: 2 });
        console.log(chalk_1.default.cyan(`  ⚙️  Created contest config: ${configPath}`));
    });
}
/**
 * 创建 LEMON 包的 ZIP 文件
 *
 * 使用 archiver 库将整个比赛目录压缩成 ZIP 文件，
 * 这是 LEMON 系统导入比赛的标准格式。
 *
 * @param contestDir 比赛目录
 * @param contestName 比赛名称
 * @returns ZIP 文件路径
 */
function createLemonZipPackage(contestDir, contestName) {
    return __awaiter(this, void 0, void 0, function* () {
        const zipPath = path_1.default.join(process.cwd(), 'output', `${contestName}.zip`);
        console.log(chalk_1.default.cyan(`  📦 Creating ZIP package: ${zipPath}`));
        return new Promise((resolve, reject) => {
            const archive = (0, archiver_1.default)('zip', {
                zlib: { level: 9 } // 最高压缩级别
            });
            const stream = fs_extra_1.default.createWriteStream(zipPath);
            // 监听压缩过程中的事件
            archive.on('error', (err) => {
                console.error(chalk_1.default.red(`  ❌ Archive error: ${err.message}`));
                reject(err);
            });
            archive.on('warning', (err) => {
                if (err.code === 'ENOENT') {
                    console.log(chalk_1.default.yellow(`  ⚠️  Archive warning: ${err.message}`));
                }
                else {
                    reject(err);
                }
            });
            stream.on('close', () => {
                console.log(chalk_1.default.green(`  ✅ ZIP package created successfully`));
                resolve(zipPath);
            });
            // 将目录添加到压缩包中
            archive.directory(contestDir, false);
            archive.pipe(stream);
            archive.finalize();
        });
    });
}
/**
 * 获取文件大小（用于显示包的大小信息）
 *
 * @param filePath 文件路径
 * @returns 格式化的文件大小字符串
 */
function getFileSize(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield fs_extra_1.default.stat(filePath);
            const bytes = stats.size;
            if (bytes < 1024)
                return `${bytes} B`;
            if (bytes < 1024 * 1024)
                return `${(bytes / 1024).toFixed(1)} KB`;
            if (bytes < 1024 * 1024 * 1024)
                return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        }
        catch (error) {
            return 'Unknown';
        }
    });
}
