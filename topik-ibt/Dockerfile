# TOPIK IBT - Single-stage build (Railway compatible)
# Cache bust: v3 - force full rebuild with client+server
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

# Build client first
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Build server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/start.sh ./
COPY --from=builder /app/client/dist ./dist/public
RUN chmod +x start.sh
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "./start.sh"]
