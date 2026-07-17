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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LicensePurchasePageObject {
    private WebDriver driver;
    private WebDriverWait wait;

    // TODO: Update these selectors based on actual page structure
    private By starterLicenseOption = By.cssSelector("[data-license-type='starter']");
    private By proLicenseOption = By.cssSelector("[data-license-type='pro']");
    private By teamLicenseOption = By.cssSelector("[data-license-type='team']");
    
    private By starterPrice = By.cssSelector("[data-license-type='starter'] .price");
    private By proPrice = By.cssSelector("[data-license-type='pro'] .price");
    private By teamPrice = By.cssSelector("[data-license-type='team'] .price");
    
    private By starterQuota = By.cssSelector("[data-license-type='starter'] .quota");
    private By proQuota = By.cssSelector("[data-license-type='pro'] .quota");
    private By teamQuota = By.cssSelector("[data-license-type='team'] .quota");
    
    private By starterBuyButton = By.cssSelector("[data-license-type='starter'] .buy-button");
    private By proBuyButton = By.cssSelector("[data-license-type='pro'] .buy-button");
    private By teamBuyButton = By.cssSelector("[data-license-type='team'] .buy-button");
    
    private By stripePaymentFrame = By.cssSelector("iframe[name*='stripe']");
    private By stripeCardNumberField = By.name("cardnumber");
    private By stripeExpiryField = By.name("exp-date");
    private By stripeCvcField = By.name("cvc");
    private By stripeSubmitButton = By.cssSelector("button[type='submit']");
    
    private By paymentSuccessMessage = By.cssSelector(".payment-success-message");
    private By paymentErrorMessage = By.cssSelector(".payment-error-message");
    private By errorMessageText = By.cssSelector(".error-message-text");
    
    private By emailConfirmationNotice = By.cssSelector(".email-confirmation-notice");

    public LicensePurchasePageObject(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    public void navigateToLicensePage() {
        driver.get("https://tickettotest.com/purchase");
    }

    public boolean isStarterLicenseDisplayed() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(starterLicenseOption)).isDisplayed();
    }

    public boolean isProLicenseDisplayed() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(proLicenseOption)).isDisplayed();
    }

    public boolean isTeamLicenseDisplayed() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(teamLicenseOption)).isDisplayed();
    }

    public String getStarterPrice() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(starterPrice)).getText();
    }

    public String getProPrice() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(proPrice)).getText();
    }

    public String getTeamPrice() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(teamPrice)).getText();
    }

    public String getStarterQuota() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(starterQuota)).getText();
    }

    public String getProQuota() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(proQuota)).getText();
    }

    public String getTeamQuota() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(teamQuota)).getText();
    }

    public void clickStarterBuyButton() {
        wait.until(ExpectedConditions.elementToBeClickable(starterBuyButton)).click();
    }

    public void clickProBuyButton() {
        wait.until(ExpectedConditions.elementToBeClickable(proBuyButton)).click();
    }

    public void clickTeamBuyButton() {
        wait.until(ExpectedConditions.elementToBeClickable(teamBuyButton)).click();
    }

    public boolean isRedirectedToStripe() {
        wait.until(ExpectedConditions.or(
            ExpectedConditions.urlContains("stripe.com"),
            ExpectedConditions.urlContains("checkout.stripe.com"),
            ExpectedConditions.presenceOfElementLocated(stripePaymentFrame)
        ));
        return driver.getCurrentUrl().contains("stripe") || 
               !driver.findElements(stripePaymentFrame).isEmpty();
    }

    public void fillStripePaymentForm(String cardNumber, String expiry, String cvc) {
        try {
            List<WebElement> iframes = driver.findElements(stripePaymentFrame);
            if (!iframes.isEmpty()) {
                driver.switchTo().frame(iframes.get(0));
            }
            
            wait.until(ExpectedConditions.visibilityOfElementLocated(stripeCardNumberField))
                .sendKeys(cardNumber);
            driver.findElement(stripeExpiryField).sendKeys(expiry);
            driver.findElement(stripeCvcField).sendKeys(cvc);
            
            driver.switchTo().defaultContent();
        } catch (Exception e) {
            driver.switchTo().defaultContent();
        }
    }

    public void submitStripePayment() {
        try {
            List<WebElement> iframes = driver.findElements(stripePaymentFrame);
            if (!iframes.isEmpty()) {
                driver.switchTo().frame(iframes.get(0));
            }
            
            wait.until(ExpectedConditions.elementToBeClickable(stripeSubmitButton)).click();
            driver.switchTo().defaultContent();
        } catch (Exception e) {
            driver.switchTo().defaultContent();
        }
    }

    public boolean isPaymentSuccessful() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(paymentSuccessMessage)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isErrorMessageDisplayed() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(paymentErrorMessage)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getErrorMessageText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(errorMessageText)).getText();
    }

    public boolean isEmailConfirmationNoticeDisplayed() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(emailConfirmationNotice)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isPriceDisplayed(String price) {
        return price != null && !price.isEmpty() && price.matches(".*\\d+.*");
    }

    public boolean isQuotaDisplayed(String quota)