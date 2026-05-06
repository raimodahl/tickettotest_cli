// @ts-nocheck
import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
const CONFIG_DIR = join(homedir(), ".tickettotest");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
export function saveConfig(config) {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
export function loadConfig() {
    if (!existsSync(CONFIG_FILE))
        return null;
    try {
        return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    }
    catch {
        return null;
    }
}
export function configExists() {
    return existsSync(CONFIG_FILE);
}
