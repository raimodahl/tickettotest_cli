// @ts-nocheck
import chalk from "chalk";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { loadConfig } from "../config.js";

/**
 * Recursively scan a directory for test files (.spec.ts, .robot, .cy.ts, .java)
 */
function scanTestDirectory(dirPath, depth = 0) {
    if (depth > 10) return []; // Prevent infinite recursion
    const testFiles = [];
    if (!existsSync(dirPath)) return testFiles;
    try {
        const entries = readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
            const fullPath = join(dirPath, entry.name);
            if (entry.isDirectory()) {
                testFiles.push(...scanTestDirectory(fullPath, depth + 1));
            } else if (entry.isFile() && (
                entry.name.endsWith(".spec.ts") ||
                entry.name.endsWith(".robot") ||
                entry.name.endsWith(".cy.ts") ||
                entry.name.endsWith(".java")
            )) {
                testFiles.push(fullPath);
            }
        }
    } catch (e) {
        // Ignore permission errors
    }
    return testFiles;
}

/**
 * Extract test names from a Playwright/Cypress .spec.ts/.cy.ts file
 */
function extractPlaywrightTestNames(content) {
    const testNames = [];
    const testRegex = /(?:test|it)\s*\(\s*["']([^"']+)["']/g;
    let match;
    while ((match = testRegex.exec(content)) !== null) {
        testNames.push(match[1]);
    }
    const describeRegex = /describe\s*\(\s*["']([^"']+)["']/g;
    while ((match = describeRegex.exec(content)) !== null) {
        testNames.push(match[1]);
    }
    return testNames;
}

/**
 * Extract test names from a Robot Framework .robot file
 */
function extractRobotTestNames(content) {
    const testNames = [];
    const lines = content.split("\n");
    let inTestCasesSection = false;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "*** Test Cases ***") {
            inTestCasesSection = true;
            continue;
        }
        if (trimmed.startsWith("*** ") && inTestCasesSection) break;
        if (inTestCasesSection && trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("...")) {
            testNames.push(trimmed);
        }
    }
    return testNames;
}

/**
 * Extract test names from a Selenium/Appium .java file
 */
function extractJavaTestNames(content) {
    const testNames = [];
    // Match @Test methods
    const methodRegex = /@Test\s+(?:public\s+)?void\s+(\w+)\s*\(/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
        testNames.push(match[1]);
    }
    // Match Javadoc-style test names as comments above @Test
    const commentRegex = /\/\*\*\s*\n\s*\*\s*([^@\n]+?)\s*\n\s*\*\//g;
    while ((match = commentRegex.exec(content)) !== null) {
        const name = match[1].trim();
        if (name) testNames.push(name);
    }
    return testNames;
}

/**
 * Build coverage map: file -> test names
 */
function buildCoverageMap(projectPath) {
    const testFiles = scanTestDirectory(projectPath);
    const coverageMap = {};
    for (const filePath of testFiles) {
        try {
            const content = readFileSync(filePath, "utf-8");
            let testNames = [];
            if (filePath.endsWith(".robot")) {
                testNames = extractRobotTestNames(content);
            } else if (filePath.endsWith(".java")) {
                testNames = extractJavaTestNames(content);
            } else {
                testNames = extractPlaywrightTestNames(content);
            }
            if (testNames.length > 0) {
                const relative = filePath.replace(projectPath, "").replace(/^\//, "");
                coverageMap[relative] = { filePath, testNames, count: testNames.length };
            }
        } catch (e) {
            // Ignore unreadable files
        }
    }
    return coverageMap;
}

/**
 * Match ticket keywords against test names
 */
function matchTicket(ticketId, ticketTitle, ticketDescription, coverageMap) {
    const text = `${ticketId} ${ticketTitle} ${ticketDescription}`.toLowerCase();
    const stopWords = new Set([
        "the", "and", "for", "are", "but", "not", "you", "all", "can", "her",
        "was", "one", "our", "out", "has", "had", "will", "with",
        "this", "that", "from", "they", "been", "were", "being",
        "does", "should", "could", "would", "what", "when", "where",
        "null", "undefined", "void", "type", "class", "function", "import",
        "export", "default", "return", "if", "else", "test", "tests", "spec"
    ]);
    const words = text.split(/\s+/)
        .map(w => w.replace(/[^a-z0-9]/g, ""))
        .filter(w => w.length > 3 && !stopWords.has(w));

    const matched = [];
    for (const [relative, info] of Object.entries(coverageMap)) {
        for (const testName of info.testNames) {
            const testLower = testName.toLowerCase();
            for (const word of words) {
                if (testLower.includes(word) && !matched.includes(relative)) {
                    matched.push(relative);
                    break;
                }
            }
        }
    }
    return matched;
}

async function fetchJiraTicket(ticketId, jiraUrl, email, token) {
    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    const url = `${jiraUrl}/rest/api/3/issue/${ticketId}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
        },
    });
    if (!res.ok) throw new Error(`Jira ${res.status}`);
    const data = await res.json();
    return {
        id: ticketId,
        title: data.fields?.summary || "",
        description: extractTextFromADF(data.fields?.description),
    };
}

function extractTextFromADF(adf) {
    if (!adf || typeof adf === "string") return adf || "";
    const lines = [];
    function walk(node) {
        if (!node) return;
        if (node.type === "text") lines.push(node.text || "");
        else if (node.type === "hardBreak") lines.push("\n");
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

export async function coverageCommand(ticketIds, options) {
    const config = loadConfig();
    if (!config) {
        console.error(chalk.red("✗ TicketToTest is not configured. Run: npx tickettotest init"));
        process.exit(1);
    }

    const projectPath = options.project || options.output || ".";
    console.log(chalk.gray(`  Project: ${chalk.bold(projectPath)}\n`));

    // Build coverage map
    const mapSpinner = require("ora")(`Scanning ${projectPath} for tests...`).start();
    const coverageMap = buildCoverageMap(projectPath);
    const fileCount = Object.keys(coverageMap).length;
    const totalTests = Object.values(coverageMap).reduce((s, i) => s + i.count, 0);
    mapSpinner.succeed(chalk.green(`Found ${fileCount} test files with ${totalTests} test cases\n`));

    if (ticketIds.length === 0) {
        // No tickets provided — just show summary
        if (fileCount === 0) {
            console.log(chalk.yellow("No test files found. Run from your project root or use --project <path>."));
            return;
        }
        console.log(chalk.bold("Coverage summary by file:\n"));
        const sorted = Object.entries(coverageMap).sort((a, b) => b[1].count - a[1].count);
        for (const [relative, info] of sorted) {
            const bar = "█".repeat(Math.min(info.count, 20));
            console.log(`  ${chalk.gray(relative)} ${chalk.cyan(`${info.count} tests`)}`);
            console.log(`  ${chalk.gray(info.testNames.slice(0, 5).join(", "))}${info.count > 5 ? chalk.gray(" ...") : ""}\n`);
        }
        return;
    }

    // Fetch tickets and check coverage
    let covered = 0;
    let uncovered = [];
    console.log(chalk.bold(`\nChecking coverage for ${ticketIds.length} ticket(s)...\n`));

    for (const ticketId of ticketIds) {
        process.stdout.write(chalk.gray(`  ${ticketId}... `));
        try {
            const ticket = await fetchJiraTicket(ticketId, config.jira_url, config.jira_email, config.jira_token);
            const matched = matchTicket(ticket.id, ticket.title, ticket.description, coverageMap);
            if (matched.length > 0) {
                process.stdout.write(chalk.green(`✓ covered by ${matched.length} file(s)\n`));
                for (const f of matched) {
                    process.stdout.write(chalk.gray(`    → ${f}\n`));
                }
                covered++;
            } else {
                process.stdout.write(chalk.yellow(`✗ no matching tests\n`));
                uncovered.push(ticketId);
            }
        } catch (err) {
            process.stdout.write(chalk.red(`✗ ${err.message}\n`));
            uncovered.push(ticketId);
        }
    }

    console.log(chalk.gray("\n─────────────────────────────────────────"));
    const pct = ticketIds.length > 0 ? Math.round((covered / ticketIds.length) * 100) : 0;
    const pctStr = pct === 100 ? chalk.green(`${pct}%`)
        : pct > 0 ? chalk.yellow(`${pct}%`)
        : chalk.red(`${pct}%`);
    console.log(`  ${chalk.bold("Coverage:")} ${pctStr} (${covered}/${ticketIds.length} tickets have tests)`);
    if (uncovered.length > 0) {
        console.log(chalk.yellow(`\n  Uncovered tickets: ${uncovered.join(", ")}`));
        console.log(chalk.gray(`  Run: ttt generate <ticket-id> --output ${projectPath}/tests\n`));
    }
}