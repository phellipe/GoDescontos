import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Breadcrumbs,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Campaign as CampaignIcon,
  TrendingUp as TrendingIcon,
  ConfirmationNumber as TicketIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as OfferIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import { useAuthStore } from '@/stores/authStore';

interface Campaign {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING_PAYMENT' | 'ENDED';
  priceOriginal: number;
  pricePromo: number;
  totalQuantity: number;
  redeemedQuantity: number;
  viewCount: number;
  category?: string;
  startAt: string;
  endAt: string;
}

type StatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'PENDING_PAYMENT' | 'ENDED';

const statusConfig = {
  DRAFT: {
    bgcolor: 'grey.100',
    color: 'grey.800',
    label: 'Rascunho',
  },
  PUBLISHED: {
    bgcolor: 'success.light',
    color: 'success.dark',
    label: 'Ativa',
  },
  PENDING_PAYMENT: {
    bgcolor: 'warning.light',
    color: 'warning.dark',
    label: 'Aguardando Pagamento',
  },
  ENDED: {
    bgcolor: 'error.light',
    color: 'error.dark',
    label: 'Encerrada',
  },
};

export default function MerchantCampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Fetch campaigns
  const { data: campaigns, isLoading, error } = useQuery(
    ['merchantCampaigns', user?.id],
    async () => {
      const response = await api.get('/merchant/campaigns');
      return response.data.data as Campaign[];
    },
    {
      enabled: !!user?.id,
    }
  );

  // Publish mutation
  const publishMutation = useMutation(
    async (campaignId: string) => {
      await api.post(`/merchant/campaigns/${campaignId}/publish`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['merchantCampaigns']);
        setSnackbar({ open: true, message: 'Campanha publicada com sucesso!' });
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Erro ao publicar campanha',
        });
      },
    }
  );

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];

    return campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTerm, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!campaigns) return { total: 0, active: 0, coupons: 0, revenue: 0 };

    return {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === 'PUBLISHED').length,
      coupons: campaigns.reduce((sum, c) => sum + c.redeemedQuantity, 0),
      revenue: campaigns.reduce(
        (sum, c) => sum + c.redeemedQuantity * Number(c.pricePromo),
        0
      ),
    };
  }, [campaigns]);

  const calculateDiscount = (original: number, promo: number) => {
    return Math.round(((Number(original) - Number(promo)) / Number(original)) * 100);
  };

  const calculateAvailability = (total: number, redeemed: number) => {
    return ((total - redeemed) / total) * 100;
  };

  const renderSkeletons = () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid item xs={12} md={6} lg={4} key={i}>
          <Card>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="80%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (!user) {
    return (
      <Layout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert severity="error">Você precisa estar logado como comerciante.</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Fade in timeout={400}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 3 }}
          >
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Início
            </Link>
            <Link
              to="/merchant/dashboard"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              Dashboard
            </Link>
            <Typography color="text.primary" fontWeight={600}>
              Minhas Campanhas
            </Typography>
          </Breadcrumbs>
        </Fade>

        {/* Header */}
        <Fade in timeout={500}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              mb: 4,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
              >
                Minhas Campanhas
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gerencie suas campanhas e acompanhe o desempenho
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/merchant/campaigns/create')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 12px 28px rgba(102, 126, 234, 0.5)',
                },
              }}
            >
              Nova Campanha
            </Button>
          </Box>
        </Fade>

        {/* Stats Section */}
        <Fade in timeout={600}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total de Campanhas"
                value={stats.total}
                icon={<CampaignIcon />}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Campanhas Ativas"
                value={stats.active}
                subtitle={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total`}
                icon={<TrendingIcon />}
                gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cupons Vendidos"
                value={stats.coupons}
                icon={<TicketIcon />}
                gradient="linear-gradient(135deg, #f093fb 0%, #fbbf24 100%)"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Receita Total"
                value={`R$ ${stats.revenue.toFixed(2)}`}
                icon={<MoneyIcon />}
                gradient="linear-gradient(135deg, #f5576c 0%, #f093fb 100%)"
              />
            </Grid>
          </Grid>
        </Fade>

        {/* Filters */}
        <Fade in timeout={800}>
          <Card sx={{ mb: 4, p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Buscar por título, descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Tabs
                  value={statusFilter}
                  onChange={(_, value) => setStatusFilter(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="Filtrar por status"
                >
                  <Tab label="Todas" value="ALL" />
                  <Tab label="Ativas" value="PUBLISHED" />
                  <Tab label="Rascunho" value="DRAFT" />
                  <Tab label="Aguardando" value="PENDING_PAYMENT" />
                  <Tab label="Encerradas" value="ENDED" />
                </Tabs>
              </Grid>
            </Grid>
          </Card>
        </Fade>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            Erro ao carregar campanhas. Tente novamente mais tarde.
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && renderSkeletons()}

        {/* Empty State */}
        {!isLoading && filteredCampaigns.length === 0 && (
          <EmptyState
            icon={<CampaignIcon sx={{ fontSize: 60 }} />}
            title={
              searchTerm || statusFilter !== 'ALL'
                ? 'Nenhuma campanha encontrada'
                : 'Você ainda não criou nenhuma campanha'
            }
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Tente ajustar os filtros de busca'
                : 'Crie sua primeira campanha e comece a vender cupons promocionais'
            }
            actionLabel={
              !searchTerm && statusFilter === 'ALL' ? 'Criar Primeira Campanha' : undefined
            }
            onAction={
              !searchTerm && statusFilter === 'ALL'
                ? () => navigate('/merchant/campaigns/create')
                : undefined
            }
          />
        )}

        {/* Campaigns Grid */}
        {!isLoading && filteredCampaigns.length > 0 && (
          <Grid container spacing={3}>
            {filteredCampaigns.map((campaign, index) => {
              const discount = calculateDiscount(campaign.priceOriginal, campaign.pricePromo);
              const availability = calculateAvailability(
                campaign.totalQuantity,
                campaign.redeemedQuantity
              );
              const availableCount = campaign.totalQuantity - campaign.redeemedQuantity;

              return (
                <Grid item xs={12} md={6} lg={4} key={campaign.id}>
                  <Fade in timeout={400 + index * 100}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    >
                      {/* Image + Badges */}
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="div"
                          sx={{
                            height: 200,
                            bgcolor: 'grey.200',
                            backgroundImage: campaign.imageUrl
                              ? `url(${campaign.imageUrl})`
                              : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {!campaign.imageUrl && (
                            <OfferIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                          )}
                        </CardMedia>

                        {/* Status Badge */}
                        <Chip
                          label={statusConfig[campaign.status].label}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            bgcolor: statusConfig[campaign.status].bgcolor,
                            color: statusConfig[campaign.status].color,
                            fontWeight: 'bold',
                          }}
                        />

                        {/* Discount Badge */}
                        <Chip
                          label={`-${discount}%`}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            bgcolor: 'error.main',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>

                      {/* Content */}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {campaign.title}
                        </Typography>

                        {campaign.shortDescription && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {campaign.shortDescription}
                          </Typography>
                        )}

                        {campaign.category && (
                          <Chip
                            label={campaign.category}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 2 }}
                          />
                        )}

                        {/* Metrics Grid */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Preço Original
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
                            >
                              R$ {Number(campaign.priceOriginal).toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Preço Promo
                            </Typography>
                            <Typography
                              variant="h6"
                              color="success.main"
                              fontWeight="bold"
                            >
                              R$ {Number(campaign.pricePromo).toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Visualizações
                            </Typography>
                            <Typography variant="body1" fontWeight="600">
                              {campaign.viewCount}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Vendidos
                            </Typography>
                            <Typography variant="body1" fontWeight="600">
                              {campaign.redeemedQuantity} / {campaign.totalQuantity}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Availability Progress */}
                        <Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              Disponibilidade
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {availableCount} disponíveis
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={availability}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                bgcolor:
                                  availability > 50
                                    ? 'success.main'
                                    : availability > 20
                                    ? 'warning.main'
                                    : 'error.main',
                              },
                            }}
                          />
                        </Box>
                      </CardContent>

                      {/* Actions */}
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Box>
                          <Tooltip title="Ver Detalhes">
                            <IconButton
                              component={Link}
                              to={`/merchant/campaigns/${campaign.id}`}
                              color="primary"
                              aria-label="Ver detalhes"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              component={Link}
                              to={`/merchant/campaigns/${campaign.id}/edit`}
                              color="primary"
                              aria-label="Editar campanha"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {campaign.status === 'DRAFT' && (
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            onClick={() => publishMutation.mutate(campaign.id)}
                            disabled={publishMutation.isLoading}
                          >
                            Publicar
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Layout>
  );
}
