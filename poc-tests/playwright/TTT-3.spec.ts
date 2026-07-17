import { test, expect, Page } from '@playwright/test';

class TicketToTestPage {
  constructor(private page: Page) {}

  async navigateToProject() {
    await this.page.goto('/');
  }

  async executeGenerateCommand(ticketId: string, framework: string): Promise<string> {
    const terminalInput = this.page.locator('input[placeholder*="command"], textarea[placeholder*="command"], [role="textbox"]').first();
    await terminalInput.fill(`npx tickettotest generate ${ticketId} --framework ${framework}`);
    await terminalInput.press('Enter');
    
    const output = await this.page.locator('.terminal-output, .command-output, pre').first().textContent();
    return output || '';
  }

  async getGeneratedFileContent(filePath: string): Promise<string> {
    const fileViewer = this.page.locator(`[data-file-path="${filePath}"], .file-content`).first();
    await fileViewer.waitFor({ state: 'visible', timeout: 10000 });
    return await fileViewer.textContent() || '';
  }

  async verifyFileExists(filePath: string): Promise<boolean> {
    const fileElement = this.page.locator(`text="${filePath}"`).or(this.page.locator(`[title="${filePath}"]`));
    try {
      await fileElement.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getExecutionInstructions(): Promise<string> {
    const instructionsElement = this.page.locator('.execution-instructions, .run-command, text=/robot tests/i').first();
    await instructionsElement.waitFor({ state: 'visible', timeout: 5000 });
    return await instructionsElement.textContent() || '';
  }
}

test.describe('TTT-3: Käyttäjä voi generoida Robot Framework -testin Jira-tiketistä', () => {
  let ticketToTestPage: TicketToTestPage;

  test.beforeEach(async ({ page }) => {
    ticketToTestPage = new TicketToTestPage(page);
    await ticketToTestPage.navigateToProject();
  });

  test('Käyttäjä ajaa npx tickettotest generate TTT-1 --framework robot komennon', async ({ page }) => {
    // Given: Käyttäjä on valmiina ajamaan komentoa
    await expect(page).toHaveURL(/.*\//);

    // When: Käyttäjä suorittaa generate-komennon Robot Framework -valinnalla
    const output = await ticketToTestPage.executeGenerateCommand('TTT-1', 'robot');

    // Then: Komento suoritetaan onnistuneesti ilman virheitä
    await expect(page.locator('text=/success|generated|created/i').first()).toBeVisible({ timeout: 10000 });
    expect(output).not.toContain('error');
    expect(output).not.toContain('failed');
  });

  test('Työkalu hakee tiketin Jirasta automaattisesti', async ({ page }) => {
    // Given: Jira-tiketti TTT-1 on olemassa
    const ticketId = 'TTT-1';

    // When: Generate-komento suoritetaan
    await ticketToTestPage.executeGenerateCommand(ticketId, 'robot');

    // Then: Työkalu näyttää viestin Jira-tiketin hausta
    const jiraFetchMessage = page.locator('text=/fetching.*jira|retrieved.*jira|loading.*ticket/i').first();
    await expect(jiraFetchMessage).toBeVisible({ timeout: 10000 });

    // And: Tiketin tiedot on haettu onnistuneesti
    const successMessage = page.locator('text=/ticket.*loaded|jira.*success|fetched.*TTT-1/i').first();
    await expect(successMessage).toBeVisible();
  });

  test('Generoitu tiedosto tallennetaan tests/TTT-1.robot polkuun', async ({ page }) => {
    // Given: Generate-komento on suoritettu
    await ticketToTestPage.executeGenerateCommand('TTT-1', 'robot');

    // When: Tiedostorakenne päivittyy
    await page.waitForTimeout(2000);

    // Then: Tiedosto tests/TTT-1.robot on olemassa
    const fileExists = await ticketToTestPage.verifyFileExists('tests/TTT-1.robot');
    expect(fileExists).toBeTruthy();

    // And: Tiedostopolku näkyy output-viestissä
    const output = page.locator('text=/tests\/TTT-1\.robot/');
    await expect(output).toBeVisible();
  });

  test('Tiedosto sisältää *** Settings *** osion Browser-kirjastolla', async ({ page }) => {
    // Given: Robot Framework -testi on generoitu
    await ticketToTestPage.executeGenerateCommand('TTT-1', 'robot');

    // When: Tiedoston sisältö luetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent('tests/TTT-1.robot');

    // Then: Settings-osio löytyy
    expect(fileContent).toContain('*** Settings ***');

    // And: Browser-kirjasto on tuotu
    expect(fileContent).toMatch(/Library.*Browser/i);
  });

  test('Tiedosto sisältää *** Variables *** osion BASE_URL muuttujalla', async ({ page }) => {
    // Given: Robot Framework -testi on generoitu
    await ticketToTestPage.executeGenerateCommand('TTT-1', 'robot');

    // When: Tiedoston sisältö luetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent('tests/TTT-1.robot');

    // Then: Variables-osio löytyy
    expect(fileContent).toContain('*** Variables ***');

    // And: BASE_URL muuttuja on määritelty
    expect(fileContent).toMatch(/\$\{BASE_URL\}/);
  });

  test('Tiedosto sisältää *** Test Cases *** osion', async ({ page }) => {
    // Given: Robot Framework -testi on generoitu
    await ticketToTestPage.executeGenerateCommand('TTT-1', 'robot');

    // When: Tiedoston sisältö luetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent('tests/TTT-1.robot');

    // Then: Test Cases -osio löytyy
    expect(fileContent).toContain('*** Test Cases ***');

    // And: Osio ei ole tyhjä
    const testCasesSection = fileContent.split('*** Test Cases ***')[1];
    expect(testCasesSection).toBeTruthy();
    expect(testCasesSection.trim().length).toBeGreaterThan(0);
  });

  test('Yksi testitapaus per hyväksymiskriteeri generoidaan', async ({ page }) => {
    // Given: TTT-1 tiketillä on useita hyväksymiskriteerejä
    await ticketToTestPage.executeGenerateCommand('TTT-1', 'robot');

    // When: Tiedoston sisältö luetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent('tests/TTT-1.robot');

    // Then: Useampi kuin yksi testitapaus on generoitu
    const testCasesSection = fileContent.split('*** Test Cases ***')[1]?.split('***')[0] || '';