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
exports.editCommand = void 0;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const moment_1 = __importDefault(require("moment"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
exports.editCommand = new commander_1.Command('edit')
    .description('Edit contest information or problem ID')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_1.loadConfig)(process.cwd());
        console.log(chalk_1.default.bold.blue('\n✏️ Edit Menu\n'));
        const { editType } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'editType',
                message: 'What do you want to edit?',
                choices: [
                    { name: 'Edit contest information', value: 'contest' },
                    { name: 'Edit problem ID', value: 'problemId' }
                ]
            }
        ]);
        if (editType === 'contest') {
            yield editContestInfo(config);
        }
        else {
            yield editProblemId(config);
        }
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error editing: ${err.message}`));
        process.exit(1);
    }
}));
function editContestInfo(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const oldName = config.name;
        const currentDir = process.cwd();
        const parentDir = path_1.default.dirname(currentDir);
        const answers = yield inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Contest directory name:',
                default: config.name
            },
            {
                type: 'input',
                name: 'description',
                message: 'Contest description (for PDF):',
                default: config.description
            },
            {
                type: 'input',
                name: 'startTime',
                message: 'Start time (YYYY-MM-DD HH:mm):',
                default: config.startTime,
                validate: input => {
                    if (!(0, moment_1.default)(input, 'YYYY-MM-DD HH:mm', true).isValid()) {
                        return 'Invalid date format. Use YYYY-MM-DD HH:mm (e.g. 2023-10-15 09:00)';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'duration',
                message: 'Contest duration (minutes):',
                default: config.duration.toString(),
                validate: input => !isNaN(Number(input)) || 'Please enter a valid number'
            },
            {
                type: 'input',
                name: 'author',
                message: 'Author:',
                default: config.author
            }
        ]);
        const newName = answers.name;
        const newDirPath = path_1.default.join(parentDir, newName);
        config.name = newName;
        config.description = answers.description;
        config.duration = parseInt(answers.duration);
        config.author = answers.author;
        config.startTime = (0, moment_1.default)(answers.startTime, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm');
        yield (0, config_1.saveConfig)(currentDir, config);
        if (oldName !== newName) {
            try {
                if (yield fs_extra_1.default.pathExists(newDirPath)) {
                    console.log(chalk_1.default.yellow(`\n⚠️  Directory "${newName}" already exists. Cannot rename.`));
                    console.log(chalk_1.default.cyan(`  Keeping current directory name: ${oldName}`));
                    console.log(chalk_1.default.cyan(`  Config updated with new name: ${newName}`));
                }
                else {
                    yield fs_extra_1.default.move(currentDir, newDirPath);
                    console.log(chalk_1.default.green(`\n✅ Directory renamed from "${oldName}" to "${newName}"`));
                    console.log(chalk_1.default.cyan(`  New path: ${newDirPath}`));
                    process.chdir(newDirPath);
                    console.log(chalk_1.default.cyan(`  Working directory changed to: ${newDirPath}`));
                }
            }
            catch (renameError) {
                console.log(chalk_1.default.yellow(`\n⚠️  Failed to rename directory: ${renameError.message}`));
                console.log(chalk_1.default.cyan(`  Config updated with new name: ${newName}`));
                console.log(chalk_1.default.cyan(`  Directory remains: ${oldName}`));
            }
        }
        console.log(chalk_1.default.green.bold('\n✅ Contest information updated successfully!'));
        console.log(chalk_1.default.cyan(`  Directory Name: ${config.name}`));
        console.log(chalk_1.default.cyan(`  Description: ${config.description}`));
        console.log(chalk_1.default.cyan(`  Start Time: ${config.startTime}`));
        console.log(chalk_1.default.cyan(`  Duration: ${config.duration} minutes`));
        console.log(chalk_1.default.cyan(`  Author: ${config.author}`));
    });
}
function editProblemId(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const contestDir = process.cwd();
        if (!config.problems || config.problems.length === 0) {
            console.log(chalk_1.default.yellow('No problems found in this contest.'));
            return;
        }
        // 选择题目
        const { selectedId } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedId',
                message: 'Select the problem to edit ID:',
                choices: config.problems.map((p) => ({
                    name: `[${p.id}] ${p.title}`,
                    value: p.id
                }))
            }
        ]);
        const oldId = selectedId;
        const oldProblemDir = path_1.default.join(contestDir, 'problem', oldId);
        // 输入新ID
        const { newId } = yield inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'newId',
                message: `Enter new ID for problem [${oldId}]:`,
                validate: (input) => {
                    if (!input.trim())
                        return 'ID cannot be empty';
                    if (input === oldId)
                        return 'New ID is the same as the old ID';
                    if (config.problems.some((p) => p.id === input))
                        return 'ID already exists!';
                    return true;
                }
            }
        ]);
        const newProblemDir = path_1.default.join(contestDir, 'problem', newId);
        // 重命名目录
        try {
            yield fs_extra_1.default.move(oldProblemDir, newProblemDir);
        }
        catch (e) {
            console.error(chalk_1.default.red(`Failed to rename problem directory: ${e.message}`));
            return;
        }
        // 修改 config.json
        const configJsonPath = path_1.default.join(newProblemDir, 'config.json');
        if (yield fs_extra_1.default.pathExists(configJsonPath)) {
            const problemConfig = yield fs_extra_1.default.readJson(configJsonPath);
            problemConfig.id = newId;
            yield fs_extra_1.default.writeJson(configJsonPath, problemConfig, { spaces: 2 });
        }
        // 修改 status.json
        const statusJsonPath = path_1.default.join(newProblemDir, 'status.json');
        if (yield fs_extra_1.default.pathExists(statusJsonPath)) {
            try {
                const statusConfig = yield fs_extra_1.default.readJson(statusJsonPath);
                if (statusConfig.id)
                    statusConfig.id = newId;
                yield fs_extra_1.default.writeJson(statusJsonPath, statusConfig, { spaces: 2 });
            }
            catch (_a) { }
        }
        // 更新 oicontest.json
        for (const p of config.problems) {
            if (p.id === oldId) {
                p.id = newId;
                break;
            }
        }
        yield (0, config_1.saveConfig)(contestDir, config);
        console.log(chalk_1.default.green.bold(`\n✅ Problem ID updated from "${oldId}" to "${newId}"!`));
    });
}
