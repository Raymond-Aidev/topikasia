#!/bin/bash
set -e

echo "🚀 TOPIK IBT Deployment Script"
echo "Domain: www.topikasia.com"
echo "================================"

# Step 1: Build and start containers
echo "📦 Building Docker images..."
docker compose build

echo "🗄️ Starting database..."
docker compose up -d db
sleep 5

echo "📊 Running Prisma migrations..."
docker compose run --rm server npx prisma migrate deploy

echo "📊 Running manual migrations..."
for f in server/prisma/migrations/manual/*.sql; do
  echo "  Running $f..."
  docker compose exec -T db psql -U topik -d topikibt < "$f"
done

echo "🌱 Seeding database..."
docker compose run --rm server npx ts-node prisma/seed.ts

echo "🌱 Seeding registration data..."
docker compose exec -T db psql -U topik -d topikibt < server/prisma/seed-registration.sql

echo "🚀 Starting all services..."
docker compose up -d

echo ""
echo "✅ Deployment complete!"
echo "================================"
echo "Frontend: https://www.topikasia.com"
echo "API: https://www.topikasia.com/api"
echo "Health: https://www.topikasia.com/api/health"
echo ""
echo "Test accounts:"
echo "  Admin: superadmin / admin1234!"
echo "  Examinee: 100000001 / test1234"
echo "================================"
