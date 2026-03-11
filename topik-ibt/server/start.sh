#!/bin/sh
echo "=== Server Starting ==="

# IPv6 DNS 우선 (Railway 내부 네트워크 호환)
export NODE_OPTIONS="--dns-result-order=verbatim"

# 디버깅: 모든 DB 관련 환경변수 확인
echo "=== ENV DEBUG ==="
echo "DATABASE_URL length: ${#DATABASE_URL}"
echo "DATABASE_URL first 30 chars: $(echo "$DATABASE_URL" | cut -c1-30)"
echo "NODE_ENV: $NODE_ENV"
echo "All DB vars:"
env | grep -i "database\|postgres\|pg" || echo "(no DB vars found)"
echo "=== END ENV DEBUG ==="

# 1. DB 스키마 동기화 (재시도 3회, 내부 네트워크 초기화 대기)
for i in 1 2 3; do
  echo "=== Prisma db push ($i/3) ==="
  npx prisma db push && break
  echo "=== 실패, 10초 대기... ==="
  sleep 10
done

# 2. 수동 마이그레이션 + 시드 데이터
echo "=== DB 초기화 (마이그레이션 + 시딩) ==="
node prisma/init-db.js

# 3. 서버 시작
echo "=== Starting Node.js server ==="
node dist/server.js
