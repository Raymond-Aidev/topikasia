#!/bin/sh
echo "=== Server Starting ==="
echo "=== Build: $(date -r dist/server.js 2>/dev/null || echo 'unknown') ==="
echo "=== Deploy: $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="

# 1. 수동 마이그레이션 + 시드 데이터
echo "=== DB 초기화 (마이그레이션 + 시딩) ==="
node prisma/init-db.js

# 2. 서버 시작
echo "=== Starting Node.js server ==="
node dist/server.js
