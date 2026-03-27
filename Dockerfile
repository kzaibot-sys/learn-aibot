FROM node:20-alpine AS builder
WORKDIR /app
ARG APP_NAME=api

# Install deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build packages then app
RUN cd packages/shared && npx tsc
RUN cd packages/database && npx tsc
RUN cd apps/${APP_NAME} && npx tsc

# Download video for the demo course
RUN apk add --no-cache python3 py3-pip && \
    python3 -m pip install --break-system-packages yt-dlp 2>/dev/null && \
    mkdir -p apps/api/public/videos && \
    python3 -m yt_dlp -f "best[ext=mp4]" -o "apps/api/public/videos/intro.mp4" "https://youtu.be/PkXjihPOl58" || true

FROM node:20-alpine AS runner
WORKDIR /app
ARG APP_NAME=api
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy full monorepo structure needed at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/${APP_NAME}/dist ./apps/${APP_NAME}/dist
COPY --from=builder /app/apps/${APP_NAME}/package.json ./apps/${APP_NAME}/package.json
# Copy src/assets if present (fonts for PDF generation, etc.)
# Using wildcard so it doesn't fail if the directory doesn't exist
COPY --from=builder /app/apps/${APP_NAME}/src/asset[s] ./apps/${APP_NAME}/src/assets
# Copy public directory (videos, etc.)
COPY --from=builder /app/apps/${APP_NAME}/publi[c] ./apps/${APP_NAME}/public
# Copy Prisma schema for db push at startup
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

USER appuser
ENV PORT=3001
EXPOSE ${PORT}
WORKDIR /app/apps/${APP_NAME}
CMD ["sh", "-c", "npx prisma db push --schema=/app/packages/database/prisma/schema.prisma --skip-generate --accept-data-loss 2>/dev/null; node dist/index.js"]
