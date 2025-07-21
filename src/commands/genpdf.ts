// src/commands/genpdf.ts
import { Command } from 'commander';
import { loadConfig, saveConfig } from '../lib/config';
import { generatePDF } from '../lib/pdf';
import chalk from 'chalk';

export const genPDFCommand = new Command('genpdf')
  .description('Generate contest PDF with problems')
  .action(async () => {
    try {
      const config = await loadConfig(process.cwd());
      
      if (config.problems.length === 0) {
        console.error(chalk.red('Error: No problems added to contest'));
        process.exit(1);
      }
      
      //console.log(chalk.bold.blue('\n📄 Generating Contest PDF\n'));
      
      const pdfPath = await generatePDF(config);
      
      // Update status
      config.status.pdfGenerated = true;
      await saveConfig(process.cwd(), config);
      
      //console.log(chalk.green.bold('\n✅ PDF generated successfully!'));
      console.log(chalk.cyan(`  Location: ${pdfPath}`));
    } catch (err:any) {
      console.error(chalk.red(`Error generating PDF: ${err.message}`));
      process.exit(1);
    }
  });