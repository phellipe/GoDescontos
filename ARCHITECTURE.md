# Arquitetura GoDescontos

## Resumo

GoDescontos é uma plataforma de cupons e promoções construída com arquitetura de microserviços, TypeScript full-stack, utilizando Node.js no backend, React no web, React Native (Expo) no mobile, PostgreSQL como banco de dados, Redis para cache e filas, e Stripe para pagamentos.

## Componentes Principais

### 1. Backend API (Port 3000)
- **Stack**: Node.js 20 + Express + TypeScript
- **ORM**: Prisma com PostgreSQL
- **Autenticação**: JWT (access + refresh tokens) com rotação
- **Validação**: Zod
- **Segurança**: Helmet, CORS, Rate Limiting
- **Observabilidade**: Pino (logs) + Sentry (errors)

**Responsabilidades**:
- API REST para todas as operações
- Autenticação e autorização
- Gerenciamento de campanhas
- Processamento de pagamentos (Stripe)
- Emissão de cupons
- Integração com notificações push

### 2. Worker (Background Jobs)
- **Stack**: BullMQ + Redis
- **Processadores**:
  - `emailProcessor`: Envio de emails (verificação, reset senha)
  - `pushProcessor`: Envio de notificações push
  - `reportProcessor`: Geração de relatórios

**Responsabilidades**:
- Processos assíncronos e demorados
- Retry automático em falhas
- Distribuição de carga

### 3. Web Frontend (Port 5173)
- **Stack**: React 18 + Vite + TypeScript
- **State**: Zustand
- **Data Fetching**: React Query
- **Routing**: React Router DOM
- **Push**: Service Worker + Web Push API

**Responsabilidades**:
- Interface para consumidores
- Painel merchant (gestão de campanhas)
- Painel admin
- Web Push Notifications

### 4. Mobile App
- **Stack**: React Native + Expo 50
- **Navigation**: React Navigation
- **State**: Zustand
- **Push**: Expo Notifications

**Responsabilidades**:
- App nativo iOS/Android
- Push notifications
- Geolocalização (futuro)
- Scan QR codes

## Fluxos Principais

### Fluxo de Autenticação

```
1. User → POST /auth/register
2. Backend: hash password, create user, send verification email (job)
3. Backend → return access + refresh tokens
4. User stores tokens
5. User → requests with Bearer token
6. Backend: validates token
7. Token expires → POST /auth/refresh
8. Backend: validates refresh token, rotates, returns new pair
```

### Fluxo de Criação de Campanha

```
1. Merchant → POST /merchant/campaigns (status: DRAFT)
2. Backend: validates, creates campaign
3. Merchant → POST /payments/create-checkout
4. Backend → Stripe: create checkout session
5. Merchant pays on Stripe
6. Stripe → webhook → Backend: mark campaign as paid
7. Merchant → POST /merchant/campaigns/:id/publish
8. Backend: change status to PUBLISHED, generate coupons
9. Worker: send push notifications to followers/nearby users
```

### Fluxo de Cupom

```
1. User sees campaign
2. User → POST /coupons/reserve { campaignId }
3. Backend: find available coupon, assign to user
4. User goes to merchant
5. Merchant → POST /coupons/:code/redeem
6. Backend: validates, marks as redeemed
7. Update campaign.redeemedQuantity
```

### Fluxo de Push Notification

**Mobile (Expo)**:
```
1. App requests permission
2. App → Expo: get push token
3. App → POST /push/register { token, platform: 'EXPO' }
4. Backend stores token
5. Event occurs (new campaign, etc)
6. Backend → BullMQ: enqueue push job
7. Worker → Expo Push API: send notification
8. Expo → FCM/APNs → User device
```

**Web**:
```
1. Browser requests permission
2. Service Worker → Push API: subscribe
3. App → POST /push/web/subscribe { endpoint, keys }
4. Backend stores subscription
5. Event occurs
6. Worker → Web Push (VAPID): send notification
7. Browser displays notification
```

## Banco de Dados (PostgreSQL)

### Modelos Principais

- **User**: Usuários (consumers, merchants, admins)
- **Merchant**: Dados do comerciante
- **Campaign**: Campanhas promocionais
- **Coupon**: Cupons individuais
- **Payment**: Pagamentos Stripe
- **Subscription**: Assinaturas de merchants
- **Plan**: Planos de assinatura
- **RefreshToken**: Tokens de refresh (rotação)
- **PushToken**: Tokens para notificações push
- **Notification**: Histórico de notificações
- **Favorite**: Campanhas favoritadas
- **AuditLog**: Logs de auditoria

### Índices Importantes

- `campaigns(city, state, category)` - busca rápida
- `campaigns(status, startAt, endAt)` - campanhas ativas
- `coupons(code)` - validação rápida
- `refreshTokens(token)` - autenticação
- Fulltext index em `campaigns(title, description)`

## Redis

**Uso**:
- **Cache**: Resultados de queries frequentes
- **Session Store**: (futuro)
- **BullMQ Queues**:
  - `email` queue
  - `push` queue
  - `report` queue

## Stripe Integration

**Fluxos**:

1. **Pagamento de Campanha**:
   - Checkout Session (one-time payment)
   - Webhook: `checkout.session.completed`
   - Ativa campanha após pagamento

2. **Assinatura**:
   - Checkout Session (subscription mode)
   - Webhooks: `customer.subscription.*`
   - Gerencia status da assinatura

3. **Reembolso**:
   - Admin dashboard
   - Webhook: `charge.refunded`

## Segurança

### Camadas de Proteção

1. **Network**: HTTPS, CORS, Firewall
2. **Application**: Rate Limiting, Helmet headers, Input validation
3. **Authentication**: JWT, password hashing, token rotation
4. **Database**: Prisma (prepared statements), role-based access
5. **Secrets**: Environment variables, never committed

### Rate Limits

- General: 100 req/15min
- Auth: 5 attempts/15min
- Payment: 10 req/hour
- Upload: 20 files/15min

## Escalabilidade

### Horizontal Scaling

- **Backend**: Stateless, pode escalar horizontalmente
  - Load balancer (Nginx/Traefik)
  - Multiple replicas

- **Worker**: Múltiplos workers podem processar mesma queue
  - BullMQ distribui jobs automaticamente

### Vertical Scaling

- **Database**: Read replicas, connection pooling (Prisma)
- **Redis**: Redis Cluster para alta disponibilidade

### Otimizações

- **Database**: Índices, query optimization
- **Cache**: Redis para queries caras
- **CDN**: Assets estáticos (futuro)
- **Image optimization**: Resize, compress, WebP (futuro)

## Monitoramento

### Logs

- **Formato**: JSON (Pino)
- **Níveis**: debug, info, warn, error, fatal
- **Centralização**: (futuro) ELK Stack ou Datadog

### Metrics

- **Application**: Sentry (errors)
- **Infrastructure**: (futuro) Prometheus + Grafana
- **Uptime**: (futuro) UptimeRobot ou similar

### Alerts

- API downtime
- High error rate
- Database connection issues
- Queue backlog

## Deploy

### Development
```bash
docker-compose up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD
1. Push to GitHub
2. GitHub Actions: test, lint, build
3. Build Docker images
4. Push to registry (GHCR)
5. Deploy to server via SSH
6. Run migrations
7. Restart services

## Futuras Melhorias

- [ ] Migração para GraphQL (Apollo Server)
- [ ] WebSockets para notificações real-time
- [ ] Microservices separation (Auth Service, Payment Service)
- [ ] Event-driven architecture (Kafka/RabbitMQ)
- [ ] Elasticsearch para busca avançada
- [ ] S3 para armazenamento de imagens
- [ ] CDN (CloudFront/Cloudflare)
- [ ] Multi-tenancy
- [ ] Internacionalização (i18n)
- [ ] A/B testing framework
