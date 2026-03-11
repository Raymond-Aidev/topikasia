#!/bin/sh
echo "=== Server Starting ==="

# 1. DB 스키마 동기화 (재시도 3회)
for i in 1 2 3; do
  echo "=== Prisma db push 시도 ($i/3) ==="
  npx prisma db push && break
  echo "=== 실패, 10초 대기 후 재시도... ==="
  sleep 10
done

# 2. 수동 마이그레이션 + 시드 데이터
echo "=== DB 초기화 (마이그레이션 + 시딩) ==="
node prisma/init-db.js

# 3. 서버 시작
echo "=== Starting Node.js server ==="
node dist/server.js
