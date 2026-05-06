// @ts-nocheck
import chalk from "chalk";
import ora from "ora";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { loadConfig } from "../config.js";
async function fetchJiraTicket(ticketId, jiraUrl, email, token) {
    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    const url = `${jiraUrl}/rest/api/3/issue/${ticketId}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
        },
    });
    if (!res.ok) {
        if (res.status === 404)
            throw new Error(`Ticket ${ticketId} not found`);
        if (res.status === 401)
            throw new Error("Invalid Jira credentials");
        throw new Error(`Jira API error: ${res.status}`);
    }
    const data = await res.json();
    const description = extractTextFromADF(data.fields.description);
    return {
        id: ticketId,
        title: data.fields.summary,
        description,
    };
}
// Convert Jira ADF format to plain text
function extractTextFromADF(adf) {
    if (!adf)
        return "";
    if (typeof adf === "string")
        return adf;
    const lines = [];
    function walk(node) {
        if (!node)
            return;
        if (node.type === "text") {
            lines.push(node.text || "");
        }
        else if (node.type === "hardBreak") {
            lines.push("\n");
        }
        else if (node.content) {
            node.content.forEach(walk);
            if (["paragraph", "heading", "listItem", "bulletList"].includes(node.type)) {
                lines.push("\n");
            }
        }
    }
    walk(adf);
    return lines.join("").trim();
}
export async function generateCommand(ticketId, options) {
    const config = loadConfig();
    if (!config) {
        console.error(chalk.red("✗ TicketToTest is not configured. Run first: ") +
            chalk.bold("npx tickettotest init"));
        process.exit(1);
    }
    console.log(chalk.gray(`  Ticket: ${chalk.bold(ticketId)}\n`));
    // 1. Fetch Jira ticket
    const jiraSpinner = ora(`Fetching ticket ${ticketId} from Jira...`).start();
    let ticket;
    try {
        ticket = await fetchJiraTicket(ticketId, config.jira_url, config.jira_email, config.jira_token);
        jiraSpinner.succeed(chalk.green(`Ticket fetched: "${ticket.title}"`));
    }
    catch (err) {
        jiraSpinner.fail(chalk.red(`Jira fetch failed: ${err.message}`));
        process.exit(1);
    }
    // 2. Generate Playwright test via TicketToTest API
    const genSpinner = ora("Claude AI is generating your Playwright test...").start();
    try {
        const res = await fetch(`${config.api_url}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-license-key": config.license_key,
            },
            body: JSON.stringify({
                ticket_id: ticket.id,
                title: ticket.title,
                description: ticket.description,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            genSpinner.fail(chalk.red(`Generation failed: ${data.error}`));
            if (data.message)
                console.log(chalk.yellow(`  → ${data.message}`));
            process.exit(1);
        }
        // Clean code — remove markdown fences if present
        const code = data.code
            .replace(/^```typescript\n?/, "")
            .replace(/^```ts\n?/, "")
            .replace(/```$/, "")
            .trim();
        const lineCount = code.split("\n").length;
        genSpinner.succeed(chalk.green(`Test generated! (${lineCount} lines of TypeScript)`));
        // 3a. --dry-run: print to console
        if (options.dryRun) {
            console.log(chalk.gray("\n─────────────────────────────────────────"));
            console.log(code);
            console.log(chalk.gray("─────────────────────────────────────────\n"));
        }
        else {
            // 3b. Save to file
            if (!existsSync(options.output)) {
                mkdirSync(options.output, { recursive: true });
            }
            const filepath = join(options.output, data.filename);
            writeFileSync(filepath, code, "utf-8");
            console.log(chalk.green(`\n✓ Saved: ${chalk.bold(filepath)}`));
            console.log(chalk.cyan("\nRun your test:\n") +
                chalk.bold(`  npx playwright test ${filepath}\n`));
        }
        // 4. Show remaining quota
        const remaining = data.quota_remaining;
        const color = remaining < 20 ? chalk.yellow : chalk.gray;
        console.log(color(`  Generations remaining: ${remaining}`));
        if (remaining < 20) {
            console.log(chalk.yellow("  ⚠ Running low on credits!\n") +
                chalk.cyan("  Buy more at: tickettotest.com\n"));
        }
    }
    catch (err) {
        genSpinner.fail(chalk.red(`API connection failed: ${err.message}`));
        process.exit(1);
    }
}
