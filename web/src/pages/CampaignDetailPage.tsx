import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Skeleton,
  Alert,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Breadcrumbs,
  Link,
  LinearProgress,
  Fade,
  Grow,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  LocalOffer as OfferIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Store as StoreIcon,
  Phone as PhoneIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  NavigateNext as NavigateNextIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import Layout from '@/components/Layout';
import CampaignCard from '@/components/CampaignCard';
import { useAuthStore } from '@/stores/authStore';

// Countdown Timer Hook
function useCountdown(endDate: Date) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [endDate]);

  return timeLeft;
}

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch campaign details
  const { data: campaign, isLoading } = useQuery(
    ['campaign', id],
    async () => {
      const response = await api.get(`/campaigns/${id}`);
      return response.data.data;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        // Update page title dynamically for SEO
        document.title = `${data.title} - GoDescontos`;
      },
    }
  );

  // Fetch related campaigns (same category or city)
  const { data: relatedCampaigns } = useQuery(
    ['relatedCampaigns', campaign?.category, campaign?.city],
    async () => {
      if (!campaign) return [];
      const response = await api.get('/campaigns', {
        params: {
          category: campaign.category,
          city: campaign.city,
          limit: 3,
        },
      });
      // Filter out current campaign
      return response.data.data.filter((c: any) => c.id !== campaign.id).slice(0, 3);
    },
    {
      enabled: !!campaign,
    }
  );

  const { data: isFavorited } = useQuery(
    ['isFavorited', id],
    async () => {
      try {
        const response = await api.get('/favorites');
        return response.data.data.some((fav: any) => fav.campaignId === id);
      } catch {
        return false;
      }
    },
    {
      enabled: !!user && !!id,
    }
  );

  const reserveMutation = useMutation(
    async () => {
      const response = await api.post('/coupons/reserve', { campaignId: id });
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myCoupons');
        setReserveDialogOpen(false);
        setSnackbar({
          open: true,
          message: 'Cupom reservado com sucesso!',
          severity: 'success',
        });
        setTimeout(() => navigate('/my-coupons'), 2000);
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Erro ao reservar cupom',
          severity: 'error',
        });
      },
    }
  );

  const toggleFavoriteMutation = useMutation(
    async () => {
      if (isFavorited) {
        await api.delete(`/favorites/${id}`);
      } else {
        await api.post('/favorites', { campaignId: id });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['isFavorited', id]);
        queryClient.invalidateQueries('myFavorites');
        setSnackbar({
          open: true,
          message: isFavorited ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
          severity: 'success',
        });
      },
      onError: () => {
        setSnackbar({
          open: true,
          message: 'Erro ao atualizar favoritos',
          severity: 'error',
        });
      },
    }
  );

  // Enhanced share handlers
  const handleShare = async (platform?: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    if (!campaign) return;

    const url = window.location.href;
    const text = `Confira essa promoção: ${campaign.title} - Economize ${Math.round(
      ((Number(campaign.priceOriginal) - Number(campaign.pricePromo)) / Number(campaign.priceOriginal)) * 100
    )}%!`;

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setSnackbar({
        open: true,
        message: 'Link copiado para a área de transferência',
        severity: 'success',
      });
    } else {
      // Native share API fallback
      if (navigator.share) {
        try {
          await navigator.share({
            title: campaign.title,
            text: text,
            url: url,
          });
        } catch (error) {
          console.log('Error sharing:', error);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Container>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Campanha não encontrada</Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mt: 2 }}>
            Voltar para Home
          </Button>
        </Container>
      </Layout>
    );
  }

  const availableCoupons = campaign.totalQuantity - campaign.redeemedQuantity;
  const availabilityPercent = (availableCoupons / campaign.totalQuantity) * 100;
  const discountPercent = Math.round(
    ((Number(campaign.priceOriginal) - Number(campaign.pricePromo)) / Number(campaign.priceOriginal)) * 100
  );
  const isExpired = new Date(campaign.endAt) < new Date();
  const isSoldOut = availableCoupons <= 0;

  // Check if campaign is ending soon (less than 3 days)
  const daysUntilEnd = Math.ceil((new Date(campaign.endAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isEndingSoon = daysUntilEnd > 0 && daysUntilEnd <= 3;

  // Use countdown timer for campaigns ending soon
  const countdown = useCountdown(new Date(campaign.endAt));

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Fade in timeout={400}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 3 }}
          >
            <Link
              component={RouterLink}
              to="/"
              underline="hover"
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              Início
            </Link>
            {campaign.category && (
              <Link
                component={RouterLink}
                to={`/?search=${campaign.category}`}
                underline="hover"
                color="inherit"
              >
                {campaign.category}
              </Link>
            )}
            <Typography color="text.primary" fontWeight={600}>
              {campaign.title}
            </Typography>
          </Breadcrumbs>
        </Fade>

        {/* Hero Section */}
        <Grow in timeout={600}>
          <Card sx={{ mb: 3, overflow: 'hidden', position: 'relative' }}>
            <Box
              sx={{
                height: { xs: 300, md: 450 },
                bgcolor: 'grey.200',
                backgroundImage: campaign.imageUrl ? `url(${campaign.imageUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: campaign.imageUrl
                    ? 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)'
                    : 'none',
                },
              }}
            >
              {!campaign.imageUrl && (
                <Typography variant="h1" sx={{ fontSize: { xs: '72px', md: '120px' } }}>
                  🎫
                </Typography>
              )}

              {/* Discount Badge - Enhanced */}
              <Chip
                label={`-${discountPercent}% OFF`}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                  color: 'white',
                  fontSize: { xs: '1rem', md: '1.4rem' },
                  fontWeight: 'bold',
                  height: { xs: 40, md: 56 },
                  px: { xs: 2, md: 3 },
                  boxShadow: '0 8px 16px rgba(245, 87, 108, 0.4)',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      transform: 'scale(1)',
                    },
                    '50%': {
                      transform: 'scale(1.05)',
                    },
                  },
                }}
              />

              {/* Ending Soon Badge */}
              {isEndingSoon && !isExpired && !isSoldOut && (
                <Chip
                  icon={<TimeIcon />}
                  label="Termina em breve!"
                  color="warning"
                  sx={{
                    position: 'absolute',
                    top: 80,
                    right: 16,
                    fontWeight: 'bold',
                    animation: 'blink 1.5s ease-in-out infinite',
                    '@keyframes blink': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }}
                />
              )}

              {/* Action Buttons */}
              <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1 }}>
                {user && (
                  <IconButton
                    onClick={() => toggleFavoriteMutation.mutate()}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: 'white',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s',
                    }}
                    aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {isFavorited ? (
                      <FavoriteIcon color="error" />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                )}
                <IconButton
                  onClick={() => handleShare()}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      bgcolor: 'white',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                  aria-label="Compartilhar"
                >
                  <ShareIcon />
                </IconButton>
              </Box>
            </Box>

          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                {/* Title and Category */}
                <Fade in timeout={800}>
                  <Box sx={{ mb: 3 }}>
                    {campaign.category && (
                      <Chip
                        label={campaign.category}
                        color="primary"
                        sx={{ mb: 2, fontWeight: 600 }}
                      />
                    )}
                    <Typography
                      variant="h3"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                    >
                      {campaign.title}
                    </Typography>
                    {campaign.shortDescription && (
                      <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}>
                        {campaign.shortDescription}
                      </Typography>
                    )}
                  </Box>
                </Fade>

                {/* Countdown Timer for ending soon campaigns */}
                {isEndingSoon && !isExpired && !isSoldOut && (
                  <Fade in timeout={1000}>
                    <Box
                      sx={{
                        mb: 3,
                        p: 3,
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'warning.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TimeIcon sx={{ mr: 1, color: 'warning.dark' }} />
                        <Typography variant="subtitle1" fontWeight="bold" color="warning.dark">
                          Oferta termina em:
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {[
                          { value: countdown.days, label: 'Dias' },
                          { value: countdown.hours, label: 'Horas' },
                          { value: countdown.minutes, label: 'Min' },
                          { value: countdown.seconds, label: 'Seg' },
                        ].map((item, index) => (
                          <Grid item xs={3} key={index}>
                            <Box
                              sx={{
                                bgcolor: 'white',
                                borderRadius: 1.5,
                                p: 1.5,
                                textAlign: 'center',
                              }}
                            >
                              <Typography variant="h4" fontWeight="bold" color="warning.dark">
                                {String(item.value).padStart(2, '0')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {item.label}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Fade>
                )}

                {/* Price Section - Enhanced */}
                <Fade in timeout={1000}>
                  <Box
                    sx={{
                      mb: 3,
                      p: 3,
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'success.light',
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          De{' '}
                          <Typography
                            component="span"
                            sx={{ textDecoration: 'line-through', fontWeight: 500 }}
                          >
                            R$ {Number(campaign.priceOriginal).toFixed(2)}
                          </Typography>
                        </Typography>
                        <Typography
                          variant="h3"
                          color="success.dark"
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}
                        >
                          R$ {Number(campaign.pricePromo).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ textAlign: { sm: 'right' } }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Você economiza
                          </Typography>
                          <Typography
                            variant="h5"
                            color="success.dark"
                            fontWeight="bold"
                            sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                          >
                            R$ {(Number(campaign.priceOriginal) - Number(campaign.pricePromo)).toFixed(2)}
                          </Typography>
                          <Chip
                            label={`${discountPercent}% de desconto`}
                            size="small"
                            sx={{
                              mt: 1,
                              bgcolor: 'success.main',
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>

                <Divider sx={{ my: 3 }} />

                {/* Description */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Sobre a Promoção
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {campaign.description || campaign.shortDescription}
                  </Typography>
                </Box>

                {/* Terms */}
                {campaign.termsConditions && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Termos e Condições
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {campaign.termsConditions}
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Sidebar */}
              <Grid item xs={12} md={4}>
                {/* Reserve Button - Enhanced */}
                <Fade in timeout={1200}>
                  <Card
                    variant="outlined"
                    sx={{
                      mb: 3,
                      p: 3,
                      position: { md: 'sticky' },
                      top: { md: 90 },
                      borderWidth: 2,
                      borderColor: isExpired || isSoldOut ? 'divider' : 'primary.main',
                    }}
                  >
                    {isExpired ? (
                      <Alert severity="error" icon={<ScheduleIcon />}>
                        Promoção expirada
                      </Alert>
                    ) : isSoldOut ? (
                      <Alert severity="warning" icon={<OfferIcon />}>
                        Cupons esgotados
                      </Alert>
                    ) : (
                      <>
                        {/* Availability Progress */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                              Disponibilidade
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {availableCoupons} de {campaign.totalQuantity}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={availabilityPercent}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background:
                                  availabilityPercent > 50
                                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                    : availabilityPercent > 20
                                    ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                                    : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                              },
                            }}
                          />
                          {availabilityPercent < 30 && (
                            <Typography variant="caption" color="error" fontWeight={600} sx={{ mt: 1, display: 'block' }}>
                              Corra! Últimas unidades
                            </Typography>
                          )}
                        </Box>

                        {user ? (
                          <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() => setReserveDialogOpen(true)}
                            startIcon={<OfferIcon />}
                            sx={{
                              py: 1.5,
                              fontSize: '1.125rem',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                boxShadow: '0 12px 28px rgba(102, 126, 234, 0.5)',
                              },
                            }}
                          >
                            Reservar Cupom
                          </Button>
                        ) : (
                          <>
                            <Alert severity="info" sx={{ mb: 2 }} icon={<CheckIcon />}>
                              Faça login para reservar
                            </Alert>
                            <Button
                              variant="contained"
                              fullWidth
                              size="large"
                              onClick={() => navigate('/login')}
                              sx={{ py: 1.5 }}
                            >
                              Fazer Login
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </Card>
                </Fade>

                {/* Campaign Info - Enhanced */}
                <Fade in timeout={1400}>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Informações
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <ScheduleIcon sx={{ mr: 1.5, color: 'primary.main', mt: 0.3 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Válido até
                            </Typography>
                            <Typography variant="body1" fontWeight="600">
                              {new Date(campaign.endAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <LocationIcon sx={{ mr: 1.5, color: 'primary.main', mt: 0.3 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Localização
                            </Typography>
                            <Typography variant="body1" fontWeight="600">
                              {campaign.city}, {campaign.state}
                            </Typography>
                          </Box>
                        </Box>

                        {campaign.merchant && (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <StoreIcon sx={{ mr: 1.5, color: 'primary.main', mt: 0.3 }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Estabelecimento
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="body1" fontWeight="600">
                                    {campaign.merchant.name}
                                  </Typography>
                                  {campaign.merchant.isApproved && (
                                    <VerifiedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                  )}
                                </Box>
                              </Box>
                            </Box>

                            {campaign.merchant.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <PhoneIcon sx={{ mr: 1.5, color: 'primary.main', mt: 0.3 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Telefone
                                  </Typography>
                                  <Typography variant="body1" fontWeight="600">
                                    {campaign.merchant.phone}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Fade>

                {/* Share Options - Enhanced */}
                <Fade in timeout={1600}>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Compartilhar
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          onClick={() => handleShare('facebook')}
                          sx={{
                            bgcolor: '#1877f2',
                            color: 'white',
                            '&:hover': { bgcolor: '#145dbf' },
                          }}
                          aria-label="Compartilhar no Facebook"
                        >
                          <FacebookIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleShare('twitter')}
                          sx={{
                            bgcolor: '#1da1f2',
                            color: 'white',
                            '&:hover': { bgcolor: '#0c85d0' },
                          }}
                          aria-label="Compartilhar no Twitter"
                        >
                          <TwitterIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleShare('whatsapp')}
                          sx={{
                            bgcolor: '#25d366',
                            color: 'white',
                            '&:hover': { bgcolor: '#1ebe57' },
                          }}
                          aria-label="Compartilhar no WhatsApp"
                        >
                          <WhatsAppIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleShare('copy')}
                          sx={{
                            bgcolor: 'grey.200',
                            color: 'text.primary',
                            '&:hover': { bgcolor: 'grey.300' },
                          }}
                          aria-label="Copiar link"
                        >
                          <CopyIcon />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                </Fade>

                {/* Safety Notice */}
                <Fade in timeout={1800}>
                  <Alert severity="info" icon={<CheckIcon />}>
                    Seu cupom será reservado e você poderá usá-lo no estabelecimento apresentando o código ou QR code.
                  </Alert>
                </Fade>
              </Grid>
            </Grid>
          </CardContent>
          </Card>
        </Grow>

        {/* Related Campaigns Section */}
        {relatedCampaigns && relatedCampaigns.length > 0 && (
          <Fade in timeout={2000}>
            <Box sx={{ mt: 6 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Ofertas Relacionadas
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Outras promoções que você pode gostar
              </Typography>
              <Grid container spacing={3}>
                {relatedCampaigns.map((relatedCampaign: any, index: number) => (
                  <Grid item xs={12} sm={6} md={4} key={relatedCampaign.id}>
                    <Fade in timeout={400 + index * 100}>
                      <div>
                        <CampaignCard
                          campaign={relatedCampaign}
                          onViewDetails={() => navigate(`/campaigns/${relatedCampaign.id}`)}
                        />
                      </div>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        )}
      </Container>

      {/* Mobile Sticky CTA */}
      {isMobile && !isExpired && !isSoldOut && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 2,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
            zIndex: 1100,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Preço promocional
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  R$ {Number(campaign.pricePromo).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                {user ? (
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => setReserveDialogOpen(true)}
                    startIcon={<OfferIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    Reservar
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      {/* Reserve Dialog */}
      <Dialog open={reserveDialogOpen} onClose={() => setReserveDialogOpen(false)}>
        <DialogTitle>Confirmar Reserva</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Deseja reservar um cupom para <strong>{campaign.title}</strong>?
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Valor do cupom
            </Typography>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              R$ {Number(campaign.pricePromo).toFixed(2)}
            </Typography>
          </Box>
          <Alert severity="warning">
            O cupom ficará reservado para você e deverá ser usado até {new Date(campaign.endAt).toLocaleDateString('pt-BR')}.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => reserveMutation.mutate()}
            disabled={reserveMutation.isLoading}
          >
            {reserveMutation.isLoading ? 'Reservando...' : 'Confirmar Reserva'}
          </Button>
        </DialogActions>
      </Dialog>

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
