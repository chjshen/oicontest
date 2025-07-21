import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import inquirer from 'inquirer';
import {  getTemplate, writeFileWithDir, writeYaml } from '../utils/utils';
import { loadConfig, saveConfig, ProblemConfig, ProblemStatus } from '../lib/config';
import chalk from 'chalk';
import { mkdirp } from 'mkdirp';

export const addProblemCommand = new Command('addproblem')
  .description('Add a new problem to the contest')
  .action(async () => {
    const contestDir = process.cwd();
    try {
      const config = await loadConfig(contestDir);

      console.log(chalk.bold.blue('\n➕ Add New Problem\n'));

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'id',
          message: 'Problem ID:',
          validate: input => input.trim() !== '' || 'ID cannot be empty'
        },
        {
          type: 'input',
          name: 'title',
          message: 'Problem title:',
          default: 'Untitled Problem'
        },
        {
          type: 'input',
          name: 'timeLimit',
          message: 'Time limit (ms):',
          default: '1000',
          validate: input => !isNaN(Number(input)) || 'Please enter a valid number'
        },
        {
          type: 'input',
          name: 'memoryLimit',
          message: 'Memory limit (MB):',
          default: '256',
          validate: input => !isNaN(Number(input)) || 'Please enter a valid number'
        },
        {
          type: "checkbox",
          name: "tags",
          message: "请选择题目标签:",
          choices: [
            { name: "入门", value: "入门" },
            { name: "普及-", value: "普及-" },
            { name: "普及/提高-", value: "普及/提高-" },
            { name: "普及+/提高", value: "普及+/提高" },
            { name: "提高+/省选-", value: "提高+/省选-" },
            { name: "省选/NOI-", value: "省选/NOI-" },
            { name: "NOI/NOI+/CTSC", value: "NOI/NOI+/CTSC" },
            new inquirer.Separator(),
            { name: "动态规划", value: "动态规划" },
            { name: "图论", value: "图论" },
            { name: "数据结构", value: "数据结构" },
            { name: "数学", value: "数学" },
            { name: "基础算法", value: "基础算法" },
            { name: "字符串", value: "字符串" },
            { name: "其他", value: "其他" },
          ],
          default: ["入门"],
        },
        {
          type: "input",
          name: "othertag",
          message: "其他分类标签(用空格或,分割多个)：",
          default: "",
        },
        {
          type: 'input',
          name: 'maxScore',
          message: 'Maximum score:',
          default: '100',
          validate: input => !isNaN(Number(input)) || 'Please enter a valid number'
        }
      ]);

      // Check if problem exists
      if (config.problems.some(p => p.id === answers.id)) {
        console.error(chalk.red(`\nError: Problem "${answers.id}" already exists`));
        process.exit(1);
      }

      const problemDir = path.join(contestDir,'problem', answers.id);

      // Create problem directories
      //   fs.ensureDirSync(path.join(problemDir, 'testdata'));  // 测试数据
      //   fs.ensureDirSync(path.join(problemDir, 'src'));       // 源文件，包括std等
      //   fs.ensureDirSync(path.join(problemDir, 'sample'));    // 样例文件，包括大样例
      //   fs.ensureDirSync(path.join(problemDir, 'solution'));  // 题解

      //   // Create default files
      //   fs.writeFileSync(
      //     path.join(problemDir, 'problem.md'), 
      //     `# ${answers.title}\n\n## Problem Description\n\n`
      //   );
      // 选择checker类型
      //
      const checkerType = await inquirer.prompt([
        {
          type: "list",
          name: "selectedChecker",
          message: "请选择需要的Checker 类型：",
          choices: [
            {
              name: "ncmp (标准比较器：逐字节对比用户输出和标准答案，但会忽略行末空格和文件末尾的多余换行)",
              value: "ncmp.cpp",
            },
            {
              name: "wcmp (比较两个单词序列，按顺序逐个比较单词，若某对单词不同或序列长度不同，则判定为答案错误；否则判定为答案正确。)",
              value: "wcmp.cpp",
            },
            {
              name: "fcmp (将文件按行作为字符串序列进行比较，若某行内容不同，则判定为答案错误；否则判定为答案正确。)",
              value: "fcmp.cpp",
            },
            {
              name: "rcmp (比较两个双精度浮点数，允许最大绝对误差为 1.5E-6。若误差超过该值，判定为答案错误；否则判定为答案正确。)",
              value: "rcmp.cpp",
            },
            {
              name: "rcmp4 (比较两个双精度浮点数序列，允许最大绝对或相对误差为 1E-4。若某对元素误差超过该值，判定为答案错误；否则判定为答案正确。)",
              value: "rcmp4.cpp",
            },
            {
              name: "rcmp6 (比较两个双精度浮点数序列，允许最大绝对或相对误差为 1E-6。若某对元素误差超过该值，判定为答案错误；否则判定为答案正确。)",
              value: "rcmp6.cpp",
            },
            {
              name: "rcmp9 (比较两个双精度浮点数序列，允许最大绝对或相对误差为 1E-9。若某对元素误差超过该值，判定为答案错误；否则判定为答案正确。)",
              value: "rcmp9.cpp",
            },
            {
              name: "rncmp (比较两个双精度浮点数序列，允许最大绝对误差为 1.5E-5。若某对元素误差超过该值，判定为答案错误；否则判定为答案正确。)",
              value: "rncmp.cpp",
            },
            {
              name: "uncmp (比较两个无序的有符号长整型序列，会先排序再比较，若序列长度或元素不同，则判定为错误。)",
              value: "uncmp.cpp",
            },
            {
              name: 'yesno (检查输入是否为 "YES" 或 "NO" （大小写不敏感），若输入不符合要求或与答案不一致，则判定为错误。)',
              value: "yesno.cpp",
            },
            {
              name: "acmp (比较两个双精度浮点数，允许最大绝对误差为 1.5E-6。若误差超过该值，判定为答案错误；否则判定为答案正确。)",
              value: "acmp.cpp",
            },
            {
              name: "caseicmp (带有测试用例支持的单 int64 检查器，用于比较两个有序的 int64 序列，若序列长度不同或对应元素不同，则判定为错误。)",
              value: "caseicmp.cpp",
            },
            {
              name: 'casencmp (用于比较输出和答案的格式为 "Case X: <number> <number> ..." 的情况，按测试用例逐行比较长整型序列。)',
              value: "casencmp.cpp",
            },
            {
              name: 'casewcmp (用于比较输出和答案的格式为 "Case X: <token> <token> ..." 的情况，按测试用例逐行比较字符串序列。)',
              value: "casewcmp.cpp",
            },
            {
              name: "dcmp (比较两个双精度浮点数，允许最大绝对或相对误差为 1E-6。若误差超过该值，判定为答案错误；否则判定为答案正确。)",
              value: "dcmp.cpp",
            },
            {
              name: "hcmp (比较两个有符号的大整数，会先检查输入是否为有效的整数格式，若格式错误或数值不同，则判定为错误。)",
              value: "hcmp.cpp",
            },
            {
              name: "icmp (比较两个有符号的整数，若两个整数不相等，则判定为答案错误；否则判定为答案正确。)",
              value: "icmp.cpp",
            },
            {
              name: "lcmp (将文件按行拆分为单词序列进行比较，若某行的单词序列不同，则判定为答案错误；否则判定为答案正确。)",
              value: "lcmp.cpp",
            },
            {
              name: "ncmp (比较两个有序的有符号长整型序列，会检查序列长度和对应元素是否相同，若不同则判定为错误。)",
              value: "ncmp.cpp",
            },
            {
              name: 'nyesno (用于检查多个 "YES" 或 "NO" （大小写不敏感）的输入，会统计 "YES" 和 "NO" 的数量，若输入不符合要求或与答案不一致，则判定为错误。)',
              value: "nyesno.cpp",
            },
            {
              name: "pointscmp (示例得分检查器，通过比较两个双精度浮点数的差值来给出得分。)",
              value: "pointscmp.cpp",
            },
            {
              name: "pointsinfo (示例带有 points_info 的检查器，读取两个双精度浮点数，记录相关信息并退出。)",
              value: "pointsinfo.cpp",
            },
          ],
          default: 0,
        },
      ]);
      // 创建目录结构
      const dirs = ["testdata", "src", "sample", "solution", "additional_file"];

      for (const dir of dirs) {
        await mkdirp(path.join(problemDir, dir));
      }

      
      //  生成题目状态文件
      const problemStatus: ProblemStatus = {
        dir: { desc: "目录完整", status: false },
        isvalidated: { desc: "验证输入数据", status: false },
        isgenerated: { desc: "评测数据", status: false },
        ischecked: { desc: "是否检查完整", status: false }
      };
      try {
        const statusFileName = path.resolve(problemDir, "status.json");
        console.log(statusFileName);
        fs.writeFileSync(statusFileName, JSON.stringify(problemStatus, null, 2), "utf-8");
      }
      catch (e: unknown) {
        console.error(chalk.red("写入题目状态文件失败:"), (e as Error).message);
        process.exit(1);
      }

      // 写入模板文件
      const templates = {
        "src/std.cpp": "std.cpp",
        "problem_zh.md": "problem_zh.md",
        "src/generator.cpp": "generator.cpp",
        "src/validator.cpp": "validator.cpp",
        "src/testlib.h": "testlib.h",
        "solution/stdsol.md": "solution/stdsol.md",
        "src/checker.cpp": "checker.cpp",
      };

      // 根据用户选择的checker
      if (checkerType.value)
        templates["src/checker.cpp"] = `checkers/${checkerType.value}`;
      else
        templates["src/checker.cpp"] = "checkers/wcmp.cpp";
      // 根据用户选择过滤模板文件
      const finalTemplates = Object.entries(templates).filter(([filePath]) => {
        if (filePath.includes("checker")&& false) return false;
        if (filePath.includes("generator") && false) return false;
        if (filePath.includes("validator") && false) return false;
        return true;
      });
      const templateDir = path.resolve(__dirname,"../templates");
      for (const [filePath, templateName] of finalTemplates) {
        writeFileWithDir(
          path.join(problemDir, filePath),
          getTemplate(templateDir, templateName)
        );
      }

      // 生成 problem.yaml
      answers.tags.filter((item: string) => item !== "");
      if (answers.othertag)
        answers["othertag"].split(/[\s,，;]+/).forEach((el: string) => {
          answers.tags.push(el);
        });
      const problemYaml = {
        tag: [...answers.tags],
        title: answers.title,
      };

      writeYaml(path.join(problemDir, "problem.yaml"), problemYaml);

      // 生成 testdata/config.yaml
      const configYaml = {
        memory: answers.memoryLimit,
        time: answers.timeLimit,
      };

      writeYaml(path.join(problemDir, "testdata", "config.yaml"), configYaml);
      const problemName = answers.title;
      console.log(chalk.green(`\n题目 "${problemName}" 初始化完成！`));
      console.log(chalk.blue(`目录结构已创建在: ${problemDir}`));
      //查找目前有几道题目

      const indexs = config.problems.length;
      const problemConfig: ProblemConfig = {
        id: answers.id,
        index:indexs,
        title: answers.title,
        timeLimit: parseInt(answers.timeLimit),
        memoryLimit: parseInt(answers.memoryLimit),
        maxScore: parseInt(answers.maxScore),
      };

      // Save problem config
      fs.writeJsonSync(
        path.join(problemDir, 'config.json'),
        problemConfig,
        { spaces: 2 }
      );

      // Update contest config
      config.problems.push(problemConfig);
      config.status.problemsAdded = true;
      await saveConfig(process.cwd(), config);

      console.log(chalk.green.bold('\n✅ Problem added successfully!'));
      console.log(chalk.cyan(`  ID: ${answers.id}`));
      console.log(chalk.cyan(`  Title: ${answers.title}`));
      console.log(chalk.cyan(`  Time Limit: ${answers.timeLimit}ms`));
      console.log(chalk.cyan(`  Memory Limit: ${answers.memoryLimit}MB`));
      console.log(chalk.cyan(`  Directory: ${problemDir}`));
    } catch (err: unknown) {
      console.error(chalk.red(`Error adding problem: ${(err as Error).message}`));
      process.exit(1);
    }
  });