class GenerateTestFromJiraPage {
  // TODO: Fill in actual selectors
  private readonly commandInput = 'TODO: selector for command input field';
  private readonly generateButton = 'TODO: selector for generate button';
  private readonly ticketIdInput = 'TODO: selector for ticket ID input';
  private readonly outputConsole = 'TODO: selector for output console';
  private readonly successMessage = 'TODO: selector for success message';
  private readonly generatedFilePath = 'TODO: selector for generated file path display';
  private readonly quotaDisplay = 'TODO: selector for remaining quota display';
  private readonly errorMessage = 'TODO: selector for error message';
  private readonly loadingIndicator = 'TODO: selector for loading indicator';
  private readonly generationTimer = 'TODO: selector for generation timer';

  visit(): void {
    cy.visit('/');
  }

  enterCommand(command: string): void {
    cy.get(this.commandInput).clear().type(command);
  }

  enterTicketId(ticketId: string): void {
    cy.get(this.ticketIdInput).clear().type(ticketId);
  }

  clickGenerate(): void {
    cy.get(this.generateButton).click();
  }

  verifySuccessMessage(): void {
    cy.get(this.successMessage).should('be.visible');
  }

  verifyGeneratedFilePath(expectedPath: string): void {
    cy.get(this.generatedFilePath).should('contain.text', expectedPath);
  }

  verifyQuotaDisplayed(): void {
    cy.get(this.quotaDisplay).should('be.visible');
  }

  verifyQuotaValue(): void {
    cy.get(this.quotaDisplay).invoke('text').should('match', /\d+/);
  }

  verifyErrorMessage(message: string): void {
    cy.get(this.errorMessage).should('be.visible').and('contain.text', message);
  }

  verifyLoadingIndicatorShown(): void {
    cy.get(this.loadingIndicator).should('be.visible');
  }

  verifyLoadingIndicatorHidden(): void {
    cy.get(this.loadingIndicator).should('not.exist');
  }

  verifyGenerationTimeUnder(seconds: number): void {
    cy.get(this.generationTimer)
      .invoke('text')
      .then((timeText: string) => {
        const timeValue = parseFloat(timeText);
        expect(timeValue).to.be.lessThan(seconds);
      });
  }

  verifyOutputContains(text: string): void {
    cy.get(this.outputConsole).should('contain.text', text);
  }

  verifyDescribeBlock(ticketTitle: string): void {
    cy.get(this.outputConsole).should('contain.text', `describe('${ticketTitle}'`);
  }

  verifyItBlocks(count: number): void {
    cy.get(this.outputConsole)
      .invoke('text')
      .then((text: string) => {
        const itBlockCount = (text.match(/it\(/g) || []).length;
        expect(itBlockCount).to.equal(count);
      });
  }

  verifyPageObjectPattern(): void {
    cy.get(this.outputConsole).should('contain.text', 'class');
    cy.get(this.outputConsole).should('contain.text', 'Page');
  }

  verifyTodoComments(): void {
    cy.get(this.outputConsole).should('contain.text', 'TODO');
  }
}

describe('TTT-2: Käyttäjä voi generoida Playwright-testin Jira-tiketistä', () => {
  const page = new GenerateTestFromJiraPage();
  const testTicketId = 'TTT-1';
  const expectedFilePath = `tests/${testTicketId}.spec.ts`;

  beforeEach(() => {
    page.visit();
  });

  it('Käyttäjä ajaa: npx tickettotest generate TTT-1', () => {
    page.enterCommand(`npx tickettotest generate ${testTicketId}`);
    page.clickGenerate();
    cy.contains('Command executed successfully').should('be.visible');
  });

  it('Työkalu hakee tiketin Jirasta automaattisesti', () => {
    page.enterTicketId(testTicketId);
    page.clickGenerate();
    page.verifyLoadingIndicatorShown();
    cy.contains('Fetching ticket from Jira').should('be.visible');
    page.verifyLoadingIndicatorHidden();
    cy.contains('Ticket fetched successfully').should('be.visible');
  });

  it('Claude AI generoi testiskeleton hyväksymiskriteerien pohjalta', () => {
    page.enterTicketId(testTicketId);
    page.clickGenerate();
    cy.contains('Generating test with Claude AI').should('be.visible');
    cy.contains('Test skeleton generated').should('be.visible');
  });

  it('Generoitu tiedosto tallennetaan: tests/TTT-1.spec.ts', () => {
    page.enterTicketId(testTicketId);
    page.clickGenerate();
    page.verifySuccessMessage();
    page.verifyGeneratedFilePath(expectedFilePath);
    cy.contains(expectedFilePath).should('be.visible');
  });

  it('Tiedosto sisältää describe-blokin tiketin nimellä', () => {
    page.enterTicketId(testTicketId);
    page.clickGenerate();
    page.verifyDescribeBlock('TTT-1');
    cy.contains("describe('TTT-1'").should('be.visible');
  });

  it('Tiedosto sisältää yhden it()-blokin per hyväksymiskriteeri', () => {
    page.enterTicketId(testTicketId);
    page.clickGenerate();
    page.verifyItBlocks(1);
    cy.get(page['outputConsole'])
      .invoke('text')
      .should('match', /it\(/);
  });

  it('Tiedosto käyttää Page Object Model -rakennetta', () => {
    page.enterTicketId(testTicketId);
    page.clickGenerate();
    page.verifyPageObjectPattern();
    cy.contains('class').should('be.visible');
    cy.contains('Page').should('be.visible');
  });

  it('Selektorit on merkitty TODO-kommentteina', () => {
    page.enterTicketId(testTicketId);
    page.clickGenerate();
    page.verifyTodoComments();
    cy.contains('TODO').should('be.visible');
    cy.contains('selector').should('be.visible');
  });

  it('Käyttäjä näkee jäljellä olevat generointikiintiöt', () => {
    page.enterTicketId(testTicketId);
    page.clickGenerate();
    page.verifyQuotaDisplayed();
    page.verifyQuotaValue();
    cy.contains('Remaining quota').should('be.visible');
  });

  it('Generointi kestää alle 30 sekuntia', () => {
    const maxGenerationTime = 30;
    page.enterTicketId(testTicketId);
    const startTime = Date.now();
    page.clickGenerate();
    page.verifySuccessMessage();
    cy.wrap(null).then(() => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      expect(duration).to.be.lessThan(maxGenerationTime);
    });
  });

  it('Käyttäjä näkee virheilmoituksen jos tiketti ei löydy