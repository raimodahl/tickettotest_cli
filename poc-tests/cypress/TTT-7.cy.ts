class SeleniumTestGenerationPage {
  // TODO: Fill in actual selectors
  private readonly commandInput = 'TODO: [data-testid="command-input"]';
  private readonly frameworkSelect = 'TODO: [data-testid="framework-select"]';
  private readonly generateButton = 'TODO: [data-testid="generate-button"]';
  private readonly outputDisplay = 'TODO: [data-testid="output-display"]';
  private readonly successMessage = 'TODO: [data-testid="success-message"]';
  private readonly errorMessage = 'TODO: [data-testid="error-message"]';
  private readonly filePathDisplay = 'TODO: [data-testid="file-path-display"]';
  private readonly runInstructionsDisplay = 'TODO: [data-testid="run-instructions-display"]';
  private readonly jiraTicketIdInput = 'TODO: [data-testid="jira-ticket-id-input"]';
  private readonly jiraFetchStatus = 'TODO: [data-testid="jira-fetch-status"]';
  private readonly generatedCodePreview = 'TODO: [data-testid="generated-code-preview"]';

  visit(): void {
    cy.visit('/');
  }

  enterCommand(command: string): void {
    cy.get(this.commandInput).clear().type(command);
  }

  selectFramework(framework: string): void {
    cy.get(this.frameworkSelect).select(framework);
  }

  enterTicketId(ticketId: string): void {
    cy.get(this.jiraTicketIdInput).clear().type(ticketId);
  }

  clickGenerateButton(): void {
    cy.get(this.generateButton).click();
  }

  verifySuccessMessage(): void {
    cy.get(this.successMessage).should('be.visible');
  }

  verifyErrorMessage(): void {
    cy.get(this.errorMessage).should('be.visible');
  }

  verifyFilePathDisplayed(expectedPath: string): void {
    cy.get(this.filePathDisplay).should('contain', expectedPath);
  }

  verifyRunInstructions(expectedInstructions: string): void {
    cy.get(this.runInstructionsDisplay).should('contain', expectedInstructions);
  }

  verifyGeneratedCodeContains(content: string): void {
    cy.get(this.generatedCodePreview).should('contain', content);
  }

  verifyJiraFetchSuccess(): void {
    cy.get(this.jiraFetchStatus).should('contain', 'Jirasta haettu onnistuneesti');
  }

  verifyJiraFetchError(): void {
    cy.get(this.jiraFetchStatus).should('contain', 'Virhe haettaessa Jirasta');
  }
}

describe('TTT-7: Käyttäjä voi generoida Selenium-testin Jira-tiketistä', () => {
  const page = new SeleniumTestGenerationPage();
  const testTicketId = 'TTT-1';
  const expectedFilePath = `tests/${testTicketId}.java`;
  const command = `npx tickettotest generate ${testTicketId} --framework selenium`;

  beforeEach(() => {
    page.visit();
  });

  it('Käyttäjä voi ajaa komennon: npx tickettotest generate TTT-1 --framework selenium', () => {
    page.enterCommand(command);
    page.selectFramework('selenium');
    page.enterTicketId(testTicketId);
    page.clickGenerateButton();
    page.verifySuccessMessage();
  });

  it('Työkalu hakee tiketin Jirasta automaattisesti', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifyJiraFetchSuccess();
    cy.contains('Tiketti haettu Jirasta').should('be.visible');
  });

  it('Generoitu tiedosto tallennetaan: tests/TTT-1.java', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifyFilePathDisplayed(expectedFilePath);
    cy.contains(expectedFilePath).should('be.visible');
  });

  it('Tiedosto sisältää org.openqa.selenium importit', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifyGeneratedCodeContains('import org.openqa.selenium');
    cy.contains('import org.openqa.selenium.WebDriver').should('be.visible');
    cy.contains('import org.openqa.selenium.By').should('be.visible');
  });

  it('Tiedosto sisältää JUnit 5 @Test annotaation', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifyGeneratedCodeContains('@Test');
    cy.contains('import org.junit.jupiter.api.Test').should('be.visible');
  });

  it('Tiedosto sisältää @BeforeEach WebDriver-alustuksen', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifyGeneratedCodeContains('@BeforeEach');
    cy.contains('import org.junit.jupiter.api.BeforeEach').should('be.visible');
    cy.contains('WebDriver driver').should('be.visible');
  });

  it('Tiedosto käyttää By.cssSelector() tai By.id() selektoreita', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifyGeneratedCodeContains('By.cssSelector');
    cy.get(page['generatedCodePreview']).then(($preview) => {
      const codeContent = $preview.text();
      const hasCssSelector = codeContent.includes('By.cssSelector');
      const hasId = codeContent.includes('By.id');
      expect(hasCssSelector || hasId).to.be.true;
    });
  });

  it('Tiedosto käyttää Page Object -rakennetta', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifyGeneratedCodeContains('class');
    cy.contains('Page').should('be.visible');
    cy.contains('public class').should('be.visible');
  });

  it('Yksi testitapaus per hyväksymiskriteeri', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    cy.get(page['generatedCodePreview']).within(() => {
      cy.contains('@Test').should('exist');
    });
  });

  it('Selektorit on merkitty TODO-kommentteina', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifyGeneratedCodeContains('// TODO:');
    cy.contains('// TODO: Fill in actual selector').should('be.visible');
  });

  it('Happy path testi mukana', () => {
    page.enterTicketId(testTicketId);
    page.selectFramework('selenium');
    page.clickGenerateButton();
    page.verifySuccessMessage();
    cy.contains('Tiedosto luotu onnistune