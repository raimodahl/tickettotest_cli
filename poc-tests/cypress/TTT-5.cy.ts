import { defineConfig } from 'cypress';

class TicketToTestPurchasePage {
  // TODO: Fill in actual selectors after inspecting the application
  private selectors = {
    starterPlan: '[data-testid="plan-starter"]',
    proPlan: '[data-testid="plan-pro"]',
    teamPlan: '[data-testid="plan-team"]',
    starterPrice: '[data-testid="starter-price"]',
    proPrice: '[data-testid="pro-price"]',
    teamPrice: '[data-testid="team-price"]',
    starterQuota: '[data-testid="starter-quota"]',
    proQuota: '[data-testid="pro-quota"]',
    teamQuota: '[data-testid="team-quota"]',
    starterBuyButton: '[data-testid="buy-starter"]',
    proBuyButton: '[data-testid="buy-pro"]',
    teamBuyButton: '[data-testid="buy-team"]',
    errorMessage: '[data-testid="error-message"]',
  };

  visit(): void {
    cy.visit('https://tickettotest.com');
  }

  getStarterPlan(): Cypress.Chainable {
    return cy.get(this.selectors.starterPlan);
  }

  getProPlan(): Cypress.Chainable {
    return cy.get(this.selectors.proPlan);
  }

  getTeamPlan(): Cypress.Chainable {
    return cy.get(this.selectors.teamPlan);
  }

  getStarterPrice(): Cypress.Chainable {
    return cy.get(this.selectors.starterPrice);
  }

  getProPrice(): Cypress.Chainable {
    return cy.get(this.selectors.proPrice);
  }

  getTeamPrice(): Cypress.Chainable {
    return cy.get(this.selectors.teamPrice);
  }

  getStarterQuota(): Cypress.Chainable {
    return cy.get(this.selectors.starterQuota);
  }

  getProQuota(): Cypress.Chainable {
    return cy.get(this.selectors.proQuota);
  }

  getTeamQuota(): Cypress.Chainable {
    return cy.get(this.selectors.teamQuota);
  }

  clickStarterBuyButton(): void {
    cy.get(this.selectors.starterBuyButton).click();
  }

  clickProBuyButton(): void {
    cy.get(this.selectors.proBuyButton).click();
  }

  clickTeamBuyButton(): void {
    cy.get(this.selectors.teamBuyButton).click();
  }

  getErrorMessage(): Cypress.Chainable {
    return cy.get(this.selectors.errorMessage);
  }

  verifyAllPlansVisible(): void {
    this.getStarterPlan().should('be.visible');
    this.getProPlan().should('be.visible');
    this.getTeamPlan().should('be.visible');
  }

  verifyPricesVisible(): void {
    this.getStarterPrice().should('be.visible').and('not.be.empty');
    this.getProPrice().should('be.visible').and('not.be.empty');
    this.getTeamPrice().should('be.visible').and('not.be.empty');
  }

  verifyQuotasVisible(): void {
    this.getStarterQuota().should('be.visible').and('not.be.empty');
    this.getProQuota().should('be.visible').and('not.be.empty');
    this.getTeamQuota().should('be.visible').and('not.be.empty');
  }
}

class StripePage {
  // TODO: Fill in actual Stripe selectors
  private selectors = {
    cardNumberInput: '[data-testid="card-number"]',
    expiryInput: '[data-testid="card-expiry"]',
    cvcInput: '[data-testid="card-cvc"]',
    submitButton: '[data-testid="submit-payment"]',
    errorMessage: '[data-testid="stripe-error"]',
  };

  verifyOnStripePage(): void {
    cy.url().should('include', 'stripe.com');
  }

  fillCardDetails(cardNumber: string, expiry: string, cvc: string): void {
    cy.get(this.selectors.cardNumberInput).type(cardNumber);
    cy.get(this.selectors.expiryInput).type(expiry);
    cy.get(this.selectors.cvcInput).type(cvc);
  }

  submitPayment(): void {
    cy.get(this.selectors.submitButton).click();
  }

  getErrorMessage(): Cypress.Chainable {
    return cy.get(this.selectors.errorMessage);
  }
}

class EmailHelper {
  // TODO: Configure email testing service (e.g., Mailosaur, Mailtrap)
  private emailConfig = {
    serverId: Cypress.env('MAILOSAUR_SERVER_ID'),
    apiKey: Cypress.env('MAILOSAUR_API_KEY'),
  };

  waitForLicenseEmail(emailAddress: string, timeoutMs: number = 120000): Cypress.Chainable {
    // TODO: Implement actual email fetching logic using email testing service
    return cy.task('getEmail', { emailAddress, timeout: timeoutMs });
  }

  verifyLicenseKeyInEmail(email: any): void {
    // TODO: Implement verification logic
    cy.wrap(email).its('subject').should('contain', 'license');
    cy.wrap(email).its('body').should('contain', 'license key');
  }

  verifyCliInstructionsInEmail(email: any): void {
    // TODO: Implement verification logic
    cy.wrap(email).its('body').should('contain', 'CLI');
    cy.wrap(email).its('body').should('contain', 'initialize');
  }

  extractLicenseKey(email: any): string {
    // TODO: Implement license key extraction logic
    return 'extracted-license-key';
  }
}

class CliHelper {
  verifyLicenseKey(licenseKey: string): void {
    // TODO: Implement CLI verification using cy.exec() or cy.task()
    cy.exec(`tickettotest verify ${licenseKey}`).its('code').should('eq', 0);
  }
}

describe('TTT-5: Käyttäjä voi ostaa lisenssin tickettotest.com-sivustolta', () => {
  let purchasePage: TicketToTestPurchasePage;
  let stripePage: StripePage;
  let emailHelper: EmailHelper;
  let cliHelper: CliHelper;

  beforeEach(() => {
    purchasePage = new TicketToTestPurchasePage();
    stripePage = new StripePage();
    emailHelper = new EmailHelper();
    cliHelper = new CliHelper();
    purchasePage.visit();
  });

  it('Käyttäjä näkee kolme lisenssivaihtoehtoa: Starter/Pro/Team', () => {
    purchasePage.verifyAllPlansVisible();
    cy.contains('Starter').should('be.visible');
    cy.contains('Pro').should('be.visible');
    cy.contains('Team').should('be.visible');
  });

  it('Jokaisen vaihtoehdon hinta ja kiintiö on selkeästi näkyvissä', () => {
    purchasePage.verifyPricesVisible();
    purchasePage.verifyQuotasVisible();
    
    purchasePage.getStarterPrice().should('match', /\d+/);
    purchasePage.getProPrice().should('match', /\d+/);
    purchasePage.get