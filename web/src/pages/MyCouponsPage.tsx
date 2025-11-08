import { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
  Explore as ExploreIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import Layout from '@/components/Layout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`coupon-tabpanel-${index}`}
      aria-labelledby={`coupon-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MyCouponsPage() {
  const navigate = useNavigate();
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const { data: coupons, isLoading } = useQuery('myCoupons', async () => {
    const response = await api.get('/coupons/my');
    return response.data.data;
  });

  const handleShowQR = async (coupon: any) => {
    try {
      const response = await api.get(`/coupons/${coupon.id}/qr`);
      setSelectedCoupon(response.data.data);
      setQrDialogOpen(true);
    } catch (error) {
      console.error('Error loading QR code:', error);
    }
  };

  const handleCloseQR = () => {
    setQrDialogOpen(false);
    setSelectedCoupon(null);
  };

  const activeCoupons = coupons?.filter((c: any) =>
    c.status === 'RESERVED' && new Date(c.expiresAt) > new Date()
  ) || [];

  const usedCoupons = coupons?.filter((c: any) => c.status === 'REDEEMED') || [];

  const expiredCoupons = coupons?.filter((c: any) =>
    c.status === 'RESERVED' && new Date(c.expiresAt) <= new Date()
  ) || [];

  const renderCouponCard = (coupon: any) => {
    const isExpired = new Date(coupon.expiresAt) < new Date();
    const isRedeemed = coupon.status === 'REDEEMED';

    return (
      <Grid item xs={12} md={6} key={coupon.id}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s',
            opacity: isExpired || isRedeemed ? 0.7 : 1,
            '&:hover': {
              transform: isExpired || isRedeemed ? 'none' : 'translateY(-4px)',
              boxShadow: isExpired || isRedeemed ? 1 : 4,
            },
          }}
        >
          <CardMedia
            component="div"
            sx={{
              height: 180,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: coupon.campaign.imageUrl ? `url(${coupon.campaign.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          >
            {!coupon.campaign.imageUrl && (
              <Typography variant="h2">🎫</Typography>
            )}

            {/* Status Badge */}
            <Chip
              label={isRedeemed ? 'Usado' : isExpired ? 'Expirado' : 'Disponível'}
              color={isRedeemed ? 'success' : isExpired ? 'error' : 'primary'}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                fontWeight: 'bold',
              }}
            />
          </CardMedia>

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Title and Merchant */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {coupon.campaign.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {coupon.campaign.merchant.name}
            </Typography>

            {/* Price */}
            <Box sx={{ my: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                R$ {Number(coupon.campaign.pricePromo).toFixed(2)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                R$ {Number(coupon.campaign.priceOriginal).toFixed(2)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Coupon Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Código: <strong>{coupon.code}</strong>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Válido até: {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                </Typography>
              </Box>

              {isRedeemed && coupon.redeemedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon fontSize="small" color="success" />
                  <Typography variant="body2" color="success.main">
                    Usado em: {new Date(coupon.redeemedAt).toLocaleString('pt-BR')}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Action Button */}
            <Box sx={{ mt: 'auto' }}>
              {!isRedeemed && !isExpired ? (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<QrCodeIcon />}
                  onClick={() => handleShowQR(coupon)}
                >
                  Mostrar QR Code
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  fullWidth
                  disabled
                  startIcon={isRedeemed ? <CheckIcon /> : <CancelIcon />}
                >
                  {isRedeemed ? 'Cupom Usado' : 'Cupom Expirado'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Meus Cupons
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie todos os seus cupons de desconto
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h3" fontWeight="bold">
                  {activeCoupons.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Cupons Ativos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h3" fontWeight="bold">
                  {usedCoupons.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Cupons Usados
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h3" fontWeight="bold">
                  {expiredCoupons.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Cupons Expirados
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              aria-label="coupon tabs"
            >
              <Tab label={`Ativos (${activeCoupons.length})`} />
              <Tab label={`Usados (${usedCoupons.length})`} />
              <Tab label={`Expirados (${expiredCoupons.length})`} />
            </Tabs>
          </Box>

          {/* Loading State */}
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={12} md={6} key={i}>
                    <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <>
              {/* Active Coupons */}
              <TabPanel value={tabValue} index={0}>
                {activeCoupons.length === 0 ? (
                  <Alert severity="info" icon={<ExploreIcon />}>
                    Você não tem cupons ativos no momento. Explore as promoções disponíveis!
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate('/')}
                      sx={{ ml: 2 }}
                    >
                      Ver Promoções
                    </Button>
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {activeCoupons.map(renderCouponCard)}
                  </Grid>
                )}
              </TabPanel>

              {/* Used Coupons */}
              <TabPanel value={tabValue} index={1}>
                {usedCoupons.length === 0 ? (
                  <Alert severity="info">
                    Você ainda não usou nenhum cupom.
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {usedCoupons.map(renderCouponCard)}
                  </Grid>
                )}
              </TabPanel>

              {/* Expired Coupons */}
              <TabPanel value={tabValue} index={2}>
                {expiredCoupons.length === 0 ? (
                  <Alert severity="success">
                    Você não tem cupons expirados. Continue aproveitando suas promoções!
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {expiredCoupons.map(renderCouponCard)}
                  </Grid>
                )}
              </TabPanel>
            </>
          )}
        </Card>
      </Container>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={handleCloseQR}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              QR Code do Cupom
            </Typography>
            <IconButton onClick={handleCloseQR} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedCoupon && (
            <Box sx={{ textAlign: 'center' }}>
              {/* QR Code */}
              {selectedCoupon.qrCodeUrl && (
                <Box
                  component="img"
                  src={selectedCoupon.qrCodeUrl}
                  alt="QR Code"
                  sx={{
                    width: '100%',
                    maxWidth: 300,
                    height: 'auto',
                    mx: 'auto',
                    mb: 3,
                    border: '4px solid',
                    borderColor: 'grey.200',
                    borderRadius: 2,
                  }}
                />
              )}

              {/* Campaign Info */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {selectedCoupon.campaign.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedCoupon.campaign.merchant.name}
              </Typography>

              {/* Coupon Code */}
              <Card sx={{ bgcolor: 'grey.100', my: 3, p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Código do Cupom
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                  {selectedCoupon.code}
                </Typography>
              </Card>

              {/* Price */}
              <Typography variant="h3" color="success.main" fontWeight="bold" gutterBottom>
                R$ {Number(selectedCoupon.campaign.pricePromo).toFixed(2)}
              </Typography>

              <Divider sx={{ my: 3 }} />

              {/* Merchant Details */}
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Endereço
                    </Typography>
                    <Typography variant="body1">
                      {selectedCoupon.campaign.merchant.city},{' '}
                      {selectedCoupon.campaign.merchant.state}
                    </Typography>
                  </Box>
                </Box>

                {selectedCoupon.campaign.merchant.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PhoneIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Telefone
                      </Typography>
                      <Typography variant="body1">
                        {selectedCoupon.campaign.merchant.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Instructions */}
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                Mostre este QR code ou o código ao estabelecimento para resgatar seu cupom.
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseQR} variant="contained" fullWidth>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
