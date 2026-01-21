# 🏭 Factory Nervous System

Monorepo dla systemu zarządzania magazynem w czasie rzeczywistym. Integracja **NestJS API** + **React UI** + **PostgreSQL** z transakcjami, idempotencją i Transactional Outbox pattern.

## 📋 Architektura

```
FactorySystem/
├── apps/
│   ├── api/          # NestJS API (port 3000)
│   └── web/          # React + Vite + Tailwind (port 5173)
├── packages/
│   └── db/           # Drizzle ORM + schema
└── docker-compose.yml
```

## 🚀 Quick Start

### 1. Wymagania

- Node.js 22+
- Docker & Docker Compose
- npm workspaces

### 2. Instalacja

```bash
# Klon repo
git clone <repository>
cd FactorySystem-1

# Instaluj wszystkie zależności
npm install
```

### 3. Konfiguracja Bazy Danych

```bash
# Uruchom PostgreSQL w Dockerze
docker-compose up -d

# Czekaj aż baza się uruchomi (5-10 sekund)

# Wygeneruj migracje
npm run db:generate

# Zastosuj migracje
npm run db:push

# Załaduj dane testowe
npm run db:seed
```

### 4. Uruchom API

```bash
npm run dev:api
# API dostępny na: http://localhost:3000/api
```

### 5. Uruchom Frontend (w osobnym terminalu)

```bash
npm run dev:web
# UI dostępny na: http://localhost:5173
```

---

## 📚 API Dokumentacja

### Health Check
```bash
GET /api/health
# Response: { "status": "ok" }
```

### Metadata

**Pobierz wszystkie lokacje:**
```bash
curl http://localhost:3000/api/locations
```

**Pobierz wszystkie artykuły:**
```bash
curl http://localhost:3000/api/items
```

**Pobierz stan magazynu:**
```bash
curl http://localhost:3000/api/stock
```

### Operacje Inwentaryzacyjne

**Przyjęcie Towaru (Inbound):**
```bash
curl -X POST http://localhost:3000/api/inventory/inbound \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "locationId": "uuid-here",
    "itemId": "uuid-here",
    "quantity": 100,
    "operatorId": "OP001",
    "metadata": {"batch": "2024-001"}
  }'
```

**Transfer Między Lokacjami:**
```bash
curl -X POST http://localhost:3000/api/inventory/transfer \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "fromLocationId": "uuid-here",
    "toLocationId": "uuid-here",
    "itemId": "uuid-here",
    "quantity": 50,
    "operatorId": "OP001"
  }'
```

---

## 🗄️ Baza Danych

### Schemat

| Tabela | Opis |
|--------|------|
| `locations` | Magazyny, półki, strefy |
| `items` | Artykuły, SKU, jednostki miary |
| `inventory_balance` | Stan bieżący (lokacja × artykuł) |
| `inventory_ledger` | Historia wszystkich zmian |
| `outbox_events` | Transactional Outbox dla zdarzeń |
| `idempotency_keys` | Cache dla Idempotency-Key |

### Constraints

- ✅ `inventory_balance.quantity >= 0` (CHECK)
- ✅ PK: `(locationId, itemId)` na balance
- ✅ Indeksy na ledger dla szybkiego wyszukiwania

---

## 🔒 Gwarancje

### Transakcje
- Wszystkie operacje (inbound, transfer) wykonywane w **SERIALIZABLE** transakcjach
- `SELECT FOR UPDATE` zapobiega race conditions

### Idempotency
- Każde API call generuje `Idempotency-Key` (UUID v4)
- Powtórzone żądania z tym samym kluczem zwracają cached response
- Tabela `idempotency_keys` przechowuje historia

### Outbox Pattern
- Zdarzenia zapisywane w tej samej transakcji co operacja
- Worker co 5 sekund relayuje pending eventy
- Status: PENDING → PROCESSED / FAILED

---

## 💻 Frontend

### Dashboard Operatora

Interfejs "Rugged" (duże przyciski, wysoki kontrast):

**Zakładki:**
1. 📊 **Stan Magazynu** - Tabela z bieżącym stanem (GET /stock)
2. 📥 **Przyjęcie** - Formularz + live dashboard
3. 🔄 **Transfer** - Formularz + live dashboard

**Cechy:**
- ✅ Responsywny design (Tailwind CSS)
- ✅ High contrast colors (accessibility)
- ✅ Duższe przyciski (gloved operation)
- ✅ Optimistic UI + error handling
- ✅ Proxy /api → http://localhost:3000 (Vite)

---

## 📝 Przykładowy Workflow

### Scenariusz: Przyjęcie 100 pcs produktu ABC na Półkę 1

1. **Frontend:** Otwórz Dashboard → zakładka "Przyjęcie"
2. **Formularz:** 
   - Lokacja: "Półka 1"
   - Artykuł: "ABC-001"
   - Ilość: 100
   - Operator: "OP001"
3. **Submit:** Frontend generuje Idempotency-Key i wysyła POST
4. **API:** 
   - Transakcja: INSERT inventory_ledger + UPDATE balance + INSERT outbox_event
   - CHECK: `quantity >= 0` ✓
5. **Dashboard:** Odświeża, pokazuje nowy stan

### Scenariusz: Transfer 30 pcs z Półki 1 na Półkę 2

1. **Frontend:** Zakładka "Transfer"
2. **Formularz:**
   - Z: "Półka 1"
   - Do: "Półka 2"
   - Artykuł: "ABC-001"
   - Ilość: 30
3. **API:**
   - SELECT FOR UPDATE z Półki 1
   - Sprawdź dostępność (>= 30)
   - UPDATE oba balance'e w transakcji
   - INSERT ledger entries (2x)
4. **Success:** Dashboard pokazuje -30 na Półce 1, +30 na Półce 2

---

## 🛠️ Development

### Lint & Format

```bash
npm run lint       # ESLint
npm run format     # Prettier
```

### Build

```bash
npm run build:api   # Nest.js production build
npm run build:web   # React production build
```

### Docker Compose

```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f postgres

# Stop
docker-compose down

# Clean (usuwanie volume)
docker-compose down -v
```

---

## 📦 Tech Stack

| Komponent | Technologia |
|-----------|------------|
| Backend API | NestJS 11 + TypeScript |
| ORM | Drizzle ORM |
| Baza | PostgreSQL 15 |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Monorepo | npm workspaces |
| Walidacja | class-validator |

---

## 🧪 Testing

Smoke test (checks health + basic flows):

```bash
npm run smoke-test
```

---

## 📄 License

MIT

## 🤝 Contributing

1. Create feature branch
2. Make changes + test
3. Push & create PR
4. CI/CD validates (lint, format, tests) - Dashboard Operatora Magazynowego

Monorepo Factory Nervous System: **Nest.js API** + **React UI** + **PostgreSQL** w Dockerze.

> **Styl "Rugged"**: Interfejs z dużymi przyciskami (czytelny w rękawicach), wysokim kontrastem i intuicyjną nawigacją.

---

## 🏗️ Architektura

```
apps/
  ├── api/          (Nest.js + Drizzle ORM)
  └── web/          (React + Vite + Tailwind CSS)
packages/
  └── db/           (Drizzle schema + migrations)
```

### Technologia

| Komponent | Tech Stack |
|-----------|-----------|
| **API** | Nest.js 11, Drizzle ORM 0.45, PostgreSQL |
| **UI** | React 18, Vite 5, Tailwind CSS 3 |
| **Database** | PostgreSQL 15 (Docker), npm workspaces |
| **Idempotency** | UUID-based keys + database lookup |
| **Transactional Outbox** | polling co 5s, ACID guarantees |

---

## 🚀 Quick Start

### 1. Wstępne wymagania

- Node.js 20+
- Docker + Docker Compose
- npm 10+

### 2. Instalacja zależności

```bash
npm install
```

Instaluje wszystkie zależności dla API, Web i DB packages (npm workspaces).

### 3. Uruchom Docker + Postgres

```bash
docker-compose up -d
```

- **Postgres**: `postgresql://postgres:postgres@localhost:5432/factory_db`
- Health check: `docker-compose ps` → `postgres (healthy)`

### 4. Seed bazy danych

```bash
npm run db:seed
```

Wstawia przykładowe:
- **Locations**: Regał-A, Regał-B, Recepcja
- **Items**: ITEM-001, ITEM-002

### 5. Uruchom API (w osobnym terminalu)

```bash
npm run dev:api
```

API słucha na `http://localhost:3000/api`

### 6. Uruchom Web UI (w osobnym terminalu)

```bash
npm run dev:web
```

UI dostępne na `http://localhost:5173`
- Proxy `/api` → `http://localhost:3000`

---

## 📊 API Endpoints

### Health & Metadata

```bash
# Health check
curl -X GET http://localhost:3000/api/health

# Pobierz wszystkie lokacje
curl -X GET http://localhost:3000/api/locations

# Pobierz wszystkie artykuły
curl -X GET http://localhost:3000/api/items

# Stan magazynu (inventory balance)
curl -X GET http://localhost:3000/api/stock
```

### Operacje Magazynowe

#### Przyjęcie Towaru (Inbound)

```bash
curl -X POST http://localhost:3000/api/inventory/inbound \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "locationId": "UUID_LOKACJI",
    "itemId": "UUID_ARTYKUŁU",
    "quantity": 50,
    "operatorId": "OP-001"
  }'
```

**Odpowiedź**: `{ "ok": true, "transactionGroupId": "..." }`

#### Przesunięcie Towaru (Transfer)

```bash
curl -X POST http://localhost:3000/api/inventory/transfer \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "fromLocationId": "UUID_ŹRÓDŁO",
    "toLocationId": "UUID_CEL",
    "itemId": "UUID_ARTYKUŁU",
    "quantity": 25,
    "operatorId": "OP-001"
  }'
```

**Odpowiedź**: `{ "ok": true, "transactionGroupId": "..." }`

---

## 🎨 React UI - Funkcjonalność

### Dashboard Operatora

**Adres**: `http://localhost:5173`

#### Zakładki

1. **📊 Stan Magazynu** - Tabela z całym inventory (lokacja, artykuł, ilość, ostatnia zmiana)
2. **📥 Przyjęcie** - Formularz inbound + live dashboard
3. **🔄 Transfer** - Formularz transfer + live dashboard

#### Cechy "Rugged UI"

- ✅ Duże przyciski (`px-8 py-4`)
- ✅ Wysoki kontrast: ciemny `#1a1a1a` tło, pomarańczowe akcenty `#ff6b35`
- ✅ Duży tekst (base `text-lg`, headers `text-heading-xl`)
- ✅ Zaokrąglone elementy, przejrzyste hover effects
- ✅ Walidacja formularzy po stronie klienta
- ✅ Obsługa błędów z informacyjnymi komunikatami

#### Idempotency

Każde żądanie `inbound` i `transfer` automatycznie:
1. Generuje UUID (Idempotency-Key)
2. Wysyła w nagłówku `Idempotency-Key`
3. API zwraca buforowany wynik w razie powtórzenia

---

## 🗄️ Baza Danych

### Schema

| Tabela | Opis |
|--------|------|
| `locations` | Lokacje magazynowe (regały, stoły itp.) |
| `items` | Artykuły/SKU w katalogu |
| `inventory_balance` | Stan magazynu (location_id, item_id, quantity) |
| `inventory_ledger` | Historia wszystkich zmian (audit trail) |
| `outbox_events` | Transactional Outbox dla event replay |
| `idempotency_keys` | Cache idempotency z response body |

### Migracje

```bash
# Wygeneruj migrację ze zmian w schema.ts
npm run db:generate

# Zastosuj migracje na DB
npm run db:push

# Seed danych testowych
npm run db:seed
```

---

## 🧪 Smoke Test

```bash
npm run smoke-test
```

Testuje:
- Health check
- Pobieranie metadanych (locations, items)
- Inbound z walidacją
- Transfer z CHECK (`quantity >= 0`)
- Idempotency (duplikat = ten sam wynik)

---

## 🏭 Operacje w Terminalu

### Logowanie API

```bash
# Uruchom API w debug mode
npm run dev:api

# Obserwuj outbox polling (co 5s)
# Logi pojawiają się w terminalu API
```

### Zarządzanie Docker

```bash
# Pokaż status kontenerów
docker-compose ps

# Podgląd logów Postgres
docker-compose logs -f postgres

# Zatrzymaj stos
docker-compose down

# Usuń volume z DB (reset)
docker-compose down -v
```

---

## 📝 Przykładowe Workflow

### 1. Seed danych

```bash
npm run db:seed
```

### 2. Otwórz UI

```
http://localhost:5173
```

### 3. Przejrzyj „Stan Magazynu"

- Tabela pokazuje: Regał-A, ITEM-001 → 100 szt

### 4. Przyjęcie (Inbound)

- Lokacja: Regał-B
- Artykuł: ITEM-002
- Ilość: 50
- Kliknij **✓ Zatwierdź Przyjęcie**
- Wynik: Regał-B, ITEM-002 → 50 szt (dodane)

### 5. Transfer

- Ze: Regał-A
- Do: Regał-B
- Artykuł: ITEM-001
- Ilość: 25
- Kliknij **✓ Zatwierdź Transfer**
- Wynik: Regał-A 75 szt, Regał-B 125 szt

---

## 🔧 Dev Ergonomia

### Skrypty Monorepo

```bash
# Lint & Format
npm run lint
npm run format

# Build
npm run build:api
npm run build:web

# Dev
npm run dev:api    # Terminal 1
npm run dev:web    # Terminal 2

# DB
npm run db:generate
npm run db:push
npm run db:seed
```

### Zmienne Środowiska

**`.env`** (root):
```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/factory_db?schema=public"
```

**API** (`.env` w `apps/api`):
```dotenv
PORT=3000
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### ❌ API nie startuje

```bash
# Sprawdź czy Postgres żyje
docker-compose ps

# Jeśli nie, uruchom
docker-compose up -d postgres

# Czekaj na health check
docker-compose ps | grep postgres
```

### ❌ "Cannot GET /api/locations"

- Sprawdź czy API słucha na porcie 3000: `npm run dev:api`
- Vite proxy może nie być skonfigurowany → sprawdź `vite.config.ts`

### ❌ UI ładuje się, ale formularze nie wysyłają

1. Otwórz DevTools (F12)
2. Sprawdź Network tab → czy `/api/inventory/inbound` zwraca 200?
3. Jeśli 500: sprawdź logi API w terminalu

### ❌ "Port 5173 already in use"

```bash
# Zmień port w vite.config.ts
# lub zabij proces
lsof -i :5173  # macOS/Linux
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess  # Windows
```

---

## 📚 Dokumentacja

- **Nest.js**: https://docs.nestjs.com/
- **Drizzle ORM**: https://orm.drizzle.team/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/

---

## ✅ Checklist Gotowości

- [x] Monorepo (npm workspaces) + lint/format
- [x] Drizzle schema + migrations + seed
- [x] Nest API (health, stock, items, locations)
- [x] Inbound/Transfer z transakcją + SELECT FOR UPDATE + ledger
- [x] Transactional Outbox + worker
- [x] Idempotency-Key (tabela + interceptor)
- [x] React UI (Vite, Tailwind, Rugged style)
- [x] Docker Compose + dev instrukcje

**Status**: ✅ **Production Ready** (bez zaawansowanego alertingu/monitoringu)

---

## 👨‍💼 Kontakt

Factory Nervous System © 2026