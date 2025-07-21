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
exports.genLemonCommand = void 0;
// src/commands/genlemon.ts
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const lemon_1 = require("../lib/lemon");
const chalk_1 = __importDefault(require("chalk"));
exports.genLemonCommand = new commander_1.Command('genlemon')
    .description('Generate LEMON evaluation package')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_1.loadConfig)(process.cwd());
        if (config.problems.length === 0) {
            console.error(chalk_1.default.red('Error: No problems added to contest'));
            process.exit(1);
        }
        // 检查所有题目是否都已验证
        if (!(config.status && config.status.problemsVerified)) {
            console.error(chalk_1.default.bold.red('All problems must be verified before generating the LEMON package.'));
            process.exit(1);
        }
        // 必须先生成 PDF（html）
        if (!(config.status && config.status.pdfGenerated)) {
            console.error(chalk_1.default.bold.red('You must generate the HTML (genhtml) before generating the LEMON package.'));
            process.exit(1);
        }
        console.log(chalk_1.default.bold.blue('\n🍋 Generating LEMON Package\n'));
        const outputPath = yield (0, lemon_1.generateLemonPackage)(config);
        // 更新状态
        config.status.lemonGenerated = true;
        yield (0, config_1.saveConfig)(process.cwd(), config);
        console.log(chalk_1.default.green.bold('\n✅ LEMON package generated successfully!'));
        console.log(chalk_1.default.cyan(`  Location: ${outputPath}`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error generating LEMON package: ${err.message}`));
        process.exit(1);
    }
}));
