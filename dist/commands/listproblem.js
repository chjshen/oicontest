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
exports.listProblemCommand = void 0;
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils/utils");
//@ts-ignore
const path = require('path');
const fs = require('fs');
exports.listProblemCommand = new commander_1.Command('listproblem')
    .description('List all problems in the contest')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestDir = process.cwd();
        const config = yield (0, config_1.loadConfig)(process.cwd());
        if (config.problems.length === 0) {
            console.log(chalk_1.default.yellow('No problems added to this contest'));
            return;
        }
        console.log(chalk_1.default.bold.blue('\n📋 Problem List\n'));
        //ischecked
        let verifiedArray = [];
        const problems = config.problems;
        for (const p of problems) {
            const fullPath = path.join(contestDir, "problem", p.id, "status.json");
            try {
                const status = yield (0, utils_1.loadJsonFile)(fullPath);
                if (status.ischecked && status.ischecked.status)
                    verifiedArray.push(p.id);
            }
            catch (e) {
                console.error(chalk_1.default.red("load json file error:"), e);
            }
        }
        const tableData = config.problems.map(p => ({
            ID: (p.id),
            Title: p.title,
            'Time Limit': `${p.timeLimit}ms`,
            'Memory Limit': `${p.memoryLimit}MB`,
            Score: p.maxScore,
            verified: verifiedArray.includes(p.id) ? '✅' : ('❌')
        }));
        // Simple table output
        console.log(chalk_1.default.green(`Total: ${verifiedArray.length} verified`));
        // console.log('ID           Title                   Time   Memory   Score  verified');
        // console.log('-----------------------------------------------------------------------');
        console.table(tableData);
        // tableData.forEach((p,index) => {
        //   console.log(
        //     `${(p.ID).padEnd(13)}${(p.Title).padEnd(24)}${p['Time Limit'].padEnd(7)}${p['Memory Limit'].padEnd(9)}${p.Score.toString().padEnd(6)} ${verifiedArray.includes(p.ID)?chalk.green('✓'):chalk.red('✗')}`
        // );
        // });
        // console.log(('-----------------------------------------------------------------------'));
        console.log(chalk_1.default.bold(`Total: ${config.problems.length} problems`));
    }
    catch (err) {
        console.error(chalk_1.default.red('Error: Not in a contest directory or config missing'));
        process.exit(1);
    }
}));
