import { Command } from 'commander';
import inquirer from 'inquirer';
import { loadConfig, saveConfig, ContestConfig, ProblemConfig } from '../lib/config';
import chalk from 'chalk';

export const swapIndexCommand = new Command('swapindex')
  .description('Adjust problem order by changing problem index')
  .action(async () => {
    try {
      const config = await loadConfig(process.cwd());
      
      if (config.problems.length === 0) {
        console.log(chalk.yellow('No problems added to this contest'));
        return;
      }
      
      console.log(chalk.bold.blue('\n🔀 Adjust Problem Order\n'));
      
      // Display current problem list
      console.log(chalk.cyan('Current problem order:'));
      config.problems.forEach((problem, index) => {
        console.log(chalk.white(`  ${index + 1}. [${problem.index}] ${problem.id} - ${problem.title}`));
      });
      console.log();
      
      // Ask user for adjustment mode
      const { adjustmentMode } = await inquirer.prompt([
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
        await adjustSingleProblem(config);
      } else if (adjustmentMode === 'batch') {
        await adjustBatchProblems(config);
      } else {
        await adjustDragDrop(config);
      }
      
      // Save updated config
      await saveConfig(process.cwd(), config);
      
      // Display updated problem list
      console.log(chalk.cyan('\nUpdated problem order:'));
      config.problems.forEach((problem, index) => {
        console.log(chalk.white(`  ${index + 1}. [${problem.index}] ${problem.id} - ${problem.title}`));
      });
      
      console.log(chalk.green.bold('\n✅ Problem order updated successfully!'));
      
    } catch (err: unknown) {
      console.error(chalk.red(`Error adjusting problem order: ${(err as Error).message}`));
      process.exit(1);
    }
  });

async function adjustSingleProblem(config: ContestConfig) {
  // Ask user to select problem to adjust
  const { selectedProblemId } = await inquirer.prompt([
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
  
  console.log(chalk.cyan(`\nSelected: [${selectedProblem.index}] ${selectedProblem.id} - ${selectedProblem.title}`));
  
  // Ask for new index
  const { newIndex } = await inquirer.prompt([
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
    console.log(chalk.yellow(`\n⚠️  Index ${targetIndex} is already occupied by: [${existingProblem.index}] ${existingProblem.id} - ${existingProblem.title}`));
    
    const { confirmSwap } = await inquirer.prompt([
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
      
      console.log(chalk.green('\n✅ Problems swapped successfully!'));
    } else {
      console.log(chalk.blue('\nOperation cancelled.'));
      return;
    }
  } else {
    // Simply change the index
    selectedProblem.index = targetIndex;
    console.log(chalk.green('\n✅ Problem index updated successfully!'));
  }
  
  // Sort problems by index to maintain order
  config.problems.sort((a, b) => a.index - b.index);
}

async function adjustBatchProblems(config: ContestConfig) {
  console.log(chalk.cyan('\nBatch reorder mode:'));
  console.log(chalk.white('You will be asked to assign new indices to all problems.'));
  console.log(chalk.white('Problems will be reordered based on the new indices.\n'));
  
  const newIndices: { [problemId: string]: number } = {};
  const usedIndices = new Set<number>();
  
  for (const problem of config.problems) {
    const { newIndex } = await inquirer.prompt([
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
  
  console.log(chalk.green('\n✅ All problem indices updated successfully!'));
}

async function adjustDragDrop(config: ContestConfig) {
  console.log(chalk.cyan('\nDrag and drop reorder mode:'));
  console.log(chalk.white('You will select problems one by one to place them in the desired order.\n'));
  
  const reorderedProblems: ProblemConfig[] = [];
  const remainingProblems = [...config.problems];
  
  while (remainingProblems.length > 0) {
    console.log(chalk.cyan(`\nRemaining problems (${remainingProblems.length}):`));
    remainingProblems.forEach((problem, index) => {
      console.log(chalk.white(`  ${index + 1}. [${problem.index}] ${problem.id} - ${problem.title}`));
    });
    
    if (reorderedProblems.length > 0) {
      console.log(chalk.green('\nCurrent order:'));
      reorderedProblems.forEach((problem, index) => {
        console.log(chalk.white(`  ${index + 1}. [${problem.index}] ${problem.id} - ${problem.title}`));
      });
    }
    
    const { selectedProblemId } = await inquirer.prompt([
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
    
    console.log(chalk.green(`\n✅ Added [${selectedProblem.index}] ${selectedProblem.id} - ${selectedProblem.title} to position ${selectedProblem.index}`));
  }
  
  // Replace the problems array with the reordered one
  config.problems = reorderedProblems;
  
  console.log(chalk.green('\n✅ All problems reordered successfully!'));
}