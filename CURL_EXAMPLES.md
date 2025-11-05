# Exemplos de Requests cURL - GoDescontos API

## Variáveis de Ambiente

Para facilitar, defina:

```bash
export API_URL="http://localhost:3000/api"
export ACCESS_TOKEN="seu_access_token_aqui"
export MERCHANT_ID="uuid_do_merchant"
export CAMPAIGN_ID="uuid_da_campanha"
```

## Autenticação

### Registrar Usuário (Consumer)

```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaForte123!@#",
    "name": "João Silva",
    "role": "USER"
  }'
```

### Registrar Merchant

```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "comerciante@example.com",
    "password": "SenhaForte123!@#",
    "name": "Maria Comerciante",
    "role": "MERCHANT"
  }'
```

### Login

```bash
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaForte123!@#"
  }' | jq
```

**Resposta**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "name": "João Silva",
      "role": "USER",
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token

```bash
curl -X POST $API_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "seu_refresh_token"
  }' | jq
```

### Obter Usuário Atual

```bash
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Logout

```bash
curl -X POST $API_URL/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "seu_refresh_token"
  }'
```

### Esqueci Minha Senha

```bash
curl -X POST $API_URL/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com"
  }'
```

### Resetar Senha

```bash
curl -X POST $API_URL/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_recebido_por_email",
    "password": "NovaSenha123!@#"
  }'
```

## Campanhas (Público)

### Listar Todas as Campanhas

```bash
curl -X GET "$API_URL/campaigns" | jq
```

### Buscar por Cidade

```bash
curl -X GET "$API_URL/campaigns?city=São%20Paulo" | jq
```

### Buscar por Categoria

```bash
curl -X GET "$API_URL/campaigns?category=Alimentação" | jq
```

### Buscar com Múltiplos Filtros

```bash
curl -X GET "$API_URL/campaigns?city=Rio%20de%20Janeiro&state=RJ&category=Fitness&page=1&limit=10" | jq
```

### Busca por Texto

```bash
curl -X GET "$API_URL/campaigns?search=pizza" | jq
```

### Detalhes de uma Campanha

```bash
curl -X GET "$API_URL/campaigns/$CAMPAIGN_ID?incrementView=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Favoritar Campanha

```bash
curl -X POST "$API_URL/campaigns/$CAMPAIGN_ID/favorite" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## Merchant - Gestão de Campanhas

### Criar Nova Campanha

```bash
curl -X POST $API_URL/merchant/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "merchantId": "'$MERCHANT_ID'",
    "title": "Pizza Grande + Refrigerante 2L",
    "description": "Saboreie uma deliciosa pizza grande (8 fatias) de qualquer sabor do nosso cardápio acompanhada de um refrigerante 2L. Válido de segunda a quinta-feira, exceto feriados.",
    "shortDescription": "Pizza Grande + Refri 2L por apenas R$ 49,90",
    "priceOriginal": 89.90,
    "pricePromo": 49.90,
    "category": "Alimentação",
    "tags": ["pizza", "delivery", "italiano", "promoção"],
    "city": "São Paulo",
    "state": "SP",
    "country": "BR",
    "startAt": "2024-01-15T00:00:00Z",
    "endAt": "2024-03-15T23:59:59Z",
    "totalQuantity": 100,
    "terms": "Válido apenas de segunda a quinta-feira. Não acumulativo com outras promoções. Delivery grátis para pedidos acima de R$ 50.",
    "imageUrl": "https://example.com/pizza.jpg"
  }' | jq
```

### Atualizar Campanha

```bash
curl -X PATCH "$API_URL/merchant/campaigns/$CAMPAIGN_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Pizza Grande + Refri 2L - PROMOÇÃO ESPECIAL",
    "pricePromo": 39.90
  }' | jq
```

### Publicar Campanha

```bash
curl -X POST "$API_URL/merchant/campaigns/$CAMPAIGN_ID/publish" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Listar Minhas Campanhas

```bash
curl -X GET "$API_URL/merchant/campaigns?merchantId=$MERCHANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Deletar Campanha

```bash
curl -X DELETE "$API_URL/merchant/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Cupons

### Reservar Cupom

```bash
curl -X POST $API_URL/coupons/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "campaignId": "'$CAMPAIGN_ID'"
  }' | jq
```

### Meus Cupons

```bash
curl -X GET $API_URL/coupons/my \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Validar/Usar Cupom (Merchant)

```bash
curl -X POST "$API_URL/coupons/PIZZA-ABC123/redeem" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## Pagamentos

### Criar Checkout Session (Stripe)

```bash
curl -X POST $API_URL/payments/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "merchantId": "'$MERCHANT_ID'",
    "campaignId": "'$CAMPAIGN_ID'",
    "amount": 99.90
  }' | jq
```

**Resposta**:
```json
{
  "status": "success",
  "data": {
    "url": "https://checkout.stripe.com/pay/cs_test_...",
    "sessionId": "cs_test_..."
  }
}
```

### Criar Checkout para Assinatura

```bash
curl -X POST $API_URL/payments/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "merchantId": "'$MERCHANT_ID'",
    "planId": "plan-uuid",
    "amount": 99.90
  }' | jq
```

## Push Notifications

### Registrar Token (Mobile)

```bash
curl -X POST $API_URL/push/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "EXPO",
    "deviceId": "iPhone 13"
  }'
```

### Subscribe Web Push

```bash
curl -X POST $API_URL/push/web/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BKxN...",
      "auth": "rZc..."
    }
  }'
```

### Obter VAPID Public Key

```bash
curl -X GET $API_URL/push/web/vapid-key | jq
```

### Remover Token

```bash
curl -X POST $API_URL/push/unregister \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }'
```

## Health Check

```bash
curl -X GET $API_URL/health | jq
```

**Resposta**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "database": "connected",
  "redis": "connected"
}
```

## Testando Stripe Webhooks Localmente

1. Instale Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Login:
```bash
stripe login
```

3. Forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

4. Trigger evento de teste:
```bash
stripe trigger checkout.session.completed
```

## Paginação

Todas as listagens suportam paginação:

```bash
curl -X GET "$API_URL/campaigns?page=2&limit=20" | jq
```

**Resposta**:
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "pages": 8
  }
}
```

## Tratamento de Erros

### Erro de Validação (400)

```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-invalido",
    "password": "123"
  }' | jq
```

**Resposta**:
```json
{
  "status": "error",
  "message": "Validation error",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email format"
    },
    {
      "field": "body.password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Erro de Autenticação (401)

```bash
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer token_invalido" | jq
```

**Resposta**:
```json
{
  "status": "error",
  "message": "Invalid token"
}
```

### Rate Limit (429)

```json
{
  "status": "error",
  "message": "Too many requests, please try again later."
}
```

## Dicas

1. Use `jq` para formatação JSON
2. Armazene tokens em variáveis de ambiente
3. Para desenvolvimento, desabilite SSL verification: `-k` ou `--insecure`
4. Use `--verbose` ou `-v` para debug
5. Salve respostas em arquivo: `... > response.json`
