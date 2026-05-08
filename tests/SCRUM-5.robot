*** Settings ***
Library    Browser
Test Setup    Open Application
Test Teardown    Close Browser

*** Variables ***
${BASE_URL}           https://example.com
${SEARCH_TERM}        tuote
${PRODUCT_NAME}       Testituote
${PRODUCT_PRICE}      19.99
${TIMEOUT}            10s

*** Test Cases ***
Hakupalkki Näkyy Etusivulla
    [Documentation]    Varmistaa että hakupalkki näkyy etusivulla
    Open Homepage
    Search Bar Should Be Visible

Hakusanan Kirjoittaminen Ja Enter-Painallus Näyttää Relevantit Tulokset
    [Documentation]    Varmistaa että hakutulokset näkyvät hakusanan syöttämisen jälkeen
    Open Homepage
    Search For Product    ${SEARCH_TERM}
    Search Results Should Be Visible

Jokainen Hakutulos Näyttää Tuotteen Nimen Hinnan Ja Kuvan
    [Documentation]    Varmistaa että hakutuloksissa näkyy tuotetiedot
    Open Homepage
    Search For Product    ${SEARCH_TERM}
    Search Results Should Contain Product Details

Lisää Koriin Napin Painaminen Lisää Tuotteen Ostoskoriin
    [Documentation]    Varmistaa että tuote lisätään ostoskoriin
    Open Homepage
    Search For Product    ${SEARCH_TERM}
    Add First Product To Cart
    Product Should Be Added To Cart

Ostoskori-Ikoni Päivittyy Näyttämään Tuotteiden Määrän
    [Documentation]    Varmistaa että ostoskori-ikoni päivittyy
    Open Homepage
    Search For Product    ${SEARCH_TERM}
    Add First Product To Cart
    Cart Icon Should Show Item Count    1

Käyttäjä Näkee Vahvistusviestin Tuotteen Lisäämisen Jälkeen
    [Documentation]    Varmistaa että vahvistusviesti näkyy
    Open Homepage
    Search For Product    ${SEARCH_TERM}
    Add First Product To Cart
    Confirmation Message Should Be Visible

Tyhjä Hakukysely Näyttää Virheviestin
    [Documentation]    Varmistaa että tyhjä haku näyttää virheviestin
    Open Homepage
    Search For Product    ${EMPTY}
    Error Message Should Be Visible

*** Keywords ***
Open Application
    New Browser    chromium    headless=false
    New Page    ${BASE_URL}
    Set Browser Timeout    ${TIMEOUT}

Open Homepage
    Go To    ${BASE_URL}
    Wait For Load State    networkidle

Search Bar Should Be Visible
    Wait For Elements State    TODO_SEARCH_BAR_SELECTOR    visible

Search For Product
    [Arguments]    ${search_term}
    Fill Text    TODO_SEARCH_INPUT_SELECTOR    ${search_term}
    Press Keys    TODO_SEARCH_INPUT_SELECTOR    Enter
    Wait For Load State    networkidle

Search Results Should Be Visible
    Wait For Elements State    TODO_SEARCH_RESULTS_SELECTOR    visible
    Get Element Count    TODO_SEARCH_RESULT_ITEMS_SELECTOR    >    0

Search Results Should Contain Product Details
    Wait For Elements State    TODO_PRODUCT_NAME_SELECTOR    visible
    Wait For Elements State    TODO_PRODUCT_PRICE_SELECTOR    visible
    Wait For Elements State    TODO_PRODUCT_IMAGE_SELECTOR    visible

Add First Product To Cart
    Click    TODO_FIRST_ADD_TO_CART_BUTTON_SELECTOR
    Wait For Load State    networkidle

Product Should Be Added To Cart
    # TODO: Add verification that product is in cart
    Log    Product added to cart verification needed

Cart Icon Should Show Item Count
    [Arguments]    ${expected_count}
    Wait For Elements State    TODO_CART_ICON_SELECTOR    visible
    Get Text    TODO_CART_COUNT_SELECTOR    ==    ${expected_count}

Confirmation Message Should Be Visible
    Wait For Elements State    TODO_CONFIRMATION_MESSAGE_SELECTOR    visible
    Get Text    TODO_CONFIRMATION_MESSAGE_SELECTOR    contains    lisätty

Error Message Should Be Visible
    Wait For Elements State    TODO_ERROR_MESSAGE_SELECTOR    visible
    Get Text    TODO_ERROR_MESSAGE_SELECTOR    contains    virhe