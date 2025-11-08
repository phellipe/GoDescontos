# Docker Infrastructure Guide - GoDescontos

Documentacao completa da infraestrutura Docker do GoDescontos, incluindo comandos uteis, boas praticas e troubleshooting.

---

## Visao Geral

O GoDescontos utiliza Docker e Docker Compose para gerenciar toda a stack de desenvolvimento e producao:

- **PostgreSQL 16**: Banco de dados principal
- **Redis 7**: Cache e filas BullMQ
- **Backend**: Node.js + Express + Prisma
- **Worker**: BullMQ para jobs em background
- **Web**: React + Vite

---

## Arquivos Docker

### Dockerfiles

Todos os Dockerfiles utilizam **multi-stage builds** com 3 stages:

1. **development**: Hot-reload para desenvolvimento local
2. **builder**: Compila TypeScript e prepara artefatos
3. **production**: Imagem minima e otimizada para producao

**Localizacao**:
- `Z:\dev\GoDescontos\backend\Dockerfile`
- `Z:\dev\GoDescontos\worker\Dockerfile`
- `Z:\dev\GoDescontos\web\Dockerfile`

### Docker Compose

**3 arquivos de compose** para diferentes cenarios:

| Arquivo | Uso | Servicos |
|---------|-----|----------|
| `docker-compose.dev.yml` | Apenas infraestrutura (apps locais) | postgres, redis, adminer, redis-insight |
| `docker-compose.yml` | Stack completa em containers | postgres, redis, backend, worker, web, pgadmin |
| `docker-compose.prod.yml` | Producao com replicas e nginx | Todos + nginx reverse proxy |

---

## Comandos Essenciais

### Setup Inicial

```bash
# 1. Apenas infraestrutura (recomendado para dev)
docker-compose -f docker-compose.dev.yml up -d

# 2. Stack completa (tudo no Docker)
docker-compose up --build -d

# 3. Ver logs em tempo real
docker-compose logs -f backend worker

# 4. Verificar status dos containers
docker-compose ps
```

### Desenvolvimento Diario

```bash
# Rebuild de um servico especifico (apos mudanca no Dockerfile)
docker-compose build backend
docker-compose up -d backend

# Rebuild sem cache (quando dependency mudou)
docker-compose build --no-cache backend

# Restart rapido de um servico
docker-compose restart backend

# Executar comando dentro de um container
docker-compose exec backend sh
docker-compose exec backend npx prisma studio
docker-compose exec postgres psql -U postgres -d godescontos

# Ver logs de erro
docker-compose logs --tail=100 backend
docker-compose logs --tail=50 worker | grep ERROR
```

### Database Operations

```bash
# Aplicar migrations
docker-compose exec backend npx prisma migrate deploy

# Criar nova migration
docker-compose exec backend npx prisma migrate dev --name add_new_field

# Seed database
docker-compose exec backend npx prisma db seed

# Abrir Prisma Studio
docker-compose exec backend npx prisma studio
# Acesse http://localhost:5555

# Backup do banco (manual)
docker-compose exec postgres pg_dump -U postgres godescontos > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore do banco
docker-compose exec -T postgres psql -U postgres godescontos < backup_20250107_120000.sql

# Reset completo (APAGA TUDO!)
docker-compose exec backend npx prisma migrate reset
```

### Limpeza e Manutencao

```bash
# Parar todos os containers
docker-compose down

# Parar e REMOVER volumes (APAGA DADOS!)
docker-compose down -v

# Limpar imagens antigas
docker image prune -a

# Limpar tudo (volumes, networks, imagens)
docker system prune -a --volumes

# Listar volumes
docker volume ls

# Remover volume especifico
docker volume rm godescontos_postgres_data

# Ver espaco usado pelo Docker
docker system df
```

### Producao (Build & Push)

```bash
# Build para producao
docker build -t godescontos-backend:latest -f backend/Dockerfile --target production ./backend
docker build -t godescontos-worker:latest -f worker/Dockerfile --target production ./worker
docker build -t godescontos-web:latest -f web/Dockerfile --target production ./web

# Tag para registry
docker tag godescontos-backend:latest registry.example.com/godescontos-backend:v1.0.0

# Push para registry
docker push registry.example.com/godescontos-backend:v1.0.0

# Deploy em producao
docker-compose -f docker-compose.prod.yml up -d

# Update com zero downtime (rolling update)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
```

---

## Cenarios de Uso

### Cenario 1: Dev Local (Recomendado)

**Quando usar**: Desenvolvimento dia a dia com hot-reload rapido.

**Setup**:
```bash
# 1. Subir apenas infra
docker-compose -f docker-compose.dev.yml up -d

# 2. Rodar apps localmente
cd backend && npm run dev
cd worker && npm run dev
cd web && npm run dev
```

**Vantagens**:
- Hot-reload mais rapido
- Debugging mais facil (sem entrar no container)
- Usa node_modules local

**URLs**:
- Backend: http://localhost:3000
- Web: http://localhost:5173
- Adminer: http://localhost:8080
- RedisInsight: http://localhost:8001 (com --profile tools)

### Cenario 2: Full Docker (Ambiente Isolado)

**Quando usar**: Testar comportamento em ambiente "prod-like" ou trabalhar em multiplos projetos.

**Setup**:
```bash
# Subir tudo
docker-compose up --build -d

# Ver logs
docker-compose logs -f
```

**Vantagens**:
- Isolamento completo
- Reproducivel em qualquer maquina
- Testa Dockerfiles antes do deploy

**URLs**:
- Backend: http://localhost:3000
- Web: http://localhost:5173
- pgAdmin: http://localhost:5050 (com --profile tools)

### Cenario 3: Producao

**Setup**:
```bash
# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Ver status
docker-compose -f docker-compose.prod.yml ps
```

---

## Otimizacoes Implementadas

### Dockerfiles

1. **Multi-stage builds**: Reduz tamanho final da imagem (70%+ menor)
2. **Layer caching**: `package.json` copiado antes do codigo fonte
3. **Non-root user**: Seguranca (usuario nodejs:1001)
4. **dumb-init**: Graceful shutdown (handles SIGTERM corretamente)
5. **Health checks**: Monitoramento automatico de saude
6. **Alpine Linux**: Imagens minimas (vs debian)

### Docker Compose

1. **Named volumes para node_modules**: Performance em Windows/Mac (evita I/O lento)
2. **Health checks com depends_on**: Espera servicos estarem prontos
3. **Networks customizadas**: Isolamento e seguranca
4. **Cached volumes**: `:cached` para volumes de codigo (Mac)
5. **Profiles**: Ferramentas opcionais (pgAdmin, RedisInsight)
6. **Connection pooling**: Limites de conexao no DATABASE_URL

### .dockerignore

Arquivos excluidos do build context:
- `node_modules`, `dist`, `.git`
- `.env`, logs, cache
- Documentacao (`.md`)

**Beneficio**: Build 10x mais rapido

---

## Troubleshooting

### Erro: "port already in use"

```bash
# Descobrir o processo usando a porta
netstat -ano | findstr :5432
# ou no Linux/Mac
lsof -i :5432

# Parar compose e tentar novamente
docker-compose down
docker-compose up -d
```

### Erro: "database connection refused"

```bash
# Verificar se postgres esta healthy
docker-compose ps

# Ver logs do postgres
docker-compose logs postgres

# Verificar se DATABASE_URL esta correto
docker-compose exec backend env | grep DATABASE_URL

# Testar conexao manual
docker-compose exec backend sh -c "npx prisma db pull"
```

### Erro: "migration failed"

```bash
# Ver estado das migrations
docker-compose exec backend npx prisma migrate status

# Forcar reset (APAGA DADOS!)
docker-compose exec backend npx prisma migrate reset

# Ou aplicar manualmente
docker-compose exec backend npx prisma migrate deploy
```

### Container reiniciando constantemente

```bash
# Ver logs para identificar o erro
docker-compose logs --tail=100 backend

# Verificar health check
docker inspect godescontos-backend | grep -A 10 Health

# Entrar no container para debug
docker-compose exec backend sh
```

### Build muito lento (Windows)

```bash
# 1. Verificar se .dockerignore existe
cat backend/.dockerignore

# 2. Usar named volumes para node_modules (ja configurado)
# 3. Habilitar WSL2 backend no Docker Desktop
# 4. Considerar BuildKit
export DOCKER_BUILDKIT=1
docker-compose build
```

### Worker nao processa jobs

```bash
# Verificar se Redis esta acessivel
docker-compose exec worker sh -c "redis-cli -h redis ping"

# Ver logs do worker
docker-compose logs -f worker

# Ver filas no RedisInsight
docker-compose --profile tools up -d redis-insight
# Acesse http://localhost:8001
```

### Hot-reload nao funciona

**Em docker-compose.yml**:
```yaml
volumes:
  - ./backend/src:/app/src:cached  # :cached para Mac
```

**No Windows**: WSL2 recomendado.

**Verificar se volume esta montado**:
```bash
docker-compose exec backend ls -la /app/src
```

---

## Boas Praticas

### 1. Nunca commitar .env

```bash
# .dockerignore ja exclui, mas verifique:
git ls-files | grep .env
# Deve retornar vazio
```

### 2. Use health checks

Todos os servicos criticos devem ter:
```yaml
healthcheck:
  test: ['CMD', 'wget', '--spider', 'http://localhost:3000/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 3. Logs estruturados

Backend usa Pino (JSON). Para ler logs:
```bash
docker-compose logs backend | jq
```

### 4. Backup automatico

**Exemplo de cron job**:
```bash
# Rodar diariamente as 3AM
0 3 * * * docker-compose exec -T postgres pg_dump -U postgres godescontos | gzip > /backups/godescontos_$(date +\%Y\%m\%d).sql.gz
```

### 5. Monitoring em producao

Adicionar ao docker-compose.prod.yml:
- Prometheus + Grafana
- Sentry (ja configurado no backend)
- Uptime monitoring (ex: UptimeRobot)

### 6. Secrets em producao

**NAO use env vars hardcoded!**

Usar:
- Docker Secrets (Swarm mode)
- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes Secrets

```yaml
# Exemplo com Docker Secrets
services:
  backend:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

---

## Performance Tips

### 1. BuildKit (Build mais rapido)

```bash
# Habilitar globalmente
export DOCKER_BUILDKIT=1

# Ou em docker-compose.yml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      cache_from:
        - godescontos-backend:latest
```

### 2. Layer Caching (CI/CD)

```bash
# Pull imagem anterior para usar cache
docker pull godescontos-backend:latest || true
docker build --cache-from godescontos-backend:latest -t godescontos-backend:latest ./backend
```

### 3. Multi-platform builds (ARM + x64)

```bash
# Setup buildx
docker buildx create --use

# Build para multiplas arquiteturas
docker buildx build --platform linux/amd64,linux/arm64 -t godescontos-backend:latest ./backend
```

---

## Comandos Uteis (Cheat Sheet)

```bash
# Ver consumo de recursos
docker stats

# Limpar espaco
docker system prune -a --volumes --filter "until=24h"

# Export/Import imagem
docker save godescontos-backend:latest | gzip > backend.tar.gz
docker load < backend.tar.gz

# Ver historico de layers
docker history godescontos-backend:latest

# Inspecionar imagem
docker inspect godescontos-backend:latest

# Copiar arquivo do container
docker cp godescontos-backend:/app/uploads/image.png ./

# Copiar arquivo para container
docker cp ./config.json godescontos-backend:/app/

# Verificar vulnerabilidades (Docker Scout)
docker scout cves godescontos-backend:latest

# Ver logs com timestamp
docker-compose logs -f --timestamps backend

# Filtrar logs por nivel
docker-compose logs backend | grep ERROR
docker-compose logs backend | grep WARN
```

---

## Proximos Passos

### Para Producao

- [ ] Setup de CI/CD (GitHub Actions)
- [ ] Registry privado (AWS ECR, Docker Hub, ou self-hosted)
- [ ] Nginx como reverse proxy com SSL
- [ ] Let's Encrypt para certificados
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Alerting (PagerDuty, Slack)
- [ ] Backup automatizado do PostgreSQL
- [ ] Log aggregation (ELK stack ou Loki)
- [ ] Auto-scaling (Kubernetes ou Docker Swarm)
- [ ] Blue-green deployment strategy

### Para Desenvolvimento

- [ ] Docker Compose override para configs pessoais
- [ ] Debugger attach (VS Code)
- [ ] Pre-commit hooks para lint Dockerfiles
- [ ] Testes automatizados em containers

---

## Recursos Adicionais

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose Spec](https://docs.docker.com/compose/compose-file/)
- [Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Prisma in Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

---

## Contato

Duvidas ou problemas? Abra uma issue ou contate o time DevOps.

**Ultima atualizacao**: 2025-01-07
