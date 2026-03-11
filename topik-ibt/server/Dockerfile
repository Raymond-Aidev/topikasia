# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate --config prisma.config.ts
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["sh", "-c", "echo \"DB_URL starts with: $(echo $DATABASE_URL | cut -c1-20)...\" && echo \"All env vars with DB: $(env | grep -i database)\" && npx prisma db push --config prisma.config.ts --url \"$DATABASE_URL\" && node dist/server.js"]
