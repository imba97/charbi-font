import type { FontConfig } from "../config/schema";

export interface FontSubsetInfo {
  config: FontConfig;
  filePath: string;
  size: number;
  format: string;
}

export type FontGroupMap = Map<string, FontSubsetInfo[]>;
