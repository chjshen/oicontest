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
exports.openHtmlCommand = void 0;
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const mdToHtml_1 = require("../lib/mdToHtml");
exports.openHtmlCommand = new commander_1.Command('openhtml')
    .description('Open contest HTML file in default browser.')
    .option('-f, --file <filename>', 'Specify HTML file name (without .html extension)')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestDir = process.cwd();
        const config = yield (0, config_1.loadConfig)(process.cwd());
        // 确定HTML文件名
        let htmlFileName;
        if (options.file) {
            htmlFileName = options.file.endsWith('.html') ? options.file : `${options.file}.html`;
        }
        else {
            htmlFileName = `${config.name}.html`;
        }
        const htmlPath = path_1.default.join(contestDir, 'html', htmlFileName);
        // 检查HTML文件是否存在
        if (!fs_extra_1.default.existsSync(htmlPath)) {
            console.error(chalk_1.default.red(`❌ HTML file not found: ${htmlPath}`));
            console.log(chalk_1.default.yellow('💡 Try running "oicontest genhtml" first to generate the HTML file.'));
            process.exit(1);
        }
        console.log(chalk_1.default.bold.blue('\n🌐 Opening HTML file in default browser...\n'));
        console.log(chalk_1.default.cyan(`File: ${htmlPath}`));
        // 在默认浏览器中打开HTML文件
        yield (0, mdToHtml_1.openHtmlInBrowser)(htmlPath);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error opening HTML file: ${err.message}`));
        process.exit(1);
    }
}));
