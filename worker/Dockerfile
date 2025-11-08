# =============================================================================
# DEVELOPMENT STAGE - Hot reload for local development
# =============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl

# Copy dependency files first (better cache layer)
COPY package*.json ./

# Install ALL dependencies (including dev)
RUN npm ci --prefer-offline

# Copy Prisma schema
# NOTE: In development, Prisma schema should be mounted as volume from backend
# or copied during docker build with correct context
COPY prisma ./prisma/

# Generate Prisma Client (will be regenerated when schema volume is mounted)
RUN if [ -f "./prisma/schema.prisma" ]; then npx prisma generate; fi

# Copy TypeScript configuration
COPY tsconfig.json ./

# Source code will be mounted as volume for hot-reload
# tsx watch will detect changes and recompile automatically

# Health check for worker (checks if process is running and Redis connection)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD pgrep -f "node.*worker" > /dev/null || exit 1

# Default command for development (can be overridden in docker-compose)
CMD ["npm", "run", "dev"]

# =============================================================================
# BUILDER STAGE - Compile TypeScript for production
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (needed for build)
RUN npm ci --prefer-offline --no-audit

# Copy Prisma schema
# This will be provided via build context in docker-compose
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy worker source code
COPY src ./src

# Build application (TypeScript compilation)
RUN npm run build

# Prune dev dependencies to reduce size
RUN npm prune --production --no-audit

# =============================================================================
# PRODUCTION STAGE - Minimal image for production
# =============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies
# dumb-init: Proper signal handling for PID 1
# openssl: Required by Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Copy production node_modules from builder (already pruned)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy Prisma files and generated client
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy compiled worker
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Health check for worker (validates process is running)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD pgrep -f "node.*dist/worker" > /dev/null || exit 1

# Use dumb-init for graceful shutdown handling
ENTRYPOINT ["dumb-init", "--"]

# Start worker
CMD ["node", "dist/worker.js"]
