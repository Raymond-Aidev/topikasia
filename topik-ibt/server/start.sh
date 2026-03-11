#!/bin/sh
echo "=== Server Starting ==="
echo "DATABASE_URL set: $(if [ -n "$DATABASE_URL" ]; then echo YES; else echo NO; fi)"
echo "JWT_SECRET set: $(if [ -n "$JWT_SECRET" ]; then echo YES; else echo NO; fi)"
echo "ADMIN_JWT_SECRET set: $(if [ -n "$ADMIN_JWT_SECRET" ]; then echo YES; else echo NO; fi)"

npx prisma db push
if [ $? -ne 0 ]; then
  echo "=== Prisma db push failed ==="
fi

node dist/server.js
