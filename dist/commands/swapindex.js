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
exports.swapIndexCommand = void 0;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../lib/config");
const chalk_1 = __importDefault(require("chalk"));
exports.swapIndexCommand = new commander_1.Command('swapindex')
    .description('Adjust problem order by changing problem index')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_1.loadConfig)(process.cwd());
        if (config.problems.length === 0) {
            console.log(chalk_1.default.yellow('No problems added to this contest'));
            return;
        }
        console.log(chalk_1.default.bold.blue('\n🔀 Adjust Problem Order\n'));
        // Display current problem list
        console.log(chalk_1.default.cyan('Current problem order:'));
        config.problems.forEach((problem, index) => {
            console.log(chalk_1.default.white(`  ${index + 1}. [${problem.index}] ${problem.id} - ${problem.title}`));
        });
        console.log();
        // Ask user for adjustment mode
        const { adjustmentMode } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'adjustmentMode',
                message: 'Choose adjustment mode:',
                choices: [
                    { name: 'Single problem adjustment', value: 'single' },
                    { name: 'Batch reorder all problems', value: 'batch' },
                    { name: 'Drag and drop reorder', value: 'drag' }
                ]
            }
        ]);
        if (adjustmentMode === 'single') {
            yield adjustSingleProblem(config);
        }
        else if (adjustmentMode === 'batch') {
            yield adjustBatchProblems(config);
        }
        else {
            yield adjustDragDrop(config);
        }
        // Save updated config
        yield (0, config_1.saveConfig)(process.cwd(), config);
        // Display updated problem list
        console.log(chalk_1.default.cyan('\nUpdated problem order:'));
        config.problems.forEach((problem, index) => {
            console.log(chalk_1.default.white(`  ${index + 1}. [${problem.index}] ${problem.id} - ${problem.title}`));
        });
        console.log(chalk_1.default.green.bold('\n✅ Problem order updated successfully!'));
    }
    catch (err) {
        console.error(chalk_1.default.red(`Error adjusting problem order: ${err.message}`));
        process.exit(1);
    }
}));
function adjustSingleProblem(config) {
    return __awaiter(this, void 0, void 0, function* () {
        // Ask user to select problem to adjust
        const { selectedProblemId } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedProblemId',
                message: 'Select the problem to adjust:',
                choices: config.problems.map(p => ({
                    name: `[${p.index}] ${p.id} - ${p.title}`,
                    value: p.id
                }))
            }
        ]);
        const selectedProblem = config.problems.find(p => p.id === selectedProblemId);
        if (!selectedProblem) {
            throw new Error('Selected problem not found');
        }
        console.log(chalk_1.default.cyan(`\nSelected: [${selectedProblem.index}] ${selectedProblem.id} - ${selectedProblem.title}`));
        // Ask for new index
        const { newIndex } = yield inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'newIndex',
                message: `Enter new index for ${selectedProblem.id} (current: ${selectedProblem.index}):`,
                default: selectedProblem.index.toString(),
                validate: (input) => {
                    const num = parseInt(input);
                    if (isNaN(num) || num < 1) {
                        return 'Please enter a valid positive number';
                    }
                    return true;
                }
            }
        ]);
        const targetIndex = parseInt(newIndex);
        // Check if target index is already occupied
        const existingProblem = config.problems.find(p => p.index === targetIndex && p.id !== selectedProblemId);
        if (existingProblem) {
            console.log(chalk_1.default.yellow(`\n⚠️  Index ${targetIndex} is already occupied by: [${existingProblem.index}] ${existingProblem.id} - ${existingProblem.title}`));
            const { confirmSwap } = yield inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirmSwap',
                    message: 'Do you want to swap the positions of these two problems?',
                    default: true
                }
            ]);
            if (confirmSwap) {
                // Swap the indices
                const tempIndex = selectedProblem.index;
                selectedProblem.index = existingProblem.index;
                existingProblem.index = tempIndex;
                console.log(chalk_1.default.green('\n✅ Problems swapped successfully!'));
            }
            else {
                console.log(chalk_1.default.blue('\nOperation cancelled.'));
                return;
            }
        }
        else {
            // Simply change the index
            selectedProblem.index = targetIndex;
            console.log(chalk_1.default.green('\n✅ Problem index updated successfully!'));
        }
        // Sort problems by index to maintain order
        config.problems.sort((a, b) => a.index - b.index);
    });
}
function adjustBatchProblems(config) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.cyan('\nBatch reorder mode:'));
        console.log(chalk_1.default.white('You will be asked to assign new indices to all problems.'));
        console.log(chalk_1.default.white('Problems will be reordered based on the new indices.\n'));
        const newIndices = {};
        const usedIndices = new Set();
        for (const problem of config.problems) {
            const { newIndex } = yield inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'newIndex',
                    message: `Enter new index for [${problem.index}] ${problem.id} - ${problem.title}:`,
                    default: problem.index.toString(),
                    validate: (input) => {
                        const num = parseInt(input);
                        if (isNaN(num) || num < 1) {
                            return 'Please enter a valid positive number';
                        }
                        if (usedIndices.has(num)) {
                            return `Index ${num} is already assigned to another problem`;
                        }
                        return true;
                    }
                }
            ]);
            const targetIndex = parseInt(newIndex);
            newIndices[problem.id] = targetIndex;
            usedIndices.add(targetIndex);
        }
        // Apply new indices
        for (const problem of config.problems) {
            problem.index = newIndices[problem.id];
        }
        // Sort problems by index to maintain order
        config.problems.sort((a, b) => a.index - b.index);
        console.log(chalk_1.default.green('\n✅ All problem indices updated successfully!'));
    });
}
function adjustDragDrop(config) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(chalk_1.default.cyan('\nDrag and drop reorder mode:'));
        console.log(chalk_1.default.white('You will select problems one by one to place them in the desired order.\n'));
        const reorderedProblems = [];
        const remainingProblems = [...config.problems];
        while (remainingProblems.length > 0) {
            console.log(chalk_1.default.cyan(`\nRemaining problems (${remainingProblems.length}):`));
            remainingProblems.forEach((problem, index) => {
                console.log(chalk_1.default.white(`  ${index + 1}. [${problem.index}] ${problem.id} - ${problem.title}`));
            });
            if (reorderedProblems.length > 0) {
                console.log(chalk_1.default.green('\nCurrent order:'));
                reorderedProblems.forEach((problem, index) => {
                    console.log(chalk_1.default.white(`  ${index + 1}. [${problem.index}] ${problem.id} - ${problem.title}`));
                });
            }
            const { selectedProblemId } = yield inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'selectedProblemId',
                    message: `Select the next problem to add (position ${reorderedProblems.length + 1}):`,
                    choices: remainingProblems.map(p => ({
                        name: `[${p.index}] ${p.id} - ${p.title}`,
                        value: p.id
                    }))
                }
            ]);
            const selectedProblem = remainingProblems.find(p => p.id === selectedProblemId);
            if (!selectedProblem) {
                throw new Error('Selected problem not found');
            }
            // Add to reordered list with new index
            selectedProblem.index = reorderedProblems.length + 1;
            reorderedProblems.push(selectedProblem);
            // Remove from remaining list
            const index = remainingProblems.findIndex(p => p.id === selectedProblemId);
            remainingProblems.splice(index, 1);
            console.log(chalk_1.default.green(`\n✅ Added [${selectedProblem.index}] ${selectedProblem.id} - ${selectedProblem.title} to position ${selectedProblem.index}`));
        }
        // Replace the problems array with the reordered one
        config.problems = reorderedProblems;
        console.log(chalk_1.default.green('\n✅ All problems reordered successfully!'));
    });
}
