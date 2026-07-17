```java
package com.tickettotest.tests;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

public class TTT4QuotaCheckTest {

    private WebDriver driver;
    private QuotaCheckPage quotaCheckPage;
    private WebDriverWait wait;

    @BeforeEach
    public void setUp() {
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        quotaCheckPage = new QuotaCheckPage(driver);
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testUserCanCheckGenerationQuota() {
        quotaCheckPage.navigateToQuotaPage();
        quotaCheckPage.executeQuotaCommand();
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(quotaCheckPage.getLicenseTypeLocator()));
        
        String licenseType = quotaCheckPage.getLicenseType();
        assertNotNull(licenseType, "License type should be displayed");
        assertTrue(licenseType.matches("Starter|Pro|Team"), 
            "License type should be Starter, Pro, or Team");
    }

    @Test
    public void testToolDisplaysLicenseKeyType() {
        quotaCheckPage.navigateToQuotaPage();
        quotaCheckPage.executeQuotaCommand();
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(quotaCheckPage.getLicenseTypeLocator()));
        
        String licenseType = quotaCheckPage.getLicenseType();
        assertNotNull(licenseType, "License type should not be null");
        assertTrue(licenseType.equals("Starter") || 
                   licenseType.equals("Pro") || 
                   licenseType.equals("Team"),
            "License type should be one of: Starter, Pro, or Team");
    }

    @Test
    public void testToolDisplaysTotalQuota() {
        quotaCheckPage.navigateToQuotaPage();
        quotaCheckPage.executeQuotaCommand();
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(quotaCheckPage.getTotalQuotaLocator()));
        
        String totalQuota = quotaCheckPage.getTotalQuota();
        assertNotNull(totalQuota, "Total quota should be displayed");
        assertTrue(Integer.parseInt(totalQuota.replaceAll("[^0-9]", "")) > 0, 
            "Total quota should be greater than 0");
    }

    @Test
    public void testToolDisplaysUsedGenerations() {
        quotaCheckPage.navigateToQuotaPage();
        quotaCheckPage.executeQuotaCommand();
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(quotaCheckPage.getUsedGenerationsLocator()));
        
        String usedGenerations = quotaCheckPage.getUsedGenerations();
        assertNotNull(usedGenerations, "Used generations should be displayed");
        int usedCount = Integer.parseInt(usedGenerations.replaceAll("[^0-9]", ""));
        assertTrue(usedCount >= 0, "Used generations should be 0 or greater");
    }

    @Test
    public void testToolDisplaysRemainingGenerations() {
        quotaCheckPage.navigateToQuotaPage();
        quotaCheckPage.executeQuotaCommand();
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(quotaCheckPage.getRemainingGenerationsLocator()));
        
        String remainingGenerations = quotaCheckPage.getRemainingGenerations();
        assertNotNull(remainingGenerations, "Remaining generations should be displayed");
        int remainingCount = Integer.parseInt(remainingGenerations.replaceAll("[^0-9]", ""));
        assertTrue(remainingCount >= 0, "Remaining generations should be 0 or greater");
        
        int totalQuota = Integer.parseInt(quotaCheckPage.getTotalQuota().replaceAll("[^0-9]", ""));
        int usedGenerations = Integer.parseInt(quotaCheckPage.getUsedGenerations().replaceAll("[^0-9]", ""));
        assertEquals(totalQuota - usedGenerations, remainingCount, 
            "Remaining generations should equal total minus used");
    }

    @Test
    public void testInvalidOrExpiredKeyShowsClearError() {
        quotaCheckPage.navigateToQuotaPage();
        quotaCheckPage.enterInvalidLicenseKey();
        quotaCheckPage.executeQuotaCommand();
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(quotaCheckPage.getErrorMessageLocator()));
        
        String errorMessage = quotaCheckPage.getErrorMessage();
        assertNotNull(errorMessage, "Error message should be displayed");
        assertTrue(errorMessage.length() > 0, "Error message should not be empty");
        assertTrue(errorMessage.toLowerCase().contains("invalid") || 
                   errorMessage.toLowerCase().contains("expired") ||
                   errorMessage.toLowerCase().contains("error"),
            "Error message should indicate invalid or expired key");
    }

    @Test
    public void testCommandWorksWithoutInternetWhenCached() {
        quotaCheckPage.navigateToQuotaPage();
        quotaCheckPage.executeQuotaCommand();
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(quotaCheckPage.getLicenseTypeLocator()));
        
        quotaCheckPage.simulateOfflineMode();
        quotaCheckPage.executeQuotaCommand();
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(quotaCheckPage.getLicenseTypeLocator()));
        
        String licenseType = quotaCheckPage.getLicenseType();
        assertNotNull(licenseType, "License type should be displayed from cache");
        
        String totalQuota = quotaCheckPage.getTotalQuota();
        assertNotNull(totalQuota, "Quota information should be available from cache");
    }
}

class QuotaCheckPage {
    
    private WebDriver driver;
    private WebDriverWait wait;
    
    // TODO: Update these locators based on actual application UI
    private By commandInputField = By.cssSelector("input[name='command']");
    private By executeButton = By.cssSelector("button[type='submit']");
    private By licenseTypeDisplay = By.cssSelector(".license-type");
    private By totalQuotaDisplay = By.cssSelector(".total-quota");
    private By usedGenerationsDisplay = By.cssSelector(".used-generations");
    private By remainingGenerationsDisplay = By.cssSelector(".remaining-generations");
    private By errorMessageDisplay = By.cssSelector(".error-message");
    private By licenseKeyInput = By.id("license-key-input");
    private By offlineModeToggle = By.cssSelector("input[name='offline-mode']");
    
    public QuotaCheckPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }
    
    public void navigateToQuotaPage() {
        // TODO: Update with actual application URL
        driver.get("http://localhost:3000