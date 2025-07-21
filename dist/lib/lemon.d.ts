import { ContestConfig } from './config';
/**
 * 生成 LEMON 评测包
 *
 * LEMON 是一个开源的在线评测系统，支持多种编程语言和评测方式。
 * 此函数将 OIContest 的题目数据转换为 LEMON 系统可识别的格式。
 *
 * @param config 比赛配置信息
 * @returns Promise<string> 生成的 ZIP 包路径
 */
export declare function generateLemonPackage(config: ContestConfig): Promise<string>;
