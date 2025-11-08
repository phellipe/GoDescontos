import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Skeleton,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  TrendingUp as TrendingIcon,
  Receipt as ReceiptIcon,
  Percent as PercentIcon,
  Add as AddIcon,
  QrCodeScanner as ScanIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  LocalOffer as CouponIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/services/api';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/stores/authStore';

const COLORS = ['#10b981', '#94a3b8', '#3b82f6', '#f59e0b'];

export default function MerchantDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // TODO: Get merchantId from user profile
  const merchantId = 'merchant-id-here'; // This should come from user data

  const { data: stats, isLoading } = useQuery(
    ['merchantDashboard', merchantId],
    async () => {
      const response = await api.get(`/merchant/analytics/dashboard?merchantId=${merchantId}`);
      return response.data.data;
    },
    {
      enabled: !!merchantId,
    }
  );

  // Prepare chart data
  const campaignPerformanceData = stats?.recentCampaigns?.slice(0, 5).map((campaign: any) => ({
    name: campaign.title.length > 15 ? campaign.title.substring(0, 15) + '...' : campaign.title,
    Visualizações: campaign.totalViews,
    Reservados: campaign.totalCoupons - campaign.redeemedCoupons,
    Resgatados: campaign.redeemedCoupons,
  })) || [];

  const conversionData = [
    { name: 'Resgatados', value: stats?.totalCouponsRedeemed || 0 },
    {
      name: 'Não convertidos',
      value: Math.max(0, (stats?.totalViews || 0) - (stats?.totalCouponsRedeemed || 0)),
    },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Dashboard do Lojista
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bem-vindo de volta, {user?.name || 'Merchant'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/merchant/campaigns/create')}
          >
            Nova Campanha
          </Button>
        </Box>

        {isLoading ? (
          <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                        <CampaignIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {stats?.totalCampaigns || 0}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total de Campanhas
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {stats?.activeCampaigns || 0} ativas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                        <ReceiptIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          R$ {(stats?.totalRevenue || 0).toFixed(0)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Receita Total
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Em cupons resgatados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                        <CheckIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {stats?.totalCouponsRedeemed || 0}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Cupons Resgatados
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Total de conversões
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                        <PercentIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h3" fontWeight="bold">
                          {(stats?.averageConversionRate || 0).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Taxa de Conversão
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {stats?.totalViews || 0} visualizações
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* Main Content */}
              <Grid item xs={12} md={8}>
                {/* Performance Chart */}
                {stats?.recentCampaigns && stats.recentCampaigns.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Performance por Campanha
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={campaignPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Visualizações" fill="#3b82f6" />
                          <Bar dataKey="Reservados" fill="#f59e0b" />
                          <Bar dataKey="Resgatados" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Campaigns */}
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Campanhas Recentes
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => navigate('/merchant/campaigns')}
                      >
                        Ver Todas
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    {!stats?.recentCampaigns || stats.recentCampaigns.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          Nenhuma campanha criada ainda
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/merchant/campaigns/create')}
                          sx={{ mt: 2 }}
                        >
                          Criar Primeira Campanha
                        </Button>
                      </Box>
                    ) : (
                      <List>
                        {stats.recentCampaigns.slice(0, 5).map((campaign: any, index: number) => {
                          const conversionRate = campaign.conversionRate || 0;
                          const redemptionRate = campaign.redemptionRate || 0;

                          return (
                            <ListItem
                              key={campaign.campaignId}
                              sx={{
                                borderBottom: index < 4 ? 1 : 0,
                                borderColor: 'divider',
                                py: 2,
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {campaign.title}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Grid container spacing={2} alignItems="center">
                                      <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <VisibilityIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                              {campaign.totalViews}
                                            </Typography>
                                          </Box>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CouponIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                              {campaign.redeemedCoupons}/{campaign.totalCoupons}
                                            </Typography>
                                          </Box>
                                          <Typography variant="body2" fontWeight="bold" color="success.main">
                                            R$ {campaign.revenue.toFixed(2)}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <Box>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                              Conversão
                                            </Typography>
                                            <Typography variant="caption" fontWeight="bold" color="success.main">
                                              {conversionRate.toFixed(1)}%
                                            </Typography>
                                          </Box>
                                          <LinearProgress
                                            variant="determinate"
                                            value={Math.min(conversionRate, 100)}
                                            sx={{ height: 6, borderRadius: 1 }}
                                          />
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Sidebar */}
              <Grid item xs={12} md={4}>
                {/* Conversion Pie Chart */}
                {stats?.totalViews > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Taxa de Conversão Geral
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={conversionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {conversionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {(stats?.averageConversionRate || 0).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Taxa média de conversão
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}

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
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/merchant/campaigns/create')}
                      >
                        Nova Campanha
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ScanIcon />}
                        onClick={() => navigate('/merchant/validate')}
                      >
                        Validar Cupom
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<CampaignIcon />}
                        onClick={() => navigate('/merchant/campaigns')}
                      >
                        Minhas Campanhas
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AssessmentIcon />}
                        disabled
                      >
                        Relatórios
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Dica para Aumentar Vendas
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      Ofereça descontos maiores em horários de menor movimento para atrair mais clientes!
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </Layout>
  );
}
