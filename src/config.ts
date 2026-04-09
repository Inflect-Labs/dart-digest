import fs from "fs";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { ENV_FILE, CONFIG_FILE, CONFIG_DIR } from "./paths.js";
import type { Config, DateRange } from "./types.js";

export function loadEnv(): void {
  dotenv.config({ path: ENV_FILE });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Run: dtd setup`);
    process.exit(1);
  }
  return value;
}

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error("No config found. Run: dtd setup");
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) as Config;
  } catch {
    console.error("Invalid config. Run: dtd setup");
    process.exit(1);
  }
}

export function saveConfig(config: Config): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function parseLast(period: string): number {
  const map: Record<string, number> = {
    day: 1,
    "3d": 3,
    week: 7,
    fortnight: 14,
    month: 30,
  };
  if (map[period] !== undefined) return map[period];
  const match = period.match(/^(\d+)d$/);
  if (match) return parseInt(match[1], 10);
  console.error(`Unknown period: "${period}". Use: day, 3d, week, fortnight, month, Nd`);
  process.exit(1);
}

export function getDateRange(
  since?: string,
  until?: string,
  daysBack = 7
): DateRange {
  const today = new Date().toISOString().slice(0, 10);
  const resolvedUntil = until ?? today;
  const resolvedSince = since ?? subtractDays(resolvedUntil, daysBack);
  return { since: resolvedSince, until: resolvedUntil };
}

function subtractDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function matchSpace(spaces: string[], query: string): string | undefined {
  if (spaces.includes(query)) return query;
  return spaces.find((s) => s.toLowerCase().includes(query.toLowerCase()));
}

export function copyToClipboard(text: string): boolean {
  try {
    if (process.platform === "darwin") {
      execSync("pbcopy", { input: text });
    } else {
      try {
        execSync("xclip -selection clipboard", { input: text });
      } catch {
        execSync("xsel --clipboard --input", { input: text });
      }
    }
    return true;
  } catch {
    return false;
  }
}
