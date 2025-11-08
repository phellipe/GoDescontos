# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Visão Geral do Projeto

**GoDescontos** é uma plataforma completa de cupons e promoções (estilo Groupon/Peixe Urbano) construída como monorepo TypeScript com:

- **Backend**: Node.js + Express + Prisma (PostgreSQL)
- **Worker**: BullMQ para processos em background (emails, push notifications, relatórios)
- **Web**: React + Vite
- **Mobile**: React Native + Expo

## Comandos Essenciais

### Desenvolvimento Local

```bash
# Iniciar todos os serviços (Postgres, Redis, backend, worker, web)
docker-compose up --build

# Backend individualmente
cd backend
npm run dev              # Dev server com hot reload (tsx watch)
npm run migrate:dev      # Criar nova migration
npm run studio           # Prisma Studio (GUI do banco)
npm run seed             # Popular banco com dados de teste

# Web
cd web
npm run dev              # Vite dev server (porta 5173)

# Mobile
cd mobile
npm start                # Expo dev server
npm run android          # Abrir no emulador Android
npm run ios              # Abrir no simulador iOS
```

### Testes e Linting

```bash
# Backend
cd backend
npm test                 # Rodar testes com Vitest
npm run test:watch       # Modo watch
npm run test:coverage    # Relatório de cobertura
npm run lint             # ESLint
npm run lint:fix         # ESLint com auto-fix
npm run format           # Prettier

# Web
cd web
npm run lint             # ESLint
npm run build            # Build de produção (tsc + vite build)
```

### Prisma

```bash
cd backend

# Após alterar schema.prisma
npm run generate         # Gera Prisma Client
npm run migrate:dev      # Cria e aplica migration

# Produção
npm run migrate          # Aplica migrations (prisma migrate deploy)

# Reset completo (APAGA DADOS!)
npm run migrate:reset    # Reset + seed
```

## Arquitetura

### Backend - Estrutura de Camadas

```
Routes (Express Router)
  ↓ Middlewares (authenticate, authorize, validate com Zod)
Controllers (req/res handling)
  ↓
Services (lógica de negócio)
  ↓
Prisma ORM (data access)
```

**IMPORTANTE**:
- Toda validação de input usa **Zod schemas** via middleware `validate()`
- Autenticação usa **JWT duplo**: access token (15min) + refresh token (7 dias) com rotação
- Rate limiting está ativo: 100 req/15min (geral), 5 req/15min (auth endpoints)

### Principais Services

- `AuthService`: Login, registro, refresh token rotation, verificação de email
- `CampaignService`: CRUD de campanhas, publicação (gera cupons automaticamente)
- `CouponService`: Reserva e resgate de cupons
- `StripeService`: Checkout sessions, webhooks, assinaturas
- `PushService`: Notificações push (Expo + Web Push VAPID)
- `UploadService`: Upload de imagens (Multer)
- `AnalyticsService`: Métricas e relatórios para merchants

### Autenticação e Autorização

**Fluxo de Refresh Token**:
1. Login retorna `accessToken` + `refreshToken`
2. Access token expira em 15min
3. Cliente usa `POST /auth/refresh` com refresh token
4. Backend **revoga** token antigo e gera novo par (rotação)
5. Cliente armazena novos tokens

**Proteção de rotas**:
```typescript
router.post(
  '/merchant/campaigns',
  authenticate,                    // Valida JWT
  authorize(UserRole.MERCHANT),    // Valida role
  validate(createCampaignSchema),  // Valida body
  controller.create
);
```

### Modelo de Dados (Prisma)

**13 entidades principais**:

**Core**:
- `User`: Usuários (roles: USER, MERCHANT, ADMIN)
- `Merchant`: Comerciantes (1:1 com User)
- `Customer`: CRM básico dos merchants
- `Campaign`: Campanhas promocionais (status: DRAFT → PENDING_PAYMENT → PUBLISHED → ENDED)
- `Coupon`: Cupons individuais (status: AVAILABLE → RESERVED → REDEEMED)

**Pagamentos**:
- `Payment`: Pagamentos Stripe (one-time e subscription)
- `Plan`: Planos de assinatura
- `Subscription`: Assinaturas ativas

**Auth & Notificações**:
- `RefreshToken`: Tokens JWT (suporta rotação e revogação)
- `PushToken`: Tokens Expo/mobile (platforms: WEB, IOS, ANDROID, EXPO)
- `WebPushSubscription`: Subscrições Web Push (VAPID)
- `Notification`: Histórico de notificações

**Social**:
- `Favorite`: Campanhas favoritadas
- `AuditLog`: Logs de auditoria

**Índices importantes**:
- `campaigns(city, state, category)` - busca por localização
- `campaigns(status, startAt, endAt)` - campanhas ativas
- `coupons(code)` - validação rápida de cupom
- Full-text index em `campaigns(title, description)`

### Worker (BullMQ)

**3 filas de processamento**:

1. **Email Queue** (concurrency: 5)
   - Verificação de email
   - Reset de senha
   - Confirmações de pagamento

2. **Push Queue** (concurrency: 5)
   - Novas campanhas publicadas
   - Campanhas expirando
   - Cupons redimidos

3. **Report Queue** (concurrency: 5)
   - Relatórios de vendas
   - Analytics de campanhas
   - Exportação de dados

**Como enfileirar um job**:
```typescript
import { emailQueue } from '@/config/queues';

await emailQueue.add('send-email', {
  to: user.email,
  subject: 'Verificação de Email',
  template: 'verify-email',
  data: { token: verificationToken }
});
```

### Sistema de Pagamentos (Stripe)

**Fluxo de pagamento de campanha**:

1. Merchant cria campanha (status: DRAFT)
2. Merchant faz upload de imagem
3. Merchant chama `POST /payments/create-checkout` com `campaignId`
4. Backend cria Stripe Checkout Session (mode: 'payment')
5. Merchant paga no Stripe
6. Stripe envia webhook `checkout.session.completed`
7. Backend valida signature, cria `Payment` (status: SUCCEEDED)
8. Backend atualiza `Campaign` (isPaid: true, status: PENDING_PAYMENT)
9. Merchant chama `POST /merchant/campaigns/:id/publish`
10. Backend gera cupons (quantidade = `totalQuantity`) com códigos únicos + QR codes
11. Backend atualiza status para PUBLISHED
12. Worker enfileira notificações push para usuários

**IMPORTANTE**: Webhook Stripe DEVE ter signature validation (`stripe.webhooks.constructEvent`)

### Notificações Push

**Dual platform support**:

**Mobile (Expo)**:
```typescript
// App pede permissão e registra token
const token = await Notifications.getExpoPushTokenAsync();
await api.post('/push/register', { token: token.data, platform: 'EXPO' });
```

**Web (Web Push VAPID)**:
```typescript
// Service Worker + Push API
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidPublicKey
});
await api.post('/push/web/subscribe', subscription);
```

**Enviar notificação**:
```typescript
import { pushQueue } from '@/config/queues';

await pushQueue.add('send-push', {
  userId: user.id,
  title: 'Nova Campanha!',
  body: 'Confira a nova promoção perto de você',
  data: { campaignId }
});
```

## Padrões do Projeto

### TypeScript Strict Mode

- Projeto usa TypeScript em strict mode
- Path aliases configurados: `@/*` → `./src/*`, `@services/*` → `./src/services/*`, etc.
- Use `tsc-alias` no build (já configurado no `npm run build`)

### Validação com Zod

**SEMPRE** criar schemas Zod para validação de inputs:

```typescript
import { z } from 'zod';

const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    priceOriginal: z.number().positive(),
    pricePromo: z.number().positive(),
    startAt: z.string().datetime(),
    totalQuantity: z.number().int().positive()
  })
});

// Usar no middleware
router.post('/campaigns', validate(createCampaignSchema), controller.create);
```

### Error Handling

**Custom errors**:
```typescript
import { AppError } from '@/utils/errors';

// Em services
if (!campaign) {
  throw new AppError('Campanha não encontrada', 404);
}

// Global error handler captura e retorna JSON estruturado
```

**Response format padrão**:
```json
{
  "status": "success",
  "data": { ... }
}
```

**Errors**:
```json
{
  "status": "error",
  "message": "Mensagem de erro"
}
```

### Logging Estruturado (Pino)

```typescript
import logger from '@/config/logger';

logger.info({ userId, campaignId }, 'Campanha criada');
logger.error({ error, context: 'StripeService' }, 'Falha ao processar pagamento');
logger.warn({ userId }, 'Tentativa de acesso não autorizado');
```

**SEMPRE** inclua contexto relevante como primeiro argumento (objeto).

## Segurança

### Implementado

- **Helmet**: Headers de segurança (CSP, HSTS, X-Frame-Options)
- **CORS**: Configurável via `CORS_ORIGIN` (.env)
- **Rate Limiting**: Express Rate Limit
- **JWT**: Access + refresh tokens com rotação
- **Bcrypt**: 10 rounds (dev) / 12 rounds (prod)
- **Zod**: Validação de todos os inputs
- **Prisma**: Prepared statements (anti-SQL injection)

### Checklist de Deploy

- [ ] Trocar `JWT_SECRET` e `JWT_REFRESH_SECRET` (mínimo 32 chars)
- [ ] Configurar `STRIPE_WEBHOOK_SECRET` com webhook real
- [ ] Configurar `CORS_ORIGIN` com domínios permitidos
- [ ] Gerar novas VAPID keys (`npx web-push generate-vapid-keys`)
- [ ] Configurar SMTP real para emails (não usar dev mode)
- [ ] Habilitar HTTPS (Let's Encrypt)
- [ ] Configurar backups automáticos do PostgreSQL

## Variáveis de Ambiente

### Backend (.env) - Essenciais

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/godescontos"
REDIS_URL="redis://localhost:6379"

# JWT (TROCAR EM PRODUÇÃO!)
JWT_SECRET="dev-secret-min-32-chars-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-min-32-chars-change"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..." ou "sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_SUCCESS_URL="http://localhost:5173/payment/success"
STRIPE_CANCEL_URL="http://localhost:5173/payment/cancel"

# Push Notifications
EXPO_ACCESS_TOKEN="obter em https://expo.dev"
VAPID_PUBLIC_KEY="obter com: npx web-push generate-vapid-keys"
VAPID_PRIVATE_KEY="obter com: npx web-push generate-vapid-keys"
VAPID_SUBJECT="mailto:contato@godescontos.com"

# CORS
CORS_ORIGIN="http://localhost:5173,http://localhost:19006"

# Segurança
BCRYPT_ROUNDS="10"  # 12 em produção
RATE_LIMIT_MAX_REQUESTS="100"
```

### Web (.env)

```bash
VITE_API_URL="http://localhost:3000/api"
```

## Fluxos Críticos

### 1. Publicar Campanha

```typescript
// Merchant cria campanha (DRAFT)
POST /merchant/campaigns { title, price, ... }

// Upload imagem
POST /uploads (multipart/form-data)

// Atualizar campanha com imageUrl
PATCH /merchant/campaigns/:id { imageUrl }

// Criar checkout Stripe
POST /payments/create-checkout { campaignId, amount }
// → Redireciona para Stripe

// Stripe processa pagamento → webhook
// Backend cria Payment e marca Campaign.isPaid = true

// Publicar campanha
POST /merchant/campaigns/:id/publish
// → Gera cupons
// → Atualiza status para PUBLISHED
// → Enfileira push notifications
```

### 2. Consumidor Reserva Cupom

```typescript
// Buscar campanhas
GET /campaigns?city=São+Paulo&category=Alimentação

// Reservar cupom
POST /coupons/reserve { campaignId }
// → Busca cupom AVAILABLE
// → Atualiza status para RESERVED
// → Retorna código + QR

// Merchant valida cupom (scanner QR)
POST /coupons/:code/redeem
// → Valida código
// → Atualiza status para REDEEMED
// → Incrementa campaign.redeemedQuantity
// → Envia notificação ao usuário
```

### 3. Refresh Token Rotation

```typescript
// Access token expira (15min) → 401
// Client chama:
POST /auth/refresh { refreshToken }

// Backend:
// 1. Busca token no DB
// 2. Verifica isRevoked === false
// 3. Verifica expiresAt
// 4. REVOGA token antigo (isRevoked = true)
// 5. Gera novo access + refresh token
// 6. Salva novo refresh token no DB
// 7. Retorna novo par de tokens
```

## Troubleshooting

### Erro: "P1001: Can't reach database server"

```bash
# Verificar se Postgres está rodando
docker-compose ps

# Restart services
docker-compose restart postgres backend
```

### Erro: Migrations falham

```bash
# Reset database (APAGA DADOS!)
cd backend
npm run migrate:reset

# Ou manualmente
npx prisma migrate reset
npx prisma migrate deploy
npm run seed
```

### Push Notifications não funcionam

1. **Expo**: Verificar se `EXPO_ACCESS_TOKEN` está configurado
2. **Web Push**: Verificar VAPID keys no .env
3. **Permissões**: Verificar se usuário concedeu permissões
4. **Logs**: `docker-compose logs worker` para ver erros

### Stripe Webhook não recebe eventos

```bash
# Use Stripe CLI para testes locais
stripe listen --forward-to localhost:3000/api/payments/webhook

# Copiar webhook secret gerado e adicionar em .env como STRIPE_WEBHOOK_SECRET
```

## Referências Importantes

- **Prisma Schema**: `backend/prisma/schema.prisma`
- **README completo**: `README.md`
- **Exemplos de cURL**: `CURL_EXAMPLES.md`
- **API Docs (dev)**: http://localhost:3000/api-docs
- **pgAdmin**: http://localhost:5050 (admin@godescontos.com / admin123)

## Credenciais de Teste (após seed)

```
Admin:    admin@godescontos.com / Admin123!@#
User:     joao.silva@example.com / User123!@#
Merchant: contato@pizzariabellanapoli.com / Merchant123!@#
```

## Observações Finais

- **NÃO** comitar arquivos `.env`
- **SEMPRE** usar Zod para validação de inputs
- **SEMPRE** usar `authenticate` middleware em rotas protegidas
- **SEMPRE** usar `authorize(role)` para controle de acesso por role
- **SEMPRE** logar erros com contexto usando Pino
- Migrations Prisma **NUNCA** devem ser editadas manualmente após aplicadas
- Webhook Stripe **DEVE** validar signature
- Refresh tokens **DEVEM** ser revogados após uso (rotação)
