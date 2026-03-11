#!/bin/sh
echo "=== Server Starting ==="
echo "DATABASE_URL set: $(if [ -n "$DATABASE_URL" ]; then echo YES; else echo NO; fi)"
echo "DATABASE_URL scheme: $(echo "$DATABASE_URL" | cut -c1-15)"
echo "JWT_SECRET set: $(if [ -n "$JWT_SECRET" ]; then echo YES; else echo NO; fi)"
echo "ADMIN_JWT_SECRET set: $(if [ -n "$ADMIN_JWT_SECRET" ]; then echo YES; else echo NO; fi)"

npx prisma db push --config prisma.config.ts --url "$DATABASE_URL"
if [ $? -ne 0 ]; then
  echo "=== Prisma db push failed, trying without --url flag ==="
  npx prisma db push --config prisma.config.ts
fi

node dist/server.js
