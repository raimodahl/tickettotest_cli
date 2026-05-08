class ProductSearchPage {
  // TODO: Fill in actual selectors
  private selectors = {
    searchInput: '[data-testid="search-input"]', // TODO: Replace with actual selector
    searchButton: '[data-testid="search-button"]', // TODO: Replace with actual selector
    searchResults: '[data-testid="search-results"]', // TODO: Replace with actual selector
    productCard: '[data-testid="product-card"]', // TODO: Replace with actual selector
    productName: '[data-testid="product-name"]', // TODO: Replace with actual selector
    productPrice: '[data-testid="product-price"]', // TODO: Replace with actual selector
    productImage: '[data-testid="product-image"]', // TODO: Replace with actual selector
    addToCartButton: '[data-testid="add-to-cart-button"]', // TODO: Replace with actual selector
    cartIcon: '[data-testid="cart-icon"]', // TODO: Replace with actual selector
    cartItemCount: '[data-testid="cart-item-count"]', // TODO: Replace with actual selector
    confirmationMessage: '[data-testid="confirmation-message"]', // TODO: Replace with actual selector
    errorMessage: '[data-testid="error-message"]', // TODO: Replace with actual selector
  };

  visit(): void {
    cy.visit('/');
  }

  getSearchInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.selectors.searchInput);
  }

  getSearchButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.selectors.searchButton);
  }

  getSearchResults(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.selectors.searchResults);
  }

  getProductCards(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.selectors.productCard);
  }

  getCartIcon(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.selectors.cartIcon);
  }

  getCartItemCount(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.selectors.cartItemCount);
  }

  getConfirmationMessage(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.selectors.confirmationMessage);
  }

  getErrorMessage(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.selectors.errorMessage);
  }

  searchForProduct(searchTerm: string): void {
    this.getSearchInput().type(searchTerm);
    this.getSearchInput().type('{enter}');
  }

  clickSearchButton(): void {
    this.getSearchButton().click();
  }

  addFirstProductToCart(): void {
    this.getProductCards().first().find(this.selectors.addToCartButton).click();
  }

  verifySearchInputVisible(): void {
    this.getSearchInput().should('be.visible');
  }

  verifySearchResultsVisible(): void {
    this.getSearchResults().should('be.visible');
  }

  verifyProductCardContent(): void {
    this.getProductCards().should('have.length.greaterThan', 0);
    this.getProductCards().each(($card) => {
      cy.wrap($card).find(this.selectors.productName).should('be.visible');
      cy.wrap($card).find(this.selectors.productPrice).should('be.visible');
      cy.wrap($card).find(this.selectors.productImage).should('be.visible');
    });
  }

  verifyCartItemCount(expectedCount: string): void {
    this.getCartItemCount().should('contain.text', expectedCount);
  }

  verifyConfirmationMessage(): void {
    this.getConfirmationMessage().should('be.visible');
  }

  verifyErrorMessage(): void {
    this.getErrorMessage().should('be.visible');
  }

  submitEmptySearch(): void {
    this.getSearchInput().clear();
    this.getSearchInput().type('{enter}');
  }
}

describe('SCRUM-5: Käyttäjä voi hakea tuotteita ja lisätä ne ostoskoriin', () => {
  let productSearchPage: ProductSearchPage;

  beforeEach(() => {
    productSearchPage = new ProductSearchPage();
    productSearchPage.visit();
  });

  it('should display search bar on the homepage', () => {
    productSearchPage.verifySearchInputVisible();
  });

  it('should show relevant results when typing search term and pressing Enter', () => {
    const searchTerm = 'laptop';
    
    productSearchPage.searchForProduct(searchTerm);
    productSearchPage.verifySearchResultsVisible();
  });

  it('should display product name, price and image for each search result', () => {
    const searchTerm = 'phone';
    
    productSearchPage.searchForProduct(searchTerm);
    productSearchPage.verifyProductCardContent();
  });

  it('should add product to cart when clicking "Lisää koriin" button', () => {
    const searchTerm = 'tablet';
    
    productSearchPage.searchForProduct(searchTerm);
    productSearchPage.addFirstProductToCart();
    
    // Verify product was added to cart
    productSearchPage.verifyCartItemCount('1');
  });

  it('should update cart icon to show number of products', () => {
    const searchTerm = 'keyboard';
    
    productSearchPage.searchForProduct(searchTerm);
    
    // Initially cart should be empty or show 0
    productSearchPage.getCartIcon().should('be.visible');
    
    // Add first product
    productSearchPage.addFirstProductToCart();
    productSearchPage.verifyCartItemCount('1');
    
    // Add second product if available
    productSearchPage.getProductCards().then(($cards) => {
      if ($cards.length > 1) {
        cy.wrap($cards).eq(1).find(productSearchPage['selectors'].addToCartButton).click();
        productSearchPage.verifyCartItemCount('2');
      }
    });
  });

  it('should show confirmation message after adding product to cart', () => {
    const searchTerm = 'mouse';
    
    productSearchPage.searchForProduct(searchTerm);
    productSearchPage.addFirstProductToCart();
    productSearchPage.verifyConfirmationMessage();
  });

  it('should show error message for empty search query', () => {
    productSearchPage.submitEmptySearch();
    productSearchPage.verifyErrorMessage();
  });
});