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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDF = generatePDF;
// // 自定义 Markdown 渲染器，用于更好的 PDF 格式控制
// const renderer = new marked.Renderer();
// // 覆盖标题渲染
// renderer.heading = (text, level) => {
//   const fontSize = 24 - (level * 2);
//   return `<font size="${fontSize}"><b>${text}</b></font><br/><br/>`;
// };
// // 覆盖段落渲染
// renderer.paragraph = (text) => {
//   return `<font size="12">${text}</font><br/><br/>`;
// };
// // 覆盖代码块渲染
// renderer.code = (code, language) => {
//   return `<font size="11" face="Courier">${code}</font><br/>`;
// };
// // 覆盖列表项渲染
// renderer.listitem = (text) => {
//   return `<font size="12">• ${text}</font><br/>`;
// };
// // 覆盖表格渲染
// renderer.table = (header, body) => {
//   return `<table border="1" cellpadding="5" cellspacing="0">${header}${body}</table><br/><br/>`;
// };
// marked.setOptions({
//   renderer,
//   gfm: true,
//   breaks: true,
// });
// async function loadCustomFont(fontPath:string)
// {
//   // 加载中文字体文件
//   const simSunFontPath = path.resolve(fontPath);
//   const simSunFontBytes = fs.readFileSync(simSunFontPath);
//   return simSunFontBytes;
//   //return simSunFont = await pdfDoc.embedFont(simSunFontBytes);
// }
function generatePDF(config) {
    return __awaiter(this, void 0, void 0, function* () {
        //   console.log(chalk.cyan('📝 Generating contest PDF...'));
        //   // 创建 PDF 文档
        //   const pdfDoc = await PDFDocument.create();
        //   // 加载 fontkit 并注册
        //   pdfDoc.registerFontkit(fontkit);
        //   const coustomFontPath = path.join(__dirname, '../fonts/仿宋.ttf');
        //   if(!fs.existsSync(coustomFontPath))
        //   {
        //     console.error(chalk(`${coustomFontPath} font file not found!`))
        //     process.exit(1);
        //   }
        //   const fontBytes = await loadCustomFont(coustomFontPath);
        //   // 添加标题页
        //   console.log("add tilte page...");
        //   const titlePage = await addTitlePage(pdfDoc, fontBytes, config);
        //   // 添加题目汇总表
        //   console.log("add problems summary page...");
        //   await addProblemSummary(pdfDoc,fontBytes, config);
        //   // 添加各个题目详情
        //   console.log("add problem detail page...");
        //   await addProblemDetails(pdfDoc,fontBytes, config);
        //   // 保存 PDF
        //   console.log("save pdf...");
        //   const pdfBytes = await pdfDoc.save();
        //   const pdfPath = path.join(process.cwd(), 'pdf', config.name+'.pdf');
        //   await fs.ensureDir(path.dirname(pdfPath));
        //   await fs.writeFile(pdfPath, pdfBytes);
        //   console.log(chalk.green(`✅ PDF generated at ${pdfPath}`));
        //   return pdfPath;
        // }
        // async function addTitlePage(pdfDoc: PDFDocument,fontBytes:any, config: ContestConfig) {
        //   const page = pdfDoc.addPage();
        //   const { width, height } = page.getSize();
        //   const titleFont = await pdfDoc.embedFont(fontBytes);
        //   const normalFont = await pdfDoc.embedFont(fontBytes);
        //   // 添加标题
        //   console.log(". add title detail...")
        //   page.drawText(config.description, {
        //     x: 50,
        //     y: height - 100,
        //     size: 24,
        //     font: titleFont,
        //     color: rgb(0, 0, 0),
        //   });
        //   // 添加测试信息
        //   console.log(" add contest inforamt...")
        //   const infoLines = [
        //     //`作者: ${config.author}`,
        //     `开始时间: ${config.startTime}`,
        //     `时长: ${config.duration} 分钟`,
        //     //`创建时间: ${config.createdAt}`,
        //     `题目数量: ${config.problems.length} 题`,
        //   ];
        //   let y = height - 200;
        //   for (const line of infoLines) {
        //     page.drawText(line, {
        //       x: 50,
        //       y,
        //       size: 14,
        //       font: normalFont,
        //       color: rgb(0, 0, 0),
        //     });
        //     y -= 30;
        //   }
        //   // 添加页脚
        //   console.log(" add page footer...")
        //   page.drawText(`生成时间: ${new Date().toLocaleString()} -- generated by oicontest`, {
        //     x: 50,
        //     y: 50,
        //     size: 10,
        //     font: normalFont,
        //     color: rgb(0.5, 0.5, 0.5),
        //   });
        //   return page;
        return "0";
    });
}
// async function addProblemSummary(pdfDoc: PDFDocument, fontBytes:any,config: ContestConfig) {
//   let page = pdfDoc.addPage();
//   const { width, height } = page.getSize();
//   const titleFont = await pdfDoc.embedFont(fontBytes);
//   const normalFont = await pdfDoc.embedFont(fontBytes);
//   // 添加标题
//   // 使用正式比赛名称作为标题
//   page.drawText(config.description, {
//     x: 50,
//     y: height - 100,
//     size: 24,
//     font: titleFont,
//     color: rgb(0, 0, 0),
//   });
//   // 添加测试信息
//   const infoLines = [
//     //`作者: ${config.author}`,
//     `开始时间: ${config.startTime}`,
//     `时长: ${config.duration} 分钟`,
//     `创建时间: ${config.createdAt.split('T')[0]}`,
//     `题目数量: ${config.problems.length} 题`,
//   ];
//   // 创建表格
//   const tableTop = height - 150;
//   const tableLeft = 50;
//   const tableRight = width - 50;
//   const rowHeight = 30;
//   const colWidths = [90, 50, 70,70,80, 80, 60];
//   const headers = ['题目名称', '目录','输入文件名','输出文件名', '时间限制(ms)', '内存限制(MB)', '分值'];
//   // 绘制表头
//   let x = 50;
//   for (let i = 0; i < headers.length; i++) {
//     page.drawText(headers[i], {
//       x: x,
//       y: tableTop,
//       size: 12,
//       font: titleFont,
//       color: rgb(0, 0, 0),
//     });
//     x += colWidths[i];
//   }
//   // 添加分隔线
//   page.drawLine({
//     start: { x:tableLeft, y: tableTop - 10 },
//     end: { x: tableRight , y: tableTop - 10 },
//     thickness: 1,
//     color: rgb(0, 0, 0),
//   });
//   // 绘制表格行
//   let currentY = tableTop - rowHeight;
//   for (const problem of config.problems) {
//     const values = [
//       problem.title,
//       problem.id,
//       problem.id+".in",
//       problem.id +".out",
//       problem.timeLimit.toString(),
//       problem.memoryLimit.toString(),
//       problem.maxScore.toString(),
//     ];
//     x = 50;
//     for (let i = 0; i < values.length; i++) {
//       page.drawText(values[i], {
//         x,
//         y: currentY,
//         size: 10,
//         font: normalFont,
//         color: rgb(0, 0, 0),
//       });
//       x += colWidths[i];
//     }
//     currentY -= rowHeight;
//     // 如果当前页空间不足，创建新页
//     if (currentY < 100) {
//       page = pdfDoc.addPage();
//       currentY = height - 50;
//     }
//   }
//   return page;
// }
// async function addProblemDetails(pdfDoc: PDFDocument,fontBytes:any, config: ContestConfig) {
//   const normalFont = await pdfDoc.embedFont(fontBytes);
//   for (const problem of config.problems) {
//     const problemDir = path.join(process.cwd(), 'problem', problem.id);
//     let problemMdPath = path.join(problemDir, 'problem.md');
//     if (!fs.existsSync(problemMdPath)){
//        problemMdPath = path.join(problemDir, 'problem_zh.md');
//     }
//     if (!fs.existsSync(problemMdPath)) {
//       console.warn(chalk.yellow(`⚠️ Problem markdown not found: ${problemMdPath}`));
//       continue;
//     }
//     const markdownContent = await fs.readFile(problemMdPath, 'utf-8');
//     const htmlContent = marked(markdownContent);
//     // 创建新页
//     let page = pdfDoc.addPage();
//     const { width, height } = page.getSize();
//     const titleFont = await pdfDoc.embedFont(fontBytes);
//     // 添加题目标题
//     page.drawText(`${problem.id}: ${problem.title}`, {
//       x: 50,
//       y: height - 50,
//       size: 18,
//       font: titleFont,
//       color: rgb(0, 0, 0),
//     });
//     // 添加题目信息
//     page.drawText(`时间限制: ${problem.timeLimit}ms | 内存限制: ${problem.memoryLimit}MB | 分值: ${problem.maxScore}`, {
//       x: 50,
//       y: height - 80,
//       size: 12,
//       font: normalFont,
//       color: rgb(0.5, 0.5, 0.5),
//     });
//     // 添加分隔线
//     page.drawLine({
//       start: { x: 50, y: height - 90 },
//       end: { x: width - 50, y: height - 90 },
//       thickness: 1,
//       color: rgb(0.8, 0.8, 0.8),
//     });
//     // 添加题目内容
//     let currentY = height - 120;
//     const lines = htmlContent.split('<br/><br/>');
//     for (const line of lines) {
//       // 移除 HTML 标签
//       const textContent = line.replace(/<[^>]*>?/gm, '');
//       if (textContent.trim().length === 0) continue;
//       // 检查页面空间
//       if (currentY < 100) {
//         page = pdfDoc.addPage();
//         currentY = height - 50;
//       }
//       // 添加文本
//       page.drawText(textContent, {
//         x: 50,
//         y: currentY,
//         size: 12,
//         font: normalFont,
//         color: rgb(0, 0, 0),
//       });
//       currentY -= 20;
//     }
//   }
// }
