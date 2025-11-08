import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import {
  Container,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Fade,
  Grow,
  Chip,
  Grid,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Stack,
  InputAdornment,
  Skeleton,
  Snackbar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  LocalOffer as OfferIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  PreviewOutlined as PreviewIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Celebration as CelebrationIcon,
  Visibility as VisibilityIcon,
  RestartAlt as RestartIcon,
  List as ListIcon,
} from '@mui/icons-material';
import Layout from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

// Form data interface
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

// Initial form state
const initialFormData: CampaignFormData = {
  title: '',
  description: '',
  shortDescription: '',
  category: 'Alimentação',
  tags: '',
  priceOriginal: '',
  pricePromo: '',
  totalQuantity: '100',
  city: '',
  state: '',
  startAt: '',
  endAt: '',
  termsConditions: '',
  imageUrl: '',
};

// Categories
const categories = [
  'Alimentação',
  'Fitness',
  'Beleza',
  'Serviços',
  'Entretenimento',
  'Educação',
  'Saúde',
  'Viagens',
];

// Steps configuration
const steps = [
  { label: 'Informações Básicas', icon: <OfferIcon /> },
  { label: 'Preços e Quantidade', icon: <MoneyIcon /> },
  { label: 'Localização e Validade', icon: <LocationIcon /> },
  { label: 'Revisão', icon: <PreviewIcon /> },
];

// LocalStorage key for draft
const DRAFT_KEY = 'campaign_draft';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuthStore();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  // Load campaign data if in edit mode
  const { data: campaignData, isLoading: loadingCampaign } = useQuery(
    ['campaign', id],
    async () => {
      if (!id) return null;
      const response = await api.get(`/merchant/campaigns/${id}`);
      return response.data.data;
    },
    { enabled: isEditMode }
  );

  // Populate form when campaign data is loaded
  useEffect(() => {
    if (campaignData && isEditMode) {
      setFormData({
        title: campaignData.title || '',
        description: campaignData.description || '',
        shortDescription: campaignData.shortDescription || '',
        category: campaignData.category || 'Alimentação',
        tags: campaignData.tags || '',
        priceOriginal: String(campaignData.priceOriginal || ''),
        pricePromo: String(campaignData.pricePromo || ''),
        totalQuantity: String(campaignData.totalQuantity || '100'),
        city: campaignData.city || '',
        state: campaignData.state || '',
        startAt: campaignData.startAt ? new Date(campaignData.startAt).toISOString().slice(0, 16) : '',
        endAt: campaignData.endAt ? new Date(campaignData.endAt).toISOString().slice(0, 16) : '',
        termsConditions: campaignData.termsConditions || '',
        imageUrl: campaignData.imageUrl || '',
      });
    }
  }, [campaignData, isEditMode]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setShowDraftDialog(true);
        // Store draft temporarily
        (window as any).__draftData = parsedDraft;
      } catch (error) {
        console.error('Failed to parse draft:', error);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (activeStep > 0 || formData.title || formData.description) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, activeStep }));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, activeStep]);

  // Handle draft restore
  const handleRestoreDraft = () => {
    const draft = (window as any).__draftData;
    if (draft) {
      setFormData(draft.formData || initialFormData);
      setActiveStep(draft.activeStep || 0);
    }
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    delete (window as any).__draftData;
    setShowDraftDialog(false);
  };

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData(initialFormData);
    setActiveStep(0);
    setTermsAccepted(false);
    setErrors({});
    setSnackbar({ open: true, message: 'Rascunho limpo com sucesso', severity: 'info' });
  };

  // Form field update
  const handleChange = (field: keyof CampaignFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation functions
  const validateStep0 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.title.length < 3) {
      newErrors.title = 'O título deve ter pelo menos 3 caracteres';
    }
    if (formData.title.length > 200) {
      newErrors.title = 'O título deve ter no máximo 200 caracteres';
    }
    if (formData.description.length < 10) {
      newErrors.description = 'A descrição deve ter pelo menos 10 caracteres';
    }
    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const priceOriginal = parseFloat(formData.priceOriginal);
    const pricePromo = parseFloat(formData.pricePromo);
    const quantity = parseInt(formData.totalQuantity);

    if (!formData.priceOriginal || priceOriginal <= 0) {
      newErrors.priceOriginal = 'O preço original deve ser maior que zero';
    }
    if (!formData.pricePromo || pricePromo <= 0) {
      newErrors.pricePromo = 'O preço promocional deve ser maior que zero';
    }
    if (pricePromo >= priceOriginal) {
      newErrors.pricePromo = 'O preço promocional deve ser menor que o original';
    }
    if (!formData.totalQuantity || quantity < 1) {
      newErrors.totalQuantity = 'A quantidade deve ser no mínimo 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.city.length < 2) {
      newErrors.city = 'A cidade deve ter pelo menos 2 caracteres';
    }
    if (!/^[A-Z]{2}$/.test(formData.state)) {
      newErrors.state = 'O estado deve ter exatamente 2 letras maiúsculas (ex: SP)';
    }
    if (!formData.startAt) {
      newErrors.startAt = 'Selecione a data de início';
    }
    if (!formData.endAt) {
      newErrors.endAt = 'Selecione a data de término';
    }
    if (formData.startAt && formData.endAt) {
      const start = new Date(formData.startAt);
      const end = new Date(formData.endAt);
      const now = new Date();

      if (start < now) {
        newErrors.startAt = 'A data de início não pode ser no passado';
      }
      if (end <= start) {
        newErrors.endAt = 'A data de término deve ser posterior à data de início';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!termsAccepted) {
      newErrors.terms = 'Você deve concordar com os termos de serviço';
      setSnackbar({ open: true, message: 'Você deve concordar com os termos de serviço', severity: 'error' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    let isValid = false;

    switch (activeStep) {
      case 0:
        isValid = validateStep0();
        break;
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit mutation
  const createMutation = useMutation(
    async () => {
      const payload = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        priceOriginal: parseFloat(formData.priceOriginal),
        pricePromo: parseFloat(formData.pricePromo),
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        city: formData.city,
        state: formData.state.toUpperCase(),
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        totalQuantity: parseInt(formData.totalQuantity),
        termsConditions: formData.termsConditions || undefined,
        imageUrl: formData.imageUrl || undefined,
      };

      const response = isEditMode
        ? await api.put(`/merchant/campaigns/${id}`, payload)
        : await api.post('/merchant/campaigns', payload);
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        setCreatedCampaignId(data.id);
        setShowSuccessDialog(true);
        localStorage.removeItem(DRAFT_KEY);
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Erro ao criar campanha',
          severity: 'error',
        });
      },
    }
  );

  const handleSubmit = () => {
    if (validateStep3()) {
      createMutation.mutate();
    }
  };

  // Helper calculations
  const discountPercent =
    formData.priceOriginal && formData.pricePromo
      ? Math.round(
          ((parseFloat(formData.priceOriginal) - parseFloat(formData.pricePromo)) /
            parseFloat(formData.priceOriginal)) *
            100
        )
      : 0;

  const campaignDuration =
    formData.startAt && formData.endAt
      ? Math.ceil(
          (new Date(formData.endAt).getTime() - new Date(formData.startAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  // Step components
  const renderStep0 = () => (
    <Fade in timeout={400}>
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          Informações Básicas
        </Typography>

        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Título da Campanha"
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={Boolean(errors.title)}
            helperText={errors.title || `${formData.title.length}/200 caracteres`}
            placeholder="Ex: Pizza Grande + Refrigerante 2L"
            inputProps={{ maxLength: 200 }}
          />

          <TextField
            fullWidth
            label="Descrição Curta"
            value={formData.shortDescription}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            helperText={`${formData.shortDescription.length}/100 caracteres - Resumo em uma linha`}
            placeholder="Chamada rápida e atrativa"
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            fullWidth
            label="Descrição Completa"
            required
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            error={Boolean(errors.description)}
            helperText={errors.description || 'Descreva todos os detalhes da promoção'}
            placeholder="Inclua informações sobre o produto/serviço, restrições, como utilizar o cupom, etc."
          />

          <TextField
            fullWidth
            select
            label="Categoria"
            required
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            error={Boolean(errors.category)}
            helperText={errors.category}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Tags"
            value={formData.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="pizza, delivery, italiano"
            helperText="Separe as tags por vírgula para facilitar a busca"
          />
        </Stack>
      </Box>
    </Fade>
  );

  const renderStep1 = () => (
    <Fade in timeout={400}>
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          Preços e Quantidade
        </Typography>

        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Preço Original"
                required
                value={formData.priceOriginal}
                onChange={(e) => handleChange('priceOriginal', e.target.value)}
                error={Boolean(errors.priceOriginal)}
                helperText={errors.priceOriginal}
                placeholder="89.90"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Preço Promocional"
                required
                value={formData.pricePromo}
                onChange={(e) => handleChange('pricePromo', e.target.value)}
                error={Boolean(errors.pricePromo)}
                helperText={errors.pricePromo}
                placeholder="49.90"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
          </Grid>

          {/* Discount Preview */}
          {discountPercent > 0 && (
            <Grow in>
              <Card
                sx={{
                  background:
                    discountPercent >= 30
                      ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                      : discountPercent >= 10
                      ? 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
                      : alpha(theme.palette.warning.main, 0.1),
                  border: `2px solid ${
                    discountPercent >= 30
                      ? theme.palette.success.main
                      : discountPercent >= 10
                      ? theme.palette.warning.main
                      : theme.palette.grey[400]
                  }`,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color={discountPercent >= 30 ? 'white' : 'text.primary'}>
                        -{discountPercent}%
                      </Typography>
                      <Typography variant="body2" color={discountPercent >= 30 ? 'white' : 'text.secondary'}>
                        Desconto aplicado
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: 'line-through' }}
                        color={discountPercent >= 30 ? 'white' : 'text.secondary'}
                      >
                        R$ {parseFloat(formData.priceOriginal).toFixed(2)}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color={discountPercent >= 30 ? 'white' : 'primary.main'}>
                        R$ {parseFloat(formData.pricePromo).toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grow>
          )}

          {discountPercent > 0 && discountPercent < 10 && (
            <Alert severity="warning" icon={<WarningIcon />}>
              Descontos menores que 10% podem ter menor engajamento. Considere aumentar o desconto para atrair mais
              clientes.
            </Alert>
          )}

          {discountPercent >= 30 && (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              Excelente! Descontos acima de 30% tendem a ter alto engajamento e conversão.
            </Alert>
          )}

          <TextField
            fullWidth
            type="number"
            label="Quantidade de Cupons"
            required
            value={formData.totalQuantity}
            onChange={(e) => handleChange('totalQuantity', e.target.value)}
            error={Boolean(errors.totalQuantity)}
            helperText={errors.totalQuantity || `Você irá gerar ${formData.totalQuantity || 0} cupons disponíveis`}
            inputProps={{ min: '1', step: '1' }}
          />

          <Alert severity="info" icon={<InfoIcon />}>
            Após a criação e publicação da campanha, {formData.totalQuantity || 0} cupons únicos com códigos QR serão
            gerados automaticamente.
          </Alert>
        </Stack>
      </Box>
    </Fade>
  );

  const renderStep2 = () => (
    <Fade in timeout={400}>
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          Localização e Validade
        </Typography>

        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Cidade"
                required
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                error={Boolean(errors.city)}
                helperText={errors.city}
                placeholder="São Paulo"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estado (UF)"
                required
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                error={Boolean(errors.state)}
                helperText={errors.state}
                placeholder="SP"
                inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Data de Início"
                required
                value={formData.startAt}
                onChange={(e) => handleChange('startAt', e.target.value)}
                error={Boolean(errors.startAt)}
                helperText={errors.startAt}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Data de Término"
                required
                value={formData.endAt}
                onChange={(e) => handleChange('endAt', e.target.value)}
                error={Boolean(errors.endAt)}
                helperText={errors.endAt}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {campaignDuration > 0 && (
            <Alert severity="info" icon={<InfoIcon />}>
              Duração da campanha: <strong>{campaignDuration} dia(s)</strong>
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Termos e Condições"
            value={formData.termsConditions}
            onChange={(e) => handleChange('termsConditions', e.target.value)}
            placeholder="Ex: Válido de segunda a quinta. Não acumulativo com outras promoções. Um cupom por CPF."
            helperText="Opcional, mas recomendado para evitar mal-entendidos"
          />

          <Box>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Imagem da Campanha
            </Typography>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => handleChange('imageUrl', url)}
              label=""
              placeholder="Clique para fazer upload da imagem da campanha"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Recomendado: 1200x630px para melhor visualização
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Fade>
  );

  const renderStep3 = () => (
    <Fade in timeout={400}>
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          Revisão e Confirmação
        </Typography>

        {/* Preview Card */}
        <Card
          sx={{
            mb: 4,
            border: `2px solid ${theme.palette.primary.main}`,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -12,
              left: 16,
              bgcolor: 'background.paper',
              px: 2,
            }}
          >
            <Typography variant="caption" fontWeight="bold" color="primary">
              PREVIEW DA CAMPANHA
            </Typography>
          </Box>

          {formData.imageUrl && (
            <Box
              component="img"
              src={formData.imageUrl}
              alt={formData.title}
              sx={{
                width: '100%',
                height: 300,
                objectFit: 'cover',
              }}
            />
          )}

          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Chip
                  label={formData.category}
                  size="small"
                  color="primary"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h4" fontWeight="bold">
                  {formData.title}
                </Typography>
                {formData.shortDescription && (
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {formData.shortDescription}
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Descrição
                </Typography>
                <Typography variant="body1">{formData.description}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      p: 2,
                      borderRadius: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      -{discountPercent}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Desconto
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ textDecoration: 'line-through' }}
                      color="text.secondary"
                    >
                      De: R$ {parseFloat(formData.priceOriginal).toFixed(2)}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      Por: R$ {parseFloat(formData.pricePromo).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Localização
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {formData.city}, {formData.state}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Validade
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {new Date(formData.startAt).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(formData.endAt).toLocaleDateString('pt-BR')}
                  </Typography>
                </Grid>
              </Grid>

              {formData.tags && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tags
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {formData.tags.split(',').map((tag, index) => (
                      <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {formData.termsConditions && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Termos e Condições
                  </Typography>
                  <Typography variant="body2">{formData.termsConditions}</Typography>
                </Box>
              )}

              <Alert severity="success" icon={<CheckCircleIcon />}>
                {formData.totalQuantity} cupons serão gerados após a publicação
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Terms Acceptance */}
        <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), mb: 3 }}>
          <CardContent>
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Concordo com os{' '}
                  <Link href="#" underline="hover">
                    termos de serviço
                  </Link>{' '}
                  e confirmo que todas as informações estão corretas
                </Typography>
              }
            />
          </CardContent>
        </Card>

        <Alert severity="info" icon={<InfoIcon />}>
          A campanha será criada como <strong>rascunho</strong>. Você poderá revisá-la e publicá-la quando estiver
          pronta.
        </Alert>
      </Box>
    </Fade>
  );

  return (
    <Layout>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
        <Container maxWidth="md">
          {/* Breadcrumbs */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 3 }}
          >
            <Link
              component="button"
              onClick={() => navigate('/merchant/dashboard')}
              underline="hover"
              color="inherit"
            >
              Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/merchant/campaigns')}
              underline="hover"
              color="inherit"
            >
              Campanhas
            </Link>
            {isEditMode && campaignData && (
              <Link
                component="button"
                onClick={() => navigate(`/merchant/campaigns/${id}`)}
                underline="hover"
                color="inherit"
              >
                {campaignData.title}
              </Link>
            )}
            <Typography color="text.primary">{isEditMode ? 'Editar' : 'Nova Campanha'}</Typography>
          </Breadcrumbs>

          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              {isEditMode ? 'Editar Campanha' : 'Nova Campanha'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isEditMode
                ? 'Atualize as informações da sua campanha'
                : 'Preencha as informações para criar sua campanha promocional'}
            </Typography>
          </Box>

          {/* Stepper */}
          <Card sx={{ mb: 4, overflow: 'visible' }}>
            <CardContent sx={{ px: { xs: 2, md: 4 } }}>
              <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 3 }}>
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor:
                              activeStep === index
                                ? 'primary.main'
                                : activeStep > index
                                ? 'success.main'
                                : 'grey.300',
                            color: 'white',
                            transition: 'all 0.3s',
                          }}
                        >
                          {activeStep > index ? <CheckCircleIcon /> : step.icon}
                        </Box>
                      )}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: { xs: 'none', sm: 'block' },
                          fontWeight: activeStep === index ? 600 : 400,
                        }}
                      >
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              {activeStep === 0 && renderStep0()}
              {activeStep === 1 && renderStep1()}
              {activeStep === 2 && renderStep2()}
              {activeStep === 3 && renderStep3()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<NavigateNextIcon sx={{ transform: 'rotate(180deg)' }} />}
              >
                Voltar
              </Button>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={clearDraft}
                  startIcon={<DeleteIcon />}
                >
                  Limpar
                </Button>
              )}
            </Stack>

            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NavigateNextIcon />}
                size="large"
              >
                Próximo
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!termsAccepted || createMutation.isLoading}
                startIcon={createMutation.isLoading ? <CircularProgress size={20} /> : (isEditMode ? <SaveIcon /> : <AddIcon />)}
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a4193 100%)',
                  },
                }}
              >
                {createMutation.isLoading
                  ? (isEditMode ? 'Salvando...' : 'Criando...')
                  : (isEditMode ? 'Salvar Alterações' : 'Criar Campanha')}
              </Button>
            )}
          </Stack>

          {createMutation.isLoading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
            </Box>
          )}
        </Container>
      </Box>

      {/* Draft Recovery Dialog */}
      <Dialog open={showDraftDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <SaveIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Rascunho Encontrado
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Encontramos um rascunho salvo anteriormente. Deseja continuar de onde parou?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDiscardDraft} color="error">
            Descartar
          </Button>
          <Button onClick={handleRestoreDraft} variant="contained" autoFocus>
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 5 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3,
            }}
          >
            <CelebrationIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {isEditMode ? 'Campanha Atualizada!' : 'Campanha Criada!'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {isEditMode
              ? 'Suas alterações foram salvas com sucesso. O que deseja fazer agora?'
              : 'Sua campanha foi criada com sucesso como rascunho. O que deseja fazer agora?'}
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(`/merchant/campaigns/${createdCampaignId}`)}
              startIcon={<VisibilityIcon />}
              fullWidth
            >
              Ver Campanha
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                setShowSuccessDialog(false);
                setFormData(initialFormData);
                setActiveStep(0);
                setTermsAccepted(false);
              }}
              startIcon={<RestartIcon />}
              fullWidth
            >
              Criar Outra Campanha
            </Button>
            <Button
              variant="text"
              size="large"
              onClick={() => navigate('/merchant/campaigns')}
              startIcon={<ListIcon />}
              fullWidth
            >
              Ir para Minhas Campanhas
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
