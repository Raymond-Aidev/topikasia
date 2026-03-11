# Stage 1: Build Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Stage 2: Build Server
FROM node:20-alpine AS server-builder
RUN apk add --no-cache openssl
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/package*.json ./
COPY --from=server-builder /app/server/start.sh ./
COPY --from=client-builder /app/client/dist ./dist/public
RUN chmod +x start.sh
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "./start.sh"]
