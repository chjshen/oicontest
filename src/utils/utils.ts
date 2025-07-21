
import yaml from "js-yaml";
import { mkdirp } from 'mkdirp';
import chalk from 'chalk';
import { rimraf } from 'rimraf';
import fs from 'fs-extra';
import { ContestConfig, loadConfig } from "../lib/config";
import { convertMarkdownImagePaths } from "./handleMardown";

//@ts-ignore
const path = require("path");

// 获取模板内容
export function getTemplate(templateDir: string, templateName: string): string {
  return fs.readFileSync(
    path.join(templateDir, templateName),
    "utf-8"
  );
}

// 写入文件，如果目录不存在则创建
export function writeFileWithDir(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir);
  }
  fs.writeFileSync(filePath, content);
}

// 读取 YAML 文件
export function readYaml(filePath: string) {
  try {
    return yaml.load(fs.readFileSync(filePath, "utf-8"));
  } catch (e: any) {
    console.error(
      chalk.red(`Error reading YAML file ${filePath}: ${e.message}`)
    );
    return null;
  }
}

// 写入 YAML 文件
export function writeYaml(filePath: string, data: Object) {
  writeFileWithDir(filePath, yaml.dump(data));
}

// 检查文件是否存在
export function checkFileExists(filePath: string) {
  return fs.existsSync(filePath);
}

export async function countSubdirectories(directoryPath: string) {
  try {
    const items = await fs.readdir(directoryPath);
    let subdirCount = 0;

    // 并行检查所有项目
    const results = await Promise.all(
      items.map(async (item: string) => {
        const fullPath = path.join(directoryPath, item);
        const stats = await fs.stat(fullPath);
        return stats.isDirectory();
      })
    );

    // 统计目录数量
    results.forEach(isDirectory => {
      if (isDirectory) subdirCount++;
    });

    return subdirCount;
  } catch (error) {
    console.error(`无法读取目录: ${directoryPath}`, error);
    return -1;
  }
}
export async function loadJsonFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`JSON file not found. Are you in a contest directory?`);
  }
  return fs.readJSON(filePath);
}
export async function verifyProblems(problemDir: string) {
  //验证题目
  //1.读取各题目的status.json,返回已经验证的数量

  const items = await fs.readdir(problemDir);
  console.error(items);
  let verifiedCount = 0;
  // 并行检查所有项目
  const results = await Promise.all(
    items.map(async (item: string) => {
      const fullPath = path.join(problemDir, item, "status.json");
      console.error(fullPath)

      return fullPath;
    })
  );


  // 统计数量

  // 由于 loadJsonFile 是异步函数，需要使用 await
  // 因为 forEach 不支持 await，改用 for...of 循环
  for (const fullPath of results) {
    try {
      const status = await loadJsonFile(fullPath);
      if (status.ischecked && status.ischecked.status) verifiedCount++;
    } catch (err) {
      // 可以选择忽略错误或记录日志
      console.error(`Error loading ${fullPath}:`, err);
    }
  }
  return verifiedCount;

}

export async function contestInfoToMarkdown(config: ContestConfig)
{
  const contestDir = process.cwd();

  //先将contest信息转换成markdown格式

  if (config.problems.length === 0) {
    console.error(chalk.red('Error: No problems added to contest'));
    process.exit(1);
  }

  
  let mdContent: string = "";
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
  })
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
      mdProblemsTable += s + "|"
    })
  }
  //加入注意事项
  const notice = await fs.readFile(path.join(__dirname, "../templates", "notice.md"));
  mdContent = "\n" + notice + "\n\n";

  for (const p of config.problems) {
    let mdfile = path.resolve(contestDir, "problem", p.id, "problem.md");
    if (!fs.existsSync(mdfile))
      mdfile = path.resolve(contestDir, "problem", p.id, "problem_zh.md");
    if (!fs.existsSync(mdfile)) {
      console.error(chalk.red(`题目文件${mdfile}未找到！`));
      process.exit(1);
    }
    const problemConfig = await fs.readJSON(path.join(contestDir, "problem", p.id, "config.json"));
    mdContent = mdContent + "\n-----------------\n\n# " + problemConfig.title + "\n\n";
    //将里面的所有图片转换成绝对路径
    mdContent += await convertMarkdownImagePaths(mdfile);
    
  }
  const mdAll = mdTitle + "\n" + mdProblemsTable + mdContent;

  //转换成html
  return mdAll;
}
