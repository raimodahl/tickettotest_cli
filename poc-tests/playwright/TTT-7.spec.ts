import { test, expect, Page } from '@playwright/test';

class TicketToTestPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/');
  }

  async runGenerateCommand(ticketId: string, framework: string) {
    const commandInput = this.page.locator('input[placeholder*="command" i], input[type="text"]').first();
    await commandInput.fill(`npx tickettotest generate ${ticketId} --framework ${framework}`);
    const runButton = this.page.getByRole('button', { name: /run|execute|generate/i });
    await runButton.click();
  }

  async getGeneratedFilePath() {
    const filePathElement = this.page.locator('text=/tests\\/.*\\.java/').first();
    return await filePathElement.textContent();
  }

  async getGeneratedFileContent() {
    const codeBlock = this.page.locator('pre, code, .code-block').first();
    return await codeBlock.textContent();
  }

  async getExecutionInstructions() {
    const instructionsElement = this.page.locator('text=/mvn test/i').first();
    return await instructionsElement.textContent();
  }

  async waitForGeneration() {
    await this.page.waitForSelector('text=/generation complete|success/i', { timeout: 10000 });
  }

  async getErrorMessage() {
    const errorElement = this.page.locator('.error, [role="alert"], text=/error|failed/i').first();
    return await errorElement.textContent();
  }
}

test.describe('TTT-7: Käyttäjä voi generoida Selenium-testin Jira-tiketistä', () => {
  let ticketToTestPage: TicketToTestPage;

  test.beforeEach(async ({ page }) => {
    ticketToTestPage = new TicketToTestPage(page);
    await ticketToTestPage.navigate();
  });

  test('Käyttäjä ajaa npx tickettotest generate TTT-1 --framework selenium komennon', async ({ page }) => {
    // Given: Käyttäjä on tickettotest-sivulla
    await expect(page).toHaveURL(/./);

    // When: Käyttäjä ajaa generate-komennon Selenium frameworkilla
    await ticketToTestPage.runGenerateCommand('TTT-1', 'selenium');

    // Then: Komento suoritetaan onnistuneesti
    await ticketToTestPage.waitForGeneration();
    await expect(page.locator('text=/success|complete/i')).toBeVisible();
  });

  test('Työkalu hakee tiketin Jirasta automaattisesti', async ({ page }) => {
    // Given: Käyttäjä on antanut tikettitunnuksen TTT-1
    await ticketToTestPage.runGenerateCommand('TTT-1', 'selenium');

    // When: Generointi suoritetaan
    await ticketToTestPage.waitForGeneration();

    // Then: Näytetään vahvistus että tiketti haettiin Jirasta
    await expect(page.locator('text=/fetched from jira|jira ticket retrieved/i')).toBeVisible();
  });

  test('Generoitu tiedosto tallennetaan tests/TTT-1.java polkuun', async ({ page }) => {
    // Given: Käyttäjä on suorittanut generate-komennon
    await ticketToTestPage.runGenerateCommand('TTT-1', 'selenium');
    await ticketToTestPage.waitForGeneration();

    // When: Tiedostopolku näytetään
    const filePath = await ticketToTestPage.getGeneratedFilePath();

    // Then: Tiedostopolku on tests/TTT-1.java
    expect(filePath).toContain('tests/TTT-1.java');
  });

  test('Tiedosto sisältää org.openqa.selenium importit', async ({ page }) => {
    // Given: Käyttäjä on generoinut Selenium-testin
    await ticketToTestPage.runGenerateCommand('TTT-1', 'selenium');
    await ticketToTestPage.waitForGeneration();

    // When: Tiedoston sisältö tarkistetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent();

    // Then: Tiedosto sisältää org.openqa.selenium importit
    expect(fileContent).toContain('import org.openqa.selenium');
  });

  test('Tiedosto sisältää JUnit 5 @Test annotaation', async ({ page }) => {
    // Given: Käyttäjä on generoinut Selenium-testin
    await ticketToTestPage.runGenerateCommand('TTT-1', 'selenium');
    await ticketToTestPage.waitForGeneration();

    // When: Tiedoston sisältö tarkistetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent();

    // Then: Tiedosto sisältää @Test annotaation
    expect(fileContent).toContain('@Test');
    expect(fileContent).toContain('import org.junit.jupiter.api.Test');
  });

  test('Tiedosto sisältää @BeforeEach WebDriver-alustuksen', async ({ page }) => {
    // Given: Käyttäjä on generoinut Selenium-testin
    await ticketToTestPage.runGenerateCommand('TTT-1', 'selenium');
    await ticketToTestPage.waitForGeneration();

    // When: Tiedoston sisältö tarkistetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent();

    // Then: Tiedosto sisältää @BeforeEach annotaation ja WebDriver-alustuksen
    expect(fileContent).toContain('@BeforeEach');
    expect(fileContent).toContain('WebDriver');
    expect(fileContent).toContain('import org.junit.jupiter.api.BeforeEach');
  });

  test('Tiedosto käyttää By.cssSelector() tai By.id() selektoreita', async ({ page }) => {
    // Given: Käyttäjä on generoinut Selenium-testin
    await ticketToTestPage.runGenerateCommand('TTT-1', 'selenium');
    await ticketToTestPage.waitForGeneration();

    // When: Tiedoston sisältö tarkistetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent();

    // Then: Tiedosto käyttää By.cssSelector() tai By.id() selektoreita
    const hasCssSelector = fileContent?.includes('By.cssSelector');
    const hasId = fileContent?.includes('By.id');
    expect(hasCssSelector || hasId).toBeTruthy();
  });

  test('Tiedosto käyttää Page Object -rakennetta', async ({ page }) => {
    // Given: Käyttäjä on generoinut Selenium-testin
    await ticketToTestPage.runGenerateCommand('TTT-1', 'selenium');
    await ticketToTestPage.waitForGeneration();

    // When: Tiedoston sisältö tarkistetaan
    const fileContent = await ticketToTestPage.getGeneratedFileContent();

    // Then: Tiedosto käyttää Page Object -rakennetta
    expect(fileContent).toMatch(/class\s+\w+Page/);
  });

  test('Yksi testitapaus per hyväksymiskriteeri', async ({ page }) => {
    // Given: Käyttäjä on generoinut Selenium-testin tiketistä jossa on useita hyväksymiskriteerejä
    await tick