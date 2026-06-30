# NexusDial Backend

Multi-tenant backend assignment built with Node.js + TypeScript, Express, PostgreSQL (Prisma), Redis (BullMQ), and Socket.io.

## Requirements

- Node.js **20+**
- Docker Desktop (for Postgres + Redis via compose)

## Quick start (recommended)

Start infrastructure:

```bash
docker compose up -d
```

Install deps:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set secrets + AI provider keys (see below).

Run DB migrations + generate Prisma client:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Start dev server (API + workers + socket):

```bash
npm run dev
```

Server starts on `http://localhost:4000` (default).

## Docker Compose (Postgres + Redis)

This repo includes a `docker-compose.yml` with:

- **Postgres**: `localhost:5432` (db `nexusdial`, user `admin`, pass `admin123`)
- **Redis**: `localhost:6379`

Commands:

```bash
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```

## Environment variables

All secrets must be in `.env` (and `.env` is gitignored). Start from `.env.example`.

Required:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `AI_PROVIDER` (`gemini` or `openai`)

For AI extraction (voicemail intelligence Step 2):

- If `AI_PROVIDER=gemini` set `GEMINI_API_KEY`
- If `AI_PROVIDER=openai` set `OPENAI_API_KEY`

Example `.env`:

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://admin:admin123@localhost:5432/nexusdial
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=super-access-secret-change-me
JWT_REFRESH_SECRET=super-refresh-secret-change-me

AI_PROVIDER=gemini
GEMINI_API_KEY=
OPENAI_API_KEY=
```

## Running tests

```bash
npm test
```

## Socket.io

Socket server is initialized in `src/server.ts`.

- Tenants join room: `tenant:<tenantId>`
- Events emitted by backend:
  - `call_event` → payload `{ event: "call_event", data: CallRecord }`
  - `intelligence_ready` → payload `{ event: "intelligence_ready", data: enrichedCallRecord }`

## API reference (for testing)

Base URL: `http://localhost:4000`

### Auth (`/api/auth`)

- **POST** `/api/auth/send-otp` (rate limited: 3 / 10min / mobile)

Request body:

```json
{ "mobile": "+919676223174" }
```

Notes:
- OTP is generated and logged server-side for this assignment.
- Mobile must match `+` optional, 10–15 digits.

- **POST** `/api/auth/verify-otp`

```json
{ "mobile": "+919676223174", "otp": "123456" }
```

- **POST** `/api/auth/refresh`

```json
{ "refreshToken": "<refreshToken>" }
```

- **POST** `/api/auth/logout`

```json
{ "refreshToken": "<refreshToken>" }
```

### Numbers (`/api/numbers`) (auth required, tenant rate limited: 200 / 15min / tenant)

- **GET** `/api/numbers`
- **GET** `/api/numbers/:id`
- **POST** `/api/numbers`

```json
{ "label": "Main Line" }
```

- **PATCH** `/api/numbers/:id`

```json
{ "label": "Sales Line", "isActive": true }
```

### Simulate calls (`/api/simulate`) (auth required, tenant rate limited)

- **POST** `/api/simulate/call`

```json
{
  "virtualNumberId": "<virtualNumberId>",
  "callerMobile": "+919876543210",
  "direction": "INBOUND",
  "durationSec": 120,
  "hasVoicemail": true
}
```

Behavior:
- Creates a `CallRecord` with `status=ANSWERED` (or `MISSED` if `durationSec=0`)
- If `hasVoicemail=true`, enqueues BullMQ voicemail processing job
- Emits Socket.io `call_event` to `tenant:<tenantId>`

### Contacts (`/api/contacts`) (auth required, tenant rate limited)

- **GET** `/api/contacts`
  - Query params supported:
    - `page`, `limit`
    - `tag`
    - `minCallCount`
    - `firstSeenFrom` / `firstSeenTo` (ISO datetime)

Examples:



- **GET** `/api/contacts/:id`
- **GET** `/api/contacts/:id/timeline`
- **PATCH** `/api/contacts/:id`

```json
{ "name": "Ramesh", "addTags": ["vip"], "removeTags": ["old-tag"] }
```

- **DELETE** `/api/contacts/:id` (soft delete)

### Analytics (`/api/analytics`) (auth required, tenant rate limited)

- **GET** `/api/analytics/summary`

## End-to-end test flow (manual)

1) Send OTP:

```bash
curl -s -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"mobile\":\"+919676223174\"}"
```

2) Verify OTP (check server logs for OTP) to get `accessToken`.

3) Create a virtual number:

```bash
curl -s -X POST http://localhost:4000/api/numbers \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d "{\"label\":\"Main Line\"}"
```

4) Simulate a call with voicemail:

```bash
curl -s -X POST http://localhost:4000/api/simulate/call \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d "{\"virtualNumberId\":\"<virtualNumberId>\",\"callerMobile\":\"+919876543210\",\"direction\":\"INBOUND\",\"durationSec\":120,\"hasVoicemail\":true}"
```

5) Observe:
- `CallRecord` created
- `IntelligenceJob` created and processed by worker
- Socket events: `call_event`, then `intelligence_ready`
- Inspect DB with Prisma Studio:

```bash
npm run prisma:studio
```

## Dockerfile

`Dockerfile` is included for container builds (production `npm start` runs compiled `dist/server.js`).