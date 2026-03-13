#!/bin/sh
echo "=== Server Starting ==="

# 1. Prisma 클라이언트 생성 (스키마 변경 시 필요)
echo "=== Prisma generate ==="
npx prisma generate

# 2. 수동 마이그레이션 + 시드 데이터
echo "=== DB 초기화 (마이그레이션 + 시딩) ==="
node prisma/init-db.js

# 3. 서버 시작
echo "=== Starting Node.js server ==="
node dist/server.js
