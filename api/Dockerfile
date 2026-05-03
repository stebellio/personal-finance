# api/Dockerfile

# ─── Stage 1: dipendenze di produzione ───────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# ─── Stage 2: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copia i package file e installa TUTTE le dipendenze (incluse devDeps)
COPY package*.json ./
RUN npm ci

# Copia il resto dei sorgenti
COPY . .

# Genera il client Prisma per l'architettura corrente (ARM64 in produzione)
RUN npx prisma generate

# Compila TypeScript
RUN npm run build


# ─── Stage 3: immagine finale ─────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
COPY package*.json ./

RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]