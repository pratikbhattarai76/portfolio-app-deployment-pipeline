FROM node:24.14.0-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:24.14.0-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24.14.0-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

LABEL org.opencontainers.image.source="https://github.com/pratikbhattarai76/portfolio-app-deployment-pipeline"

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=builder /app/dist ./dist

EXPOSE 4321
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "const http = require('node:http'); const req = http.get({ host: '127.0.0.1', port: Number(process.env.PORT || 4321), path: '/api/health', timeout: 4000 }, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.on('timeout', () => { req.destroy(); process.exit(1); });"]

CMD ["node", "./dist/server/entry.mjs"]
