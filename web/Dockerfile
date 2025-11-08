# =============================================================================
# DEVELOPMENT STAGE - Hot reload with Vite dev server
# =============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Copy dependency files first (optimal cache layer)
COPY package*.json ./

# Install ALL dependencies (including dev)
# --prefer-offline speeds up repeated builds
# --legacy-peer-deps allows react-qr-reader@3.0.0-beta-1 to work with React 18
RUN npm ci --prefer-offline --legacy-peer-deps

# Source code will be mounted as volume for hot-reload
# Vite dev server watches for changes and performs HMR (Hot Module Replacement)

EXPOSE 5173

# Health check for Vite dev server
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

# Default command for development
# --host 0.0.0.0 allows external connections (required for Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# =============================================================================
# BUILDER STAGE - Build optimized production assets
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./

# Install dependencies (needs devDependencies for Vite build)
RUN npm ci --prefer-offline --no-audit

# Copy all source files and build configuration
COPY . .

# Build optimized production bundle
# Vite performs tree-shaking, minification, and code splitting
RUN npm run build

# =============================================================================
# PRODUCTION STAGE - Serve with nginx
# =============================================================================
FROM nginx:alpine AS production

# Install runtime dependencies
# dumb-init: Proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root nginx user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create optimized nginx configuration for React SPA
RUN echo 'server { \n\
    listen 80; \n\
    server_name _; \n\
    root /usr/share/nginx/html; \n\
    index index.html; \n\
    \n\
    # Security headers \n\
    add_header X-Frame-Options "SAMEORIGIN" always; \n\
    add_header X-Content-Type-Options "nosniff" always; \n\
    add_header X-XSS-Protection "1; mode=block" always; \n\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \n\
    \n\
    # Compression (reduce bandwidth) \n\
    gzip on; \n\
    gzip_vary on; \n\
    gzip_min_length 1024; \n\
    gzip_comp_level 6; \n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml; \n\
    \n\
    # SPA fallback - serve index.html for all routes (React Router) \n\
    location / { \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    # Cache static assets aggressively (Vite includes content hash in filenames) \n\
    location ~* ^/assets/.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \n\
        expires 1y; \n\
        add_header Cache-Control "public, immutable"; \n\
        access_log off; \n\
    } \n\
    \n\
    # Never cache index.html (ensures users get latest version) \n\
    location = /index.html { \n\
        expires -1; \n\
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \n\
    } \n\
    \n\
    # Disable access to hidden files \n\
    location ~ /\. { \n\
        deny all; \n\
        access_log off; \n\
        log_not_found off; \n\
    } \n\
}' > /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Create nginx PID directory with correct permissions
RUN mkdir -p /var/run/nginx && \
    chown -R nginx-user:nginx-user /var/run/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
