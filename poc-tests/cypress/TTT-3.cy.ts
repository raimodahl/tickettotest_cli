import { defineConfig } from 'cypress';

class GenerateRobotFrameworkTestPage {
  // TODO: Fill in actual selectors
  private selectors = {
    frameworkDropdown: '[data-testid="framework-dropdown"]',
    frameworkRobotOption: '[data-testid="framework-option-robot"]',
    ticketIdInput: '[data-testid="ticket-id-input"]',
    generateButton: '[data-testid="generate-button"]',
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    generatedFilePath: '[data-testid="generated-file-path"]',
    filePreview: '[data-testid="file-preview"]',
    runInstructionsSection: '[data-testid="run-instructions"]',
    jiraConnectionStatus: '[data-testid="jira-connection-status"]',
    settingsSection: '[data-testid="settings-section"]',
    browserLibraryIndicator: '[data-testid="browser-library-indicator"]',
    baseUrlVariable: '[data-testid="base-url-variable"]',
    testCasesSection: '[data-testid="test-cases-section"]',
    keywordsSection: '[data-testid="keywords-section"]',
    pageObjectStructure: '[data-testid="page-object-structure"]',
    todoComments: '[data-testid="todo-comments"]'
  };

  visit(): void {
    cy.visit('/');
  }

  selectRobotFramework(): void {
    cy.get(this.selectors.frameworkDropdown).click();
    cy.get(this.selectors.frameworkRobotOption).click();
  }

  enterTicketId(ticketId: string): void {
    cy.get(this.selectors.ticketIdInput).clear().type(ticketId);
  }

  clickGenerateButton(): void {
    cy.get(this.selectors.generateButton).click();
  }

  verifySuccessMessage(): void {
    cy.get(this.selectors.successMessage).should('be.visible');
  }

  verifyErrorMessage(): void {
    cy.get(this.selectors.errorMessage).should('be.visible');
  }

  verifyGeneratedFilePath(expectedPath: string): void {
    cy.get(this.selectors.generatedFilePath).should('contain.text', expectedPath);
  }

  verifyFilePreviewContains(content: string): void {
    cy.get(this.selectors.filePreview).should('contain.text', content);
  }

  verifyRunInstructions(expectedCommand: string): void {
    cy.get(this.selectors.runInstructionsSection).should('contain.text', expectedCommand);
  }

  verifyJiraConnectionStatus(status: 'connected' | 'disconnected'): void {
    cy.get(this.selectors.jiraConnectionStatus).should('contain.text', status);
  }

  verifySettingsSectionExists(): void {
    cy.get(this.selectors.settingsSection).should('exist');
  }

  verifyBrowserLibraryInSettings(): void {
    cy.get(this.selectors.browserLibraryIndicator).should('exist');
    cy.get(this.selectors.filePreview).should('contain.text', '*** Settings ***');
    cy.get(this.selectors.filePreview).should('contain.text', 'Library');
    cy.get(this.selectors.filePreview).should('contain.text', 'Browser');
  }

  verifyVariablesSectionExists(): void {
    cy.get(this.selectors.filePreview).should('contain.text', '*** Variables ***');
  }

  verifyBaseUrlVariable(): void {
    cy.get(this.selectors.filePreview).should('contain.text', '${BASE_URL}');
  }

  verifyTestCasesSectionExists(): void {
    cy.get(this.selectors.filePreview).should('contain.text', '*** Test Cases ***');
  }

  verifyKeywordsSectionExists(): void {
    cy.get(this.selectors.filePreview).should('contain.text', '*** Keywords ***');
  }

  verifyPageObjectStructure(): void {
    cy.get(this.selectors.filePreview).should('contain.text', 'Page Object');
  }

  verifyTodoComments(): void {
    cy.get(this.selectors.filePreview).should('contain.text', 'TODO');
  }

  executeGenerateCommand(ticketId: string, framework: string): void {
    this.enterTicketId(ticketId);
    this.selectRobotFramework();
    this.clickGenerateButton();
  }
}

describe('TTT-3: Käyttäjä voi generoida Robot Framework -testin Jira-tiketistä', () => {
  let generatePage: GenerateRobotFrameworkTestPage;

  beforeEach(() => {
    generatePage = new GenerateRobotFrameworkTestPage();
    generatePage.visit();
  });

  it('Käyttäjä ajaa: npx tickettotest generate TTT-1 --framework robot', () => {
    const ticketId = 'TTT-1';
    const framework = 'robot';

    generatePage.enterTicketId(ticketId);
    generatePage.selectRobotFramework();
    generatePage.clickGenerateButton();

    cy.contains('npx tickettotest generate').should('be.visible');
    cy.contains(ticketId).should('be.visible');
    cy.contains('--framework robot').should('be.visible');
  });

  it('Työkalu hakee tiketin Jirasta automaattisesti', () => {
    const ticketId = 'TTT-1';

    generatePage.enterTicketId(ticketId);
    generatePage.selectRobotFramework();
    generatePage.clickGenerateButton();

    generatePage.verifyJiraConnectionStatus('connected');
    cy.contains('Fetching ticket from Jira').should('be.visible');
    cy.contains(ticketId).should('be.visible');
    generatePage.verifySuccessMessage();
  });

  it('Generoitu tiedosto tallennetaan: tests/TTT-1.robot', () => {
    const ticketId = 'TTT-1';
    const expectedFilePath = 'tests/TTT-1.robot';

    generatePage.enterTicketId(ticketId);
    generatePage.selectRobotFramework();
    generatePage.clickGenerateButton();

    generatePage.verifySuccessMessage();
    generatePage.verifyGeneratedFilePath(expectedFilePath);
    cy.contains('File saved successfully').should('be.visible');
  });

  it('Tiedosto sisältää *** Settings *** osion Browser-kirjastolla', () => {
    const ticketId = 'TTT-1';

    generatePage.enterTicketId(ticketId);
    generatePage.selectRobotFramework();
    generatePage.clickGenerateButton();

    generatePage.verifySuccessMessage();
    generatePage.verifyFilePreviewContains('*** Settings ***');
    generatePage.verifyFilePreviewContains('Library');
    generatePage.verifyFilePreviewContains('Browser');
    generatePage.verifyBrowserLibraryInSettings();
  });

  it('Tiedosto sisältää *** Variables *** osion BASE_URL muuttujalla', () => {
    const ticketId = 'TTT-1';

    generatePage.enterTicketId(ticketId);
    generatePage.selectRobotFramework();
    generatePage.clickGenerateButton();

    generatePage.verifySuccessMessage();
    generatePage.verifyVariablesSectionExists();
    generatePage.verifyBaseUrlVariable();
    generatePage.verifyFilePreviewContains('*** Variables ***');