FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/bot/package.json ./apps/bot/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --ignore-scripts
COPY packages/database/prisma ./packages/database/prisma
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

FROM node:20-alpine AS builder
WORKDIR /app
ARG APP_NAME=api
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cd packages/shared && npx tsc --noEmit false --outDir dist || true
RUN cd packages/database && npx tsc --noEmit false --outDir dist || true
RUN cd apps/${APP_NAME} && npx tsc --noEmit false --outDir dist

FROM node:20-alpine AS runner
WORKDIR /app
ARG APP_NAME=api
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/${APP_NAME}/dist ./dist
COPY --from=deps /app/packages/database/prisma ./prisma
RUN npx prisma generate --schema=prisma/schema.prisma
USER appuser
EXPOSE 3001
CMD ["node", "dist/index.js"]
