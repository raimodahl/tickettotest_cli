import { test, expect, Page, Locator } from '@playwright/test';

class ProductSearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productResults: Locator;
  readonly addToCartButtons: Locator;
  readonly cartIcon: Locator;
  readonly cartItemCount: Locator;
  readonly confirmationMessage: Locator;
  readonly errorMessage: Locator;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('searchbox', { name: /haku/i });
    this.searchButton = page.getByRole('button', { name: /hae/i });
    this.productResults = page.getByTestId('product-results');
    this.addToCartButtons = page.getByRole('button', { name: /lisää koriin/i });
    this.cartIcon = page.getByTestId('cart-icon');
    this.cartItemCount = page.getByTestId('cart-item-count');
    this.confirmationMessage = page.getByTestId('confirmation-message');
    this.errorMessage = page.getByTestId('error-message');
    this.productName = page.getByTestId('product-name');
    this.productPrice = page.getByTestId('product-price');
    this.productImage = page.getByTestId('product-image');
  }

  async navigateToHomePage(): Promise<void> {
    await this.page.goto('/');
  }

  async searchForProduct(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
  }

  async searchWithButton(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.searchButton.click();
  }

  async addFirstProductToCart(): Promise<void> {
    await this.addToCartButtons.first().click();
  }

  async getCartItemCount(): Promise<string> {
    return await this.cartItemCount.textContent() || '0';
  }

  async isSearchInputVisible(): Promise<boolean> {
    return await this.searchInput.isVisible();
  }

  async getProductResults(): Promise<Locator[]> {
    await this.productResults.waitFor();
    return await this.productResults.locator('[data-testid="product-item"]').all();
  }

  async performEmptySearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.searchInput.press('Enter');
  }
}

test.describe('Käyttäjä voi hakea tuotteita ja lisätä ne ostoskoriin', () => {
  let productSearchPage: ProductSearchPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page object
    productSearchPage = new ProductSearchPage(page);
    
    // Navigate to homepage
    await productSearchPage.navigateToHomePage();
  });

  test('Hakupalkki näkyy etusivulla', async () => {
    // Verify search input is visible on homepage
    const isSearchVisible = await productSearchPage.isSearchInputVisible();
    expect(isSearchVisible).toBe(true);
    
    // Verify search input is accessible
    await expect(productSearchPage.searchInput).toBeVisible();
    await expect(productSearchPage.searchInput).toBeEnabled();
  });

  test('Hakusanan kirjoittaminen ja Enter-painallus näyttää relevantit tulokset', async () => {
    // Enter search term and press Enter
    await productSearchPage.searchForProduct('kamera');
    
    // Wait for results to appear
    await expect(productSearchPage.productResults).toBeVisible();
    
    // Verify search results are displayed
    const results = await productSearchPage.getProductResults();
    expect(results.length).toBeGreaterThan(0);
    
    // Verify results contain search term (case insensitive)
    const firstProductName = await productSearchPage.productName.first().textContent();
    expect(firstProductName?.toLowerCase()).toContain('kamera');
  });

  test('Jokainen hakutulos näyttää tuotteen nimen, hinnan ja kuvan', async () => {
    // Perform search
    await productSearchPage.searchForProduct('laptop');
    
    // Wait for results
    await expect(productSearchPage.productResults).toBeVisible();
    
    // Verify first product has all required elements
    await expect(productSearchPage.productName.first()).toBeVisible();
    await expect(productSearchPage.productPrice.first()).toBeVisible();
    await expect(productSearchPage.productImage.first()).toBeVisible();
    
    // Verify content is not empty
    const productName = await productSearchPage.productName.first().textContent();
    const productPrice = await productSearchPage.productPrice.first().textContent();
    
    expect(productName).toBeTruthy();
    expect(productPrice).toBeTruthy();
    expect(productPrice).toMatch(/\d+[.,]\d+/); // Price format validation
  });

  test('"Lisää koriin" -napin painaminen lisää tuotteen ostoskoriin', async () => {
    // Perform search to get products
    await productSearchPage.searchForProduct('hiiri');
    await expect(productSearchPage.productResults).toBeVisible();
    
    // Get initial cart count
    const initialCount = await productSearchPage.getCartItemCount();
    const initialCountNum = parseInt(initialCount) || 0;
    
    // Add first product to cart
    await productSearchPage.addFirstProductToCart();
    
    // Verify cart count increased
    await expect(productSearchPage.cartItemCount).toHaveText((initialCountNum + 1).toString());
  });

  test('Ostoskori-ikoni päivittyy näyttämään tuotteiden määrän', async () => {
    // Verify cart icon is initially visible
    await expect(productSearchPage.cartIcon).toBeVisible();
    
    // Get initial cart count
    const initialCount = await productSearchPage.getCartItemCount();
    
    // Search and add product
    await productSearchPage.searchForProduct('näppäimistö');
    await expect(productSearchPage.productResults).toBeVisible();
    await productSearchPage.addFirstProductToCart();
    
    // Verify cart icon shows updated count
    const expectedCount = (parseInt(initialCount) || 0) + 1;
    await expect(productSearchPage.cartItemCount).toHaveText(expectedCount.toString());
    
    // Add another product and verify count increases again
    await productSearchPage.addFirstProductToCart();
    await expect(productSearchPage.cartItemCount).toHaveText((expectedCount + 1).toString());
  });

  test('Käyttäjä näkee vahvistusviestin tuotteen lisäämisen jälkeen', async () => {
    // Search for product
    await productSearchPage.searchForProduct('tablet');
    await expect(productSearchPage.productResults).toBeVisible();
    
    // Add product to cart
    await productSearchPage.addFirstProductToCart();
    
    // Verify confirmation message appears
    await expect(productSearchPage.confirmationMessage).toBeVisible();
    
    // Verify message content
    const confirmationText = await productSearchPage.confirmationMessage.textContent();
    expect(confirmationText?.toLowerCase()).toContain('lisätty');
    expect(confirmationText?.toLowerCase()).toContain('koriin');
  });

  test('Tyhjä hakukysely näyttää virheviestin', async () => {
    // Perform empty search
    await productSearchPage.performEmptySearch();
    
    // Verify error message appears
    await expect(productSearchPage.errorMessage).to