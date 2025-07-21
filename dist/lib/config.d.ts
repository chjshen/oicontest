export interface ProblemConfig {
    id: string;
    index: number;
    title: string;
    timeLimit: number;
    memoryLimit: number;
    maxScore: number;
}
export interface ContestConfig {
    name: string;
    description: string;
    duration: number;
    startTime: string;
    createdAt: string;
    updatedAt: string;
    author: string;
    problems: ProblemConfig[];
    status: {
        initialized: boolean;
        problemsAdded: boolean;
        problemsVerified: boolean;
        pdfGenerated: boolean;
        lemonGenerated: boolean;
    };
}
export interface ProblemStatus {
    dir: {
        desc: string;
        status: boolean;
    };
    isvalidated: {
        desc: string;
        status: boolean;
    };
    isgenerated: {
        desc: string;
        status: boolean;
    };
    ischecked: {
        desc: string;
        status: boolean;
    };
}
export interface ProblemConfigJson {
    id: string;
    index: number;
    title: string;
    timeLimit: number;
    memoryLimit: number;
    maxScore: number;
}
export declare function loadConfig(dir: string): Promise<ContestConfig>;
export declare function saveConfig(dir: string, config: ContestConfig): Promise<void>;
export declare function initConfig(dir: string, name: string, description: string, startTime: string, duration: number, author: string): Promise<ContestConfig>;
