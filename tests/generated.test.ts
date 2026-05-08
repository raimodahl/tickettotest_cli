import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Generated test files are fixtures — we validate their structure and syntax
// without running browser commands (no live server required)
// Resolve from playwright config location (project root)
const GENERATED_TESTS_DIR = join(process.cwd(), 'tests');

test.describe('Generated test files', () => {

  test('SCRUM-5.spec.ts is a valid Playwright test file', () => {
    const content = readFileSync(join(GENERATED_TESTS_DIR, 'SCRUM-5.spec.ts'), 'utf-8');

    // Must import from @playwright/test
    expect(content).toMatch(/from ['"]@playwright\/test['"]/);

    // Must have at least one test case
    expect(content).toMatch(/test\(['"]/);

    // Must have page object or direct selectors
    expect(content).toMatch(/page\.|getBy|locator/);

    // File must not be empty
    expect(content.trim().length).toBeGreaterThan(100);
  });

  test('SCRUM-5.robot is a valid Robot Framework file', () => {
    const content = readFileSync(join(GENERATED_TESTS_DIR, 'SCRUM-5.robot'), 'utf-8');

    // Must have Robot Framework settings
    expect(content).toMatch(/\*\*\*\s*(Settings|Test Cases|Variables)/);

    // Must have at least one test case
    expect(content).toMatch(/\*\*\*\s*Test Cases/);

    // Must reference a browser library
    expect(content).toMatch(/Library\s+(Browser|SeleniumLibrary|Playwright)/i);

    // File must not be empty
    expect(content.trim().length).toBeGreaterThan(50);
  });

  test('SCRUM-5.cy.ts is a valid Cypress test file', () => {
    const content = readFileSync(join(GENERATED_TESTS_DIR, 'SCRUM-5.cy.ts'), 'utf-8');

    // Must use Cypress globals (cy.visit, cy.get, etc.)
    expect(content).toMatch(/\bcy\.(visit|get|click|type)\b/);

    // Must have at least one test case
    expect(content).toMatch(/it\(|context\(/);

    // Must have page object class
    expect(content).toMatch(/class\s+\w+Page/);

    // File must not be empty
    expect(content.trim().length).toBeGreaterThan(100);
  });

  test('all generated files use the expected naming convention', () => {
    const files = readdirSync(GENERATED_TESTS_DIR);

    const testFiles = files.filter(f => f.startsWith('SCRUM-5'));
    expect(testFiles).toHaveLength(3);
    expect(testFiles).toContain('SCRUM-5.spec.ts');
    expect(testFiles).toContain('SCRUM-5.robot');
    expect(testFiles).toContain('SCRUM-5.cy.ts');
  });
});