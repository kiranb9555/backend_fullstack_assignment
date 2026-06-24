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

/api/contacts?page=1&limit=20
/api/contacts?tag=pricing inquiry
/api/contacts?minCallCount=2
/api/contacts?firstSeenFrom=2026-06-01T00:00:00.000Z&firstSeenTo=2026-06-30T23:59:59.999Z