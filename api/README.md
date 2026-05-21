# personal-finance-api

NestJS backend for the Personal Finance Tracker. See the [root README](../README.md) for project overview, architecture, and setup instructions.

## Quick commands

```bash
npm install
cp .env.example .env       # then fill in JWT_SECRET and JWT_REFRESH_SECRET
npx prisma generate
npx prisma migrate dev
npm run start:dev          # http://localhost:3000

npm test                   # Jest unit tests
npm run test:e2e           # end-to-end
npm run lint               # ESLint + auto-fix
npx prisma studio          # browse the DB
```
