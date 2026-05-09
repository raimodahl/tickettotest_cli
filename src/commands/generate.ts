import chalk from "chalk";
import ora from "ora";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { loadConfig } from "../config.js";

interface JiraField {
    summary: string;
    description: unknown;
}

interface JiraIssue {
    fields: JiraField;
}

interface JiraTicket {
    id: string;
    title: string;
    description: string;
}

interface GenerateResponse {
    code: string;
    filename: string;
    existing_tests_warning?: string[];
    quota_remaining: number;
    error?: string;
    message?: string;
}

async function fetchJiraTicket(
    ticketId: string,
    jiraUrl: string,
    email: string,
    token: string
): Promise<JiraTicket> {
    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    const url = `${jiraUrl}/rest/api/3/issue/${ticketId}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
        },
    });
    if (!res.ok) {
        if (res.status === 404) throw new Error(`Ticket ${ticketId} not found`);
        if (res.status === 401) throw new Error("Invalid Jira credentials");
        throw new Error(`Jira API error: ${res.status}`);
    }
    const data = (await res.json()) as JiraIssue;
    const description = extractTextFromADF(data.fields.description);
    return {
        id: ticketId,
        title: data.fields.summary,
        description,
    };
}

function extractTextFromADF(adf: unknown): string {
    if (!adf) return "";
    if (typeof adf === "string") return adf;
    const lines: string[] = [];
    function walk(node: unknown): void {
        if (!node || typeof node !== "object") return;
        const n = node as { type?: string; text?: string; content?: unknown[] };
        if (n.type === "text") {
            lines.push(n.text || "");
        } else if (n.type === "hardBreak") {
            lines.push("\n");
        } else if (n.content) {
            n.content.forEach(walk);
            if (["paragraph", "heading", "listItem", "bulletList"].includes(n.type as string)) {
                lines.push("\n");
            }
        }
    }
    walk(adf);
    return lines.join("").trim();
}

interface GenerateOptions {
    framework?: string;
    output: string;
    dryRun?: boolean;
}

export async function generateCommand(
    ticketId: string,
    options: GenerateOptions
): Promise<void> {
    const config = loadConfig();
    if (!config) {
        console.error(
            chalk.red("✗ TicketToTest is not configured. Run first: ") +
            chalk.bold("npx tickettotest init")
        );
        process.exit(1);
    }
    console.log(chalk.gray(`  Ticket: ${chalk.bold(ticketId)}\n`));
    const jiraSpinner = ora(`Fetching ticket ${ticketId} from Jira...`).start();
    let ticket: JiraTicket;
    try {
        ticket = await fetchJiraTicket(
            ticketId,
            config.jira_url as string,
            config.jira_email as string,
            config.jira_token as string
        );
        jiraSpinner.succeed(chalk.green(`Ticket fetched: "${ticket.title}"`));
    } catch (err) {
        jiraSpinner.fail(chalk.red(`Jira fetch failed: ${(err as Error).message}`));
        process.exit(1);
    }
    const framework = options.framework || "playwright";
    const genSpinner = ora(`Claude AI is generating your ${framework} test...`).start();
    try {
        const res = await fetch(`${config.api_url}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-license-key": config.license_key as string,
            },
            body: JSON.stringify({
                ticket_id: ticket.id,
                title: ticket.title,
                description: ticket.description,
                framework,
                project_path: options.output,
            }),
        });
        const data = (await res.json()) as GenerateResponse;
        if (!res.ok) {
            genSpinner.fail(chalk.red(`Generation failed: ${data.error}`));
            if (data.message) console.log(chalk.yellow(`  → ${data.message}`));
            process.exit(1);
        }
        const code = data.code
            .replace(/^```typescript\n?/, "")
            .replace(/^```ts\n?/, "")
            .replace(/```$/, "")
            .trim();
        const lineCount = code.split("\n").length;
        genSpinner.succeed(chalk.green(`Test generated! (${lineCount} lines)`));
        if (options.dryRun) {
            console.log(chalk.gray("\n─────────────────────────────────────────"));
            console.log(code);
            console.log(chalk.gray("─────────────────────────────────────────\n"));
        } else {
            if (!existsSync(options.output)) {
                mkdirSync(options.output, { recursive: true });
            }
            const filepath = join(options.output, data.filename);
            writeFileSync(filepath, code, "utf-8");
            console.log(chalk.green(`\n✓ Saved: ${chalk.bold(filepath)}`));
            if (data.existing_tests_warning && data.existing_tests_warning.length > 0) {
                console.log(chalk.yellow(`\n⚠ Possible duplicate tests detected:`));
                for (const warning of data.existing_tests_warning) {
                    console.log(chalk.yellow(`  → ${warning}`));
                }
                console.log(chalk.gray(`  Review your existing tests before running.\n`));
            }
            const runCmd =
                framework === "robot" ? "robot tests/"
                : framework === "cypress" ? "npx cypress run"
                : framework === "selenium" ? "mvn test"
                : "npx playwright test";
            console.log(
                chalk.cyan("\nRun your test:\n") +
                chalk.bold(`  ${runCmd} ${filepath}\n`)
            );
        }
        const remaining = data.quota_remaining;
        const color = remaining < 20 ? chalk.yellow : chalk.gray;
        console.log(color(`  Generations remaining: ${remaining}`));
        if (remaining < 20) {
            console.log(
                chalk.yellow("  ⚠ Running low on credits!\n") +
                chalk.cyan("  Buy more at: tickettotest.com\n")
            );
        }
    } catch (err) {
        genSpinner.fail(chalk.red(`API connection failed: ${(err as Error).message}`));
        process.exit(1);
    }
}