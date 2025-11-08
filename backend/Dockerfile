# =============================================================================
# DEVELOPMENT STAGE - Hot reload for local development
# =============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies for native modules (required for bcrypt, etc)
RUN apk add --no-cache python3 make g++ openssl

# Copy dependency files first (better cache layer)
COPY package*.json ./

# Install ALL dependencies (including dev) with clean install for reproducibility
# --prefer-offline speeds up repeated builds
RUN npm ci --prefer-offline

# Copy Prisma schema for client generation
COPY prisma ./prisma/

# Generate Prisma Client (cached unless schema changes)
RUN npx prisma generate

# Copy TypeScript configuration
COPY tsconfig.json ./

# Source code will be mounted as volume in docker-compose for hot-reload
# This allows tsx watch to detect changes and recompile automatically

EXPOSE 3000

# Health check for development (lightweight check)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Default command for development (can be overridden in docker-compose)
CMD ["npm", "run", "dev"]

# =============================================================================
# BUILDER STAGE - Compile TypeScript and prepare production assets
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl

# Copy dependency files first for layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (needed for build and compilation)
RUN npm ci --prefer-offline --no-audit

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build application (TypeScript compilation + path alias resolution)
RUN npm run build

# Prune dev dependencies to reduce node_modules size for production
# This removes devDependencies like TypeScript, ESLint, etc
RUN npm prune --production --no-audit

# =============================================================================
# PRODUCTION STAGE - Minimal image for production deployment
# =============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies only
# dumb-init: Proper signal handling for PID 1
# openssl: Required by Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user for security (prevents privilege escalation)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files (for reference and potential debugging)
COPY package*.json ./

# Copy production node_modules from builder (already pruned)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy Prisma files and generated client
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy compiled application (dist folder from tsc + tsc-alias)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create uploads directory with proper permissions
RUN mkdir -p uploads && \
    chown -R nodejs:nodejs uploads && \
    chmod 755 uploads

# Switch to non-root user (all subsequent commands run as this user)
USER nodejs

# Expose port (documentation only, actual binding happens at runtime)
EXPOSE 3000

# Health check endpoint (validates app is responding correctly)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly (enables graceful shutdown on SIGTERM)
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
