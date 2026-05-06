// @ts-nocheck
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../config.js";
export async function quotaCommand() {
    const config = loadConfig();
    if (!config) {
        console.error(chalk.red("✗ TicketToTest is not configured. Run first: ") +
            chalk.bold("npx tickettotest init"));
        process.exit(1);
    }
    const spinner = ora("Fetching quota...").start();
    try {
        const res = await fetch(`${config.api_url}/quota`, {
            headers: { "x-license-key": config.license_key },
        });
        const data = await res.json();
        if (!res.ok) {
            spinner.fail(chalk.red(`Error: ${data.error}`));
            process.exit(1);
        }
        spinner.stop();
        const pct = Math.round((data.quota_used / data.quota_total) * 100);
        const barFilled = Math.round(pct / 5);
        const bar = chalk.blue("█".repeat(barFilled)) +
            chalk.gray("░".repeat(20 - barFilled));
        console.log(chalk.bold(`\n  Plan: ${data.tier.toUpperCase()}`));
        console.log(`  ${bar}  ${pct}% used\n`);
        console.log(chalk.gray(`  Used:      ${data.quota_used}`));
        console.log(chalk.gray(`  Remaining: ${chalk.bold(data.quota_remaining)}`));
        console.log(chalk.gray(`  Total:     ${data.quota_total}\n`));
        if (data.quota_remaining < 20) {
            console.log(chalk.yellow("  ⚠ Running low on credits!\n") +
                chalk.cyan("  Buy more at: tickettotest.com\n"));
        }
    }
    catch {
        spinner.fail(chalk.red("API connection failed. Check your network."));
        process.exit(1);
    }
}
