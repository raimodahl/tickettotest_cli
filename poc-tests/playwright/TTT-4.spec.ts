import { test, expect, Page } from '@playwright/test';

class QuotaPage {
  constructor(private page: Page) {}

  async navigateToQuotaPage(): Promise<void> {
    await this.page.goto('/quota');
  }

  async runQuotaCommand(): Promise<void> {
    await this.page.locator('button', { hasText: 'Check Quota' }).click();
  }

  async getLicenseType(): Promise<string> {
    return await this.page.locator('[data-testid="license-type"]').textContent() || '';
  }

  async getTotalQuota(): Promise<string> {
    return await this.page.locator('[data-testid="total-quota"]').textContent() || '';
  }

  async getUsedGenerations(): Promise<string> {
    return await this.page.locator('[data-testid="used-generations"]').textContent() || '';
  }

  async getRemainingGenerations(): Promise<string> {
    return await this.page.locator('[data-testid="remaining-generations"]').textContent() || '';
  }

  async getErrorMessage(): Promise<string> {
    return await this.page.locator('[role="alert"]').textContent() || '';
  }

  async isQuotaInfoVisible(): Promise<boolean> {
    return await this.page.locator('[data-testid="quota-info"]').isVisible();
  }

  async setLicenseKey(key: string): Promise<void> {
    await this.page.locator('input[name="license-key"]').fill(key);
  }

  async submitLicenseKey(): Promise<void> {
    await this.page.locator('button[type="submit"]').click();
  }

  async enableOfflineMode(): Promise<void> {
    await this.page.context().setOffline(true);
  }

  async disableOfflineMode(): Promise<void> {
    await this.page.context().setOffline(false);
  }

  async waitForQuotaDisplay(): Promise<void> {
    await this.page.locator('[data-testid="quota-info"]').waitFor({ state: 'visible' });
  }
}

test.describe('TTT-4: Käyttäjä voi tarkistaa generointikiintiön', () => {
  let quotaPage: QuotaPage;

  test.beforeEach(async ({ page }) => {
    quotaPage = new QuotaPage(page);
    await quotaPage.navigateToQuotaPage();
  });

  test('Työkalu näyttää lisenssiavaimen tyypin (Starter/Pro/Team)', async ({ page }) => {
    // Given: Käyttäjällä on voimassa oleva lisenssiavain
    await quotaPage.setLicenseKey('VALID-STARTER-KEY-12345');
    await quotaPage.submitLicenseKey();

    // When: Käyttäjä tarkistaa kiintiön
    await quotaPage.runQuotaCommand();
    await quotaPage.waitForQuotaDisplay();

    // Then: Lisenssin tyyppi näytetään
    const licenseType = await quotaPage.getLicenseType();
    expect(licenseType).toMatch(/Starter|Pro|Team/);
  });

  test('Työkalu näyttää kokonaiskiintiön (esim. 100)', async ({ page }) => {
    // Given: Käyttäjällä on voimassa oleva lisenssiavain
    await quotaPage.setLicenseKey('VALID-PRO-KEY-67890');
    await quotaPage.submitLicenseKey();

    // When: Käyttäjä tarkistaa kiintiön
    await quotaPage.runQuotaCommand();
    await quotaPage.waitForQuotaDisplay();

    // Then: Kokonaiskiintiö näytetään numerona
    const totalQuota = await quotaPage.getTotalQuota();
    expect(totalQuota).toMatch(/\d+/);
    const quotaNumber = parseInt(totalQuota.replace(/\D/g, ''), 10);
    expect(quotaNumber).toBeGreaterThan(0);
  });

  test('Työkalu näyttää käytetyt generoinnit (esim. 5)', async ({ page }) => {
    // Given: Käyttäjällä on voimassa oleva lisenssiavain ja hän on käyttänyt joitakin generointeja
    await quotaPage.setLicenseKey('VALID-TEAM-KEY-11111');
    await quotaPage.submitLicenseKey();

    // When: Käyttäjä tarkistaa kiintiön
    await quotaPage.runQuotaCommand();
    await quotaPage.waitForQuotaDisplay();

    // Then: Käytetyt generoinnit näytetään numerona
    const usedGenerations = await quotaPage.getUsedGenerations();
    expect(usedGenerations).toMatch(/\d+/);
    const usedNumber = parseInt(usedGenerations.replace(/\D/g, ''), 10);
    expect(usedNumber).toBeGreaterThanOrEqual(0);
  });

  test('Työkalu näyttää jäljellä olevat generoinnit (esim. 95)', async ({ page }) => {
    // Given: Käyttäjällä on voimassa oleva lisenssiavain
    await quotaPage.setLicenseKey('VALID-STARTER-KEY-22222');
    await quotaPage.submitLicenseKey();

    // When: Käyttäjä tarkistaa kiintiön
    await quotaPage.runQuotaCommand();
    await quotaPage.waitForQuotaDisplay();

    // Then: Jäljellä olevat generoinnit näytetään numerona
    const remainingGenerations = await quotaPage.getRemainingGenerations();
    expect(remainingGenerations).toMatch(/\d+/);
    const remainingNumber = parseInt(remainingGenerations.replace(/\D/g, ''), 10);
    expect(remainingNumber).toBeGreaterThanOrEqual(0);

    // And: Jäljellä olevat = Kokonaiskiintiö - Käytetyt
    const totalQuota = await quotaPage.getTotalQuota();
    const usedGenerations = await quotaPage.getUsedGenerations();
    const totalNumber = parseInt(totalQuota.replace(/\D/g, ''), 10);
    const usedNumber = parseInt(usedGenerations.replace(/\D/g, ''), 10);
    expect(remainingNumber).toBe(totalNumber - usedNumber);
  });

  test('Virheellinen tai vanhentunut avain näyttää selkeän virheen', async ({ page }) => {
    // Given: Käyttäjällä on virheellinen lisenssiavain
    await quotaPage.setLicenseKey('INVALID-KEY-99999');
    await quotaPage.submitLicenseKey();

    // When: Käyttäjä yrittää tarkistaa kiintiön
    await quotaPage.runQuotaCommand();

    // Then: Selkeä virheilmoitus näytetään
    await page.locator('[role="alert"]').waitFor({ state: 'visible' });
    const errorMessage = await quotaPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toContain('invalid');
    expect(errorMessage.toLowerCase()).toMatch(/invalid|expired|not found/);

    // And: Kiintiötiedot eivät näy
    const isQuotaVisible = await quotaPage.isQuotaInfoVisible();
    expect(isQuotaVisible).toBe(false);
  });

  test('Komento toimii ilman internet-yhteyttä jos tiedot