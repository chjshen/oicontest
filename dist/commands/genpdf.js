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
exports.genPDFCommand = void 0;
// src/commands/genpdf.ts
const commander_1 = require("commander");
const config_1 = require("../lib/config");
const pdf_1 = require("../lib/pdf");
const chalk_1 = __importDefault(require("chalk"));
exports.genPDFCommand = new commander_1.Command('genpdf')
    .description('Generate contest PDF with problems')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_1.loadConfig)(process.cwd());
        if (config.problems.length === 0) {
            console.error(chalk_1.default.red('Error: No problems added to contest'));
            process.exit(1);
        }
        //console.log(chalk.bold.blue('\n📄 Generating Contest PDF\n'));
        const pdfPath = yield (0, pdf_1.generatePDF)(config);
        // Update status
        config.status.pdfGenerated = true;
        yield (0, config_1.saveConfig)(process.cwd(), config);
        //console.log(chalk.green.bold('\n✅ PDF generated successfully!'));
        console.log(chalk_1.default.cyan(`  Location: ${pdfPath}`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error generating PDF: ${err.message}`));
        process.exit(1);
    }
}));
