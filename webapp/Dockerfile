# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build -- --configuration production


# ─── Stage 2: immagine finale ─────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copia i file statici compilati da Angular
COPY --from=builder /app/dist/personal-finance-webapp /usr/share/nginx/html

# Copia la configurazione Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80