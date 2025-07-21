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
exports.initCommand = void 0;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const moment_1 = __importDefault(require("moment"));
exports.initCommand = new commander_1.Command('init')
    .description('Initialize a new OI contest interactively')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk_1.default.bold.blue('\n🏁 OI Contest Initialization\n'));
    const answers = yield inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Contest directory name:',
            validate: input => input.trim() !== '' || 'Name cannot be empty'
        },
        {
            type: 'input',
            name: 'description',
            message: 'Contest description (for PDF):',
            default: (answers) => answers.name,
            validate: input => input.trim() !== '' || 'Description cannot be empty'
        },
        {
            type: 'input',
            name: 'startTime',
            message: 'Start time (YYYY-MM-DD HH:mm):',
            default: () => (0, moment_1.default)().add(1, 'day').format('YYYY-MM-DD 09:00'),
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
            default: '180',
            validate: input => !isNaN(Number(input)) || 'Please enter a valid number'
        },
        {
            type: 'input',
            name: 'author',
            message: 'Author:',
            default: 'Unknown'
        }
    ]);
    const dirPath = path_1.default.resolve(answers.name);
    if (fs_extra_1.default.existsSync(dirPath)) {
        console.error(chalk_1.default.red(`\nError: Directory "${answers.name}" already exists`));
        process.exit(1);
    }
    // Create directory structure
    fs_extra_1.default.ensureDirSync(path_1.default.join(dirPath, 'problem'));
    fs_extra_1.default.ensureDirSync(path_1.default.join(dirPath, 'pdf'));
    fs_extra_1.default.ensureDirSync(path_1.default.join(dirPath, 'output'));
    // Initialize config
    const config = yield (0, config_1.initConfig)(dirPath, answers.name, answers.description, answers.startTime, parseInt(answers.duration), answers.author);
    console.log(chalk_1.default.green.bold('\n✅ Contest initialized successfully!'));
    console.log(chalk_1.default.cyan(`  Directory: ${dirPath}`));
    console.log(chalk_1.default.cyan(`  Description: ${answers.description}`));
    console.log(chalk_1.default.cyan(`  Start time: ${answers.startTime}`));
    console.log(chalk_1.default.cyan(`  Duration: ${config.duration} minutes`));
    console.log(chalk_1.default.cyan(`  Author: ${config.author}`));
}));
