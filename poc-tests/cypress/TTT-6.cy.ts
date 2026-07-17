class TTT6Page {
  // TODO: Fill in the actual selectors
  private selectors = {
    commandInput: '[data-testid="command-input"]', // TODO: Update selector
    frameworkDropdown: '[data-testid="framework-dropdown"]', // TODO: Update selector
    generateButton: '[data-testid="generate-button"]', // TODO: Update selector
    outputFileDisplay: '[data-testid="output-file-display"]', // TODO: Update selector
    fileContentPreview: '[data-testid="file-content-preview"]', // TODO: Update selector
    runInstructionDisplay: '[data-testid="run-instruction-display"]', // TODO: Update selector
    successMessage: '[data-testid="success-message"]', // TODO: Update selector
    errorMessage: '[data-testid="error-message"]', // TODO: Update selector
  };

  visit(): void {
    cy.visit('/generate'); // TODO: Update URL path
  }

  enterCommand(command: string): void {
    cy.get(this.selectors.commandInput).clear().type(command);
  }

  selectFramework(framework: string): void {
    cy.get(this.selectors.frameworkDropdown).select(framework);
  }

  clickGenerateButton(): void {
    cy.get(this.selectors.generateButton).click();
  }

  verifyOutputFilePath(expectedPath: string): void {
    cy.get(this.selectors.outputFileDisplay).should('contain', expectedPath);
  }

  verifyFileContainsDescribeBlock(): void {
    cy.get(this.selectors.fileContentPreview).should('contain', 'describe(');
  }

  verifyFileContainsItBlock(): void {
    cy.get(this.selectors.fileContentPreview).should('contain', 'it(');
  }

  verifyFileUsesCyVisit(): void {
    cy.get(this.selectors.fileContentPreview).should('contain', 'cy.visit()');
  }

  verifyFileUsesCyGet(): void {
    cy.get(this.selectors.fileContentPreview).should('contain', 'cy.get()');
  }

  verifySelectorsHaveTodoComments(): void {
    cy.get(this.selectors.fileContentPreview).should('contain', '// TODO');
  }

  verifyRunInstructionDisplayed(expectedInstruction: string): void {
    cy.get(this.selectors.runInstructionDisplay).should('contain', expectedInstruction);
  }

  verifySuccessMessage(): void {
    cy.get(this.selectors.successMessage).should('be.visible');
  }

  verifyErrorMessage(): void {
    cy.get(this.selectors.errorMessage).should('be.visible');
  }
}

describe('TTT-6: Käyttäjä voi generoida Cypress-testin Jira-tiketistä', () => {
  const page = new TTT6Page();
  const testCommand = 'npx tickettotest generate TTT-1 --framework cypress';
  const expectedOutputFile = 'tests/TTT-1.cy.js';
  const expectedRunInstruction = 'npx cypress run';

  beforeEach(() => {
    page.visit();
  });

  it('Käyttäjä ajaa: npx tickettotest generate TTT-1 --framework cypress', () => {
    page.enterCommand(testCommand);
    page.selectFramework('cypress');
    page.clickGenerateButton();
    page.verifySuccessMessage();
  });

  it('Generoitu tiedosto tallennetaan: tests/TTT-1.cy.js', () => {
    page.enterCommand(testCommand);
    page.selectFramework('cypress');
    page.clickGenerateButton();
    page.verifyOutputFilePath(expectedOutputFile);
    cy.contains(expectedOutputFile).should('be.visible');
  });

  it('Tiedosto sisältää describe()-blokin', () => {
    page.enterCommand(testCommand);
    page.selectFramework('cypress');
    page.clickGenerateButton();
    page.verifyFileContainsDescribeBlock();
    cy.contains('describe(').should('be.visible');
  });

  it('Tiedosto sisältää it()-blokin per hyväksymiskriteeri', () => {
    page.enterCommand(testCommand);
    page.selectFramework('cypress');
    page.clickGenerateButton();
    page.verifyFileContainsItBlock();
    cy.contains('it(').should('be.visible');
  });

  it('Tiedosto käyttää cy.visit() navigointiin', () => {
    page.enterCommand(testCommand);
    page.selectFramework('cypress');
    page.clickGenerateButton();
    page.verifyFileUsesCyVisit();
    cy.contains('cy.visit()').should('be.visible');
  });

  it('Tiedosto käyttää cy.get() elementtien hakuun', () => {
    page.enterCommand(testCommand);
    page.selectFramework('cypress');
    page.clickGenerateButton();
    page.verifyFileUsesCyGet();
    cy.contains('cy.get()').should('be.visible');
  });

  it('Selektorit on merkitty TODO-kommentteina', () => {
    page.enterCommand(testCommand);
    page.selectFramework('cypress');
    page.clickGenerateButton();
    page.verifySelectorsHaveTodoComments();
    cy.contains('// TODO').should('be.visible');
  });

  it('Ajo-ohje näytetään: npx cypress run', () => {
    page.enterCommand(testCommand);
    page.selectFramework('cypress');
    page.clickGenerateButton();
    page.verifyRunInstructionDisplayed(expectedRunInstruction);
    cy.contains(expectedRunInstruction).should('be.visible');
  });
});