FROM node:20-alpine AS builder
WORKDIR /app
ARG APP_NAME=api

# Install deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/bot/package.json ./apps/bot/
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

USER appuser
EXPOSE 3001
WORKDIR /app/apps/${APP_NAME}
CMD ["node", "dist/index.js"]
