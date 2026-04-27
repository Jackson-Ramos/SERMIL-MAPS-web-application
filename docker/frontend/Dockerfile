# =============================================================================
# Stage 1 — Build
# Compila o React/Vite em arquivos estáticos.
# VITE_* são build-time: mudar exige rebuild da imagem.
# =============================================================================
FROM node:20-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copia apenas os manifests primeiro para aproveitar o cache de layers
COPY package.json pnpm-lock.yaml ./

# pnpm-workspace.yaml só existe se o projeto usar workspaces
COPY pnpm-workspace.yaml* ./

RUN pnpm install --frozen-lockfile

# Copia o restante do código
COPY index.html vite.config.ts tsconfig*.json postcss.config.mjs ./
COPY public/ ./public/
COPY src/   ./src/

# Variáveis de build injetadas pelo docker-compose (--build-arg)
ARG VITE_USE_MOCK=false
ARG VITE_API_URL=/api
ARG VITE_COND_ID=1

ENV VITE_USE_MOCK=$VITE_USE_MOCK
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_COND_ID=$VITE_COND_ID

RUN pnpm build

# =============================================================================
# Stage 2 — Serve
# Nginx serve os estáticos e faz proxy de /api/* para o backend.
# =============================================================================
FROM nginx:alpine AS server

COPY --from=builder /app/dist /usr/share/nginx/html

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
