import * as fs from 'fs';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import markedKatex from 'marked-katex-extension';
import hljs from 'highlight.js';
import path from 'path';
import katex from 'katex';

// 只在模块顶部配置一次 marked
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  }),
//   markedKatex({
//     throwOnError: false,
//     displayMode: false,
//     macros: {
//       "\\RR": "\\mathbb{R}",
//       "\\bold": "\\mathbf{#1}"
//     }
//   })
);
// 自定义数学公式渲染函数
function renderMathInText(text:string) {
    // 先渲染块级数学公式，避免与行内公式冲突
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
          errorColor: '#cc0000'
        });
      } catch (error) {
        console.error('KaTeX渲染错误:', error);
        return `<span style="color: #cc0000;">[数学公式渲染错误: ${formula}]</span>`;
      }
    });
    
    // 然后渲染行内数学公式
    text = text.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      // 跳过已经被渲染的块级公式
      if (match.includes('katex')) {
        return match;
      }
      try {
        return katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
          errorColor: '#cc0000'
        });
      } catch (error) {
        console.error('KaTeX渲染错误:', error);
        return `<span style="color: #cc0000;">[数学公式渲染错误: $${formula}$]</span>`;
      }
    });
    
    return text;
  }
  marked.setOptions({
    breaks: true,
    gfm: true
  });
// 动态生成KaTeX字体@font-face，使用file://绝对路径
function getKatexFontFaceCssAbs(fontsDir: string) {
    const fontMap = [
        { file: 'KaTeX_Main-Regular', family: 'KaTeX_Main', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_Main-Bold', family: 'KaTeX_Main', weight: 'bold', style: 'normal' },
        { file: 'KaTeX_Main-Italic', family: 'KaTeX_Main', weight: 'normal', style: 'italic' },
        { file: 'KaTeX_Main-BoldItalic', family: 'KaTeX_Main', weight: 'bold', style: 'italic' },
        { file: 'KaTeX_Math-Italic', family: 'KaTeX_Math', weight: 'normal', style: 'italic' },
        { file: 'KaTeX_Math-BoldItalic', family: 'KaTeX_Math', weight: 'bold', style: 'italic' },
        { file: 'KaTeX_AMS-Regular', family: 'KaTeX_AMS', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_SansSerif-Regular', family: 'KaTeX_SansSerif', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_SansSerif-Bold', family: 'KaTeX_SansSerif', weight: 'bold', style: 'normal' },
        { file: 'KaTeX_SansSerif-Italic', family: 'KaTeX_SansSerif', weight: 'normal', style: 'italic' },
        { file: 'KaTeX_Script-Regular', family: 'KaTeX_Script', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_Fraktur-Regular', family: 'KaTeX_Fraktur', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_Fraktur-Bold', family: 'KaTeX_Fraktur', weight: 'bold', style: 'normal' },
        { file: 'KaTeX_Caligraphic-Regular', family: 'KaTeX_Caligraphic', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_Caligraphic-Bold', family: 'KaTeX_Caligraphic', weight: 'bold', style: 'normal' },
        { file: 'KaTeX_Typewriter-Regular', family: 'KaTeX_Typewriter', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_Size1-Regular', family: 'KaTeX_Size1', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_Size2-Regular', family: 'KaTeX_Size2', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_Size3-Regular', family: 'KaTeX_Size3', weight: 'normal', style: 'normal' },
        { file: 'KaTeX_Size4-Regular', family: 'KaTeX_Size4', weight: 'normal', style: 'normal' },
    ];
    return fontMap.map(f => {
        const woff2 = path.resolve(fontsDir, f.file + '.woff2');
        const woff = path.resolve(fontsDir, f.file + '.woff');
        const ttf = path.resolve(fontsDir, f.file + '.ttf');
        let src = [];
        if (fs.existsSync(woff2)) src.push(`url('file://${woff2}') format('woff2')`);
        if (fs.existsSync(woff)) src.push(`url('file://${woff}') format('woff')`);
        if (fs.existsSync(ttf)) src.push(`url('file://${ttf}') format('truetype')`);
        if (src.length === 0) return '';
        return `@font-face {
  font-family: '${f.family}';
  src: ${src.join(',\n       ')};
  font-weight: ${f.weight};
  font-style: ${f.style};
}`;
    }).join('\n');
}

// 获取当前日期时间作为转换时间戳
const conversionDate = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

export async function convertMarkdownToHtml(markdownContent: string, contestTitle: string) {
    try {
        // 直接解析
        // 然后渲染数学公式
    const contentWithMath = renderMathInText(markdownContent);
    
    // 最后渲染markdown（包含代码高亮）
    //const htmlContent = marked.parse(contentWithMath);
    
        const staticPath = path.resolve(__dirname,"../templates/html");
        const fontPath = path.resolve(__dirname,"../fonts/katex");
        const fontFaceCss = getKatexFontFaceCssAbs(fontPath);
        const htmlContent = marked.parse(contentWithMath);
        // 生成完整的HTML页面，引用html目录下的本地css和字体
        const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${contestTitle}</title>
    <!-- GitHub风格CSS -->
    <link rel="stylesheet" href="${staticPath}/github-markdown.min.css">
    <!-- 代码高亮样式 -->
    <link rel="stylesheet" href="${staticPath}/github.min.css">
    <!-- KaTeX样式 -->
    <link rel="stylesheet" href="${staticPath}/katex.min.css">
    <style>
        .markdown-body {
            box-sizing: border-box;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
        }
        @media (max-width: 767px) {
            .markdown-body {
                padding: 15px;
            }
        }
        /* 图片样式 */
        .markdown-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em auto;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        /* 页脚样式 */
        .page-footer {
            margin-top: 4em;
            padding-top: 2em;
            border-top: 1px solid #e1e4e8;
            color: #6a737d;
            font-size: 0.9em;
            text-align: center;
        }
        .footer-separator {
            margin: 0 0.5em;
            opacity: 0.5;
        }
        ${fontFaceCss}
        @media print {
          #print-btn {
            display: none !important;
          }
          .copy-btn { display: none !important; }
        }
        .copy-btn { position: absolute; right: 8px; top: 8px; padding: 2px 8px; font-size: 12px; cursor: pointer; background: #eee; border: 1px solid #ccc; border-radius: 4px; z-index: 10; }
        .copy-btn:active { background: #ddd; }
        .pre-block { position: relative; }
    </style>
</head>
<body>
    <article class="markdown-body">
        ${htmlContent}
    <!-- 页脚 -->
    <footer class="page-footer">
        <p>
            转换时间: ${conversionDate}
            <span class="footer-separator">|</span>
            由 oicontent 工具生成
        </p>
    </footer>
    </article>
    <button id="print-btn" onclick="window.print()" style="position:fixed;top:20px;right:20px;z-index:999;">打印/导出PDF</button>
    <script>
    document.querySelectorAll('pre > code').forEach(function(codeBlock) {
      var pre = codeBlock.parentElement;
      pre.classList.add('pre-block');
      var btn = document.createElement('button');
      btn.innerText = '复制';
      btn.className = 'copy-btn';
      btn.onclick = function() {
        navigator.clipboard.writeText(codeBlock.innerText);
        btn.innerText = '已复制!';
        setTimeout(() => btn.innerText = '复制', 1000);
      };
      pre.appendChild(btn);
    });
    </script>
</body>
</html>`;
        return fullHtml;
    } catch (error) {
        console.error('转换失败:', error);
        process.exit(1);
    }
}


    