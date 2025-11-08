import { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Skeleton,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  Stack,
  Breadcrumbs,
  Link,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  ConfirmationNumber as TicketIcon,
  AttachMoney as MoneyIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  Info as InfoIcon,
  NavigateNext as NavigateNextIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  QrCode2 as QrCodeIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/services/api';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';

interface CampaignAnalytics {
  totalViews: number;
  uniqueViews: number;
  conversionRate: number;
  redemptionRate: number;
  revenue: number;
  availableCoupons: number;
  reservedCoupons: number;
  redeemedCoupons: number;
  totalCoupons: number;
  favorites: number;
  viewsByDay: Array<{ date: string; views: number }>;
  couponsByStatus: Array<{ status: string; count: number }>;
  topCities?: Array<{ city: string; count: number }>;
}

interface Coupon {
  id: string;
  code: string;
  status: string;
  customer?: {
    name: string;
  };
  redeemedAt?: string;
  reservedAt?: string;
  createdAt: string;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch campaign data
  const { data: campaign, isLoading: loadingCampaign } = useQuery(
    ['campaign', id],
    async () => {
      const response = await api.get(`/campaigns/${id}`);
      return response.data.data;
    },
    {
      enabled: !!id,
    }
  );

  // Fetch analytics
  const { data: stats, isLoading: loadingStats } = useQuery<CampaignAnalytics>(
    ['campaignStats', id],
    async () => {
      const response = await api.get(`/merchant/analytics/campaign/${id}`);
      return response.data.data;
    },
    {
      enabled: !!id,
    }
  );

  // Fetch coupons
  const { data: couponsData, isLoading: loadingCoupons } = useQuery(
    ['campaignCoupons', id, page, rowsPerPage],
    async () => {
      const response = await api.get(
        `/merchant/campaigns/${id}/coupons?page=${page + 1}&limit=${rowsPerPage}`
      );
      return response.data.data;
    },
    {
      enabled: !!id,
    }
  );

  const coupons = couponsData?.coupons || [];
  const totalCoupons = couponsData?.total || 0;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}/campaigns/${id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('campaign-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${campaign?.title || 'campaign'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
    const url = `${window.location.origin}/campaigns/${id}`;
    const text = `Confira esta oferta: ${campaign?.title}`;

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };

    window.open(shareUrls[platform], '_blank');
  };

  const handlePauseCampaign = async () => {
    // TODO: Implement pause/unpause logic
    console.log('Pause/unpause campaign');
  };

  const handleDeleteCampaign = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
      // TODO: Implement delete logic
      console.log('Delete campaign');
    }
  };

  const publicUrl = `${window.location.origin}/campaigns/${id}`;
  const isLoading = loadingCampaign || loadingStats;

  // Status color mapping
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      PUBLISHED: 'success',
      DRAFT: 'warning',
      PENDING_PAYMENT: 'info',
      ENDED: 'error',
    };
    return statusMap[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      PUBLISHED: 'Ativa',
      DRAFT: 'Rascunho',
      PENDING_PAYMENT: 'Aguardando Pagamento',
      ENDED: 'Finalizada',
    };
    return labelMap[status] || status;
  };

  const getCouponStatusColor = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'default'> = {
      REDEEMED: 'success',
      RESERVED: 'warning',
      AVAILABLE: 'default',
    };
    return statusMap[status] || 'default';
  };

  const getCouponStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      REDEEMED: 'Usado',
      RESERVED: 'Reservado',
      AVAILABLE: 'Disponível',
    };
    return labelMap[status] || status;
  };

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <Link
            component={RouterLink}
            to="/"
            underline="hover"
            color="inherit"
          >
            Início
          </Link>
          <Link
            component={RouterLink}
            to="/merchant/dashboard"
            underline="hover"
            color="inherit"
          >
            Dashboard
          </Link>
          <Link
            component={RouterLink}
            to="/merchant/campaigns"
            underline="hover"
            color="inherit"
          >
            Minhas Campanhas
          </Link>
          <Typography color="text.primary">
            {campaign?.title || 'Detalhes'}
          </Typography>
        </Breadcrumbs>

        {isLoading ? (
          <Box>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4, mb: 3 }} />
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <>
            {/* Hero Card with Campaign Preview */}
            <Card
              sx={{
                mb: 4,
                overflow: 'visible',
                position: 'relative',
              }}
            >
              {campaign?.imageUrl && (
                <CardMedia
                  component="img"
                  height="300"
                  image={campaign.imageUrl}
                  alt={campaign.title}
                  sx={{
                    objectFit: 'cover',
                    borderRadius: '16px 16px 0 0',
                  }}
                />
              )}
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h3" fontWeight="bold">
                        {campaign?.title}
                      </Typography>
                      <Chip
                        label={getStatusLabel(campaign?.status)}
                        color={getStatusColor(campaign?.status)}
                        size="medium"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, color: 'text.secondary', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CategoryIcon fontSize="small" />
                        <Typography variant="body2">{campaign?.category}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon fontSize="small" />
                        <Typography variant="body2">
                          {campaign?.city}, {campaign?.state}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon fontSize="small" />
                        <Typography variant="body2">
                          {new Date(campaign?.startAt).toLocaleDateString('pt-BR')} -{' '}
                          {new Date(campaign?.endAt).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Editar">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/merchant/campaigns/${id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Compartilhar">
                      <IconButton color="primary">
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={campaign?.status === 'PUBLISHED' ? 'Pausar' : 'Ativar'}>
                      <IconButton color="warning" onClick={handlePauseCampaign}>
                        {campaign?.status === 'PUBLISHED' ? <PauseIcon /> : <PlayIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={handleDeleteCampaign}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body1" color="text.secondary" paragraph>
                  {campaign?.description}
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Preço Original
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        textDecoration: 'line-through',
                        color: 'text.disabled',
                        fontWeight: 600,
                      }}
                    >
                      R$ {Number(campaign?.priceOriginal).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Preço Promocional
                    </Typography>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      R$ {Number(campaign?.pricePromo).toFixed(2)}
                    </Typography>
                    <Chip
                      label={`${Math.round(((Number(campaign?.priceOriginal) - Number(campaign?.pricePromo)) / Number(campaign?.priceOriginal)) * 100)}% OFF`}
                      color="success"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Analytics Grid - 4 Main Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total de Visualizações"
                  value={stats?.totalViews || 0}
                  subtitle={`${stats?.uniqueViews || 0} únicas`}
                  icon={<VisibilityIcon />}
                  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Taxa de Conversão"
                  value={`${(stats?.conversionRate || 0).toFixed(2)}%`}
                  subtitle={`${stats?.reservedCoupons || 0} reservas`}
                  icon={<TrendingUpIcon />}
                  gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Cupons Vendidos"
                  value={`${stats?.redeemedCoupons || 0} / ${stats?.totalCoupons || 0}`}
                  subtitle={`${stats?.totalCoupons ? Math.round(((stats?.redeemedCoupons || 0) / stats.totalCoupons) * 100) : 0}% do total`}
                  icon={<TicketIcon />}
                  gradient="linear-gradient(135deg, #f093fb 0%, #fbbf24 100%)"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Receita Gerada"
                  value={`R$ ${(stats?.revenue || 0).toFixed(2)}`}
                  subtitle="Em cupons resgatados"
                  icon={<MoneyIcon />}
                  gradient="linear-gradient(135deg, #f5576c 0%, #f093fb 100%)"
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* Main Content (8 columns) */}
              <Grid item xs={12} md={8}>
                {/* Line Chart - Views Over Time */}
                {stats?.viewsByDay && stats.viewsByDay.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Visualizações nos Últimos 7 Dias
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.viewsByDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="views"
                            stroke="#667eea"
                            strokeWidth={3}
                            dot={{ fill: '#667eea', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Bar Chart - Coupons by Status */}
                {stats?.couponsByStatus && stats.couponsByStatus.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Distribuição de Cupons
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.couponsByStatus}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                            }}
                          />
                          <Legend />
                          <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Performance Metrics with Progress Bars */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Métricas de Performance
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {/* Redemption Rate */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Taxa de Redenção
                          </Typography>
                          <Tooltip title="Cupons usados / cupons reservados">
                            <InfoIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          {(stats?.redemptionRate || 0).toFixed(2)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(stats?.redemptionRate || 0, 100)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                          },
                        }}
                      />
                    </Box>

                    {/* Conversion Rate */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Taxa de Conversão
                          </Typography>
                          <Tooltip title="Cupons reservados / visualizações">
                            <InfoIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          {(stats?.conversionRate || 0).toFixed(2)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(stats?.conversionRate || 0, 100)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          },
                        }}
                      />
                    </Box>

                    {/* Availability */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Disponibilidade
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {stats?.availableCoupons || 0} / {stats?.totalCoupons || 0}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          stats?.totalCoupons
                            ? ((stats?.availableCoupons || 0) / stats.totalCoupons) * 100
                            : 0
                        }
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            background:
                              stats?.totalCoupons && (stats?.availableCoupons || 0) / stats.totalCoupons > 0.5
                                ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                : stats?.totalCoupons && (stats?.availableCoupons || 0) / stats.totalCoupons > 0.2
                                ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                                : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>

                {/* Coupons Table */}
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        Cupons Recentes
                      </Typography>
                      <Button startIcon={<DownloadIcon />} variant="outlined" size="small">
                        Exportar CSV
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    {loadingCoupons ? (
                      <Box>
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
                        ))}
                      </Box>
                    ) : coupons.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Nenhum cupom encontrado
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <TableContainer component={Paper} variant="outlined">
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Código
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Cliente
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Data/Hora
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Status
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {coupons.map((coupon: Coupon) => (
                                <TableRow key={coupon.id} hover>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      fontFamily="monospace"
                                      fontWeight="bold"
                                    >
                                      {coupon.code}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {coupon.customer?.name || 'Cliente'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {coupon.redeemedAt
                                        ? new Date(coupon.redeemedAt).toLocaleString('pt-BR')
                                        : coupon.reservedAt
                                        ? new Date(coupon.reservedAt).toLocaleString('pt-BR')
                                        : new Date(coupon.createdAt).toLocaleString('pt-BR')}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={getCouponStatusLabel(coupon.status)}
                                      size="small"
                                      color={getCouponStatusColor(coupon.status)}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <TablePagination
                          component="div"
                          count={totalCoupons}
                          page={page}
                          onPageChange={handleChangePage}
                          rowsPerPage={rowsPerPage}
                          onRowsPerPageChange={handleChangeRowsPerPage}
                          labelRowsPerPage="Linhas por página:"
                          labelDisplayedRows={({ from, to, count }) =>
                            `${from}-${to} de ${count}`
                          }
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Sidebar (4 columns) */}
              <Grid item xs={12} md={4}>
                {/* QR Code */}
                <Card sx={{ mb: 3 }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      QR Code da Campanha
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        my: 3,
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                      }}
                    >
                      <QRCodeSVG
                        id="campaign-qr-code"
                        value={publicUrl}
                        size={200}
                        level="H"
                        includeMargin
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadQR}
                    >
                      Baixar QR Code
                    </Button>
                  </CardContent>
                </Card>

                {/* Public Link */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Link Público
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                      fullWidth
                      value={publicUrl}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={copiedLink ? 'Copiado!' : 'Copiar'}>
                              <IconButton onClick={handleCopyLink} edge="end">
                                <ContentCopyIcon
                                  sx={{
                                    color: copiedLink ? 'success.main' : 'action.active',
                                  }}
                                />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ShareIcon />}
                      onClick={() => window.open(publicUrl, '_blank')}
                    >
                      Visualizar Página
                    </Button>
                  </CardContent>
                </Card>

                {/* Social Share */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Compartilhar
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Compartilhar no WhatsApp">
                        <IconButton
                          sx={{
                            bgcolor: '#25d366',
                            color: 'white',
                            '&:hover': { bgcolor: '#1ebe57' },
                          }}
                          onClick={() => handleShare('whatsapp')}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Compartilhar no Facebook">
                        <IconButton
                          sx={{
                            bgcolor: '#1877f2',
                            color: 'white',
                            '&:hover': { bgcolor: '#145dbf' },
                          }}
                          onClick={() => handleShare('facebook')}
                        >
                          <FacebookIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Compartilhar no Twitter">
                        <IconButton
                          sx={{
                            bgcolor: '#1da1f2',
                            color: 'white',
                            '&:hover': { bgcolor: '#0c85d0' },
                          }}
                          onClick={() => handleShare('twitter')}
                        >
                          <TwitterIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Campaign Info */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Informações da Campanha
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Período
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {new Date(campaign?.startAt).toLocaleDateString('pt-BR')} -{' '}
                        {new Date(campaign?.endAt).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Categoria
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {campaign?.category}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Localização
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {campaign?.city}, {campaign?.state}
                      </Typography>
                    </Box>

                    {campaign?.address && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Endereço
                        </Typography>
                        <Typography variant="body2" fontWeight="500">
                          {campaign.address}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Total de Cupons
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {stats?.totalCoupons || 0}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Favoritos
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {stats?.favorites || 0}
                      </Typography>
                    </Box>

                    {campaign?.terms && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Termos e Condições
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {campaign.terms}
                          </Typography>
                        </Box>
                      </>
                    )}
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
