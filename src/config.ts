import fs from "fs";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { ENV_FILE, CONFIG_FILE, CONFIG_DIR } from "./paths.js";
import type { Config } from "./types.js";

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
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
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
