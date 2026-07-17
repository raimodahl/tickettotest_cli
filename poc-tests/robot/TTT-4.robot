*** Settings ***
Documentation     TTT-4: Käyttäjä voi tarkistaa generointikiintiön
Library           Browser
Library           Process
Library           OperatingSystem
Library           String

*** Variables ***
${COMMAND}                npx tickettotest quota
${VALID_API_KEY}         valid-test-key-12345
${INVALID_API_KEY}       invalid-key-xyz
${EXPIRED_API_KEY}       expired-key-abc
${STARTER_LICENSE}       Starter
${PRO_LICENSE}           Pro
${TEAM_LICENSE}          Team
${TOTAL_QUOTA}           100
${USED_GENERATIONS}      5
${REMAINING_GENERATIONS}    95

*** Test Cases ***
Käyttäjä Ajaa Quota Komennon
    [Documentation]    Käyttäjä ajaa: npx tickettotest quota
    [Tags]    TTT-4    quota    command
    Given user has valid api key configured
    When user runs quota command
    Then command executes successfully
    And output is displayed to user

Työkalu Näyttää Lisenssiavaimen Tyypin
    [Documentation]    Työkalu näyttää lisenssiavaimen tyypin (Starter/Pro/Team)
    [Tags]    TTT-4    quota    license-type
    Given user has valid api key configured
    When user runs quota command
    Then license type should be displayed
    And license type should be one of valid types

Työkalu Näyttää Kokonaiskiintiön
    [Documentation]    Työkalu näyttää kokonaiskiintiön (esim. 100)
    [Tags]    TTT-4    quota    total-quota
    Given user has valid api key configured
    When user runs quota command
    Then total quota should be displayed
    And total quota should be numeric value

Työkalu Näyttää Käytetyt Generoinnit
    [Documentation]    Työkalu näyttää käytetyt generoinnit (esim. 5)
    [Tags]    TTT-4    quota    used-generations
    Given user has valid api key configured
    When user runs quota command
    Then used generations should be displayed
    And used generations should be numeric value

Työkalu Näyttää Jäljellä Olevat Generoinnit
    [Documentation]    Työkalu näyttää jäljellä olevat generoinnit (esim. 95)
    [Tags]    TTT-4    quota    remaining-generations
    Given user has valid api key configured
    When user runs quota command
    Then remaining generations should be displayed
    And remaining generations should be numeric value
    And remaining should equal total minus used

Virheellinen Avain Näyttää Selkeän Virheen
    [Documentation]    Virheellinen tai vanhentunut avain näyttää selkeän virheen
    [Tags]    TTT-4    quota    error-handling    invalid-key
    Given user has invalid api key configured
    When user runs quota command
    Then command should return error
    And error message should be clear and informative

Vanhentunut Avain Näyttää Selkeän Virheen
    [Documentation]    Vanhentunut avain näyttää selkeän virheen
    [Tags]    TTT-4    quota    error-handling    expired-key
    Given user has expired api key configured
    When user runs quota command
    Then command should return error
    And error message should indicate expired key

Komento Toimii Offline-tilassa Kun Tiedot Välimuistissa
    [Documentation]    Komento toimii ilman internet-yhteyttä jos tiedot on välimuistissa
    [Tags]    TTT-4    quota    offline    cache
    Given user has valid api key configured
    And quota data is cached locally
    When user disconnects from internet
    And user runs quota command
    Then command executes successfully from cache
    And cached quota information is displayed

*** Keywords ***
User Has Valid Api Key Configured
    [Documentation]    Configure valid API key for testing
    # TODO: Set environment variable or config file with valid API key
    Set Environment Variable    TICKETTOTEST_API_KEY    ${VALID_API_KEY}
    ${result}=    Run Process    echo    $TICKETTOTEST_API_KEY    shell=True
    Should Not Be Empty    ${result.stdout}

User Has Invalid Api Key Configured
    [Documentation]    Configure invalid API key for testing
    # TODO: Set environment variable or config file with invalid API key
    Set Environment Variable    TICKETTOTEST_API_KEY    ${INVALID_API_KEY}

User Has Expired Api Key Configured
    [Documentation]    Configure expired API key for testing
    # TODO: Set environment variable or config file with expired API key
    Set Environment Variable    TICKETTOTEST_API_KEY    ${EXPIRED_API_KEY}

User Runs Quota Command
    [Documentation]    Execute the quota command
    # TODO: Run the actual command and capture output
    ${result}=    Run Process    ${COMMAND}    shell=True    timeout=30s
    Set Suite Variable    ${COMMAND_RESULT}    ${result}
    Log    ${result.stdout}
    Log    ${result.stderr}

Command Executes Successfully
    [Documentation]    Verify command executed without errors
    Should Be Equal As Integers    ${COMMAND_RESULT.rc}    0
    Should Not Be Empty    ${COMMAND_RESULT.stdout}

Output Is Displayed To User
    [Documentation]    Verify output is shown to user
    Should Not Be Empty    ${COMMAND_RESULT.stdout}
    # TODO: Verify output format and content

License Type Should Be Displayed
    [Documentation]    Verify license type is shown in output
    # TODO: Parse output and verify license type field exists
    ${output}=    Convert To String    ${COMMAND_RESULT.stdout}
    Should Contain Any    ${output}    License    license    Lisenssi    lisenssi

License Type Should Be One Of Valid Types
    [Documentation]    Verify license type matches valid values
    # TODO: Extract license type from output and validate
    ${output}=    Convert To String    ${COMMAND_RESULT.stdout}
    Should Contain Any    ${output}    ${STARTER_LICENSE}    ${PRO_LICENSE}    ${TEAM_LICENSE}

Total Quota Should Be Displayed
    [Documentation]    Verify total quota is shown in output
    # TODO: Parse output and verify total quota field exists
    ${output}=    Convert To String    ${COMMAND_RESULT.stdout}
    Should Contain Any    ${output}    Total    total    Kokonais    kokonais    quota

Total Quota Should Be Numeric Value
    [Documentation]    Verify total quota is a valid number
    # TODO: Extract total quota value and verify it's numeric
    ${output}=    Convert To String    ${COMMAND_RESULT.stdout}
    Should Match Regexp    ${output}    \\d+

Used Generations Should Be Displayed
    [Documentation]    Verify used generations count is shown
    # TODO: Parse output and verify used generations field exists
    ${output}=    Convert To String    ${COMMAND_RESULT.stdout}
    Should Contain Any    ${output}    Used    used    Käytetty    käytetty

Used Generations Should Be Numeric Value
    [Documentation]    Verify used generations is a valid number
    # TODO: Extract used generations value and verify it's numeric
    ${output}=    Convert To String    ${COMMAND_RESULT.stdout}
    Should Match Regexp    ${output}    \\d+

Remaining Generations Should Be Displayed
    [Documentation]    Verify remaining generations count is shown
    # TODO: Parse output and verify remaining generations field exists
    ${output}=    Convert To String    ${COMMAND_RESULT.stdout}
    Should Contain Any    ${output}    Remaining    remaining    Jäljellä    jäljellä

Remaining Generations Should Be Numeric Value
    [Documentation]    Verify remaining generations is a valid number
    # TODO: Extract remaining generations value and verify it's numeric
    ${output}=    Convert To String    ${COMMAND_RESULT.stdout}
    Should Match Regexp