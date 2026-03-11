#!/bin/sh
echo "=== Server Starting ==="

# IPv6 DNS 우선 (Railway 내부 네트워크 호환)
export NODE_OPTIONS="--dns-result-order=verbatim"

# 디버깅: 네트워크 + 환경변수 확인
echo "=== ENV DEBUG ==="
echo "DATABASE_URL first 30: $(echo "$DATABASE_URL" | cut -c1-30)"
echo "=== NETWORK DEBUG ==="
echo "DNS lookup postgres.railway.internal:"
nslookup postgres.railway.internal 2>&1 || echo "nslookup failed"
echo "---"
echo "getent hosts:"
getent hosts postgres.railway.internal 2>&1 || echo "getent failed"
echo "---"
echo "Trying TCP connect to postgres.railway.internal:5432:"
timeout 5 sh -c 'cat < /dev/tcp/postgres.railway.internal/5432' 2>&1 && echo "TCP OK" || echo "TCP FAILED"
echo "---"
echo "Trying TCP connect to RAILWAY_PRIVATE_DOMAIN:"
echo "RAILWAY_PRIVATE_DOMAIN=$RAILWAY_PRIVATE_DOMAIN"
echo "=== END NETWORK DEBUG ==="

# 1. DB 스키마 동기화 (재시도 5회, 내부 네트워크 초기화 대기)
for i in 1 2 3 4 5; do
  echo "=== Prisma db push 시도 ($i/5) ==="
  npx prisma db push && break
  echo "=== 실패, 15초 대기 후 재시도... ==="
  sleep 15
done

# 2. 수동 마이그레이션 + 시드 데이터
echo "=== DB 초기화 (마이그레이션 + 시딩) ==="
node prisma/init-db.js

# 3. 서버 시작
echo "=== Starting Node.js server ==="
node dist/server.js
