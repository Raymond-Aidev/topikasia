#!/bin/bash
set -e

DOMAIN="www.topikasia.com"
EMAIL="admin@topikasia.com"

echo "🔐 Initializing SSL certificate for $DOMAIN"

# Start nginx temporarily for ACME challenge
docker compose up -d nginx

# Get certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d topikasia.com

# Restart nginx with SSL
docker compose restart nginx

echo "✅ SSL certificate obtained for $DOMAIN"
