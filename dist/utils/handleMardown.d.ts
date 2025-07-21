export interface ConvertOptions {
    /** 在路径前添加的基础URL（如 'file:///'） */
    baseURL?: string;
    /** 是否对路径进行URL编码 */
    urlEncode?: boolean;
    /** 是否将路径转换为POSIX格式（跨平台兼容） */
    toPosixPath?: boolean;
    /** 跳过已处理的路径模式（正则表达式） */
    skipPattern?: RegExp;
}
/**
 * 将 Markdown 中的图片相对路径转换为绝对路径
 * @param markdownFilePath - Markdown 文件的绝对路径
 * @param options - 转换选项
 */
export declare function convertMarkdownImagePaths(markdownFilePath: string, options?: ConvertOptions): Promise<string>;
/**
 * 批量转换目录中的所有 Markdown 文件
 * @param directoryPath - 包含 Markdown 文件的目录路径
 * @param options - 转换选项
 */
