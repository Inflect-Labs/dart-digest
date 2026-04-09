import os from "os";
import path from "path";

export const CONFIG_DIR = path.join(os.homedir(), ".dart-digest");
export const ENV_FILE = path.join(CONFIG_DIR, ".env");
export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
