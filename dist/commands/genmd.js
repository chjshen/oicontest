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
exports.genMarkdownCommand = void 0;
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils/utils");
exports.genMarkdownCommand = new commander_1.Command('genmd')
    .description('Generate contest markdown file with problems')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestDir = process.cwd();
        const config = yield (0, config_1.loadConfig)(process.cwd());
        if (config.problems.length === 0) {
            console.error(chalk_1.default.red('Error: No problems added to contest'));
            process.exit(1);
        }
        console.log(chalk_1.default.bold.blue('\n📑 Generating Contest Markdown file\n'));
        const mdPath = path_1.default.join(contestDir, config.name + ".md");
        let mdcontent = "";
        //生成转换后的文件
        const mdContent = yield (0, utils_1.contestInfoToMarkdown)(config);
        yield fs_extra_1.default.outputFile(mdPath, mdContent);
        console.log(chalk_1.default.green('✔️ markdown file generated success!'));
        console.log(chalk_1.default.cyan(`Location: ${mdPath}`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error generating Markdown: ${err.message}`));
        process.exit(1);
    }
}));
