#!/bin/sh
echo "=== Server Starting ==="

# 1. 수동 마이그레이션 + 시드 데이터
echo "=== DB 초기화 (마이그레이션 + 시딩) ==="
node prisma/init-db.js

# 2. 서버 시작
echo "=== Starting Node.js server ==="
node dist/server.js
