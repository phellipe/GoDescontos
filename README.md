# 🎯 GoDescontos - Plataforma de Cupons e Promoções

**GoDescontos** é uma plataforma completa estilo Peixe Urbano/Groupon onde comerciantes criam campanhas promocionais, gerenciam clientes, e consumidores recebem promoções via app e web.

## 📋 Índice

- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Funcionalidades](#-funcionalidades)
- [Setup Local](#-setup-local)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Exemplos de Requests](#-exemplos-de-requests)
- [Deploy](#-deploy)
- [Testes](#-testes)
- [Segurança](#-segurança)
- [Troubleshooting](#-troubleshooting)

## 🏗 Arquitetura

GoDescontos utiliza uma arquitetura de microserviços com TypeScript em toda a stack:

- **Backend API**: Node.js + Express + Prisma (PostgreSQL)
- **Worker**: BullMQ para processos em background
- **Web**: React + Vite (SPA responsivo)
- **Mobile**: React Native com Expo
- **Infraestrutura**: Docker + Docker Compose + GitHub Actions
- **Notificações**: Expo Push (mobile) + Web Push (VAPID)
- **Pagamentos**: Stripe (assinaturas e pagamentos únicos)
- **Cache/Queue**: Redis
- **Observabilidade**: Pino (logs) + Sentry (opcional)

## 🛠 Stack Tecnológica

### Backend
- **Node.js 20** + Express 4
- **TypeScript** (strict mode)
- **Prisma ORM** com PostgreSQL
- **JWT** (access + refresh tokens com rotação)
- **Bcrypt** para hashing de senhas
- **Zod** para validação
- **Helmet** + CORS para segurança
- **Express Rate Limit**
- **BullMQ** para filas
- **Stripe** para pagamentos
- **Web Push** + **Expo Server SDK** para notificações

### Web
- **React 18** + **Vite**
- **React Router DOM**
- **React Query**
- **Zustand** (state management)
- **Axios** (HTTP client)
- **Service Worker** (Web Push)

### Mobile
- **React Native** com **Expo 50**
- **Expo Notifications**
- **React Navigation**
- **TanStack Query**
- **Zustand**

### DevOps
- **Docker** + **Docker Compose**
- **GitHub Actions** (CI/CD)
- **Nginx** (reverse proxy em produção)
- **PostgreSQL 16**
- **Redis 7**

## ✨ Funcionalidades

### Para Consumidores
- ✅ Registro e autenticação com JWT
- ✅ Listagem de campanhas por cidade/categoria
- ✅ Busca e filtros avançados
- ✅ Favoritar campanhas
- ✅ Reservar e usar cupons
- ✅ Push notifications (mobile e web)
- ✅ Histórico de cupons

### Para Comerciantes (Merchants)
- ✅ Painel de gestão de campanhas
- ✅ Criar, editar, publicar campanhas
- ✅ Gerenciar clientes (CRM básico)
- ✅ Validar cupons no POS
- ✅ Métricas e relatórios
- ✅ Pagamento via Stripe (campanhas e assinaturas)

### Para Administradores
- ✅ Gerenciar usuários e merchants
- ✅ Aprovar merchants
- ✅ Gerenciar planos de assinatura
- ✅ Forçar reembolsos
- ✅ Visualizar logs de auditoria

## 🚀 Setup Local

### Pré-requisitos

- **Node.js 20+**
- **Docker** e **Docker Compose**
- **Git**
- **Expo CLI** (para mobile): `npm install -g expo-cli`

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/GoDescontos.git
cd GoDescontos
```

### 2. Configure as variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e configure as variáveis necessárias (veja comentários no arquivo).

**Importante**: Para testes locais, você pode usar as chaves de teste do Stripe:
- Obtenha em: https://dashboard.stripe.com/test/apikeys

Para notificações Expo:
- Crie um projeto em https://expo.dev
- Obtenha o Access Token em: https://expo.dev/accounts/[account]/settings/access-tokens

Para Web Push (VAPID):
```bash
npx web-push generate-vapid-keys
```

### 3. Inicie os serviços com Docker Compose

```bash
docker-compose up --build
```

Isso irá:
- Criar containers para Postgres, Redis, pgAdmin, backend, worker e web
- Executar migrations do Prisma
- Popular o banco com dados de seed
- Iniciar todos os serviços

**Serviços disponíveis:**
- API Backend: http://localhost:3000
- Web App: http://localhost:5173
- pgAdmin: http://localhost:5050 (admin@godescontos.com / admin123)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 4. Acesse a aplicação

- **Web**: http://localhost:5173
- **API Docs**: http://localhost:3000/api-docs (somente dev)

**Credenciais padrão (após seed):**
- Admin: `admin@godescontos.com` / `Admin123!@#`
- User: `joao.silva@example.com` / `User123!@#`
- Merchant: `contato@pizzariabellanapoli.com` / `Merchant123!@#`

### 5. Rodar o Mobile App

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR code com o app Expo Go (iOS/Android).

## 📁 Estrutura do Projeto

```
GoDescontos/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Controllers (req/res)
│   │   ├── services/        # Lógica de negócio
│   │   ├── repositories/    # Acesso ao DB (Prisma)
│   │   ├── routes/          # Definição de rotas
│   │   ├── middlewares/     # Auth, validation, rate-limit
│   │   ├── jobs/            # BullMQ job definitions
│   │   ├── utils/           # Utilities (JWT, password, etc)
│   │   ├── config/          # Configurações (DB, Redis, Sentry)
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Entrada principal
│   ├── prisma/
│   │   ├── schema.prisma    # Schema do banco
│   │   └── seed.ts          # Dados iniciais
│   ├── Dockerfile
│   └── package.json
├── worker/                  # BullMQ Worker
│   ├── src/
│   │   ├── processors/      # Job processors (email, push, reports)
│   │   └── worker.ts        # Worker principal
│   └── Dockerfile
├── web/                     # Frontend React + Vite
│   ├── src/
│   │   ├── pages/           # Páginas
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── services/        # API client, push service
│   │   ├── stores/          # Zustand stores
│   │   └── main.tsx         # Entrada
│   ├── Dockerfile
│   └── nginx.conf
├── mobile/                  # App React Native Expo
│   ├── src/
│   │   ├── screens/         # Telas
│   │   ├── navigation/      # React Navigation
│   │   ├── services/        # API, push
│   │   └── stores/          # Zustand stores
│   ├── app.json
│   └── App.tsx
├── infra/                   # Infraestrutura
│   ├── nginx/               # Configs Nginx
│   └── k8s/                 # Kubernetes manifests (opcional)
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI/CD
├── docker-compose.yml       # Desenvolvimento local
├── docker-compose.prod.yml  # Produção
└── README.md
```

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify-email` - Verificar email
- `POST /api/auth/forgot-password` - Solicitar reset de senha
- `POST /api/auth/reset-password` - Resetar senha
- `GET /api/auth/me` - Obter usuário atual

### Campanhas
- `GET /api/campaigns` - Listar campanhas (pública)
- `GET /api/campaigns/:id` - Detalhes de campanha
- `POST /api/campaigns/:id/favorite` - Favoritar (requer auth)

### Merchant (requer MERCHANT ou ADMIN)
- `POST /api/merchant/campaigns` - Criar campanha
- `PATCH /api/merchant/campaigns/:id` - Atualizar campanha
- `DELETE /api/merchant/campaigns/:id` - Deletar campanha
- `POST /api/merchant/campaigns/:id/publish` - Publicar campanha
- `GET /api/merchant/campaigns` - Listar campanhas do merchant

### Cupons
- `POST /api/coupons/reserve` - Reservar cupom (requer auth)
- `GET /api/coupons/my` - Meus cupons (requer auth)
- `POST /api/coupons/:code/redeem` - Validar/usar cupom (merchant)

### Pagamentos
- `POST /api/payments/create-checkout` - Criar checkout Stripe (merchant)
- `POST /api/payments/webhook` - Webhook Stripe

### Push Notifications
- `POST /api/push/register` - Registrar token push
- `POST /api/push/web/subscribe` - Subscrever web push
- `POST /api/push/unregister` - Remover token
- `GET /api/push/web/vapid-key` - Obter chave pública VAPID

### Health
- `GET /api/health` - Health check

## 📡 Exemplos de Requests

### 1. Registrar usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo@usuario.com",
    "password": "Senha123!@#",
    "name": "Novo Usuário",
    "role": "USER"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.silva@example.com",
    "password": "User123!@#"
  }'
```

Resposta:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "joao.silva@example.com",
      "name": "João Silva",
      "role": "USER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Listar campanhas

```bash
curl -X GET "http://localhost:3000/api/campaigns?city=São Paulo&category=Alimentação" \
  -H "Content-Type: application/json"
```

### 4. Criar campanha (merchant)

```bash
curl -X POST http://localhost:3000/api/merchant/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "merchantId": "merchant-uuid",
    "title": "Pizza Grande + Refri",
    "description": "Deliciosa pizza grande com refrigerante 2L",
    "shortDescription": "Pizza + Refri",
    "priceOriginal": 89.90,
    "pricePromo": 49.90,
    "category": "Alimentação",
    "city": "São Paulo",
    "state": "SP",
    "startAt": "2024-01-01T00:00:00Z",
    "endAt": "2024-12-31T23:59:59Z",
    "totalQuantity": 100
  }'
```

### 5. Criar checkout Stripe

```bash
curl -X POST http://localhost:3000/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "merchantId": "merchant-uuid",
    "campaignId": "campaign-uuid",
    "amount": 99.90
  }'
```

### 6. Reservar cupom

```bash
curl -X POST http://localhost:3000/api/coupons/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "campaignId": "campaign-uuid"
  }'
```

### 7. Refresh token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🚢 Deploy

### Deploy com Docker (Servidor VPS)

1. **Preparar servidor**:
```bash
# Instalar Docker e Docker Compose
sudo apt update
sudo apt install docker.io docker-compose
```

2. **Clonar projeto**:
```bash
git clone https://github.com/seu-usuario/GoDescontos.git
cd GoDescontos
```

3. **Configurar variáveis**:
```bash
cp backend/.env.example backend/.env
# Editar .env com valores de produção
```

4. **Build e deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

5. **Executar migrations**:
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Deploy com Kubernetes (opcional)

Manifests de exemplo estão em `/infra/k8s/`:

```bash
kubectl apply -f infra/k8s/
```

### CI/CD com GitHub Actions

O projeto inclui workflow GitHub Actions (`.github/workflows/ci.yml`) que:
- Executa linter e testes
- Build de imagens Docker
- Push para registry (GHCR)
- Deploy automático em produção

Configure secrets no GitHub:
- `DEPLOY_HOST` - IP do servidor
- `DEPLOY_USER` - Usuário SSH
- `DEPLOY_KEY` - Chave privada SSH

## 🧪 Testes

### Backend

```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

### Web

```bash
cd web
npm test
```

### E2E (Exemplo com Playwright)

```bash
cd backend
npm run test:e2e
```

## 🔒 Segurança

### Práticas implementadas:

1. **Autenticação**:
   - JWT com access + refresh tokens
   - Refresh token rotation
   - Bcrypt para senhas (10 rounds)
   - Validação de força de senha

2. **Headers de Segurança** (Helmet):
   - CSP (Content Security Policy)
   - HSTS
   - X-Frame-Options
   - X-Content-Type-Options

3. **Rate Limiting**:
   - 100 requests / 15min (geral)
   - 5 attempts / 15min (auth)
   - 10 payments / hora

4. **Validação**:
   - Zod em todos os inputs
   - Sanitização de SQL (Prisma)
   - CORS configurável

5. **HTTPS** (produção):
   - Use Let's Encrypt com Certbot
   - Redirecionamento HTTP → HTTPS

6. **Secrets**:
   - Nunca comite `.env`
   - Use variáveis de ambiente
   - Rotacione chaves regularmente

### Checklist de Deploy

- [ ] Trocar `JWT_SECRET` e `JWT_REFRESH_SECRET` (32+ chars)
- [ ] Configurar HTTPS com certificado SSL
- [ ] Configurar Stripe webhook secret
- [ ] Configurar CORS para domínios permitidos
- [ ] Habilitar Sentry para monitoramento
- [ ] Configurar backups automáticos do PostgreSQL
- [ ] Revisar permissões do usuário do banco
- [ ] Habilitar firewall (liberar apenas portas 80, 443, 22)
- [ ] Configurar log rotation
- [ ] Testar processo de restore de backup

## 🐛 Troubleshooting

### Problema: Containers não iniciam

```bash
# Verificar logs
docker-compose logs backend
docker-compose logs postgres

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### Problema: Migrations falham

```bash
# Reset database (CUIDADO: apaga dados!)
docker-compose exec backend npx prisma migrate reset

# Ou manualmente
docker-compose exec backend npx prisma migrate deploy
```

### Problema: Push notifications não funcionam

1. Verifique se VAPID keys estão configuradas
2. Para Expo: verifique se o token foi registrado
3. Cheque permissões do navegador/app
4. Logs: `docker-compose logs worker`

### Problema: Stripe webhook não recebe eventos

1. Use Stripe CLI para testes locais:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

2. Verifique o webhook secret no .env

## 📚 Documentação Adicional

- [Prisma Docs](https://www.prisma.io/docs/)
- [Stripe Docs](https://stripe.com/docs)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 👥 Time

Desenvolvido pelo time GoDescontos.

---

**GoDescontos** - As melhores promoções perto de você! 🎉
