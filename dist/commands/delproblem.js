"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.delProblemCommand = void 0;
const commander_1 = require("commander");
const path = __importStar(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
//@ts-ignore
const fs = require('fs');
exports.delProblemCommand = new commander_1.Command('delproblem')
    .description('Delete a problem from the contest')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_1.loadConfig)(process.cwd());
        if (config.problems.length === 0) {
            console.log(chalk_1.default.yellow('No problems available to delete'));
            return;
        }
        console.log(chalk_1.default.bold.blue('\n🗑️ Delete Problem\n'));
        const { problemId } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'problemId',
                message: 'Select problem to delete:',
                choices: config.problems.map(p => ({
                    name: `${p.id} - ${p.title}`,
                    value: p.id
                }))
            }
        ]);
        const problem = config.problems.find(p => p.id === problemId);
        if (!problem) {
            console.error(chalk_1.default.red(`Problem "${problemId}" not found`));
            process.exit(1);
        }
        // Confirm deletion
        const { confirm } = yield inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to delete problem "${problemId} - ${problem.title}"?`,
                default: false
            }
        ]);
        if (!confirm) {
            console.log(chalk_1.default.yellow('Deletion canceled'));
            return;
        }
        // Remove from config
        config.problems = config.problems.filter(p => p.id !== problemId);
        // Delete problem directory
        const problemDir = path.join('problem', problemId);
        if (yield fs.existsSync(problemDir)) {
            yield fs.rmSync(problemDir, { recursive: true, force: true });
            console.log(chalk_1.default.cyan(`Deleted directory: ${problemDir}`));
        }
        // Update status
        config.status.problemsAdded = config.problems.length > 0;
        yield (0, config_1.saveConfig)(process.cwd(), config);
        console.log(chalk_1.default.green.bold(`\n✅ Problem "${problemId}" deleted successfully!`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error deleting problem: ${err.message}`));
        process.exit(1);
    }
}));
