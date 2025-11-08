# Docker Quick Reference - GoDescontos

Quick reference guide for common Docker operations in the GoDescontos project.

## Quick Start Commands

### Start Everything

```bash
# Start all services (first time or after changes)
docker-compose up --build

# Start all services (using cache)
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Start with optional tools (pgAdmin, RedisInsight)
docker-compose --profile tools up
```

### Stop Everything

```bash
# Stop all services (preserve data)
docker-compose down

# Stop and remove volumes (DANGER: deletes database!)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs

```bash
# Follow logs from all services
docker-compose logs -f

# Follow logs from specific service
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f web

# View last 100 lines
docker-compose logs --tail=100 backend

# View logs since specific time
docker-compose logs --since 2023-01-01T00:00:00 backend
```

## Development Workflow

### Code Changes (Hot Reload)

Just edit and save files - hot reload is automatic:

- **Backend**: Edit `backend/src/**/*.ts` → tsx watch reloads
- **Worker**: Edit `worker/src/**/*.ts` → tsx watch reloads
- **Web**: Edit `web/src/**/*.tsx` → Vite HMR reloads

### Restart Service

```bash
# Restart specific service (preserves data)
docker-compose restart backend

# Restart and rebuild (after Dockerfile changes)
docker-compose up --build backend
```

### Rebuild from Scratch

```bash
# Rebuild without cache
docker-compose build --no-cache backend

# Remove everything and start fresh
docker-compose down -v
docker system prune -a --volumes
docker-compose up --build
```

## Database Operations

### Prisma Migrations

```bash
# Create new migration
docker exec -it godescontos-backend npx prisma migrate dev --name add_user_avatar

# Apply migrations (production)
docker exec -it godescontos-backend npx prisma migrate deploy

# Reset database (DANGER: deletes all data)
docker exec -it godescontos-backend npx prisma migrate reset

# Generate Prisma Client (after schema changes)
docker exec -it godescontos-backend npx prisma generate
```

### Prisma Studio (Database GUI)

```bash
# Open Prisma Studio
docker exec -it godescontos-backend npx prisma studio

# Access at: http://localhost:5555
```

### Database Backup and Restore

```bash
# Backup database
docker exec godescontos-postgres pg_dump -U postgres godescontos > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
cat backup.sql | docker exec -i godescontos-postgres psql -U postgres godescontos

# Interactive psql
docker exec -it godescontos-postgres psql -U postgres -d godescontos
```

## Container Management

### Execute Commands in Container

```bash
# Bash shell
docker exec -it godescontos-backend sh
docker exec -it godescontos-worker sh

# Run npm command
docker exec -it godescontos-backend npm run test

# Install new package (then rebuild)
docker exec -it godescontos-backend npm install new-package
```

### Container Information

```bash
# List running containers
docker-compose ps

# View detailed container info
docker inspect godescontos-backend

# Check resource usage (real-time)
docker stats

# View container health
docker inspect godescontos-backend | grep -A 10 Health
```

## Troubleshooting

### View Container Logs

```bash
# Real-time logs
docker-compose logs -f backend

# Search logs
docker-compose logs backend | grep ERROR

# Export logs to file
docker-compose logs backend > backend_logs.txt
```

### Check Container Health

```bash
# Health status of all services
docker-compose ps

# Detailed health check
docker inspect --format='{{json .State.Health}}' godescontos-backend | jq
```

### Restart Unhealthy Service

```bash
# Restart service
docker-compose restart backend

# Force recreate service
docker-compose up -d --force-recreate backend
```

### Clean Up Resources

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything (DANGER!)
docker system prune -a --volumes
```

### Network Issues

```bash
# Check network
docker network ls

# Inspect network
docker network inspect godescontos-network

# Recreate network
docker-compose down
docker network rm godescontos-network
docker-compose up
```

## Performance Optimization

### Build Cache

```bash
# Use cache from registry
docker-compose build --cache-from godescontos-backend:latest

# Save cache to registry
docker tag godescontos-backend:dev registry.example.com/godescontos-backend:cache
docker push registry.example.com/godescontos-backend:cache
```

### Resource Monitoring

```bash
# Real-time resource usage
docker stats

# Disk usage
docker system df

# Detailed disk usage
docker system df -v
```

## Production Commands

### Build Production Images

```bash
# Build production backend
docker build -t godescontos-backend:prod --target production ./backend

# Build production web
docker build -t godescontos-web:prod --target production ./web

# Build production worker
docker build -t godescontos-worker:prod --target production ./worker
```

### Test Production Images Locally

```bash
# Run production backend
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  godescontos-backend:prod

# Run production web
docker run -p 80:80 godescontos-web:prod
```

## Environment-Specific Commands

### Development (Full Stack)

```bash
# Start full development stack
docker-compose up --build

# Start with database tools
docker-compose --profile tools up
```

### Infrastructure Only

```bash
# Start only Postgres and Redis
docker-compose -f docker-compose.dev.yml up

# Then run backend/worker/web locally:
cd backend && npm run dev
cd worker && npm run dev
cd web && npm run dev
```

## Useful Aliases (Add to .bashrc or .zshrc)

```bash
# Docker Compose shortcuts
alias dcu='docker-compose up'
alias dcub='docker-compose up --build'
alias dcd='docker-compose down'
alias dcl='docker-compose logs -f'
alias dcps='docker-compose ps'
alias dcr='docker-compose restart'

# GoDescontos specific
alias gd-up='docker-compose up --build'
alias gd-down='docker-compose down'
alias gd-logs='docker-compose logs -f'
alias gd-backend='docker exec -it godescontos-backend sh'
alias gd-db='docker exec -it godescontos-postgres psql -U postgres godescontos'
alias gd-redis='docker exec -it godescontos-redis redis-cli'
alias gd-prisma='docker exec -it godescontos-backend npx prisma studio'
```

## Common Issues and Solutions

### Issue: Port Already in Use

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in docker-compose.yml
```

### Issue: Database Connection Refused

```bash
# Wait for Postgres to be healthy
docker-compose up -d postgres
docker-compose ps postgres  # Should show (healthy)

# Check Postgres logs
docker-compose logs postgres

# Restart backend
docker-compose restart backend
```

### Issue: Hot Reload Not Working

```bash
# Rebuild with no cache
docker-compose up --build --force-recreate backend

# Check volume mounts
docker inspect godescontos-backend | grep -A 10 Mounts

# On Windows, ensure file sharing is enabled in Docker Desktop settings
```

### Issue: Worker Can't Find Prisma Client

```bash
# Regenerate Prisma client
docker exec -it godescontos-worker npx prisma generate

# Restart worker
docker-compose restart worker

# Verify Prisma schema is mounted
docker exec -it godescontos-worker cat /app/prisma/schema.prisma
```

### Issue: Out of Disk Space

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Remove old images
docker image prune -a

# Remove specific volumes
docker volume rm godescontos_postgres_data  # DANGER: deletes DB
```

---

**Tip**: Use `docker-compose --help` or `docker --help` for more commands and options.
