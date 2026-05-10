#!/usr/bin/env node
import { program } from "commander";
import { initCommand } from "./commands/init.js";
import { generateCommand } from "./commands/generate.js";
import { quotaCommand } from "./commands/quota.js";
import { coverageCommand, qualityCommand } from "./commands/coverage.js";
import chalk from "chalk";
console.log(chalk.bold.blue(`\n  ⚡ TicketToTest`) +
    chalk.gray(` v0.1.8 — Jira → Test generator\n`));
program
    .name("tickettotest")
    .description("Generate test cases automatically from Jira tickets")
    .version("0.1.8");
program
    .command("init")
    .description("Configure TicketToTest — enter your license key and Jira credentials")
    .action(initCommand);
program
    .command("generate <ticket-id>")
    .description("Generate a test from a Jira ticket (playwright|robot|cypress|selenium)")
    .option("-o, --output <dir>", "Directory to save the generated test", "./tests")
    .option("-f, --framework <framework>", "Test framework: playwright|robot|cypress|selenium", "playwright")
    .option("--dry-run", "Print the generated test without saving")
    .action(generateCommand);
program
    .command("quota")
    .description("Show remaining generations")
    .action(quotaCommand);
program
    .command("coverage")
    .description("Show test coverage summary or check ticket coverage")
    .option("-p, --project <path>", "Project root to scan for tests", ".")
    .option("-o, --output <dir>", "Alias for --project")
    .option("-r, --report", "Generate markdown report to tests/coverage-report.md")
    .argument("[ticket-ids...]", "Jira ticket IDs to check (optional)")
    .action(coverageCommand);
program.parse();
