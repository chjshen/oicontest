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
exports.convertMarkdownImagePaths = convertMarkdownImagePaths;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * 将 Markdown 中的图片相对路径转换为绝对路径
 * @param markdownFilePath - Markdown 文件的绝对路径
 * @param options - 转换选项
 */
function convertMarkdownImagePaths(markdownFilePath_1) {
    return __awaiter(this, arguments, void 0, function* (markdownFilePath, options = {}) {
        // 读取配置选项
        const { baseURL = '', urlEncode = false, toPosixPath = true, skipPattern = /^(https?:|[a-zA-Z]:|\/)/, } = options;
        // 1. 读取 Markdown 文件内容
        const markdownContent = fs_1.default.readFileSync(markdownFilePath, 'utf8');
        // 3. 获取 Markdown 文件所在目录
        const baseDir = path_1.default.dirname(markdownFilePath);
        //   console.log(baseDir);
        // 4. 正则表达式匹配以 file:// 开头的 Markdown 图片语法
        const imageRegex = /!\[(.*?)\]\(file:\/\/([^\)]+)\)/g;
        // 5. 替换相对路径为绝对路径
        const updatedContent = markdownContent.replace(imageRegex, (match, altText, imgPath) => {
            // skipPattern 用于检测图片路径 imgPath 是否为已处理的路径类型（如 http/https 网络图片、本地绝对路径或 Windows 盘符路径等），如果匹配则跳过处理
            if (skipPattern.test(imgPath)) {
                return match;
            }
            try {
                // file://后面的内容都是在additional_file目录中，保持file://前缀，后面的内容不变
                let absolutePath = path_1.default.resolve(baseDir, "additional_file", imgPath);
                // 可选：转换为 POSIX 路径格式（跨平台）
                if (toPosixPath) {
                    absolutePath = absolutePath.replace(/\\/g, '/');
                }
                // 添加基础 URL
                if (baseURL) {
                    absolutePath = path_1.default.resolve(baseURL, absolutePath);
                }
                // 可选：URL 编码特殊字符
                if (urlEncode) {
                    absolutePath = encodeURI(absolutePath);
                }
                //console.log("new path:",absolutePath)
                // 返回新的 Markdown 图片语法
                return `![${altText}](${absolutePath})`;
            }
            catch (error) {
                console.error(`❌ 处理图片失败: ${imgPath}`, error);
                return match; // 出错时返回原始内容
            }
        });
        return updatedContent;
        // 6. 写回文件
        //   fs.writeFileSync(markdownFilePath, updatedContent, 'utf8');
        //   console.log(`✅ 转换完成: ${markdownFilePath}`);
    });
}
/**
 * 批量转换目录中的所有 Markdown 文件
 * @param directoryPath - 包含 Markdown 文件的目录路径
 * @param options - 转换选项
 */
// export function convertMarkdownDirectory(
//   directoryPath: string,
//   options: ConvertOptions = {}
// ): void {
//   const files = fs.readdirSync(directoryPath);
//   files.forEach(file => {
//     if (file.endsWith('.md')) {
//       const fullPath = path.join(directoryPath, file);
//       try {
//         convertMarkdownImagePaths(fullPath, options);
//       } catch (error) {
//         console.error(`❌ 处理文件失败: ${fullPath}`, error);
//       }
//     }
//   });
//   console.log(`🎉 批量转换完成，共处理 ${files.filter(f => f.endsWith('.md')).length} 个文件`);
// }
// // 使用示例
// if (require.main === module) {
//   // 单个文件转换示例
//   const markdownFile = path.resolve(__dirname, 'docs/article.md');
//   convertMarkdownImagePaths(markdownFile, {
//     baseURL: 'file:///',
//     urlEncode: true,
//     toPosixPath: true,
//     backup: true
//   });
//   // 批量转换示例
//   const docsDir = path.resolve(__dirname, 'docs');
//   convertMarkdownDirectory(docsDir, {
//     toPosixPath: true
//   });
// }
