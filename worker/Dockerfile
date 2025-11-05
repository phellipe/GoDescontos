# Multi-stage build for worker
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../backend/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src
COPY tsconfig.json ./

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy Prisma files
COPY ../backend/prisma ./prisma/
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Switch to non-root user
USER nodejs

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start worker
CMD ["node", "dist/worker.js"]
