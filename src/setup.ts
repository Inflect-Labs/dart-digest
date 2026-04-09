import fs from "fs";
import { password, confirm, checkbox } from "@inquirer/prompts";
import { CONFIG_DIR, ENV_FILE, CONFIG_FILE } from "./paths.js";
import { saveConfig } from "./config.js";
import { getDartConfig } from "./dart.js";
import type { Config } from "./types.js";

export async function runSetup(): Promise<void> {
  console.log("\nDart AI setup\n");

  // Prompt for API key (skip if already set and user declines update)
  let apiKey = "";
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, "utf8");
    const match = content.match(/DART_API_KEY=(.+)/);
    if (match) {
      const existing = match[1].trim();
      const masked = `${existing.slice(0, 8)}...${existing.slice(-4)}`;
      const update = await confirm({
        message: `Update API key? (current: ${masked})`,
        default: false,
      });
      if (!update) apiKey = existing;
    }
  }

  if (!apiKey) {
    console.log("  ┌─ Dart API key needed ──────────────────────────────────────┐");
    console.log("  │");
    console.log("  │  1. Open this URL in your browser:");
    console.log("  │     https://app.dartai.com/home/api?settings=cli");
    console.log("  │");
    console.log("  │  2. Click \"Create API key\", give it a name (e.g. dtd),");
    console.log("  │     and copy the key (starts with dsa_).");
    console.log("  │");
    console.log("  └────────────────────────────────────────────────────────────┘\n");

    apiKey = await password({ message: "  Dart API key:", mask: "*" });
    apiKey = apiKey.trim();
  }

  // Validate API key
  let dartConfig;
  try {
    dartConfig = await getDartConfig(apiKey);
  } catch {
    console.error("\nInvalid API key or network error.");
    process.exit(1);
  }

  // Write .env
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(ENV_FILE, `DART_API_KEY=${apiKey}\n`, { mode: 0o600 });
  console.log(`\nLogged in as ${dartConfig.user.name} (${dartConfig.user.email})`);

  // Load existing config or start fresh
  let config: Config = { spaces: [], defaults: { daysBack: 7 } };
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) as Config;
    } catch {
      // ignore malformed config, start fresh
    }
  }

  // Prompt to select spaces if none tracked yet
  if (config.spaces.length === 0) {
    const selected = await checkbox({
      message: "Select dartboards to track:",
      choices: dartConfig.dartboards.map((d) => ({ name: d, value: d })),
    });
    config.spaces = selected;
  }

  saveConfig(config);
  console.log(`\nTracking ${config.spaces.length} space(s). Run: dtd list`);
}

export async function addSpaces(token: string): Promise<void> {
  const dartConfig = await getDartConfig(token);
  let config: Config = { spaces: [], defaults: { daysBack: 7 } };
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) as Config;
    } catch {
      // ignore malformed config, start fresh
    }
  }

  const available = dartConfig.dartboards.filter((d) => !config.spaces.includes(d));
  if (available.length === 0) {
    console.log("All dartboards are already tracked.");
    return;
  }

  const selected = await checkbox({
    message: "Select dartboards to add:",
    choices: available.map((d) => ({ name: d, value: d })),
  });

  config.spaces = [...config.spaces, ...selected];
  saveConfig(config);
  console.log(`Added ${selected.length} space(s). Now tracking ${config.spaces.length}.`);
}

export async function removeSpaces(): Promise<void> {
  let config: Config = { spaces: [], defaults: { daysBack: 7 } };
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) as Config;
    } catch {
      // ignore malformed config, start fresh
    }
  }

  if (config.spaces.length === 0) {
    console.log("No spaces configured.");
    return;
  }

  const toRemove = await checkbox({
    message: "Select spaces to remove:",
    choices: config.spaces.map((s) => ({ name: s, value: s })),
  });

  config.spaces = config.spaces.filter((s) => !toRemove.includes(s));
  saveConfig(config);
  console.log(`Removed ${toRemove.length} space(s). Now tracking ${config.spaces.length}.`);
}
