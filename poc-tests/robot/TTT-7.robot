*** Settings ***
Library    Browser
Library    OperatingSystem
Library    String

Suite Setup       Setup Test Environment
Suite Teardown    Teardown Test Environment
Test Setup        Open Ticket To Test Application
Test Teardown     Close Browser Context

*** Variables ***
${BASE_URL}              http://localhost:3000
${TICKET_ID}             TTT-1
${FRAMEWORK}             selenium
${OUTPUT_DIR}            tests
${EXPECTED_FILENAME}     TTT-1.java
${TIMEOUT}               10s
${NPX_COMMAND}           npx tickettotest generate ${TICKET_ID} --framework ${FRAMEWORK}

# Page Elements - TODO: Update with actual selectors
${INPUT_TICKET_ID}       TODO: css=input[name="ticketId"]
${DROPDOWN_FRAMEWORK}    TODO: css=select[name="framework"]
${BUTTON_GENERATE}       TODO: css=button[type="submit"]
${OUTPUT_MESSAGE}        TODO: css=.success-message
${DOWNLOAD_LINK}         TODO: css=a.download-link
${ERROR_MESSAGE}         TODO: css=.error-message
${LOADING_INDICATOR}     TODO: css=.loading-spinner

# Expected Content
${SELENIUM_IMPORT}       org.openqa.selenium
${JUNIT_ANNOTATION}      @Test
${BEFORE_EACH}           @BeforeEach
${WEBDRIVER_TYPE}        WebDriver
${BY_CSS_SELECTOR}       By.cssSelector
${BY_ID}                 By.id
${MVN_COMMAND}           mvn test

*** Test Cases ***
User Can Generate Selenium Test By Running NPX Command
    [Documentation]    AC: Käyttäjä ajaa: npx tickettotest generate TTT-1 --framework selenium
    [Tags]    happy-path    cli-command
    Given user is on the ticket to test page
    When user enters ticket id    ${TICKET_ID}
    And user selects framework    ${FRAMEWORK}
    And user clicks generate button
    Then generation should be triggered successfully

Tool Fetches Ticket From Jira Automatically
    [Documentation]    AC: Työkalu hakee tiketin Jirasta automaattisesti
    [Tags]    happy-path    jira-integration
    Given user has entered valid ticket id    ${TICKET_ID}
    And user has selected framework    ${FRAMEWORK}
    When user clicks generate button
    Then system should fetch ticket from jira
    And jira ticket details should be displayed

Generated File Is Saved To Tests Directory With Correct Name
    [Documentation]    AC: Generoitu tiedosto tallennetaan: tests/TTT-1.java
    [Tags]    happy-path    file-generation
    Given ticket has been fetched successfully
    When user completes test generation
    Then file should be saved to    ${OUTPUT_DIR}/${EXPECTED_FILENAME}
    And success message should confirm file location

File Contains Selenium Imports
    [Documentation]    AC: Tiedosto sisältää org.openqa.selenium importit
    [Tags]    happy-path    code-content
    Given test file has been generated
    When user views generated file content
    Then file should contain import    ${SELENIUM_IMPORT}

File Contains JUnit 5 Test Annotation
    [Documentation]    AC: Tiedosto sisältää JUnit 5 @Test annotaation
    [Tags]    happy-path    code-content
    Given test file has been generated
    When user views generated file content
    Then file should contain annotation    ${JUNIT_ANNOTATION}

File Contains BeforeEach WebDriver Setup
    [Documentation]    AC: Tiedosto sisältää @BeforeEach WebDriver-alustuksen
    [Tags]    happy-path    code-content
    Given test file has been generated
    When user views generated file content
    Then file should contain annotation    ${BEFORE_EACH}
    And file should contain webdriver initialization

File Uses Correct Selenium Selectors
    [Documentation]    AC: Tiedosto käyttää By.cssSelector() tai By.id() selektoreita
    [Tags]    happy-path    code-content
    Given test file has been generated
    When user views generated file content
    Then file should contain selector method    ${BY_CSS_SELECTOR}
    Or file should contain selector method    ${BY_ID}

File Uses Page Object Pattern
    [Documentation]    AC: Tiedosto käyttää Page Object -rakennetta
    [Tags]    happy-path    code-structure
    Given test file has been generated
    When user views generated file content
    Then file should contain page object class
    And file should have page object methods

One Test Case Per Acceptance Criterion
    [Documentation]    AC: Yksi testitapaus per hyväksymiskriteeri
    [Tags]    happy-path    code-structure
    Given test file has been generated
    When user analyzes test file structure
    Then file should contain multiple test methods
    And each test method should map to acceptance criterion

Selectors Are Marked With TODO Comments
    [Documentation]    AC: Selektorit on merkitty TODO-kommentteina
    [Tags]    happy-path    code-content
    Given test file has been generated
    When user views generated file content
    Then selectors should have todo comments

Happy Path And Error Case Tests Are Included
    [Documentation]    AC: Happy path ja error case testit mukana
    [Tags]    happy-path    test-coverage
    Given test file has been generated
    When user views generated file content
    Then file should contain happy path test
    And file should contain error case test

Execution Instructions Are Displayed
    [Documentation]    AC: Ajo-ohje näytetään: mvn test
    [Tags]    happy-path    user-guidance
    Given test generation is completed
    When user views completion message
    Then execution instructions should be displayed
    And instructions should show maven command    ${MVN_COMMAND}

Error Case Invalid Ticket ID
    [Documentation]    Error case: User enters invalid ticket ID
    [Tags]    error-case
    Given user is on the ticket to test page
    When user enters ticket id    INVALID-999
    And user selects framework    ${FRAMEWORK}
    And user clicks generate button
    Then error message should be displayed
    And error message should indicate invalid ticket

Error Case Jira Connection Failure
    [Documentation]    Error case: Jira connection fails
    [Tags]    error-case
    Given user has entered valid ticket id    ${TICKET_ID}
    And jira service is unavailable
    When user clicks generate button
    Then error message should be displayed
    And error message should indicate connection failure

Error Case Missing Framework Selection
    [Documentation]    Error case: User does not select framework
    [Tags]    error-case
    Given user is on the ticket to test page
    When user enters ticket id    ${TICKET_ID}
    And user does not select framework
    And user clicks generate button
    Then error message should be displayed
    And generate button should be disabled

*** Keywords ***
Setup Test Environment
    [Documentation]    Initialize test environment and create necessary directories
    Create Directory    ${OUTPUT_DIR}
    Set Browser Timeout    ${TIMEOUT}

Teardown Test Environment
    [Documentation]    Clean up test environment
    Close Browser

Open Ticket To Test Application
    [Documentation]    Opens the application in a new browser context
    New Browser    chromium    headless=False
    New Context    viewport={'width': 1920, 'height': 1080}
    New Page    ${BASE_URL}

Close Browser Context
    [Documentation]    Closes current browser context
    Close Context

# Page Object Keywords - Navigation
User Is On The Ticket To Test Page
    [Documentation]    Verify user is on correct page
    Get Url    ==    ${BASE_URL}
    Wait For Elements State    ${INPUT_TICKET_ID}    visible    timeout=${TIMEOUT}

# Page Object Keywords - Input Actions
User Enters Ticket Id
    [Documentation]    Enter ticket ID in the input field
    [Arguments]    ${ticket_id}
    Fill Text    ${INPUT_TICKET_ID}    ${ticket_id}

User Selects Framework
    [Documentation]    Select framework from dropdown
    [Arguments]    ${framework}
    Select Options By    ${DROPDOWN_FRAMEWORK}    value    ${framework}

User Clicks