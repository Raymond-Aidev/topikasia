#!/bin/sh
echo "=== Server Starting ==="

npx prisma db push
if [ $? -ne 0 ]; then
  echo "=== Prisma db push failed, continuing... ==="
fi

node dist/server.js
