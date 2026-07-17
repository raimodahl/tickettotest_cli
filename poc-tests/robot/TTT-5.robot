*** Settings ***
Library           Browser
Library           String
Library           DateTime
Resource          ../resources/common.resource
Suite Setup       Setup Browser And Context
Suite Teardown    Close Browser
Test Setup        Navigate To License Shop Page
Test Teardown     Take Screenshot On Failure

*** Variables ***
${BASE_URL}              https://tickettotest.com
${SHOP_URL}              ${BASE_URL}/shop
${TIMEOUT}               30s
${EMAIL_TIMEOUT}         120s
${TEST_EMAIL}            test.user@example.com
${STARTER_PRICE}         €49
${PRO_PRICE}            €149
${TEAM_PRICE}           €499
${STRIPE_SUCCESS_URL}    ${BASE_URL}/payment/success
${STRIPE_FAILURE_URL}    ${BASE_URL}/payment/failure

*** Test Cases ***
User Can See Three License Options With Starter Pro And Team
    [Documentation]    Verify that all three license options are visible on the shop page
    [Tags]    TTT-5    acceptance-criteria-1    license-options
    license shop page should be loaded
    starter license option should be visible
    pro license option should be visible
    team license option should be visible

Each License Option Shows Clear Price And Quota Information
    [Documentation]    Verify that price and quota are clearly displayed for each license
    [Tags]    TTT-5    acceptance-criteria-2    pricing
    license shop page should be loaded
    starter license should show price and quota
    pro license should show price and quota
    team license should show price and quota

Purchase Button Redirects To Stripe Payment Page
    [Documentation]    Verify that clicking purchase button redirects to Stripe
    [Tags]    TTT-5    acceptance-criteria-3    payment-flow
    license shop page should be loaded
    user selects pro license
    user clicks purchase button
    user should be redirected to stripe payment page

User Receives License Key By Email After Payment
    [Documentation]    Verify that license key is sent to email after successful payment
    [Tags]    TTT-5    acceptance-criteria-4    email-delivery
    license shop page should be loaded
    user completes purchase with email    ${TEST_EMAIL}
    user completes stripe payment
    payment confirmation should be displayed
    user should receive license key email    ${TEST_EMAIL}

Email Arrives Within Two Minutes After Payment
    [Documentation]    Verify that email is received within 2 minutes
    [Tags]    TTT-5    acceptance-criteria-5    email-timing
    ${start_time}=    Get Current Date
    license shop page should be loaded
    user completes purchase with email    ${TEST_EMAIL}
    user completes stripe payment
    ${end_time}=    Get Current Date
    ${email_received_time}=    wait for license key email    ${TEST_EMAIL}    ${EMAIL_TIMEOUT}
    ${elapsed_time}=    Subtract Date From Date    ${email_received_time}    ${start_time}
    Should Be True    ${elapsed_time} <= 120    Email took longer than 2 minutes to arrive

Email Contains Clear Instructions For CLI Initialization
    [Documentation]    Verify that email contains CLI initialization instructions
    [Tags]    TTT-5    acceptance-criteria-6    email-content
    license shop page should be loaded
    user completes purchase with email    ${TEST_EMAIL}
    user completes stripe payment
    ${email_content}=    get license key email content    ${TEST_EMAIL}
    email should contain license key    ${email_content}
    email should contain cli installation instructions    ${email_content}
    email should contain cli initialization command    ${email_content}

License Key Works Immediately After Payment
    [Documentation]    Verify that license key is activated immediately after payment
    [Tags]    TTT-5    acceptance-criteria-7    license-activation
    license shop page should be loaded
    user completes purchase with email    ${TEST_EMAIL}
    user completes stripe payment
    ${license_key}=    extract license key from email    ${TEST_EMAIL}
    license key should be valid    ${license_key}
    license key should be activated    ${license_key}

Failed Payment Shows Clear Error Message
    [Documentation]    Verify that failed payment displays clear error message
    [Tags]    TTT-5    acceptance-criteria-8    error-handling
    license shop page should be loaded
    user selects pro license
    user clicks purchase button
    user provides invalid payment details
    user submits payment
    error message should be displayed
    error message should be clear and understandable

*** Keywords ***
Setup Browser And Context
    New Browser    chromium    headless=False
    New Context    viewport={'width': 1920, 'height': 1080}
    New Page

Navigate To License Shop Page
    Go To    ${SHOP_URL}
    Wait For Load State    networkidle

Take Screenshot On Failure
    Run Keyword If Test Failed    Take Screenshot    fullPage=True

# Page Object Keywords - License Shop Page
license shop page should be loaded
    Wait For Elements State    TODO: css=.shop-page    visible    timeout=${TIMEOUT}
    Get Title    ==    TicketToTest - Purchase License

starter license option should be visible
    Wait For Elements State    TODO: css=[data-testid="license-starter"]    visible    timeout=${TIMEOUT}
    Get Text    TODO: css=[data-testid="license-starter"] h2    ==    Starter

pro license option should be visible
    Wait For Elements State    TODO: css=[data-testid="license-pro"]    visible    timeout=${TIMEOUT}
    Get Text    TODO: css=[data-testid="license-pro"] h2    ==    Pro

team license option should be visible
    Wait For Elements State    TODO: css=[data-testid="license-team"]    visible    timeout=${TIMEOUT}
    Get Text    TODO: css=[data-testid="license-team"] h2    ==    Team

starter license should show price and quota
    ${price}=    Get Text    TODO: css=[data-testid="license-starter"] .price
    ${quota}=    Get Text    TODO: css=[data-testid="license-starter"] .quota
    Should Not Be Empty    ${price}
    Should Not Be Empty    ${quota}
    Should Contain    ${price}    €
    Should Contain    ${quota}    tests

pro license should show price and quota
    ${price}=    Get Text    TODO: css=[data-testid="license-pro"] .price
    ${quota}=    Get Text    TODO: css=[data-testid="license-pro"] .quota
    Should Not Be Empty    ${price}
    Should Not Be Empty    ${quota}
    Should Contain    ${price}    €
    Should Contain    ${quota}    tests

team license should show price and quota
    ${price}=    Get Text    TODO: css=[data-testid="license-team"] .price
    ${quota}=    Get Text    TODO: css=[data-testid="license-team"] .quota
    Should Not Be Empty    ${price}
    Should Not Be Empty    ${quota}
    Should Contain    ${price}    €
    Should Contain    ${quota}    tests

user selects pro license
    Click    TODO: css=[data-testid="license-pro"]
    Wait For Elements State    TODO: css=[data-testid="license-pro"].selected    visible

user clicks purchase button
    Click    TODO: css=[data-testid="license-pro"] button[data-testid="btn-purchase"]
    Wait For Load State    networkidle

# Page Object Keywords - Stripe Payment Page
user should be redirected to stripe payment page
    Wait For URL    *stripe.com/checkout/*    timeout=${TIMEOUT}
    Wait For Elements State    TODO: css=.StripeElement    visible    timeout=${TIMEOUT}

user completes purchase with email
    [Arguments]    ${email}
    user selects pro license
    Fill Text    TODO: css=input[name="email"]    ${email}
    user clicks purchase button

user completes stripe payment
    Wait For Elements State    TODO: css=#card-element    visible    timeout=${TIMEOUT}
    Fill Text    TODO: css=input[name="cardNumber"]    4242424242424242
    Fill Text    TODO: css=input[name="cardExpiry"]    12/25
    Fill Text    TODO: css=input[name="cardCvc"]    123
    Fill Text    TODO: css=input