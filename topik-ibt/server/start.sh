#!/bin/sh
echo "=== Server Starting ==="

# 내부 네트워크 초기화 대기 후 DB push 시도 (최대 3회)
for i in 1 2 3; do
  echo "=== Prisma db push 시도 ($i/3) ==="
  npx prisma db push && break
  echo "=== 실패, 10초 대기 후 재시도... ==="
  sleep 10
done

node dist/server.js
