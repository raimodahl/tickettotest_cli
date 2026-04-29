# TicketToTest CLI

CLI-työkalu testikoodin generointiin TicketToTest-palvelusta.

## Asennus

```bash
npm install -g tickettotest-cli
```

## Käyttö

### Generoi testit ticket ID:n perusteella

```bash
ttt generate --ticket-id <TICKET_ID> --framework robot
```

### Generoi testit kuvauksen perusteella

```bash
ttt generate --description "Käyttäjä voi kirjautua sisään" --framework playwright --language typescript
```

## Flagit

| Flag | Lyhenne | Kuvaus | Oletus |
|------|---------|--------|--------|
| `--ticket-id` | `-t` | Ticket ID | - |
| `--description` | `-d` | Kuvaus tekstinä | - |
| `--language` | `-l` | Ohjelmointikieli | `typescript` |
| `--framework` | `-f` | Testausframework | `playwright` |
| `--output` | `-o` | Tulostepolku | auto |
| `--url` | `-u` | API URL | `https://api.tickettotest.com` |
| `--api-key` | `-k` | API-avain | ympäristömuuttujasta |

## Framework-valinnat

- `playwright` - Playwright testit (TypeScript/JavaScript)
- `robot` - Robot Framework testit (.robot)

## Esimerkit

### Robot Framework testi

```bash
ttt generate \
  --description "Käyttäjä kirjautuu sisään onnistuneesti" \
  --framework robot \
  --language python \
  --output ./tests/login.robot
```

### Playwright testi

```bash
ttt generate \
  --ticket-id abc123 \
  --framework playwright \
  --language typescript \
  --output ./tests/login.spec.ts
```

## Kehitys

```bash
# Käännä TypeScript
npm run build

# Aja CLI
npm start
```

## Lisenssi

MIT
