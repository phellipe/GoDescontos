# 🎨 Frontend - Redesign das Telas do Merchant

## 📋 Visão Geral

Redesenhar todas as telas de gerenciamento de campanhas do merchant usando **Material-UI** com design moderno, consistente com o padrão visual estabelecido em HomePage e CampaignDetailPage (consumer).

## 🎯 Objetivos

- ✅ Substituir Tailwind CSS por Material-UI em todas as telas merchant
- ✅ Implementar design system consistente com tema do app
- ✅ Melhorar UX com animações, feedback visual e responsividade
- ✅ Manter componentes reutilizáveis (Layout, StatCard, EmptyState)
- ✅ Implementar boas práticas: loading states, error handling, accessibility

## 🏗️ Arquitetura

### Stack Atual
- **React** + **TypeScript**
- **Material-UI (MUI)** v5
- **React Query** para data fetching
- **React Router** v6
- **Zustand** para state management

### Componentes Reutilizáveis Existentes
- `Layout.tsx` - Layout principal com AppBar e navegação
- `StatCard.tsx` - Card de estatísticas
- `EmptyState.tsx` - Estado vazio
- `CampaignCard.tsx` - Card de campanha (consumer)

### Theme Customizado
```typescript
// web/src/theme.ts
- Cores primárias: Gradientes roxo/azul (#667eea, #764ba2)
- Cores secundárias: Verde para success, vermelho para promoções
- Typography: Roboto, com pesos variados
- Spacing: 8px base
- Breakpoints: xs, sm, md, lg, xl
```

## 📦 Tarefas Detalhadas

### ✅ FASE 1: MerchantCampaignsPage (Lista de Campanhas)

**Arquivo:** `web/src/pages/merchant/MerchantCampaignsPage.tsx`

**Componentes a implementar:**
1. **Header Section**
   - Typography h4 para título
   - Botão gradient "Nova Campanha" com ícone Add
   - Breadcrumbs para navegação

2. **Stats Section (Novo!)**
   - Grid com 4 StatCards:
     - Total de Campanhas
     - Campanhas Ativas
     - Total de Cupons Vendidos
     - Receita Total
   - Usar componente StatCard reutilizável

3. **Filtros e Busca**
   - TextField com InputAdornment (SearchIcon)
   - Tabs para filtrar por status (Todas, Ativas, Rascunho, Encerradas)
   - Chip filters para categorias

4. **Lista de Campanhas**
   - Usar Card + CardContent para cada campanha
   - Implementar Grid responsivo (xs=12, md=6, lg=4)
   - Skeleton loading states
   - EmptyState quando não houver campanhas
   - Hover effects e transitions

5. **Item da Campanha**
   - CardMedia para imagem (150px height)
   - Status badge com Chip colorido
   - Grid de métricas (Views, Cupons, Receita)
   - Action buttons: Ver Detalhes, Editar, Publicar (se DRAFT)
   - Progress bar (LinearProgress) para disponibilidade

**Props e State:**
```typescript
interface Campaign {
  id: string;
  title: string;
  imageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ENDED';
  priceOriginal: number;
  pricePromo: number;
  totalQuantity: number;
  redeemedQuantity: number;
  viewCount: number;
  category?: string;
  startAt: string;
  endAt: string;
}
```

**APIs:**
- GET `/merchant/campaigns` - Lista campanhas do merchant
- GET `/merchant/analytics/summary` - Stats gerais (novo endpoint?)

---

### ✅ FASE 2: CreateCampaignPage (Criar/Editar Campanha)

**Arquivo:** `web/src/pages/merchant/CreateCampaignPage.tsx`

**Componentes a implementar:**
1. **Stepper (Wizard Multi-step)**
   - Usar MUI Stepper horizontal
   - 4 steps: Básico → Preços → Detalhes → Revisão
   - Botões Voltar/Próximo/Concluir

2. **Step 1: Informações Básicas**
   - TextField para título (required)
   - TextField para descrição curta (maxLength: 100)
   - TextField multiline para descrição completa
   - Select para categoria
   - Autocomplete para tags

3. **Step 2: Preços e Quantidade**
   - TextField type="number" para preço original
   - TextField type="number" para preço promocional
   - Box com preview do desconto % (real-time calculation)
   - TextField para quantidade de cupons
   - Alert com warning se desconto < 10%

4. **Step 3: Localização e Validade**
   - Autocomplete para cidade (integrar com API de cidades?)
   - Select para estado (UF)
   - DateTimePicker para startAt
   - DateTimePicker para endAt
   - TextField multiline para termos e condições
   - ImageUpload component (já existe)

5. **Step 4: Revisão e Confirmação**
   - Card com preview da campanha
   - Lista de todos os dados inseridos
   - Alert com custo estimado para publicação
   - Checkbox "Concordo com termos"
   - Botão final "Criar Campanha"

**Validações (Zod):**
```typescript
const campaignSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  priceOriginal: z.number().positive(),
  pricePromo: z.number().positive(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  totalQuantity: z.number().int().positive(),
  city: z.string().min(2),
  state: z.string().length(2),
})
```

**UX Enhancements:**
- Auto-save to localStorage (draft recovery)
- Real-time validation feedback
- Smooth transitions entre steps
- Loading overlay durante submit
- Success dialog com opções: Ver Campanha, Criar Outra, Publicar Agora

---

### ✅ FASE 3: merchant/CampaignDetailPage (Analytics e Detalhes)

**Arquivo:** `web/src/pages/merchant/CampaignDetailPage.tsx`

**Componentes a implementar:**
1. **Header com Preview**
   - Breadcrumbs
   - Card hero com imagem da campanha
   - Typography h3 para título
   - Status badge
   - Action buttons: Editar, Compartilhar, Pausar/Despausar, Excluir

2. **Grid de Analytics (Destaque!)**
   - Row 1: 4 StatCards principais
     - Total Views
     - Taxa de Conversão (%)
     - Cupons Vendidos / Total
     - Receita Gerada
   - Row 2: Gráficos
     - Line Chart: Views ao longo do tempo (7 dias)
     - Bar Chart: Cupons por status (Disponível, Reservado, Usado)
     - Pie Chart: Distribuição geográfica (se houver dados)

3. **Performance Metrics**
   - Card com LinearProgress para cada métrica:
     - Taxa de Redenção (redeemedCoupons / reservedCoupons)
     - Taxa de Conversão (reservedCoupons / views)
     - Disponibilidade (availableCoupons / totalCoupons)
   - Tooltip com explicação de cada métrica

4. **Tabela de Cupons Recentes**
   - TableContainer + Table do MUI
   - Colunas: Código, Cliente, Data/Hora, Status, Ações
   - Pagination
   - Filtro por status
   - Botão "Exportar CSV"

5. **Timeline de Atividades**
   - Timeline MUI component
   - Eventos: Criação, Publicação, Primeiro Cupom, Milestones
   - Icons diferentes para cada tipo de evento

6. **Sidebar com Ações Rápidas**
   - QR Code para campanha (gerar com qrcode.react)
   - Link público (copy to clipboard)
   - Share buttons (WhatsApp, Facebook, Twitter)
   - Download Report (PDF)

**APIs:**
- GET `/campaigns/:id` - Dados da campanha
- GET `/merchant/analytics/campaign/:id` - Analytics detalhadas
- GET `/merchant/campaigns/:id/coupons` - Lista de cupons (paginada)
- GET `/merchant/campaigns/:id/timeline` - Timeline de eventos

**Bibliotecas de Charts:**
- Usar **recharts** (já é popular, leve, e funciona bem com React)
```bash
npm install recharts
```

**Analytics Data Structure:**
```typescript
interface CampaignAnalytics {
  totalViews: number;
  uniqueViews: number;
  conversionRate: number; // %
  redemptionRate: number; // %
  revenue: number;
  availableCoupons: number;
  reservedCoupons: number;
  redeemedCoupons: number;
  favorites: number;
  viewsByDay: { date: string; views: number }[];
  couponsByStatus: { status: string; count: number }[];
  topCities: { city: string; count: number }[];
}
```

---

## 🎨 Design System

### Paleta de Cores (Status)
```typescript
const statusColors = {
  DRAFT: { bg: 'grey.100', text: 'grey.800', icon: EditIcon },
  PUBLISHED: { bg: 'success.light', text: 'success.dark', icon: CheckCircleIcon },
  PENDING_PAYMENT: { bg: 'warning.light', text: 'warning.dark', icon: PaymentIcon },
  ENDED: { bg: 'error.light', text: 'error.dark', icon: EventBusyIcon },
}
```

### Animações
- Fade in para cards (timeout: 400-800ms)
- Grow para dialogs
- Slide para snackbars
- Skeleton loading para dados assíncronos

### Responsividade
```typescript
// Breakpoints
xs: 0-600px   → 1 coluna
sm: 600-960px → 2 colunas
md: 960-1280px → 3 colunas
lg: 1280px+   → 4 colunas (stats)
```

### Acessibilidade
- aria-label em todos os IconButtons
- role="status" para loading states
- Contraste mínimo WCAG AA
- Keyboard navigation (tab order)

---

## 🧪 Testing Checklist

### Funcional
- [ ] Listagem carrega corretamente
- [ ] Filtros funcionam (status, busca, categoria)
- [ ] Criar campanha (wizard completo)
- [ ] Editar campanha existente
- [ ] Ver analytics detalhadas
- [ ] Publicar campanha DRAFT
- [ ] Pausar/despausar campanha
- [ ] Excluir campanha (com confirmação)

### UX/UI
- [ ] Loading states aparecem corretamente
- [ ] Empty states quando não há dados
- [ ] Error handling com Snackbar
- [ ] Animações suaves (Fade, Grow)
- [ ] Responsividade em mobile/tablet/desktop
- [ ] Dark mode (se implementado no futuro)

### Performance
- [ ] React Query cache funciona
- [ ] Imagens otimizadas (lazy loading)
- [ ] Debounce na busca
- [ ] Pagination em listas grandes
- [ ] Memoization em cálculos pesados

---

## 📚 Referências

### Material-UI Docs
- [Cards](https://mui.com/material-ui/react-card/)
- [Stepper](https://mui.com/material-ui/react-stepper/)
- [Table](https://mui.com/material-ui/react-table/)
- [Charts (Recharts)](https://recharts.org/)

### Exemplos no Projeto
- `web/src/pages/HomePage.tsx` - Hero section, stats grid
- `web/src/pages/CampaignDetailPage.tsx` - Layout, animations
- `web/src/pages/merchant/MerchantDashboardPage.tsx` - Stats cards

### API Endpoints
- Ver `backend/src/routes/*.ts`
- Ver `CURL_EXAMPLES.md`

---

## 🚀 Ordem de Execução

1. ✅ **MerchantCampaignsPage** (2-3h)
   - Mais simples, lista de cards
   - Base para outras telas

2. ✅ **CreateCampaignPage** (3-4h)
   - Wizard multi-step
   - Validações complexas

3. ✅ **merchant/CampaignDetailPage** (4-5h)
   - Analytics com charts
   - Tabela de cupons
   - Timeline

**Tempo Estimado Total: 9-12h**

---

## 💡 Notas Importantes

- Reutilizar componentes ao máximo (DRY principle)
- Manter consistência com theme.ts
- Usar React Query para cache e refetch
- Implementar error boundaries
- Logar erros com contexto (já usa Pino no backend)
- Não usar emojis em produção (só em placeholders)
- Validar TODOS os inputs com Zod
- Testar em Chrome, Firefox, Safari

---

**Última atualização:** {{ new Date().toISOString() }}
