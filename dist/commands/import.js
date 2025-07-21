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
exports.importCommand = void 0;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../lib/config");
const hydrooj_1 = require("../lib/hydrooj");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
exports.importCommand = new commander_1.Command('import')
    .description('Import problems from external OJ platforms')
    .argument('<zipPath>', 'Path to the import zip file')
    .action((zipPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_1.loadConfig)(process.cwd());
        // 检查文件存在和格式
        if (!zipPath.endsWith('.zip')) {
            console.error(chalk_1.default.red('Only ZIP files are supported'));
            process.exit(1);
        }
        // 如果zip文件名包含hydrooj，直接用hydrooj导入
        const lowerName = path_1.default.basename(zipPath).toLowerCase();
        if (lowerName.includes('hydro')) {
            const importedProblems = yield (0, hydrooj_1.importHydroOJ)(zipPath, process.cwd());
            config.problems.push(...importedProblems);
            config.status.problemsAdded = true;
            yield (0, config_1.saveConfig)(process.cwd(), config);
            console.log(chalk_1.default.green.bold('\n✅ Import completed successfully!'));
            console.log(chalk_1.default.cyan(`  Imported ${importedProblems.length} problems`));
            return;
        }
        // 否则走原有交互流程
        console.log(chalk_1.default.bold.blue('\n📥 Import Problems from OJ Platforms\n'));
        // 选择导入平台
        const { platform } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'platform',
                message: 'Select platform to import from:',
                choices: ['HydroOJ', 'Other (Coming Soon)']
            }
        ]);
        // 获取导入文件路径
        const { filePath } = yield inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'filePath',
                message: 'Enter path to import file:',
                default: zipPath,
                validate: input => {
                    const fs = require('fs');
                    if (!fs.existsSync(input)) {
                        return 'File does not exist';
                    }
                    if (!input.endsWith('.zip')) {
                        return 'Only ZIP files are supported';
                    }
                    return true;
                }
            }
        ]);
        let importedProblems = [];
        switch (platform) {
            case 'HydroOJ':
                importedProblems = yield (0, hydrooj_1.importHydroOJ)(filePath, process.cwd());
                break;
            default:
                console.log(chalk_1.default.yellow('Only HydroOJ import is currently supported'));
                return;
        }
        // 更新配置
        config.problems.push(...importedProblems);
        config.status.problemsAdded = true;
        yield (0, config_1.saveConfig)(process.cwd(), config);
        console.log(chalk_1.default.green.bold('\n✅ Import completed successfully!'));
        console.log(chalk_1.default.cyan(`  Imported ${importedProblems.length} problems`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Import error: ${err.message}`));
        process.exit(1);
    }
}));
