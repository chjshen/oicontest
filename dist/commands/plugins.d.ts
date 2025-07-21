import { Command } from 'commander';
export declare const pluginCommand: Command;
export interface OIContestPlugin {
    name: string;
    importers?: {
        [ojName: string]: (zipPath: string, contestDir: string) => Promise<void>;
    };
    exporters?: {
        [format: string]: (contestDir: string) => Promise<void>;
    };
    hooks?: {
        preGenPDF?: (config: any) => Promise<void>;
        postGenPDF?: (pdfPath: string) => Promise<void>;
    };
}
