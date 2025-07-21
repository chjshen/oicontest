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
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.initConfig = initConfig;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const CONFIG_FILE = 'oicontest.json';
function loadConfig(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        const configPath = path_1.default.join(dir, CONFIG_FILE);
        if (!fs_extra_1.default.existsSync(configPath)) {
            throw new Error('Configuration file not found. Are you in a contest directory?');
        }
        return fs_extra_1.default.readJSON(configPath);
    });
}
function saveConfig(dir, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const configPath = path_1.default.join(dir, CONFIG_FILE);
        config.updatedAt = new Date().toISOString();
        yield fs_extra_1.default.writeJSON(configPath, config, { spaces: 2 });
    });
}
function initConfig(dir, name, description, startTime, duration, author) {
    return __awaiter(this, void 0, void 0, function* () {
        // Validate and format start time
        const formattedStartTime = (0, moment_1.default)(startTime, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm');
        const now = new Date().toISOString();
        const config = {
            name,
            description,
            duration,
            startTime: formattedStartTime,
            createdAt: now,
            updatedAt: now,
            author,
            problems: [],
            status: {
                initialized: true,
                problemsVerified: false,
                problemsAdded: false,
                pdfGenerated: false,
                lemonGenerated: false,
            },
        };
        yield saveConfig(dir, config);
        return config;
    });
}
