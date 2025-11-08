# Relatório de Investigação: Endpoints de Campanhas - Backend GoDescontos

**Data:** 2025-11-08
**Investigador:** Apos (Backend Specialist)
**Escopo:** Análise de endpoints de criação e edição de campanhas

---

## Sumário Executivo

Foram identificados **5 problemas críticos** nos endpoints de gerenciamento de campanhas que podem impactar diretamente a experiência do usuário e a segurança da aplicação:

1. **CRÍTICO**: Endpoint de atualização sem validação Zod
2. **ALTO**: Endpoint GET para obter campanha por ID ausente nas rotas de merchant
3. **MÉDIO**: Schemas Zod definidos mas não utilizados
4. **MÉDIO**: Validação de datas de atualização inconsistente
5. **BAIXO**: Inconsistência na estrutura de controllers

---

## Problemas Identificados

### 1. ENDPOINT DE ATUALIZAÇÃO SEM VALIDAÇÃO ZOD

**Severidade:** CRÍTICA
**Localização:** `backend/src/routes/merchant.ts:64-84`

#### Descrição do Problema

O endpoint `PATCH /api/merchant/campaigns/:id` NÃO possui middleware de validação Zod, permitindo que dados não validados sejam enviados diretamente ao service layer.

#### Código Atual (Problemático)

```typescript
// backend/src/routes/merchant.ts:64-84
router.patch(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  // ❌ FALTA: validate(campaignSchemas.update),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignService.update(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.role,
      );

      res.status(200).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);
```

#### Riscos Identificados

- **Segurança**: Dados maliciosos podem passar sem validação
- **Integridade**: Campos com tipos incorretos podem corromper dados
- **Experiência**: Erros de validação só serão detectados no banco de dados (erros genéricos)
- **Padrão**: Violação do padrão estabelecido no CLAUDE.md (SEMPRE usar Zod)

#### Solução Proposta

```typescript
// backend/src/routes/merchant.ts:64-84
import { campaignSchemas } from '@/schemas/campaign.schema';

router.patch(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.update), // ✅ ADICIONAR VALIDAÇÃO
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignService.update(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.role,
      );

      res.status(200).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);
```

#### Validação Disponível (Já Existe)

O schema de validação já está definido em `backend/src/schemas/campaign.schema.ts:61-84`:

```typescript
update: z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    shortDescription: z.string().max(500).optional(),
    priceOriginal: positiveDecimalSchema.optional(),
    pricePromo: positiveDecimalSchema.optional(),
    category: z.string().min(1).max(100).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    city: z.string().min(1).max(100).optional(),
    state: brazilianStateSchema.optional(),
    startAt: dateStringSchema.optional(),
    endAt: dateStringSchema.optional(),
    totalQuantity: positiveIntSchema.max(100000).optional(),
    terms: z.string().max(5000).optional(),
    imageUrl: urlSchema.optional(),
    images: z.array(urlSchema).max(10).optional(),
    status: z.nativeEnum(CampaignStatus).optional(),
    isFeatured: z.boolean().optional(),
  }),
}),
```

**Ação Necessária:** Apenas adicionar o middleware `validate(campaignSchemas.update)` na rota.

---

### 2. ENDPOINT GET PARA CAMPANHA INDIVIDUAL AUSENTE

**Severidade:** ALTA
**Localização:** `backend/src/routes/merchant.ts` (ausente)

#### Descrição do Problema

Não existe endpoint dedicado para merchant obter detalhes de uma campanha específica por ID. O frontend precisa buscar detalhes de uma campanha para edição, mas precisa usar o endpoint público `/api/campaigns/:id`.

#### Problema Atual

```typescript
// backend/src/routes/merchant.ts
// ❌ NÃO EXISTE:
// GET /api/merchant/campaigns/:id

// O que existe:
GET /api/merchant/campaigns           // Lista todas (linha 127)
POST /api/merchant/campaigns          // Criar (linha 37)
PATCH /api/merchant/campaigns/:id     // Atualizar (linha 64)
POST /api/merchant/campaigns/:id/publish  // Publicar (linha 87)
DELETE /api/merchant/campaigns/:id    // Deletar (linha 109)
```

#### Impacto

1. **Frontend**: Precisa usar endpoint público que não retorna dados sensíveis (status DRAFT, isPaid, etc)
2. **Segurança**: Merchants podem ver campanhas DRAFT de outros merchants via endpoint público
3. **Experiência**: Dados incompletos para formulário de edição
4. **Inconsistência**: Padrão REST quebrado (falta GET individual)

#### Solução Proposta

```typescript
// backend/src/routes/merchant.ts - ADICIONAR após linha 61

/**
 * Get campaign by ID (merchant-specific)
 * GET /api/merchant/campaigns/:id
 */
router.get(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.getById),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Buscar campanha
      const campaign = await campaignService.getById(req.params.id, false);

      // Verificar ownership
      const merchant = await prisma.merchant.findUnique({
        where: { userId: req.user!.userId },
      });

      if (
        req.user!.role !== UserRole.ADMIN &&
        campaign.merchantId !== merchant?.id
      ) {
        throw new ForbiddenError('Você não tem permissão para acessar esta campanha');
      }

      res.status(200).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);
```

**Alternativa (Melhor):** Criar método específico no `CampaignService`:

```typescript
// backend/src/services/CampaignService.ts - ADICIONAR

/**
 * Get campaign by ID with ownership verification
 */
async getByIdForMerchant(id: string, userId: string, userRole: UserRole) {
  const campaign = await this.getById(id, false);

  // Verificar ownership
  const merchant = await prisma.merchant.findUnique({
    where: { userId },
  });

  if (userRole !== UserRole.ADMIN && campaign.merchantId !== merchant?.id) {
    throw new ForbiddenError('Você não tem permissão para acessar esta campanha');
  }

  return campaign;
}
```

E usar na rota:

```typescript
router.get(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.getById),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignService.getByIdForMerchant(
        req.params.id,
        req.user!.userId,
        req.user!.role,
      );

      res.status(200).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);
```

---

### 3. SCHEMAS ZOD DEFINIDOS MAS NÃO UTILIZADOS

**Severidade:** MÉDIA
**Localização:** `backend/src/routes/merchant.ts:15-34`

#### Descrição do Problema

Existe um schema Zod `createCampaignSchema` definido INLINE na rota, mas há schemas mais completos e robustos já definidos em `backend/src/schemas/campaign.schema.ts` que não estão sendo utilizados.

#### Código Atual (Duplicação)

```typescript
// backend/src/routes/merchant.ts:15-34 (INLINE - duplicado)
const createCampaignSchema = z.object({
  body: z.object({
    merchantId: z.string().uuid(),
    title: z.string().min(5),
    description: z.string().min(20),
    shortDescription: z.string().optional(),
    priceOriginal: z.number().positive(),
    pricePromo: z.number().positive(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    city: z.string(),
    state: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    totalQuantity: z.number().int().positive(),
    terms: z.string().optional(),
    imageUrl: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
  }),
});
```

#### Schema Centralizado (Mais Completo)

```typescript
// backend/src/schemas/campaign.schema.ts:26-55 (CENTRALIZADO - melhor)
create: z.object({
  body: z
    .object({
      merchantId: uuidSchema,
      title: z.string().min(3, 'Título muito curto').max(200, 'Título muito longo'),
      description: z.string().min(10, 'Descrição muito curta').max(5000, 'Descrição muito longa'),
      shortDescription: z.string().max(500).optional(),
      priceOriginal: positiveDecimalSchema,
      pricePromo: positiveDecimalSchema,
      category: z.string().min(1, 'Categoria é obrigatória').max(100),
      tags: z.array(z.string().max(50)).max(10, 'Máximo 10 tags').optional(),
      city: z.string().min(1, 'Cidade é obrigatória').max(100),
      state: brazilianStateSchema,
      country: countryCodeSchema.default('BR'),
      startAt: dateStringSchema,
      endAt: dateStringSchema,
      totalQuantity: positiveIntSchema.max(100000, 'Quantidade máxima: 100.000'),
      terms: z.string().max(5000).optional(),
      imageUrl: urlSchema.optional(),
      images: z.array(urlSchema).max(10, 'Máximo 10 imagens').optional(),
    })
    // ✅ VALIDAÇÕES CROSS-FIELD
    .refine((data) => data.pricePromo < data.priceOriginal, {
      message: 'Preço promocional deve ser menor que o preço original',
      path: ['pricePromo'],
    })
    .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
      message: 'Data de término deve ser posterior à data de início',
      path: ['endAt'],
    }),
}),
```

#### Diferenças (Schema Centralizado é Superior)

| Aspecto | Schema Inline (Atual) | Schema Centralizado |
|---------|----------------------|---------------------|
| Validação de título | `min(5)` | `min(3).max(200)` com mensagens |
| Validação de descrição | `min(20)` | `min(10).max(5000)` com mensagens |
| State validation | `z.string()` (qualquer) | `brazilianStateSchema` (UF válidos) |
| Country | Ausente | `countryCodeSchema.default('BR')` |
| Cross-field validation | **Ausente** | ✅ `pricePromo < priceOriginal` |
| Date validation | **Ausente** | ✅ `endAt > startAt` |
| Mensagens de erro | Genéricas | PT-BR específicas |

#### Solução Proposta

```typescript
// backend/src/routes/merchant.ts:1-10
import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { campaignSchemas } from '@/schemas/campaign.schema'; // ✅ IMPORTAR
import { AuthRequest } from '@/middlewares/auth';
import { Response, NextFunction } from 'express';
import { campaignService } from '@/services/CampaignService';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// ❌ REMOVER schema inline (linhas 15-34)

// ✅ USAR schema centralizado
router.post(
  '/campaigns',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.create), // ✅ USAR SCHEMA CENTRALIZADO
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignService.create(
        {
          ...req.body,
          startAt: new Date(req.body.startAt),
          endAt: new Date(req.body.endAt),
        },
        req.user!.userId,
        req.user!.role,
      );

      res.status(201).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);
```

---

### 4. VALIDAÇÃO DE DATAS DE ATUALIZAÇÃO INCONSISTENTE

**Severidade:** MÉDIA
**Localização:** `backend/src/services/CampaignService.ts:254-296`

#### Descrição do Problema

O método `update()` do `CampaignService` não valida se as novas datas (startAt/endAt) mantêm consistência quando apenas uma delas é atualizada.

#### Cenário Problemático

```typescript
// Campanha existente:
startAt: "2025-12-01T00:00:00Z"
endAt: "2025-12-31T23:59:59Z"

// Request de atualização (atualiza APENAS endAt):
PATCH /api/merchant/campaigns/:id
{
  "endAt": "2025-11-15T00:00:00Z" // ❌ ANTERIOR ao startAt original!
}

// Service aceita sem validar cross-field
// Resultado: campanha com endAt < startAt (INCONSISTENTE)
```

#### Código Atual (Service)

```typescript
// backend/src/services/CampaignService.ts:254-296
async update(id: string, data: UpdateCampaignData, userId: string, userRole: UserRole) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { merchant: true },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  if (campaign.merchant.userId !== userId && userRole !== UserRole.ADMIN) {
    throw new ForbiddenError('You do not have permission to update this campaign');
  }

  // ✅ Calcula desconto se preços mudaram
  let discountPercent = campaign.discountPercent;
  if (data.priceOriginal || data.pricePromo) {
    const original = data.priceOriginal || Number(campaign.priceOriginal);
    const promo = data.pricePromo || Number(campaign.pricePromo);
    discountPercent = Math.round(((original - promo) / original) * 100);
  }

  // ❌ NÃO VALIDA se endAt > startAt após update parcial

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      ...data,
      discountPercent,
    },
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          logoUrl: true,
        },
      },
    },
  });

  return updated;
}
```

#### Solução Proposta

```typescript
// backend/src/services/CampaignService.ts:254-296
async update(id: string, data: UpdateCampaignData, userId: string, userRole: UserRole) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { merchant: true },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  if (campaign.merchant.userId !== userId && userRole !== UserRole.ADMIN) {
    throw new ForbiddenError('You do not have permission to update this campaign');
  }

  // ✅ ADICIONAR: Validar preços
  const newPriceOriginal = data.priceOriginal ?? Number(campaign.priceOriginal);
  const newPricePromo = data.pricePromo ?? Number(campaign.pricePromo);

  if (newPricePromo >= newPriceOriginal) {
    throw new BadRequestError(
      'Preço promocional deve ser menor que o preço original'
    );
  }

  // ✅ ADICIONAR: Validar datas
  const newStartAt = data.startAt ?? campaign.startAt;
  const newEndAt = data.endAt ?? campaign.endAt;

  if (new Date(newEndAt) <= new Date(newStartAt)) {
    throw new BadRequestError(
      'Data de término deve ser posterior à data de início'
    );
  }

  // Calcular novo desconto
  const discountPercent = Math.round(
    ((newPriceOriginal - newPricePromo) / newPriceOriginal) * 100
  );

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      ...data,
      discountPercent,
    },
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          logoUrl: true,
        },
      },
    },
  });

  return updated;
}
```

**Nota:** Esta validação complementa a validação Zod (problema #1), fornecendo validação cross-field no service layer.

---

### 5. INCONSISTÊNCIA NA ESTRUTURA DE CONTROLLERS

**Severidade:** BAIXA
**Localização:** `backend/src/routes/merchant.ts:37-152`

#### Descrição do Problema

As rotas de merchant para campanhas estão implementadas INLINE no arquivo de rotas, enquanto as rotas públicas de campanhas usam um controller dedicado (`CampaignController`).

#### Estrutura Atual

```
📁 backend/src/
├── 📁 controllers/
│   ├── CampaignController.ts     ✅ Controller dedicado (public routes)
│   ├── BaseController.ts         ✅ Base class com métodos helper
│   └── (outros controllers)
│
├── 📁 routes/
│   ├── campaigns.ts              ✅ Usa CampaignController
│   └── merchant.ts               ❌ Lógica INLINE (sem controller)
```

#### Código Atual (Inline)

```typescript
// backend/src/routes/merchant.ts:37-61
router.post(
  '/campaigns',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(createCampaignSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // ❌ Lógica INLINE na rota
      const campaign = await campaignService.create(
        {
          ...req.body,
          startAt: new Date(req.body.startAt),
          endAt: new Date(req.body.endAt),
        },
        req.user!.userId,
        req.user!.role,
      );

      res.status(201).json({
        status: 'success',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  },
);
```

#### Comparação (Public Routes)

```typescript
// backend/src/routes/campaigns.ts:1-14 (BEM ESTRUTURADO)
import { Router } from 'express';
import { campaignController } from '@/controllers/CampaignController';
import { authenticate, optionalAuth } from '@/middlewares/auth';

const router = Router();

// ✅ Usa controller dedicado
router.get('/', optionalAuth, campaignController.list.bind(campaignController));
router.get('/:id', optionalAuth, campaignController.getById.bind(campaignController));
router.post('/:id/favorite', authenticate, campaignController.toggleFavorite.bind(campaignController));

export default router;
```

#### Impacto

1. **Manutenibilidade**: Lógica espalhada entre routes e controllers
2. **Testabilidade**: Dificulta testes unitários (precisa mockar Express)
3. **Reusabilidade**: Não pode reutilizar lógica entre diferentes rotas
4. **Consistência**: Padrão arquitetural quebrado

#### Solução Proposta

**Criar MerchantController:**

```typescript
// backend/src/controllers/MerchantController.ts (NOVO ARQUIVO)
import { Response, NextFunction } from 'express';
import { campaignService } from '@/services/CampaignService';
import { AuthRequest } from '@/types';
import { BaseController } from './BaseController';

/**
 * Merchant Controller
 *
 * Handles merchant-specific campaign management endpoints:
 * - Create campaign
 * - Update campaign
 * - Publish campaign
 * - Delete campaign
 * - List merchant campaigns
 */
export class MerchantController extends BaseController {
  /**
   * Create campaign
   * POST /api/merchant/campaigns
   */
  async createCampaign(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.execute(
      async () => {
        const campaign = await campaignService.create(
          {
            ...req.body,
            startAt: new Date(req.body.startAt),
            endAt: new Date(req.body.endAt),
          },
          this.getUserId(req),
          this.getUserRole(req),
        );

        this.created(res, campaign);
        this.logAction(req, 'create_campaign', { campaignId: campaign.id });
      },
      req,
      res,
      next,
    );
  }

  /**
   * Update campaign
   * PATCH /api/merchant/campaigns/:id
   */
  async updateCampaign(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.execute(
      async () => {
        const { id } = req.params;

        const campaign = await campaignService.update(
          id,
          req.body,
          this.getUserId(req),
          this.getUserRole(req),
        );

        this.success(res, campaign);
        this.logAction(req, 'update_campaign', { campaignId: id });
      },
      req,
      res,
      next,
    );
  }

  /**
   * Get campaign by ID (with ownership verification)
   * GET /api/merchant/campaigns/:id
   */
  async getCampaign(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.execute(
      async () => {
        const { id } = req.params;

        const campaign = await campaignService.getByIdForMerchant(
          id,
          this.getUserId(req),
          this.getUserRole(req),
        );

        this.success(res, campaign);
      },
      req,
      res,
      next,
    );
  }

  /**
   * Publish campaign
   * POST /api/merchant/campaigns/:id/publish
   */
  async publishCampaign(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.execute(
      async () => {
        const { id } = req.params;

        const campaign = await campaignService.publish(
          id,
          this.getUserId(req),
          this.getUserRole(req),
        );

        this.success(res, campaign);
        this.logAction(req, 'publish_campaign', { campaignId: id });
      },
      req,
      res,
      next,
    );
  }

  /**
   * Delete campaign
   * DELETE /api/merchant/campaigns/:id
   */
  async deleteCampaign(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.execute(
      async () => {
        const { id } = req.params;

        await campaignService.delete(
          id,
          this.getUserId(req),
          this.getUserRole(req),
        );

        this.success(res, { message: 'Campanha deletada com sucesso' });
        this.logAction(req, 'delete_campaign', { campaignId: id });
      },
      req,
      res,
      next,
    );
  }

  /**
   * List merchant campaigns
   * GET /api/merchant/campaigns
   */
  async listCampaigns(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await this.execute(
      async () => {
        const { merchantId } = req.query;

        const result = await campaignService.list({
          merchantId: merchantId as string,
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        });

        this.paginated(res, result.campaigns, result.pagination);
      },
      req,
      res,
      next,
    );
  }
}

export const merchantController = new MerchantController();
```

**Refatorar Rotas:**

```typescript
// backend/src/routes/merchant.ts (REFATORADO)
import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { campaignSchemas } from '@/schemas/campaign.schema';
import { merchantController } from '@/controllers/MerchantController';
import { UserRole } from '@prisma/client';

const router = Router();

// All merchant routes require authentication
router.use(authenticate);

// Campaign management routes
router.post(
  '/campaigns',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.create),
  merchantController.createCampaign.bind(merchantController),
);

router.get(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.getById),
  merchantController.getCampaign.bind(merchantController),
);

router.patch(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.update),
  merchantController.updateCampaign.bind(merchantController),
);

router.post(
  '/campaigns/:id/publish',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.publish),
  merchantController.publishCampaign.bind(merchantController),
);

router.delete(
  '/campaigns/:id',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.delete),
  merchantController.deleteCampaign.bind(merchantController),
);

router.get(
  '/campaigns',
  authorize(UserRole.MERCHANT, UserRole.ADMIN),
  validate(campaignSchemas.list),
  merchantController.listCampaigns.bind(merchantController),
);

export default router;
```

**Benefícios:**

- ✅ **Separação de responsabilidades**: Rotas definem APENAS endpoints e middlewares
- ✅ **Testabilidade**: Controllers podem ser testados isoladamente
- ✅ **Reusabilidade**: Métodos helper do BaseController (success, created, paginated, logAction)
- ✅ **Consistência**: Mesmo padrão de CampaignController
- ✅ **Manutenibilidade**: Lógica centralizada e organizada

---

## Resumo de Ações Necessárias

### Prioridade CRÍTICA (Implementar Imediatamente)

1. **Adicionar validação Zod no endpoint PATCH** (`backend/src/routes/merchant.ts:66`)
   ```typescript
   validate(campaignSchemas.update),
   ```

### Prioridade ALTA (Implementar Esta Semana)

2. **Criar endpoint GET para campanha individual** (`backend/src/routes/merchant.ts`)
   - Adicionar rota `GET /api/merchant/campaigns/:id`
   - Adicionar método `getByIdForMerchant()` no CampaignService

### Prioridade MÉDIA (Implementar Este Mês)

3. **Usar schemas centralizados** (`backend/src/routes/merchant.ts:15-40`)
   - Remover schema inline `createCampaignSchema`
   - Importar e usar `campaignSchemas.create`

4. **Adicionar validação cross-field no service** (`backend/src/services/CampaignService.ts:254`)
   - Validar `pricePromo < priceOriginal` no update
   - Validar `endAt > startAt` no update

### Prioridade BAIXA (Backlog)

5. **Criar MerchantController** (novo arquivo)
   - Extrair lógica inline das rotas
   - Implementar padrão consistente com CampaignController

---

## Checklist de Implementação

```markdown
### Problema #1: Validação Zod no PATCH
- [ ] Importar `campaignSchemas` em `merchant.ts`
- [ ] Adicionar middleware `validate(campaignSchemas.update)` na linha 66
- [ ] Testar endpoint com dados inválidos (deve retornar 400)
- [ ] Testar endpoint com dados válidos (deve atualizar)

### Problema #2: Endpoint GET Individual
- [ ] Criar método `getByIdForMerchant()` no CampaignService
- [ ] Adicionar rota `GET /campaigns/:id` em merchant.ts
- [ ] Testar acesso à própria campanha (deve retornar 200)
- [ ] Testar acesso à campanha de outro merchant (deve retornar 403)
- [ ] Testar com Admin (deve retornar 200 para qualquer campanha)

### Problema #3: Schemas Centralizados
- [ ] Remover schema inline `createCampaignSchema` (linhas 15-34)
- [ ] Usar `campaignSchemas.create` na rota POST
- [ ] Testar criação com dados inválidos
- [ ] Verificar mensagens de erro em PT-BR

### Problema #4: Validação Cross-Field
- [ ] Adicionar validação de preços no service update
- [ ] Adicionar validação de datas no service update
- [ ] Escrever testes unitários para cenários edge case
- [ ] Testar update com `endAt` anterior a `startAt` (deve retornar 400)
- [ ] Testar update com `pricePromo >= priceOriginal` (deve retornar 400)

### Problema #5: MerchantController
- [ ] Criar arquivo `MerchantController.ts`
- [ ] Implementar métodos do controller
- [ ] Refatorar rotas para usar controller
- [ ] Atualizar testes (se existirem)
- [ ] Verificar logs de auditoria funcionando
```

---

## Impacto Estimado

| Problema | LOC Afetadas | Tempo Estimado | Risco de Regressão |
|----------|--------------|----------------|-------------------|
| #1 - Validação PATCH | 1 linha | 5 minutos | Baixo |
| #2 - GET Individual | ~50 linhas | 1 hora | Médio |
| #3 - Schemas Centralizados | ~20 linhas | 30 minutos | Baixo |
| #4 - Validação Cross-Field | ~20 linhas | 1 hora | Médio |
| #5 - MerchantController | ~200 linhas | 3 horas | Alto |

**Total:** ~291 linhas modificadas/adicionadas, ~5.5 horas de desenvolvimento

---

## Testes Recomendados

### Testes Unitários (Vitest)

```typescript
// backend/src/__tests__/services/CampaignService.test.ts

describe('CampaignService.update', () => {
  it('should reject update with pricePromo >= priceOriginal', async () => {
    await expect(
      campaignService.update(
        campaignId,
        { pricePromo: 100, priceOriginal: 50 },
        userId,
        UserRole.MERCHANT,
      ),
    ).rejects.toThrow('Preço promocional deve ser menor que o preço original');
  });

  it('should reject update with endAt <= startAt', async () => {
    await expect(
      campaignService.update(
        campaignId,
        { startAt: new Date('2025-12-31'), endAt: new Date('2025-12-01') },
        userId,
        UserRole.MERCHANT,
      ),
    ).rejects.toThrow('Data de término deve ser posterior à data de início');
  });

  it('should validate cross-field on partial update', async () => {
    // Campanha existente: startAt = 2025-12-01, endAt = 2025-12-31
    await expect(
      campaignService.update(
        campaignId,
        { endAt: new Date('2025-11-15') }, // Anterior ao startAt original
        userId,
        UserRole.MERCHANT,
      ),
    ).rejects.toThrow('Data de término deve ser posterior à data de início');
  });
});
```

### Testes de Integração (cURL)

```bash
# Teste 1: Atualizar campanha sem validação (deve falhar com 400)
curl -X PATCH http://localhost:3000/api/merchant/campaigns/UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AB",
    "pricePromo": 200,
    "priceOriginal": 100
  }'

# Esperado: 400 Bad Request com erros de validação Zod

# Teste 2: Buscar campanha individual (deve retornar 200)
curl -X GET http://localhost:3000/api/merchant/campaigns/UUID \
  -H "Authorization: Bearer $TOKEN"

# Esperado: 200 OK com dados completos da campanha

# Teste 3: Buscar campanha de outro merchant (deve retornar 403)
curl -X GET http://localhost:3000/api/merchant/campaigns/OTHER_UUID \
  -H "Authorization: Bearer $MERCHANT2_TOKEN"

# Esperado: 403 Forbidden
```

---

## Referências

### Arquivos Analisados

1. `backend/src/routes/merchant.ts` (153 linhas)
2. `backend/src/routes/campaigns.ts` (14 linhas)
3. `backend/src/controllers/CampaignController.ts` (91 linhas)
4. `backend/src/services/CampaignService.ts` (402 linhas)
5. `backend/src/schemas/campaign.schema.ts` (148 linhas)
6. `backend/src/middlewares/validate.ts` (32 linhas)
7. `backend/src/app.ts` (138 linhas)

### Padrões do Projeto (CLAUDE.md)

- **Validação:** SEMPRE usar Zod schemas via middleware `validate()`
- **Autenticação:** `authenticate` + `authorize(role)` para rotas protegidas
- **Errors:** Usar `AppError`, `NotFoundError`, `ForbiddenError`, `BadRequestError`
- **Logging:** Pino com contexto estruturado
- **Arquitetura:** Routes → Middleware → Controllers → Services → Prisma

### Endpoints de Campanha (Documentados)

**Públicos** (`/api/campaigns`):
- `GET /` - Listar campanhas (com filtros)
- `GET /:id` - Detalhes de campanha
- `POST /:id/favorite` - Favoritar campanha

**Merchant** (`/api/merchant/campaigns`):
- `POST /` - Criar campanha (DRAFT)
- `GET /` - Listar campanhas do merchant
- `PATCH /:id` - Atualizar campanha ⚠️ **SEM VALIDAÇÃO**
- `POST /:id/publish` - Publicar campanha
- `DELETE /:id` - Deletar campanha
- ❌ `GET /:id` - **AUSENTE**

---

## Conclusão

A investigação identificou problemas que variam de críticos (segurança/validação) a melhorias arquiteturais. A maioria dos problemas tem soluções diretas que seguem os padrões já estabelecidos no projeto.

**Recomendação:** Implementar correções na ordem de prioridade (CRÍTICA → ALTA → MÉDIA → BAIXA) para maximizar impacto com menor esforço.

**Próximos Passos:**
1. Revisar este relatório com o time
2. Priorizar problemas #1 e #2 para implementação imediata
3. Criar issues/tasks no sistema de tracking
4. Implementar e testar correções
5. Documentar mudanças na API (se houver)

---

**Relatório gerado por:** Apos (Backend Specialist)
**Ferramentas utilizadas:** Static Code Analysis, Pattern Matching, Architecture Review
**Arquivos analisados:** 7 arquivos principais + 10 arquivos de suporte
