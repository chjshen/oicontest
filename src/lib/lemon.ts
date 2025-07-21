import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { ContestConfig, ProblemConfig } from './config';
import chalk from 'chalk';
import archiver from 'archiver';

/**
 * 生成 LEMON 评测包
 * 
 * LEMON 是一个开源的在线评测系统，支持多种编程语言和评测方式。
 * 此函数将 OIContest 的题目数据转换为 LEMON 系统可识别的格式。
 * 
 * @param config 比赛配置信息
 * @returns Promise<string> 生成的 ZIP 包路径
 */
export async function generateLemonPackage(config: ContestConfig): Promise<string> {
  console.log(chalk.cyan('🍋 Generating LEMON evaluation package...'));
  
  try {
    // 第一步：创建 LEMON 包的基础目录结构
    const { contestDir, dataDir, sourceDir } = await createLemonDirectoryStructure(config);
    
    // 第二步：处理每个题目的测试数据和配置
    await processAllProblems(config.problems, dataDir, sourceDir);
    
    // 第三步：创建比赛级别的配置文件
    await createContestConfig(config, contestDir);
    
    // 第四步：将整个目录打包成 ZIP 文件
    const zipPath = await createLemonZipPackage(contestDir, config.name+"_lemon");
    
    console.log(chalk.green(`✅ LEMON package generated successfully!`));
    console.log(chalk.cyan(`  Package path: ${zipPath}`));
    console.log(chalk.cyan(`  Package size: ${await getFileSize(zipPath)}`));
    
    return zipPath;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to generate LEMON package: ${(error as Error).message}`));
    throw error;
  }
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
async function createLemonDirectoryStructure(config: ContestConfig) {
  const contestDir = path.join(process.cwd(), 'output', config.name);
  const dataDir = path.join(contestDir, 'data');
  const sourceDir = path.join(contestDir, 'source');
  
  // 确保目录存在，如果不存在则创建
  await fs.ensureDir(dataDir);
  await fs.ensureDir(sourceDir);
  
  console.log(chalk.cyan(`  📁 Created contest directory: ${contestDir}`));
  console.log(chalk.cyan(`  📁 Created data directory: ${dataDir}`));
  console.log(chalk.cyan(`  📁 Created source directory: ${sourceDir}`));
  
  return { contestDir, dataDir, sourceDir };
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
async function processAllProblems(problems: ProblemConfig[], dataDir: string, sourceDir: string) {
  console.log(chalk.cyan(`\n  📝 Processing ${problems.length} problems...`));
  
  for (const problem of problems) {
    try {
      await processSingleProblem(problem, dataDir, sourceDir);
    } catch (error) {
      console.error(chalk.red(`  ❌ Failed to process problem ${problem.id}: ${(error as Error).message}`));
      // 继续处理其他题目，不中断整个流程
    }
  }
}

/**
 * 处理单个题目的所有数据
 * 
 * @param problemConfig 题目配置
 * @param lemonDataDir LEMON 数据目录
 * @param lemonSourceDir LEMON 源码目录
 */
async function processSingleProblem(problemConfig: ProblemConfig, lemonDataDir: string, lemonSourceDir: string) {
  const lemonProblemDir = path.join(lemonDataDir, problemConfig.id);
  await fs.ensureDir(lemonProblemDir);
  
  console.log(chalk.cyan(`  🔧 Processing problem: ${problemConfig.id} - ${problemConfig.title}`));
  
  // 处理测试数据文件
  const testCount = await processTestData(problemConfig, lemonProblemDir);
  
  // 处理校验器
  await processChecker(problemConfig, lemonProblemDir);
  
  // 处理标准答案文件
  await processStandardSolution(problemConfig, lemonSourceDir);
  
  // 创建题目配置文件
  //await createProblemConfig(problemConfig, lemonProblemDir, testCount);
  
  console.log(chalk.green(`  ✅ Problem ${problemConfig.id} processed successfully (${testCount} files)`));
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
async function processTestData(problem: ProblemConfig, problemDir: string): Promise<number> {
  const testdataSrcDir = path.join(process.cwd(), 'problem', problem.id, 'testdata');
  
  if (!await fs.pathExists(testdataSrcDir)) {
    console.log(chalk.yellow(`  ⚠️  No testdata directory found for problem ${problem.id}`));
    return 0;
  }
  
  try {
    // 直接复制整个 testdata 目录的内容到目标目录
    await fs.copy(testdataSrcDir, problemDir);
    
    // 统计复制的文件数量
    const copiedFiles = await fs.readdir(problemDir);
    const fileCount = copiedFiles.length;
    
    console.log(chalk.cyan(`  📄 Copied ${fileCount} files from testdata: ${copiedFiles.join(', ')}`));
    return fileCount;
  } catch (error) {
    console.error(chalk.red(`  ❌ Failed to copy testdata for problem ${problem.id}: ${(error as Error).message}`));
    return 0;
  }
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
async function processChecker(problemConfig: ProblemConfig, lemonProblemDir: string) {
  const checkerPath = path.join(process.cwd(), 'problem', problemConfig.id, 'src', 'checker.cpp');
  
  if (await fs.pathExists(checkerPath)) {
    try {
      await fs.copyFile(checkerPath, path.join(lemonProblemDir, 'checker.cpp'));
      console.log(chalk.cyan(`  🔍 Added custom checker for problem ${problemConfig.id}`));
    } catch (error) {
      console.error(chalk.red(`  ❌ Failed to copy checker for problem ${problemConfig.id}: ${(error as Error).message}`));
    }
  } else {
    console.log(chalk.cyan(`  🔍 Using default checker for problem ${problemConfig.id}`));
  }
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
async function processStandardSolution(problemConfig: ProblemConfig, lemonSourceDir: string) {
  const stdSolutionPath = path.join(process.cwd(), 'problem', problemConfig.id, 'src', 'std.cpp');
  
  if (await fs.pathExists(stdSolutionPath)) {
    try {
      // 创建标准答案目录结构：source/std/problemid/
      const stdDir = path.join(lemonSourceDir, 'std', problemConfig.id);
      await fs.ensureDir(stdDir);
      
      // 复制标准答案文件并重命名为 problemid.cpp
      const targetPath = path.join(stdDir, `${problemConfig.id}.cpp`);
      await fs.copyFile(stdSolutionPath, targetPath);
      
      console.log(chalk.cyan(`  📝 Added standard solution for problem ${problemConfig.id}`));
    } catch (error) {
      console.error(chalk.red(`  ❌ Failed to copy standard solution for problem ${problemConfig.id}: ${(error as Error).message}`));
    }
  } else {
    console.log(chalk.cyan(`  📝 No standard solution found for problem ${problemConfig.id}`));
  }
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
async function createProblemConfig(problem: ProblemConfig, problemDir: string, testCount: number) {
  const problemConfig = {
    id: problem.id,
    title: problem.title,
    timeLimit: problem.timeLimit / 1000, // 转换为秒（LEMON 使用秒为单位）
    memoryLimit: problem.memoryLimit,    // MB（LEMON 使用 MB 为单位）
    maxScore: problem.maxScore,
    testPoints: testCount,
    // 可以添加更多 LEMON 特定的配置项
    checker: 'checker.cpp',              // 校验器文件名
    inputFile: '',                       // 输入文件名（空表示标准输入）
    outputFile: ''                       // 输出文件名（空表示标准输出）
  };
  
  const configPath = path.join(problemDir, 'problem.json');
  await fs.writeJson(configPath, problemConfig, { spaces: 2 });
  
  console.log(chalk.cyan(`  ⚙️  Created problem config: ${configPath}`));
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
async function createContestConfig(config: ContestConfig, contestDir: string) {
  const contestConfig = {
    name: config.name,
    description: config.description,
    duration: config.duration,           // 分钟
    startTime: config.startTime,         // 格式：YYYY-MM-DD HH:mm
    author: config.author,
    problems: config.problems.map(p => ({
      id: p.id,
      title: p.title,
      maxScore: p.maxScore,
      index: p.index                     // 题目顺序
    })),
    // LEMON 系统特定的配置
    contestType: 'OI',                   // 比赛类型：OI（信息学奥林匹克）
    allowPartialScore: true,             // 允许部分得分
    showScore: true,                     // 显示得分
    showRanking: true                    // 显示排名
  };
  
  const configPath = path.join(contestDir, 'contest.json');
  await fs.writeJson(configPath, contestConfig, { spaces: 2 });
  
  console.log(chalk.cyan(`  ⚙️  Created contest config: ${configPath}`));
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
async function createLemonZipPackage(contestDir: string, contestName: string): Promise<string> {
  const zipPath = path.join(process.cwd(), 'output', `${contestName}.zip`);
  
  console.log(chalk.cyan(`  📦 Creating ZIP package: ${zipPath}`));
  
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { 
      zlib: { level: 9 }  // 最高压缩级别
    });
    const stream = fs.createWriteStream(zipPath);

    // 监听压缩过程中的事件
    archive.on('error', (err: any) => {
      console.error(chalk.red(`  ❌ Archive error: ${err.message}`));
      reject(err);
    });

    archive.on('warning', (err: any) => {
      if (err.code === 'ENOENT') {
        console.log(chalk.yellow(`  ⚠️  Archive warning: ${err.message}`));
      } else {
        reject(err);
      }
    });

    stream.on('close', () => {
      console.log(chalk.green(`  ✅ ZIP package created successfully`));
      resolve(zipPath);
    });

    // 将目录添加到压缩包中
    archive.directory(contestDir, false);
    archive.pipe(stream);
    archive.finalize();
  });
}

/**
 * 获取文件大小（用于显示包的大小信息）
 * 
 * @param filePath 文件路径
 * @returns 格式化的文件大小字符串
 */
async function getFileSize(filePath: string): Promise<string> {
  try {
    const stats = await fs.stat(filePath);
    const bytes = stats.size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } catch (error) {
    return 'Unknown';
  }
}