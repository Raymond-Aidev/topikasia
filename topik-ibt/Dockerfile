# TOPIK IBT - Combined Client + Server Build
FROM node:20-alpine AS builder
ARG RAILWAY_GIT_COMMIT_SHA
RUN apk add --no-cache openssl

# Cache bust on every commit
RUN echo "commit: ${RAILWAY_GIT_COMMIT_SHA}"

# Build client
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
