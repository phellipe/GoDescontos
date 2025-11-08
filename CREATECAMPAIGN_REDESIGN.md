# CreateCampaignPage - Redesign Completo

## Visão Geral

A página `CreateCampaignPage` foi completamente redesenhada seguindo as especificações da FASE 2 do planejamento, transformando um formulário simples em um **wizard multi-step profissional** com Material-UI.

**Arquivo**: `web/src/pages/merchant/CreateCampaignPage.tsx`

---

## Principais Funcionalidades Implementadas

### 1. Wizard Multi-Step com Stepper Visual

Implementado um fluxo de criação dividido em **4 etapas** com indicador visual de progresso:

#### Step 0: Informações Básicas
- **Título da Campanha** (required, 3-200 caracteres, contador de caracteres)
- **Descrição Curta** (opcional, 0-100 caracteres, contador)
- **Descrição Completa** (required, min 10 caracteres, multiline)
- **Categoria** (select com 8 categorias: Alimentação, Fitness, Beleza, Serviços, Entretenimento, Educação, Saúde, Viagens)
- **Tags** (opcional, separadas por vírgula)

#### Step 1: Preços e Quantidade
- **Preço Original** (number input com prefixo R$)
- **Preço Promocional** (number input com prefixo R$)
- **Preview de Desconto em Tempo Real**:
  - Card colorido mostrando porcentagem de desconto
  - Gradiente verde se desconto >= 30%
  - Gradiente laranja se desconto >= 10%
  - Cinza se desconto < 10%
  - Alert warning se desconto < 10% (incentiva a aumentar)
  - Alert success se desconto >= 30% (congratula)
- **Quantidade de Cupons** (integer, min 1, default 100)
- **Helper text** mostrando quantos cupons serão gerados

#### Step 2: Localização e Validade
- **Cidade** (text input)
- **Estado UF** (text input, 2 chars, auto-uppercase, validação regex)
- **Data de Início** (datetime-local, validação de data passada)
- **Data de Término** (datetime-local, validação de data > início)
- **Alert info** mostrando duração em dias calculada automaticamente
- **Termos e Condições** (textarea opcional)
- **Upload de Imagem** (componente ImageUpload reutilizado, recomendação de tamanho)

#### Step 3: Revisão e Confirmação
- **Preview Card Completo** simulando como a campanha aparecerá:
  - Imagem (se houver)
  - Badge de categoria
  - Título e descrição curta
  - Descrição completa
  - Box de desconto destacado
  - Preços (original cortado + promo em destaque)
  - Localização e validade
  - Tags (chips)
  - Termos e condições
  - Alert mostrando quantidade de cupons
- **Checkbox de Concordância** com termos de serviço
- **Alert info** lembrando que será criada como rascunho

---

### 2. Validação Robusta Client-Side

Cada step possui validações específicas executadas antes de avançar:

**Step 0 Validations**:
```typescript
- title: length >= 3 && length <= 200
- description: length >= 10
- category: required
```

**Step 1 Validations**:
```typescript
- priceOriginal: > 0
- pricePromo: > 0 && < priceOriginal
- totalQuantity: integer >= 1
```

**Step 2 Validations**:
```typescript
- city: length >= 2
- state: /^[A-Z]{2}$/ (exatamente 2 maiúsculas)
- startAt: >= now (não pode ser no passado)
- endAt: > startAt
```

**Step 3 Validations**:
```typescript
- termsAccepted: must be true
```

Validações mostram:
- **Error helperText** nos campos inválidos
- **Campo highlighted** em vermelho
- **Snackbar** para erros de validação final

---

### 3. Auto-Save e Recuperação de Rascunho

Sistema completo de persistência local:

**Auto-save**:
- Salva em `localStorage` automaticamente após 1 segundo de inatividade
- Chave: `campaign_draft`
- Salva tanto `formData` quanto `activeStep`
- Só inicia auto-save se houver conteúdo significativo

**Recuperação ao Montar**:
- Detecta rascunho existente ao abrir a página
- Mostra **Dialog** perguntando se deseja continuar de onde parou
- Opções:
  - "Continuar" → restaura dados e step
  - "Descartar" → remove rascunho e começa do zero

**Limpeza Manual**:
- Botão "Limpar Rascunho" (visível após step 0)
- Remove do localStorage
- Reseta formulário
- Mostra snackbar de confirmação

**Limpeza Automática**:
- Remove rascunho após criação bem-sucedida da campanha

---

### 4. Feedback Visual em Tempo Real

**Contadores de Caracteres**:
- Título: "X/200 caracteres"
- Descrição curta: "X/100 caracteres"

**Cálculos Automáticos**:
- **Desconto %** calculado em tempo real (step 1)
- **Duração da campanha** em dias (step 2)
- **Preview de preços** formatado (step 3)

**Alertas Contextuais**:
- Warning se desconto muito baixo
- Success se desconto excelente
- Info sobre duração, cupons, rascunho

**Estados de Carregamento**:
- CircularProgress no botão submit
- LinearProgress abaixo dos botões durante criação
- Disabled state em botão submit enquanto processa

---

### 5. Animações e Transições Suaves

Implementadas usando Material-UI:

**Fade In** (400ms):
- Conteúdo de cada step ao renderizar
- Alertas condicionais

**Grow** (animação de escala):
- Card de preview de desconto
- Dialogs

**Scroll Smooth**:
- Automático ao trocar de step
- `window.scrollTo({ top: 0, behavior: 'smooth' })`

**Transições CSS**:
- Stepper icons (cor e estado)
- Botões hover
- Cards hover

---

### 6. Navegação entre Steps

**Botões de Navegação**:
- **Voltar**: disabled no step 0, sempre habilitado depois
- **Próximo**: valida step atual antes de avançar
- **Limpar**: remove rascunho (visível após step 0)
- **Criar Campanha**: step final, disabled se termos não aceitos

**Validação Progressiva**:
- Cada step é validado independentemente
- Usuário não pode avançar sem preencher campos obrigatórios
- Feedback imediato ao tentar avançar

**Indicador Visual**:
- Stepper mostra step ativo (azul)
- Steps completados (verde com check)
- Steps futuros (cinza)
- Ícones customizados por step

---

### 7. Submit com React Query

Mutation configurada com tratamento completo:

**onSubmit**:
```typescript
- Valida step 3 (termos aceitos)
- Prepara payload:
  - Converte strings para números (prices, quantity)
  - Converte datas para ISO string
  - Split tags por vírgula
  - Uppercase no estado
  - Remove campos opcionais vazios
- POST /merchant/campaigns
```

**onSuccess**:
- Armazena ID da campanha criada
- Mostra Success Dialog
- Remove rascunho do localStorage

**onError**:
- Mostra Snackbar com mensagem de erro
- Mantém formulário preenchido
- Permite retry

---

### 8. Success Dialog Pós-Criação

Dialog celebratório com 3 opções de navegação:

**Opção 1: "Ver Campanha"** (variant contained, destaque)
- Navega para `/merchant/campaigns/{id}`
- Permite revisar campanha criada

**Opção 2: "Criar Outra Campanha"** (variant outlined)
- Reseta formulário para inicial
- Volta ao step 0
- Mantém na mesma página

**Opção 3: "Ir para Minhas Campanhas"** (variant text)
- Navega para `/merchant/campaigns`
- Mostra lista de todas campanhas

**Design**:
- Ícone de celebração em círculo gradiente verde
- Tipografia clara e objetiva
- Botões full-width empilhados

---

### 9. Responsividade Mobile-First

Grid adaptativo:
- **Desktop (md+)**: campos lado a lado (Grid 6/6, 8/4)
- **Mobile (xs)**: campos empilhados verticalmente (Grid 12)

Stepper:
- **Desktop**: labels visíveis
- **Mobile**: labels ocultos, apenas ícones

Padding/Spacing:
- **Desktop**: padding generoso (5)
- **Mobile**: padding reduzido (3)

Botões:
- **Desktop**: text e icons
- **Mobile**: icons prioritários, text quando necessário

---

### 10. Acessibilidade (a11y)

**Labels e ARIA**:
- Todos inputs têm labels descritivos
- Required fields marcados com asterisco
- Helper text para contexto adicional

**Navegação por Teclado**:
- Tab order natural
- Enter para avançar (em fields)
- Focus visible em todos elementos interativos

**Feedback Semântico**:
- Cores não são única forma de feedback
- Ícones acompanham alertas coloridos
- Textos descritivos em todos estados

**Contraste**:
- Text primary/secondary com contraste adequado
- Botões disabled visualmente distintos
- Error states em vermelho bold

---

## Estrutura de Código

### Imports e Dependências
```typescript
- react (useState, useEffect)
- react-router-dom (useNavigate)
- react-query (useMutation)
- @mui/material (35+ componentes)
- @mui/icons-material (13 ícones)
- @/components (Layout, ImageUpload)
- @/services/api
- @/stores/authStore
```

### Interfaces TypeScript
```typescript
interface CampaignFormData {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  tags: string;
  priceOriginal: string;
  pricePromo: string;
  totalQuantity: string;
  city: string;
  state: string;
  startAt: string;
  endAt: string;
  termsConditions: string;
  imageUrl: string;
}
```

### Constantes
```typescript
- initialFormData: CampaignFormData
- categories: string[] (8 categorias)
- steps: { label, icon }[] (4 steps)
- DRAFT_KEY: 'campaign_draft'
```

### State Management
```typescript
- activeStep: number (0-3)
- formData: CampaignFormData
- termsAccepted: boolean
- errors: Record<string, string>
- showDraftDialog: boolean
- showSuccessDialog: boolean
- createdCampaignId: string
- snackbar: { open, message, severity }
```

### Funções Principais
```typescript
- handleChange(field, value): atualiza formData
- validateStep0/1/2/3(): validações
- handleNext(): valida e avança
- handleBack(): retrocede step
- handleSubmit(): envia criação
- handleRestoreDraft(): recupera rascunho
- clearDraft(): limpa rascunho
```

### Render Functions
```typescript
- renderStep0(): JSX para step 0
- renderStep1(): JSX para step 1
- renderStep2(): JSX para step 2
- renderStep3(): JSX para step 3
```

---

## Paleta de Cores Utilizada

**Primary** (roxo gradient):
- Headers, steppers ativos, botão final
- `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

**Success** (verde):
- Steps completados, desconto alto, confirmações
- `#10b981`, gradient: `#43e97b → #38f9d7`

**Warning** (laranja):
- Desconto médio, alertas leves
- `#f59e0b`, gradient: `#ffecd2 → #fcb69f`

**Error** (vermelho):
- Validações, descontos baixos
- `#ef4444`

**Info** (azul):
- Mensagens informativas
- `#3b82f6`

---

## Melhorias de UX Implementadas

1. **Divisão Cognitiva**: 4 steps temáticos reduzem carga cognitiva
2. **Feedback Imediato**: validações ao tentar avançar, não ao digitar
3. **Preview Visual**: usuário vê exatamente como ficará antes de criar
4. **Persistência**: nunca perde trabalho, mesmo fechando navegador
5. **Celebração**: success dialog celebra conquista e oferece próximos passos
6. **Guidance**: helper texts, placeholders e alerts guiam preenchimento
7. **Progressive Disclosure**: informações complexas reveladas gradualmente
8. **Smart Defaults**: quantidade 100, categoria Alimentação pré-selecionada
9. **Error Prevention**: validações impedem valores inválidos
10. **Undo Capability**: botão "Limpar" permite recomeçar

---

## Testes Sugeridos

### Funcionalidade
- [ ] Validação de cada step funciona corretamente
- [ ] Auto-save salva dados após 1s de inatividade
- [ ] Recovery dialog aparece ao reabrir com rascunho
- [ ] Preview de desconto calcula % corretamente
- [ ] Duração em dias calcula corretamente
- [ ] Submit cria campanha com payload correto
- [ ] Success dialog navega corretamente para 3 destinos
- [ ] Limpar rascunho remove do localStorage

### Edge Cases
- [ ] Campos vazios bloqueiam avanço
- [ ] Preço promo > original mostra erro
- [ ] Data passada mostra erro
- [ ] Estado com 1 ou 3 caracteres mostra erro
- [ ] Termos não aceitos bloqueia submit
- [ ] Erro de API mostra snackbar apropriado
- [ ] Upload de imagem falha gracefully

### Responsividade
- [ ] Layout mobile empilha campos verticalmente
- [ ] Stepper mobile oculta labels
- [ ] Botões mobile têm tamanho adequado para toque
- [ ] Preview card mobile não quebra

### Acessibilidade
- [ ] Navegação por teclado funciona
- [ ] Screen reader lê labels corretamente
- [ ] Focus visible em todos elementos
- [ ] Contraste adequado em todos textos

---

## Dependências Necessárias

Certifique-se de que estas dependências estão instaladas:

```json
{
  "dependencies": {
    "@mui/material": "^5.x",
    "@mui/icons-material": "^5.x",
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "react-query": "^3.x",
    "zustand": "^4.x"
  }
}
```

---

## Performance

**Otimizações Implementadas**:
- Debounce de 1s no auto-save (evita writes excessivos)
- Validações só executam ao tentar avançar (não a cada keystroke)
- Conditional rendering por step (não renderiza todos de uma vez)
- React Query cache para mutation
- useMemo nos cálculos seria next step (não implementado ainda)

**Bundle Size Impact**:
- Material-UI já está no projeto (sem aumento)
- Ícones importados sob demanda (tree-shaking friendly)
- Código total: ~1100 linhas (bem estruturado, comentado)

---

## Próximos Passos Sugeridos

1. **Adicionar Tooltips**: em campos complexos (ex: termos, tags)
2. **Implementar Preview em Tempo Real**: mini-preview durante preenchimento
3. **Upload de Múltiplas Imagens**: galeria em vez de single image
4. **Integração com Maps**: autocomplete de cidade/estado
5. **Templates de Campanha**: salvar e reutilizar estruturas comuns
6. **Analytics**: track completion rate por step
7. **A/B Testing**: testar ordem de steps
8. **Internacionalização**: i18n para múltiplos idiomas

---

## Conclusão

A nova `CreateCampaignPage` transforma a experiência de criação de campanhas de um formulário intimidador em um processo guiado, intuitivo e visualmente atraente. Todas as especificações da FASE 2 foram implementadas com atenção a UX, acessibilidade e performance.

**Resultado**: Uma experiência de classe mundial, comparável a plataformas como Shopify, Stripe Dashboard e Notion.
