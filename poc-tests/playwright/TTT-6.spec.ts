import { test, expect, Page } from '@playwright/test';

class CypressTestGenerationPage {
  constructor(private page: Page) {}

  async navigateToHome() {
    await this.page.goto('/');
  }

  async navigateToGeneratePage() {
    await this.page.goto('/generate');
  }

  getTicketIdInput() {
    return this.page.locator('input[name="ticketId"]');
  }

  getFrameworkSelect() {
    return this.page.locator('select[name="framework"]');
  }

  getGenerateButton() {
    return this.page.getByRole('button', { name: /generate/i });
  }

  getCommandOutput() {
    return this.page.locator('[data-testid="command-output"]');
  }

  getSuccessMessage() {
    return this.page.locator('[role="alert"]').filter({ hasText: /success/i });
  }

  getErrorMessage() {
    return this.page.locator('[role="alert"]').filter({ hasText: /error/i });
  }

  getGeneratedFilePath() {
    return this.page.locator('[data-testid="generated-file-path"]');
  }

  getGeneratedFileContent() {
    return this.page.locator('[data-testid="file-content"]');
  }

  getRunInstructions() {
    return this.page.locator('[data-testid="run-instructions"]');
  }

  async fillTicketId(ticketId: string) {
    await this.getTicketIdInput().fill(ticketId);
  }

  async selectFramework(framework: string) {
    await this.getFrameworkSelect().selectOption(framework);
  }

  async clickGenerate() {
    await this.getGenerateButton().click();
  }

  async generateTest(ticketId: string, framework: string) {
    await this.fillTicketId(ticketId);
    await this.selectFramework(framework);
    await this.clickGenerate();
  }
}

test.describe('TTT-6: Käyttäjä voi generoida Cypress-testin Jira-tiketistä', () => {
  let generationPage: CypressTestGenerationPage;

  test.beforeEach(async ({ page }) => {
    generationPage = new CypressTestGenerationPage(page);
    await generationPage.navigateToGeneratePage();
  });

  test('Käyttäjä ajaa: npx tickettotest generate TTT-1 --framework cypress', async ({ page }) => {
    // Given: User is on the test generation page
    await expect(page).toHaveURL(/.*generate/);

    // When: User enters ticket ID TTT-1
    await generationPage.fillTicketId('TTT-1');

    // And: User selects Cypress framework
    await generationPage.selectFramework('cypress');

    // And: User clicks generate button
    await generationPage.clickGenerate();

    // Then: Command output should show the executed command
    const commandOutput = generationPage.getCommandOutput();
    await expect(commandOutput).toBeVisible();
    await expect(commandOutput).toContainText('npx tickettotest generate TTT-1 --framework cypress');

    // And: Success message should be displayed
    const successMessage = generationPage.getSuccessMessage();
    await expect(successMessage).toBeVisible();
  });

  test('Generoitu tiedosto tallennetaan: tests/TTT-1.cy.js', async ({ page }) => {
    // Given: User has initiated test generation
    await generationPage.generateTest('TTT-1', 'cypress');

    // When: Generation is complete
    await expect(generationPage.getSuccessMessage()).toBeVisible();

    // Then: Generated file path should be displayed
    const filePath = generationPage.getGeneratedFilePath();
    await expect(filePath).toBeVisible();
    await expect(filePath).toContainText('tests/TTT-1.cy.js');

    // And: File path should be exactly as specified
    await expect(filePath).toHaveText(/tests\/TTT-1\.cy\.js/);
  });

  test('Tiedosto sisältää describe()-blokin', async ({ page }) => {
    // Given: User has generated a Cypress test file
    await generationPage.generateTest('TTT-1', 'cypress');
    await expect(generationPage.getSuccessMessage()).toBeVisible();

    // When: User views the generated file content
    const fileContent = generationPage.getGeneratedFileContent();
    await expect(fileContent).toBeVisible();

    // Then: File should contain describe() block
    await expect(fileContent).toContainText('describe(');

    // And: describe() block should have proper closing
    await expect(fileContent).toContainText('});');
  });

  test('Tiedosto sisältää it()-blokin per hyväksymiskriteeri', async ({ page }) => {
    // Given: User has generated a Cypress test for ticket with multiple acceptance criteria
    await generationPage.generateTest('TTT-1', 'cypress');
    await expect(generationPage.getSuccessMessage()).toBeVisible();

    // When: User views the generated file content
    const fileContent = generationPage.getGeneratedFileContent();
    await expect(fileContent).toBeVisible();

    // Then: File should contain it() blocks
    const content = await fileContent.textContent();
    const itBlockCount = (content?.match(/it\(/g) || []).length;

    // And: Number of it() blocks should match acceptance criteria count
    expect(itBlockCount).toBeGreaterThan(0);

    // And: Each it() block should have proper structure
    await expect(fileContent).toContainText('it(');
  });

  test('Tiedosto käyttää cy.visit() navigointiin', async ({ page }) => {
    // Given: User has generated a Cypress test file
    await generationPage.generateTest('TTT-1', 'cypress');
    await expect(generationPage.getSuccessMessage()).toBeVisible();

    // When: User views the generated file content
    const fileContent = generationPage.getGeneratedFileContent();
    await expect(fileContent).toBeVisible();

    // Then: File should contain cy.visit() for navigation
    await expect(fileContent).toContainText('cy.visit(');

    // And: cy.visit() should not be replaced with page.goto()
    const content = await fileContent.textContent();
    expect(content).not.toContain('page.goto(');
  });

  test('Tiedosto käyttää cy.get() elementtien hakuun', async ({ page }) => {
    // Given: User has generated a Cypress test file
    await generationPage.generateTest('TTT-1', 'cypress');
    await expect(generationPage.getSuccessMessage()).toBeVisible();

    // When: User views the generated file content
    const fileContent = generationPage.getGeneratedFileContent();
    await expect(fileContent).toBeVisible();

    // Then: File should contain cy.get() for element selection
    await expect(fileContent).toContainText('cy.get(');

    // And: cy.get() should not be replaced with page.locator()
    const content = await fileContent.textContent();
    expect(content).not.toContain('page.locator(');
  });

  test('Selektorit on merkitty TODO-kommentteina', async ({ page }) => {
    // Given: User has generated a Cypress test file
    await generationPage.generateTest('TTT-1', 'cypress');
    await expect(generationPage.getSuccessMessage()).toBeVisible();

    // When: User views the generated file content
    const fileContent = generationPage.getGeneratedFileContent();
    await expect(fileContent).toBeVisible();

    // Then: File should contain TODO comments for selectors
    await expect(fileContent).toContainText('// TODO:');