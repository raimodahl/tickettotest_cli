// @ts-nocheck
import chalk from "chalk";
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "fs";
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

    const projectPath = options.project || options.output || ".";

    // Always build coverage map and run quality analysis (no config needed)
    console.log(chalk.gray(`  Project: ${chalk.bold(projectPath)}\n`));
    console.log(chalk.gray(`  Scanning ${projectPath} for tests...`));
    const coverageMap = buildCoverageMap(projectPath);
    const fileCount = Object.keys(coverageMap).length;
    const totalTests = Object.values(coverageMap).reduce((s, i) => s + i.count, 0);
    console.log(chalk.green(`  Found ${fileCount} test files with ${totalTests} test cases\n`));

    if (ticketIds.length === 0) {
        // No tickets provided — just show summary + quality analysis
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

        // Also run quality analysis and print summary
        console.log(chalk.gray("─────────────────────────────────────────\n"));
        printQualitySummary(projectPath);

        // Generate markdown report if requested
        if (options.report) {
            const reportPath = join(projectPath, "coverage-report.md");
            const report = generateQualityReport(projectPath);
            writeFileSync(reportPath, report, "utf-8");
            console.log(chalk.green(`\n\n  ✅ Report saved: ${reportPath}\n`));
        }
        return;
    }

    // Ticket IDs provided — need Jira config
    if (!config) {
        console.error(chalk.red("✗ TicketToTest is not configured. Run: npx tickettotest init"));
        process.exit(1);
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

// ── Test Quality Analysis ──────────────────────────────────────────────────────

const FRAMEWORK_EXTENSIONS = {
    playwright: [".spec.ts"],
    cypress: [".cy.ts"],
    robot: [".robot"],
    selenium: [".java"],
    appium: [".java"],
};

/**
 * Get framework from file extension
 */
function getFramework(filePath) {
    if (filePath.endsWith(".spec.ts")) return "playwright";
    if (filePath.endsWith(".cy.ts")) return "cypress";
    if (filePath.endsWith(".robot")) return "robot";
    if (filePath.endsWith(".java")) return "selenium/appium";
    return "unknown";
}

/**
 * Count assertions in a test file
 */
function countAssertions(content, framework) {
    let patterns = [];
    if (framework === "playwright" || framework === "cypress") {
        patterns = [
            /expect\s*\(/g,
            /\.should\s*\(/g,
            /\.must\s*\(/g,
            /assert\s*\(/g,
        ];
    } else if (framework === "robot") {
        patterns = [
            /Should\s+(Be|Contain|Equal|BeTrue|BeFalse|BeVisible|BeEnabled)/g,
            /Get\s+Text.*==/g,
            /Get\s+Element\s+Count.*>/g,
        ];
    } else if (framework === "selenium" || framework === "appium") {
        patterns = [
            /assertEquals/g,
            /assertTrue/g,
            /assertFalse/g,
            /assertNotNull/g,
            /assertThat/g,
            /\.assertThat/g,
        ];
    }

    let total = 0;
    for (const pattern of patterns) {
        const matches = content.match(pattern);
        total += matches ? matches.length : 0;
    }
    return total;
}

/**
 * Detect if a test is happy path or error case based on test name
 */
function detectTestType(testName, framework) {
    const nameLower = testName.toLowerCase();
    const errorKeywords = [
        "error", "virhe", "fail", "epäonnistu", "invalid", "tyhjä",
        "empty", "not found", "ei löydy", "ei näy", "ei toimi",
        "negative", "poista", "peru", "cancel", "logout", "signout"
    ];
    const isErrorCase = errorKeywords.some(kw => nameLower.includes(kw));
    return isErrorCase ? "error_case" : "happy_path";
}

/**
 * Analyze a single test file for quality metrics
 */
function analyzeTestFile(filePath, projectPath) {
    try {
        const content = readFileSync(filePath, "utf-8");
        const framework = getFramework(filePath);
        const relative = filePath.replace(projectPath, "").replace(/^\//, "");

        // Extract test names
        let testNames = [];
        let assertions = 0;
        let happyPath = 0;
        let errorCases = 0;

        if (framework === "robot") {
            testNames = extractRobotTestNames(content);
        } else if (framework === "selenium" || framework === "appium") {
            testNames = extractJavaTestNames(content);
        } else {
            testNames = extractPlaywrightTestNames(content);
        }

        // Count assertions in the whole file
        assertions = countAssertions(content, framework);

        // Classify each test
        for (const testName of testNames) {
            const type = detectTestType(testName, framework);
            if (type === "happy_path") happyPath++;
            else errorCases++;
        }

        return {
            filePath: relative,
            framework,
            testCount: testNames.length,
            assertions,
            assertionsPerTest: testNames.length > 0 ? (assertions / testNames.length).toFixed(1) : "0",
            happyPath,
            errorCases,
        };
    } catch (e) {
        return null;
    }
}

/**
 * Build quality analysis map for all test files
 */
function buildQualityMap(projectPath) {
    const testFiles = scanTestDirectory(projectPath);
    const qualityMap = {};

    // Group by framework
    const frameworkStats = {
        playwright: { files: 0, tests: 0, assertions: 0, happyPath: 0, errorCases: 0 },
        cypress: { files: 0, tests: 0, assertions: 0, happyPath: 0, errorCases: 0 },
        robot: { files: 0, tests: 0, assertions: 0, happyPath: 0, errorCases: 0 },
        selenium: { files: 0, tests: 0, assertions: 0, happyPath: 0, errorCases: 0 },
    };

    for (const filePath of testFiles) {
        const analysis = analyzeTestFile(filePath, projectPath);
        if (analysis) {
            qualityMap[analysis.filePath] = analysis;
            const fw = analysis.framework;
            if (frameworkStats[fw]) {
                frameworkStats[fw].files++;
                frameworkStats[fw].tests += analysis.testCount;
                frameworkStats[fw].assertions += analysis.assertions;
                frameworkStats[fw].happyPath += analysis.happyPath;
                frameworkStats[fw].errorCases += analysis.errorCases;
            }
        }
    }

    return { qualityMap, frameworkStats };
}

/**
 * Generate markdown quality report
 */
function generateQualityReport(projectPath) {
    const { qualityMap, frameworkStats } = buildQualityMap(projectPath);
    const timestamp = new Date().toISOString().split("T")[0];

    let totalTests = 0;
    let totalAssertions = 0;
    let totalHappyPath = 0;
    let totalErrorCases = 0;

    for (const fw of Object.values(frameworkStats)) {
        totalTests += fw.tests;
        totalAssertions += fw.assertions;
        totalHappyPath += fw.happyPath;
        totalErrorCases += fw.errorCases;
    }

    let md = `# Test Coverage Report\n\n`;
    md += `Generated: ${timestamp}\n\n`;

    // Summary by framework
    md += `## Summary by Framework\n\n`;
    md += `| Framework | Files | Tests | Assertions | Happy Path | Error Cases |\n`;
    md += `|-----------|-------|-------|------------|------------|-------------|\n`;

    for (const [fw, stats] of Object.entries(frameworkStats)) {
        if (stats.files > 0) {
            const assertPerTest = stats.tests > 0 ? (stats.assertions / stats.tests).toFixed(1) : "0";
            md += `| ${fw} | ${stats.files} | ${stats.tests} | ${stats.assertions} (${assertPerTest}/test) | ${stats.happyPath} | ${stats.errorCases} |\n`;
        }
    }

    const overallAssertPerTest = totalTests > 0 ? (totalAssertions / totalTests).toFixed(1) : "0";
    md += `| **Total** | **${Object.values(frameworkStats).reduce((s, f) => s + f.files, 0)}** | **${totalTests}** | **${totalAssertions}** (${overallAssertPerTest}/test) | **${totalHappyPath}** | **${totalErrorCases}** |\n\n`;

    // Coverage quality assessment
    md += `## Coverage Quality\n\n`;
    const errorCaseCoverage = totalTests > 0 ? Math.round((totalErrorCases / totalTests) * 100) : 0;
    md += `- Happy Path Tests: ${totalHappyPath}\n`;
    md += `- Error Case Tests: ${totalErrorCases}\n`;
    md += `- Error Case Ratio: ${errorCaseCoverage}%\n`;

    if (errorCaseCoverage < 20 && totalTests > 5) {
        md += `\n⚠️ **Warning:** Low error case coverage (${errorCaseCoverage}%). Consider adding tests for edge cases, empty inputs, and error conditions.\n`;
    } else if (errorCaseCoverage >= 20) {
        md += `\n✅ Good error case coverage (${errorCaseCoverage}%).\n`;
    }

    // Per-file breakdown
    md += `\n## Per-File Breakdown\n\n`;
    md += `| File | Framework | Tests | Assertions | Type |\n`;
    md += `|------|-----------|-------|------------|------|\n`;

    const sortedFiles = Object.entries(qualityMap).sort((a, b) => b[1].testCount - a[1].testCount);
    for (const [relative, info] of sortedFiles) {
        const typeRatio = `${info.happyPath}h/${info.errorCases}e`;
        md += `| ${relative} | ${info.framework} | ${info.testCount} | ${info.assertions} | ${typeRatio} |\n`;
    }

    md += `\n---\n*Report generated by TicketToTest*\n`;
    return md;
}

/**
 * Print quality analysis summary to console
 */
function printQualitySummary(projectPath) {
    const { qualityMap, frameworkStats } = buildQualityMap(projectPath);

    let totalTests = 0;
    let totalAssertions = 0;
    let totalHappyPath = 0;
    let totalErrorCases = 0;

    for (const fw of Object.values(frameworkStats)) {
        totalTests += fw.tests;
        totalAssertions += fw.assertions;
        totalHappyPath += fw.happyPath;
        totalErrorCases += fw.errorCases;
    }

    console.log(chalk.bold("\n  Test Quality Analysis\n"));
    console.log(chalk.gray("  ─────────────────────────────\n"));

    // Framework breakdown
    for (const [fw, stats] of Object.entries(frameworkStats)) {
        if (stats.files > 0) {
            const assertPerTest = stats.tests > 0 ? (stats.assertions / stats.tests).toFixed(1) : "0";
            console.log(`  ${chalk.cyan(fw)}: ${stats.files} files, ${stats.tests} tests, ${stats.assertions} assertions (${assertPerTest}/test)`);
        }
    }

    console.log(chalk.gray("\n  ─────────────────────────────\n"));

    // Totals
    const overallAssertPerTest = totalTests > 0 ? (totalAssertions / totalTests).toFixed(1) : "0";
    console.log(`  Total: ${totalTests} tests, ${totalAssertions} assertions (${overallAssertPerTest}/test)`);
    console.log(`  Happy Path: ${chalk.green(totalHappyPath)} | Error Cases: ${chalk.yellow(totalErrorCases)}`);

    // Error case ratio
    const errorCaseCoverage = totalTests > 0 ? Math.round((totalErrorCases / totalTests) * 100) : 0;
    if (errorCaseCoverage < 20 && totalTests > 5) {
        console.log(chalk.yellow(`\n  ⚠️ Low error case coverage (${errorCaseCoverage}%)`));
    } else if (errorCaseCoverage >= 20) {
        console.log(chalk.green(`\n  ✅ Good error case coverage (${errorCaseCoverage}%)`));
    }

    // Per-file details
    console.log(chalk.gray("\n\n  Per-File Details:\n"));
    const sortedFiles = Object.entries(qualityMap).sort((a, b) => b[1].testCount - a[1].testCount);
    for (const [relative, info] of sortedFiles) {
        const bar = "█".repeat(Math.min(info.testCount, 10));
        const typeRatio = `${info.happyPath}h/${info.errorCases}e`;
        console.log(`    ${chalk.gray(relative)} ${chalk.cyan(`${info.testCount}t`)} ${chalk.gray(info.assertions + "a")} ${chalk.gray(typeRatio)}`);
    }
}

/**
 * Run quality analysis and optionally generate report
 */
export async function qualityCommand(options) {
    const projectPath = options.project || ".";

    console.log(chalk.gray(`  Analyzing tests in: ${chalk.bold(projectPath)}\n`));

    // Build quality map
    const { qualityMap, frameworkStats } = buildQualityMap(projectPath);
    const fileCount = Object.keys(qualityMap).length;

    if (fileCount === 0) {
        console.log(chalk.yellow("No test files found."));
        return;
    }

    // Print summary to console
    printQualitySummary(projectPath);

    // Generate markdown report if requested
    if (options.report) {
        const reportPath = join(projectPath, "tests", "coverage-report.md");

        // Ensure tests directory exists
        const testsDir = join(projectPath, "tests");
        if (!existsSync(testsDir)) {
            mkdirSync(testsDir, { recursive: true });
        }

        const report = generateQualityReport(projectPath);
        writeFileSync(reportPath, report, "utf-8");
        console.log(chalk.green(`\n\n  ✅ Report saved: ${reportPath}\n`));
    }
}