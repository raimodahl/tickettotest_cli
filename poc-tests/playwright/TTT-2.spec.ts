import { test, expect, Page } from '@playwright/test';

class TicketToTestPage {
  constructor(private page: Page) {}

  async navigateToApp() {
    await this.page.goto('/');
  }

  async runGenerateCommand(ticketId: string) {
    // TODO: Implement command execution through UI or API
    // This might be a terminal command input or button trigger
    const commandInput = this.page.locator('input[placeholder*="command"]').or(this.page.getByRole('textbox', { name: /command/i }));
    await commandInput.fill(`npx tickettotest generate ${ticketId}`);
    await this.page.getByRole('button', { name: /run|execute|generate/i }).click();
  }

  async getGeneratedFilePath() {
    // TODO: Verify the file path is displayed in the output
    return this.page.locator('[data-test="generated-file-path"]').or(this.page.getByText(/tests\/.*\.spec\.ts/));
  }

  async getRemainingQuota() {
    // TODO: Locate the quota display element
    return this.page.locator('[data-test="remaining-quota"]').or(this.page.getByText(/remaining.*quota|quota.*remaining/i));
  }

  async getGenerationTime() {
    // TODO: Locate the generation time display
    return this.page.locator('[data-test="generation-time"]').or(this.page.getByText(/time|duration|completed in/i));
  }

  async waitForGeneration() {
    // TODO: Wait for generation completion indicator
    await this.page.waitForSelector('[data-test="generation-complete"]', { timeout: 35000 });
  }

  async getErrorMessage() {
    // TODO: Locate error message container
    return this.page.locator('[data-test="error-message"]').or(this.page.getByRole('alert'));
  }
}

test.describe('TTT-2: Käyttäjä voi generoida Playwright-testin Jira-tiketistä', () => {
  let ticketToTestPage: TicketToTestPage;

  test.beforeEach(async ({ page }) => {
    ticketToTestPage = new TicketToTestPage(page);
    await ticketToTestPage.navigateToApp();
  });

  test('Käyttäjä ajaa: npx tickettotest generate TTT-1', async ({ page }) => {
    // Step 1: Execute the generate command with ticket ID
    await ticketToTestPage.runGenerateCommand('TTT-1');

    // Step 2: Verify command was accepted and started processing
    const processingIndicator = page.getByText(/processing|generating|fetching/i);
    await expect(processingIndicator).toBeVisible({ timeout: 5000 });
  });

  test('Työkalu hakee tiketin Jirasta automaattisesti', async ({ page }) => {
    // Step 1: Trigger the generation command
    await ticketToTestPage.runGenerateCommand('TTT-1');

    // Step 2: Verify Jira fetch indicator or message appears
    const jiraFetchMessage = page.getByText(/fetching.*jira|retrieving.*ticket|loading.*ticket/i);
    await expect(jiraFetchMessage).toBeVisible({ timeout: 10000 });

    // Step 3: Verify successful fetch from Jira
    const successMessage = page.getByText(/ticket.*fetched|retrieved.*successfully|found.*ticket/i);
    await expect(successMessage).toBeVisible({ timeout: 15000 });
  });

  test('Claude AI generoi testiskeleton hyväksymiskriteerien pohjalta', async ({ page }) => {
    // Step 1: Execute generation command
    await ticketToTestPage.runGenerateCommand('TTT-1');

    // Step 2: Wait for AI generation to start
    const aiGenerationIndicator = page.getByText(/generating.*claude|AI.*generating|creating.*test/i);
    await expect(aiGenerationIndicator).toBeVisible({ timeout: 10000 });

    // Step 3: Verify generation completed successfully
    await ticketToTestPage.waitForGeneration();
    const completionMessage = page.getByText(/generated|completed|created/i);
    await expect(completionMessage).toBeVisible();
  });

  test('Generoitu tiedosto tallennetaan: tests/TTT-1.spec.ts', async ({ page }) => {
    // Step 1: Run the generation command
    await ticketToTestPage.runGenerateCommand('TTT-1');

    // Step 2: Wait for generation to complete
    await ticketToTestPage.waitForGeneration();

    // Step 3: Verify the file path is displayed correctly
    const filePath = await ticketToTestPage.getGeneratedFilePath();
    await expect(filePath).toBeVisible();
    await expect(filePath).toContainText('tests/TTT-1.spec.ts');
  });

  test('Tiedosto sisältää describe-blokin tiketin nimellä', async ({ page }) => {
    // Step 1: Generate the test file
    await ticketToTestPage.runGenerateCommand('TTT-1');
    await ticketToTestPage.waitForGeneration();

    // Step 2: View or preview the generated file content
    const viewFileButton = page.getByRole('button', { name: /view|preview|show/i });
    await viewFileButton.click();

    // Step 3: Verify describe block exists with ticket name
    const fileContent = page.locator('[data-test="file-preview"]').or(page.locator('pre, code'));
    await expect(fileContent).toContainText(/test\.describe|describe/);
    await expect(fileContent).toContainText('TTT-1');
  });

  test('Tiedosto sisältää yhden it()-blokin per hyväksymiskriteeri', async ({ page }) => {
    // Step 1: Generate test file from ticket with multiple acceptance criteria
    await ticketToTestPage.runGenerateCommand('TTT-1');
    await ticketToTestPage.waitForGeneration();

    // Step 2: Preview generated file
    const viewFileButton = page.getByRole('button', { name: /view|preview|show/i });
    await viewFileButton.click();

    // Step 3: Verify test blocks exist for each acceptance criterion
    const fileContent = page.locator('[data-test="file-preview"]').or(page.locator('pre, code'));
    await expect(fileContent).toContainText(/test\(/);
    
    // Step 4: Count test blocks (should match number of acceptance criteria)
    const testBlockCount = page.locator('[data-test="test-count"]').or(page.getByText(/\d+\s+test/i));
    await expect(testBlockCount).toBeVisible();
  });

  test('Tiedosto käyttää Page Object Model -rakennetta', async ({ page }) => {
    // Step 1: Generate the test file
    await ticketToTestPage.runGenerateCommand('TTT-1');
    await ticketToTestPage.waitForGeneration();

    // Step 2: View generated file content
    const viewFileButton = page.getByRole('button', { name: /view|preview|show/i });
    await viewFileButton.click();

    // Step 3: Verify Page Object Model class exists
    const fileContent = page.locator('[data-test="file-preview"]').or(page.locator('pre, code'));
    await expect(fileContent).toContainText(/class.*Page/);
    await expect(fileContent).toContainText(/constructor.*private page.*Page/);
  });

  test('Selektorit on merkitty TODO-kommentteina', async ({ page }) => {
    // Step 1: Generate test file
    await ticketToTestPage.runGenerateCommand('TTT-1');
    await ticketTo