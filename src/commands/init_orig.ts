// @ts-nocheck
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { saveConfig } from "../config.js";
const API_URL = "https://api.tickettotest.com";
export async function initCommand() {
    console.log(chalk.cyan("Welcome! Let's configure TicketToTest.\n"));
    console.log(chalk.gray("You'll need: (1) a TicketToTest license key  (2) Jira API credentials\n"));
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "license_key",
            message: "TicketToTest license key:",
            validate: (v) => /^TTT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(v.trim())
                ? true
                : "Key must be in the format TTT-XXXX-XXXX-XXXX",
        },
        {
            type: "input",
            name: "jira_url",
            message: "Jira URL (e.g. https://yourcompany.atlassian.net):",
            validate: (v) => v.startsWith("https://") ? true : "URL must start with https://",
        },
        {
            type: "input",
            name: "jira_email",
            message: "Jira email address:",
            validate: (v) => (v.includes("@") ? true : "Enter a valid email address"),
        },
        {
            type: "password",
            name: "jira_token",
            message: "Jira API token (Atlassian → Manage account → Security):",
            mask: "*",
            validate: (v) => (v.length > 10 ? true : "Token looks too short"),
        },
    ]);
    const spinner = ora("Verifying license key...").start();
    try {
        const res = await fetch(`${API_URL}/activate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ license_key: answers.license_key.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
            spinner.fail(chalk.red(`License key rejected: ${data.error}`));
            process.exit(1);
        }
        spinner.succeed(chalk.green(`License activated! Plan: ${chalk.bold(data.tier)} — ` +
            `${chalk.bold(data.quota_remaining)} generations remaining`));
        saveConfig({
            license_key: answers.license_key.trim(),
            jira_url: answers.jira_url.replace(/\/$/, ""),
            jira_email: answers.jira_email.trim(),
            jira_token: answers.jira_token,
            api_url: API_URL,
        });
        console.log(chalk.green("\n✓ Config saved to ~/.tickettotest/config.json"));
        console.log(chalk.cyan("\nYou can now generate tests:\n") +
            chalk.bold("  npx tickettotest generate PROJ-142\n"));
    }
    catch {
        spinner.fail(chalk.red("Could not connect to TicketToTest API. Check your network and try again."));
        process.exit(1);
    }
}
