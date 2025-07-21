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
exports.statusCommand = void 0;
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils/utils");
//@ts-ignore
const fs = require('fs');
const path = require('path');
exports.statusCommand = new commander_1.Command('status')
    .description('Show current contest status')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestDir = process.cwd();
        let config = yield (0, config_1.loadConfig)(contestDir);
        //题目是否验证
        // const verified = await verifyProblems(path.resolve(contestDir,"problem"));
        let verified = 0;
        const items = config.problems;
        let verifiyArray = [];
        for (const p of items) {
            try {
                const status = yield (0, utils_1.loadJsonFile)(path.join(contestDir, "problem", p.id, "status.json"));
                if (status.ischecked && status.ischecked.status) {
                    verified = verified + 1;
                    verifiyArray.push(p.id);
                }
            }
            catch (e) {
                console.error("read status json file error:", e);
            }
        }
        const problemNum = config.problems.length;
        if (verified === problemNum)
            config.status.problemsVerified = true;
        yield (0, config_1.saveConfig)(contestDir, config);
        console.log(chalk_1.default.bold.blue('\n📊 Contest Status\n'));
        console.log(chalk_1.default.bold(`Name: ${chalk_1.default.cyan(config.name)}`));
        console.log(chalk_1.default.bold(`Author: ${chalk_1.default.cyan(config.author)}`));
        console.log(chalk_1.default.bold(`Start Time: ${chalk_1.default.cyan(config.startTime)}`));
        console.log(chalk_1.default.bold(`Duration: ${chalk_1.default.cyan(config.duration)} minutes\n`));
        console.log(chalk_1.default.bold('Progress:'));
        console.log(`  ${config.status.initialized ? chalk_1.default.green('✓') : chalk_1.default.red('✗')} Initialized`);
        console.log(`  ${config.status.problemsAdded ? chalk_1.default.green('✓') : chalk_1.default.red('✗')} Problems Added(Extant ${problemNum} problems)`);
        console.log(`  ${config.status.problemsVerified ? chalk_1.default.green('✓') : chalk_1.default.red('✗')} All problems Verified`);
        console.log(`  ${config.status.pdfGenerated ? chalk_1.default.green('✓') : chalk_1.default.red('✗')} PDF Generated`);
        console.log(`  ${config.status.lemonGenerated ? chalk_1.default.green('✓') : chalk_1.default.red('✗')} LEMON Package Generated\n`);
        console.log(chalk_1.default.bold(`Problems (${config.problems.length}):`));
        console.table(config.problems.map((p) => ({
            ID: p.id,
            title: p.title,
            timeLimit: p.timeLimit,
            memoryLimit: p.memoryLimit,
            verified: verifiyArray.includes(p.id) ? '✓' : '✗',
        })));
        config.problems.forEach(p => {
            console.log(`  - ${(p.id.padEnd(12))}: ${p.title.padEnd(22)}${p.timeLimit}ms/${p.memoryLimit}MB verified: ${verifiyArray.includes(p.id) ? chalk_1.default.green('✓') : chalk_1.default.red('✗')}`);
        });
    }
    catch (err) {
        console.error(chalk_1.default.red('Error: Not in a contest directory or config missing'));
        process.exit(1);
    }
}));
