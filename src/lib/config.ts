import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';

export interface ProblemConfig {
  id: string;
  index:number;
  title: string;
  timeLimit: number; // ms
  memoryLimit: number; // MB
  maxScore: number;
}

export interface ContestConfig {
  name: string;            // Directory name
  description: string;     // Official name for PDF
  duration: number;        // minutes
  startTime: string;       // Format: YYYY-MM-DD HH:mm
  createdAt: string;
  updatedAt: string;
  author: string;
  problems: ProblemConfig[];
  status: {
    initialized: boolean;
    problemsAdded: boolean;
    problemsVerified:boolean;
    pdfGenerated: boolean;
    lemonGenerated: boolean;
  };
}

export interface ProblemStatus {
  dir: { desc: string; status: boolean };
  isvalidated: { desc: string; status: boolean };
  isgenerated: { desc: string; status: boolean };
  ischecked: { desc: string; status: boolean };
}

export interface ProblemConfigJson {
  id: string;
  index: number;
  title: string;
  timeLimit: number;
  memoryLimit: number;
  maxScore: number;
}

const CONFIG_FILE = 'oicontest.json';

export async function loadConfig(dir: string): Promise<ContestConfig> {
  const configPath = path.join(dir, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    throw new Error('Configuration file not found. Are you in a contest directory?');
  }
  return fs.readJSON(configPath);
}

export async function saveConfig(dir: string, config: ContestConfig) {
  const configPath = path.join(dir, CONFIG_FILE);
  config.updatedAt = new Date().toISOString();
  await fs.writeJSON(configPath, config, { spaces: 2 });
}

export async function initConfig(
  dir: string,
  name: string,
  description: string,
  startTime: string,
  duration: number,
  author: string
): Promise<ContestConfig> {
  // Validate and format start time
  const formattedStartTime = moment(startTime, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm');
  
  const now = new Date().toISOString();
  const config: ContestConfig = {
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
      problemsVerified:false,
      problemsAdded: false,
      pdfGenerated: false,
      lemonGenerated: false,
    },
  };
  await saveConfig(dir, config);
  return config;
}