import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
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
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  LocalOffer as CouponIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingIcon,
  Explore as ExploreIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: coupons, isLoading: couponsLoading } = useQuery('myCoupons', async () => {
    const response = await api.get('/coupons/my');
    return response.data.data;
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery('myFavorites', async () => {
    try {
      const response = await api.get('/favorites');
      return response.data.data;
    } catch (error) {
      return [];
    }
  });

  const { data: campaigns } = useQuery('trendingCampaigns', async () => {
    const response = await api.get('/campaigns?limit=3');
    return response.data.data;
  });

  // Calcular estatísticas
  const activeCoupons = coupons?.filter((c: any) =>
    c.status === 'RESERVED' && new Date(c.expiresAt) > new Date()
  ) || [];

  const usedCoupons = coupons?.filter((c: any) => c.status === 'REDEEMED') || [];
  const expiredCoupons = coupons?.filter((c: any) =>
    c.status === 'RESERVED' && new Date(c.expiresAt) <= new Date()
  ) || [];

  const totalSavings = usedCoupons.reduce((sum: number, coupon: any) => {
    return sum + (Number(coupon.campaign.priceOriginal) - Number(coupon.campaign.pricePromo));
  }, 0);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Cabeçalho de Boas-vindas */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bem-vindo ao seu painel de descontos e cupons
          </Typography>
        </Box>

        {/* Cards de Estatísticas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                    <CouponIcon />
                  </Avatar>
                  <Typography variant="h3" fontWeight="bold">
                    {activeCoupons.length}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Cupons Ativos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                    <CheckIcon />
                  </Avatar>
                  <Typography variant="h3" fontWeight="bold">
                    {usedCoupons.length}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Cupons Usados
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                    <FavoriteIcon />
                  </Avatar>
                  <Typography variant="h3" fontWeight="bold">
                    {favorites?.length || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Favoritos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                    <TrendingIcon />
                  </Avatar>
                  <Typography variant="h3" fontWeight="bold">
                    R$ {totalSavings.toFixed(0)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Economizado
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Meus Cupons Ativos */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Meus Cupons Ativos
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/my-coupons')}
                  >
                    Ver Todos
                  </Button>
                </Box>

                {couponsLoading ? (
                  <Box>
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                      </Box>
                    ))}
                  </Box>
                ) : activeCoupons.length === 0 ? (
                  <Alert severity="info" icon={<ExploreIcon />}>
                    Você ainda não tem cupons ativos. Explore as promoções disponíveis!
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activeCoupons.slice(0, 3).map((coupon: any) => (
                      <Card
                        key={coupon.id}
                        variant="outlined"
                        sx={{
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 3,
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {coupon.campaign.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {coupon.campaign.merchant.name}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Chip
                                  label={`Código: ${coupon.code}`}
                                  size="small"
                                  icon={<QrCodeIcon />}
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={`Expira: ${new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}`}
                                  size="small"
                                  icon={<ScheduleIcon />}
                                  color="warning"
                                  variant="outlined"
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                              <Typography variant="h5" color="success.main" fontWeight="bold">
                                R$ {Number(coupon.campaign.pricePromo).toFixed(2)}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textDecoration: 'line-through' }}
                              >
                                R$ {Number(coupon.campaign.priceOriginal).toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Promoções em Destaque */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Promoções em Destaque
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {campaigns && campaigns.length > 0 ? (
                  <Grid container spacing={2}>
                    {campaigns.slice(0, 3).map((campaign: any) => (
                      <Grid item xs={12} sm={4} key={campaign.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          }}
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          <Box
                            sx={{
                              height: 120,
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundImage: campaign.imageUrl ? `url(${campaign.imageUrl})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {!campaign.imageUrl && (
                              <Typography variant="h3">🎫</Typography>
                            )}
                          </Box>
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>
                              {campaign.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Typography variant="h6" color="success.main" fontWeight="bold">
                                R$ {Number(campaign.pricePromo).toFixed(2)}
                              </Typography>
                              <Chip
                                label={`-${Math.round(campaign.discountPercent)}%`}
                                size="small"
                                color="error"
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Skeleton variant="rectangular" height={200} />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Quick Actions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Ações Rápidas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<ExploreIcon />}
                    onClick={() => navigate('/')}
                  >
                    Explorar Promoções
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CouponIcon />}
                    onClick={() => navigate('/my-coupons')}
                  >
                    Meus Cupons
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<FavoriteIcon />}
                    color="error"
                    disabled={!favorites || favorites.length === 0}
                  >
                    Meus Favoritos ({favorites?.length || 0})
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Avisos/Alertas */}
            {expiredCoupons.length > 0 && (
              <Alert severity="warning" icon={<CancelIcon />} sx={{ mb: 3 }}>
                Você tem {expiredCoupons.length} cupom(ns) expirado(s).
              </Alert>
            )}

            {/* Dica do Dia */}
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  💡 Dica do Dia
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.95 }}>
                  Ative as notificações para receber alertas de novas promoções perto de você!
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}
