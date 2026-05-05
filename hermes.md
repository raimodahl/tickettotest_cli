# TicketToTest — CLI

## Projekti
npm-paketti (tickettotest) joka tarjoaa testaajille CLI-työkalun
Jira-tikettien muuttamiseen testiskeltoneihin.

## Repositorio
- Lokaali: /Users/bot/tickettotest-workspace/tickettotest_cli
- GitHub: github.com/raimodahl/tickettotest_cli
- npm: tickettotest@0.1.0

## Tech stack
- Node.js v20+, TypeScript
- Commander.js (CLI-rakenne)
- Chalk (värit), Ora (spinner)
- Config: ~/.tickettotest/config.json

## Komennot
- npx tickettotest init       — konfigurointi (lisenssi + Jira)
- npx tickettotest generate   — tiketti → testi
- npx tickettotest quota      — kiintiön tarkistus

## Generate-komento optiot
- --output <dir>    — hakemisto (oletus: ./tests)
- --dry-run         — tulosta ilman tallennusta
- --framework       — playwright | robot | cypress | selenium (tulossa)

## Tiedostorakenne
src/
  index.ts          — CLI entry point
  config.ts         — ~/.tickettotest/config.json hallinta
  commands/
    generate.ts     — Jira fetch + API call + tiedoston tallennus
    init.ts         — konfiguroinnin setup
    quota.ts        — kiintiön tarkistus

## Backend API
- POST https://api.tickettotest.com/generate
- Header: x-license-key
- Body: { ticket_id, title, description, framework? }
- Response: { success, ticket_id, filename, code, quota_remaining }

## KRIITTISTÄ
- fetch vaatii Node.js v18+ — varmista versio ennen testaamista
- nvm latautuu .zshrc:stä — ei .bashrc:stä
- Julkaisu npm:ään vaatii: npm set //registry.npmjs.org/:_authToken TOKEN

## Parhaillaan työn alla
- --framework robot optio generate-komentoon
- Tallenna oikea tiedostopääte: .robot vs .spec.ts
- Näytä oikea ajo-ohje frameworkin mukaan

## Seuraavana
- --framework cypress, selenium, gatling
- CI/CD integraatio: --with-ci optio

## Kanban-kortit
rf-support, cypress, cicd, selenium, gatling
