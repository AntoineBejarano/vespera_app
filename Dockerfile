FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --legacy-peer-deps

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
# Public Hexclave IDs must exist at build time (Docker does not inherit Railway runtime env).
ARG NEXT_PUBLIC_HEXCLAVE_API_URL=https://api.stack-auth.com
ARG NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=1c800406-1c97-4bb5-984e-926a4aae6505
ARG HEXCLAVE_SECRET_SERVER_KEY=
ENV NEXT_PUBLIC_HEXCLAVE_API_URL=$NEXT_PUBLIC_HEXCLAVE_API_URL
ENV NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=$NEXT_PUBLIC_HEXCLAVE_PROJECT_ID
ENV HEXCLAVE_PROJECT_ID=$NEXT_PUBLIC_HEXCLAVE_PROJECT_ID
ENV HEXCLAVE_SECRET_SERVER_KEY=$HEXCLAVE_SECRET_SERVER_KEY
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts/start.sh ./scripts/start.sh

RUN chmod +x ./scripts/start.sh

EXPOSE 3000
CMD ["./scripts/start.sh"]
