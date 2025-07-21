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
exports.genHtmlCommand = void 0;
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils/utils");
const mdToHtml_1 = require("../lib/mdToHtml");
const open_1 = __importDefault(require("open"));
exports.genHtmlCommand = new commander_1.Command('genhtml')
    .description('Generate contest html files.')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestDir = process.cwd();
        const config = yield (0, config_1.loadConfig)(process.cwd());
        //没有完成所有题目的验证不能生成html后转pdf
        console.log(chalk_1.default.bold.blue('\n🌐 Generating Contest information to Html file\n'));
        if (!(config.status && config.status.problemsVerified)) {
            console.error(chalk_1.default.bold.red(`All problems can not generate HTML files without validation complete`));
            process.exit(1);
        }
        console.log(chalk_1.default.green(`✓ All problems validation complete`));
        //先将contest信息转换成markdown格式
        const mdContent = yield (0, utils_1.contestInfoToMarkdown)(config);
        //生成转换后的文件
        const mdPath = path_1.default.join(contestDir, config.name + ".md");
        yield fs_extra_1.default.outputFile(mdPath, mdContent);
        //转换成html
        const htmlStr = yield (0, mdToHtml_1.convertMarkdownToHtml)(mdContent, config.description);
        const htmlPath = path_1.default.join(contestDir, 'html', config.description + ".html");
        // console.log(htmlStr);
        //生成转换后的文件
        yield fs_extra_1.default.outputFile(htmlPath, htmlStr);
        //将需要的CDN文件转换成本地文件
        // Update status
        config.status.pdfGenerated = true;
        yield (0, config_1.saveConfig)(process.cwd(), config);
        console.log(chalk_1.default.green.bold('\n✅ Html generated successfully!'));
        console.log(chalk_1.default.cyan(`html Location: ${htmlPath}, now open this file to preview, you can print it to pdf file.`));
        yield (0, open_1.default)(htmlPath);
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error generating Html: ${err.message}`));
        process.exit(1);
    }
}));
