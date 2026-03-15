# TOPIK IBT - Combined Client + Server Build (v2)
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Download multilingual fonts (Noto Sans family) — each wget uses || true to avoid build failure
RUN mkdir -p /app/server/assets/fonts; \
    wget -q -O /app/server/assets/fonts/NotoSans-Regular.ttf \
      "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/unhinted/ttf/NotoSans-Regular.ttf" || true; \
    wget -q -O /app/server/assets/fonts/NotoSans-Bold.ttf \
      "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/unhinted/ttf/NotoSans-Bold.ttf" || true; \
    wget -q -O /app/server/assets/fonts/NotoSansKR-Regular.otf \
      "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf" || true; \
    wget -q -O /app/server/assets/fonts/NotoSansKR-Bold.otf \
      "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Bold.otf" || true; \
    wget -q -O /app/server/assets/fonts/NotoSansThai-Regular.ttf \
      "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansThai/unhinted/ttf/NotoSansThai-Regular.ttf" || true; \
    wget -q -O /app/server/assets/fonts/NotoSansKhmer-Regular.ttf \
      "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansKhmer/unhinted/ttf/NotoSansKhmer-Regular.ttf" || true; \
    wget -q -O /app/server/assets/fonts/NotoSansMyanmar-Regular.ttf \
      "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansMyanmar/unhinted/ttf/NotoSansMyanmar-Regular.ttf" || true; \
    wget -q -O /app/server/assets/fonts/NotoSansLao-Regular.ttf \
      "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansLao/unhinted/ttf/NotoSansLao-Regular.ttf" || true

# Build server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/start.sh ./
COPY --from=builder /app/server/assets/fonts ./assets/fonts
COPY --from=builder /app/client/dist ./dist/public
RUN chmod +x start.sh
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "./start.sh"]
