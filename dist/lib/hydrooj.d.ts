import { ProblemConfig } from './config';
/**
 * 校验题目目录下必要文件完整性
 * @param basePath 题目根目录
 * @returns 缺失时返回错误信息，否则返回null
 */
export declare function checkProblemFiles(basePath: string): Promise<string | null>;
/**
 * 从 HydroOJ 导出包导入题目到当前 contest 目录。
 * 1. 校验压缩包存在
 * 2. 记录导入前 contest 配置和题目快照，便于失败回滚
 * 3. 解包并提取所有题目ID
 * 4. 针对每个题目：
 *    - 解包到本地目录
 *    - 提取描述、配置、测试数据等
 *    - 校验必要文件完整性
 *    - 生成 config.json（如缺失）
 *    - 生成 status.json（所有状态均为true）
 *    - 组装 ProblemConfig
 * 5. 全部成功则返回题目列表，否则回滚并报错
 */
export declare function importHydroOJ(zipPath: string, contestDir: string): Promise<ProblemConfig[]>;
