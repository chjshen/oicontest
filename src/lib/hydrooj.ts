
import AdmZip from 'adm-zip';
import { ProblemConfig, ProblemStatus, ProblemConfigJson } from './config';
import chalk from 'chalk';
import { countSubdirectories } from '../utils/utils';
import fs from 'fs-extra';
import path from 'path';

/**
 * 校验题目目录下必要文件完整性
 * @param basePath 题目根目录
 * @returns 缺失时返回错误信息，否则返回null
 */
export async function checkProblemFiles(basePath: string): Promise<string | null> {
  // 1. 检查 problem*.md
  // 正则表达式中的*表示前面的字符可以重复0次或多次
  // 但 /^problem*\.md$/ 实际上会匹配 "probl.md", "proble.md", "problemm.md" 等
  // 如果想匹配以 "problem" 开头、以 ".md" 结尾的文件名，应该用 /^problem.*\.md$/
  
  const mdFiles = (await fs.readdir(basePath)).filter((f: string) => /^problem.*\.md$/.test(f));
  
  if (mdFiles.length === 0) return '缺少 problem*.md 文件';
  
  // 2. 检查 problem.yaml
  if (!(await fs.pathExists(path.join(basePath, 'problem.yaml')))) return '缺少 problem.yaml 文件';
  // 3. 检查 testdata 目录
  const testdataPath = path.join(basePath, 'testdata');
  if (!(await fs.pathExists(testdataPath)) || !(await fs.stat(testdataPath)).isDirectory()) return '缺少 testdata 目录';
  // 4. 检查 testdata/config.yaml
  if (!(await fs.pathExists(path.join(testdataPath, 'config.yaml')))) return 'testdata 目录下缺少 config.yaml';
  // 5. 检查输入输出文件配对
  const files = await fs.readdir(testdataPath);
  const ins = files.filter((f: string) => f.endsWith('.in')).map((f: string) => f.replace(/\.in$/, ''));
  const outs = files.filter((f: string) => f.endsWith('.ans') || f.endsWith('.out')).map((f: string) => f.replace(/\.(ans|out)$/, ''));
  const pairs = ins.filter((name: string) => outs.includes(name));
  if (pairs.length === 0) return 'testdata 目录下没有配对的输入输出文件（如 1.in 和 1.ans/1.out）';
  return null;
}

/**
 * 获取不与本地已存在题目目录冲突的唯一题目ID
 * @param baseId 原始题目ID
 * @param problemRoot 题库根目录
 */
async function getUniqueId(baseId: string, problemRoot: string): Promise<string> {
  let uniqueId = baseId;
  let idx = 1;
  while (await fs.pathExists(path.join(problemRoot, uniqueId))) {
    uniqueId = `${baseId}_${idx}`;
    idx++;
  }
  return uniqueId;
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
export async function importHydroOJ(zipPath: string, contestDir: string): Promise<ProblemConfig[]> {
  // 1. 校验zip包是否存在
  if (!(await fs.pathExists(zipPath))) {
    throw new Error(`File not found: ${zipPath}`);
  }
  // 2. 记录导入前的题目目录快照和配置备份，便于失败时回滚
  const problemRoot = path.join(contestDir, 'problem');
  const beforeProblems = (await fs.pathExists(problemRoot)) ? await fs.readdir(problemRoot) : [];
  const configPath = path.join(contestDir, 'oicontest.json');
  let configBackup = null;
  if (await fs.pathExists(configPath)) {
    configBackup = await fs.readFile(configPath);
  }
  // 3. 读取zip包内容，准备解压
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  let createdProblems: string[] = [];
  const problems: ProblemConfig[] = [];
  try {
    console.log(chalk.blue(`Importing HydroOJ package: ${path.basename(zipPath)}`));
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
      if (hasProblemMd && hasProblemYaml ) {
        isSingleProblem = true;
      }
    }
    // 5. 构造题目ID映射表，确保本地目录唯一且不覆盖已有题目
    let mapping: { origId: string, uniqueId: string }[] = [];
    if (isSingleProblem) {
      // 单题模式：用zip文件名作为题目ID
      const baseName = path.basename(zipPath, path.extname(zipPath));
      const uniqueId = await getUniqueId(baseName, problemRoot);
      mapping.push({ origId: baseName, uniqueId });
    } else {
      // 多题模式：每个一级目录为一个题目
      const problemSet = new Set<string>();
      for (const entry of entries) { 
        if (!entry.isDirectory) {
          const parts = entry.entryName.split('/');
          if (parts.length >= 2) {
            problemSet.add(parts[0]);
          }
        }
      }
      for (const origId of problemSet) {
        const uniqueId = await getUniqueId(origId, problemRoot);
        mapping.push({ origId, uniqueId });
      }
    }
    // 6. 依次处理每个题目：解压、校验、生成配置
    for (const { origId, uniqueId } of mapping) {
      console.log(chalk.cyan(`\nProcessing problem: ${uniqueId}`));
      const basePath = path.join(contestDir, 'problem', uniqueId);
      await fs.ensureDir(basePath); // 确保题目目录存在
      createdProblems.push(uniqueId);
      // 6.1 解压：
      // 单题模式直接解压全部内容，多题模式只解压origId目录下内容
      if (isSingleProblem) {
        zip.extractAllTo(basePath, true);
      } else {
        for (const entry of entries) {
          if (entry.entryName.startsWith(`${origId}/`)) {
            const relPath = entry.entryName.substring(origId.length + 1);
            if (!relPath) continue;
            const destPath = path.join(basePath, relPath);
            if (entry.isDirectory) {
              await fs.ensureDir(destPath);
            } else {
              await fs.ensureDir(path.dirname(destPath));
              const fileContent = zip.readFile(entry);
              if (fileContent !== null) {
                await fs.outputFile(destPath, fileContent);
              }
            }
          }
        }
      }
      // 6.2 校验题目目录完整性，缺失必要文件则抛出异常
      const errMsg = await checkProblemFiles(basePath);
      if (errMsg) throw new Error(`题目 ${uniqueId} 校验失败：${errMsg}`);
      // 自动补全 solution 目录，并复制模板题解
      const solutionDir = path.join(basePath, 'solution');
      if (!(await fs.pathExists(solutionDir))) {
        await fs.ensureDir(solutionDir);
        // 拷贝模板题解
        const templateSol = path.resolve(__dirname, '../templates/solution/stdsol.md');
        const destSol = path.join(solutionDir, 'stdsol.md');
        if (await fs.pathExists(templateSol)) {
          await fs.copyFile(templateSol, destSol);
        }
      }
      // 6.3 读取本地problem.yaml和testdata/config.yaml，生成config.json
      let problemTitle = uniqueId;
      let timeLimit = 1000;
      let memoryLimit = 256;
      const problemYamlPath = path.join(basePath, 'problem.yaml');
      if (await fs.pathExists(problemYamlPath)) {
        try {
          const yaml = require('js-yaml');
          const yamlData = yaml.load(await fs.readFile(problemYamlPath, 'utf8'));
          if (yamlData && yamlData.title) problemTitle = yamlData.title;
        } catch (e: any) {
          console.warn(chalk.yellow(`  Failed to parse problem.yaml: ${e.message}`));
        }
      }
      const testdataConfigPath = path.join(basePath, 'testdata', 'config.yaml');
      if (await fs.pathExists(testdataConfigPath)) {
        try {
          const yaml = require('js-yaml');
          const yamlData = yaml.load(await fs.readFile(testdataConfigPath, 'utf8'));
          if (yamlData && (yamlData.time || yamlData.timeLimit)) timeLimit = yamlData.time || yamlData.timeLimit;
          if (yamlData && (yamlData.memory || yamlData.memoryLimit)) memoryLimit = yamlData.memory || yamlData.memoryLimit;
        } catch (e: any) {
          console.warn(chalk.yellow(`  Failed to parse testdata/config.yaml: ${e.message}`));
        }
      }
      // 6.4 生成config.json（如已存在且id与uniqueId相同则跳过，否则重写）
      const configPath = path.join(basePath, 'config.json');
      let skipConfig = false;
      if (await fs.pathExists(configPath)) {
        try {
          const oldConfig = await fs.readJson(configPath);
          if (oldConfig && oldConfig.id === uniqueId) {
            skipConfig = true;
          }
        } catch {}
      }
      if (!skipConfig) {
        const configJson: ProblemConfigJson = {
          id: uniqueId,
          index: await countSubdirectories(path.join(contestDir, 'problem')),
          title: problemTitle,
          timeLimit,
          memoryLimit,
          maxScore: 100
        };
        await fs.outputJson(configPath, configJson, { spaces: 2 });
      }
      // 6.5 生成完整的题目状态文件 status.json，所有状态均为true（如已存在则跳过）
      const statusFileName = path.join(basePath, "status.json");
      if (!(await fs.pathExists(statusFileName))) {
        const problemStatus: ProblemStatus = {
          dir: { desc: "目录完整", status: true },
          isvalidated: { desc: "验证输入数据", status: true },
          isgenerated: { desc: "评测数据", status: true },
          ischecked: { desc: "是否检查完整", status: true }
        };
        await fs.writeFile(statusFileName, JSON.stringify(problemStatus, null, 2), "utf-8");
      }
      // 6.6 组装 ProblemConfig 加入返回列表
      const nextIndex = await countSubdirectories(path.join(contestDir, 'problem'));
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
    console.log(chalk.green(`\n✅ Successfully imported ${problems.length} problems`));
    return problems;
  } catch (e: any) {
    // 8. 回滚：删除新建题目目录，恢复 contest 配置
    for (const p of createdProblems) {
      // 只删除本次新建且不在导入前目录快照中的目录，避免误删原有题目
      if (!beforeProblems.includes(p)) {
        const dir = path.join(problemRoot, p);
        if (await fs.pathExists(dir)) await fs.rm(dir, { recursive: true, force: true });
      }
    }
    if (configBackup) await fs.writeFile(configPath, configBackup);
    console.error(chalk.red(`导入失败，已恢复到导入前状态：${e.message}`));
    process.exit(1);
  }
}