backend/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   └── env.ts
│   ├── db/
│   │   └── prisma.ts
│   ├── redis/
│   │   └── redis.ts
│   ├── logger/
│   │   └── logger.ts
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── notFound.middleware.ts
│   ├── queues/
│   │   └── connection.ts
│   ├── socket/
│   │   └── socket.ts
│   └── types/
│       └── express.d.ts

# NexusDial Backend

Multi-tenant backend assignment built with:

- Node.js 20+
- TypeScript (strict mode)
- Express
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Winston
- Jest

## Features

- OTP authentication
- JWT access + refresh token flow
- Multi-tenant virtual number management
- Call simulation endpoint
- Voicemail intelligence pipeline
- Contacts API with soft delete + 30 day retention cleanup
- Analytics summary endpoint
- Integration tests

---

## 1. Setup

### Install dependencies

```bash
npm install


/api/contacts?page=1&limit=20
/api/contacts?tag=pricing inquiry
/api/contacts?minCallCount=2
/api/contacts?firstSeenFrom=2026-06-01T00:00:00.000Z&firstSeenTo=2026-06-30T23:59:59.999Z