import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import {
  QrCodeScanner as ScanIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  Keyboard as KeyboardIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  LocalOffer as CouponIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import Layout from '@/components/Layout';

export default function ValidateCouponPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post(`/coupons/${code.trim()}/redeem`);
      setResult(response.data.data);
      setCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao validar cupom');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    setShowScanner(true);
    setError('');
  };

  const handleScan = (result: any) => {
    if (result) {
      try {
        const data = typeof result === 'string' ? result : result.text;

        // Try to parse JSON
        try {
          const parsed = JSON.parse(data);
          if (parsed.code) {
            setCode(parsed.code);
            setShowScanner(false);
            return;
          }
        } catch {
          // Not JSON, use as-is
        }

        // Use the scanned data directly as code
        setCode(data.toUpperCase());
        setShowScanner(false);
      } catch (err) {
        setError('Erro ao processar QR code');
      }
    }
  };

  const handleScanError = (error: any) => {
    console.error('QR Scanner Error:', error);
    setError('Erro ao acessar a câmera. Verifique as permissões.');
  };

  const handleReset = () => {
    setResult(null);
    setCode('');
    setError('');
  };

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <ScanIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Validar Cupom
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Escaneie o QR code ou digite o código do cupom do cliente
          </Typography>
        </Box>

        {/* Main Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {!result ? (
              <>
                {/* Input Form */}
                <Box component="form" onSubmit={handleValidate}>
                  <TextField
                    fullWidth
                    label="Código do Cupom"
                    variant="outlined"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="PIZZA-ABC123-001"
                    autoFocus
                    sx={{
                      mb: 3,
                      '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '1.2rem',
                        textAlign: 'center',
                      },
                    }}
                    InputProps={{
                      startAdornment: <CouponIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />

                  {/* Action Buttons */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading || !code.trim()}
                        startIcon={<CheckIcon />}
                      >
                        {loading ? 'Validando...' : 'Validar Cupom'}
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        size="large"
                        onClick={handleScanQR}
                        startIcon={<CameraIcon />}
                      >
                        Escanear QR
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}
              </>
            ) : (
              /* Success Result */
              <Box sx={{ textAlign: 'center' }}>
                {/* Success Icon */}
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <CheckIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>

                <Typography variant="h5" fontWeight="bold" color="success.main" gutterBottom>
                  Cupom Validado com Sucesso!
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Coupon Details */}
                <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CouponIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Código do Cupom
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                        {result.code}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Cliente
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="500">
                        {result.user?.name || 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Valor
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        R$ {Number(result.campaign?.pricePromo).toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StoreIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Campanha
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="500">
                        {result.campaign?.title}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Data e Hora do Resgate
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {new Date(result.redeemedAt).toLocaleString('pt-BR', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Next Coupon Button */}
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleReset}
                  sx={{ mt: 3 }}
                  startIcon={<ScanIcon />}
                >
                  Validar Próximo Cupom
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Como Validar um Cupom
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" paragraph>
                Peça ao cliente para mostrar o cupom (QR code ou código)
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Escaneie o QR code com a câmera ou digite o código manualmente
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                Verifique os dados da campanha e do cliente
              </Typography>
              <Typography component="li" variant="body2">
                Após confirmação, o cupom será marcado como usado e não poderá ser reutilizado
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Alert severity="info" icon={<KeyboardIcon />}>
          <Typography variant="body2" fontWeight="500" gutterBottom>
            Dica para Atendimento Rápido
          </Typography>
          <Typography variant="body2">
            Mantenha esta página aberta durante o expediente. Você pode adicionar um atalho na tela
            inicial do seu dispositivo para acesso instantâneo.
          </Typography>
        </Alert>
      </Container>

      {/* QR Scanner Dialog */}
      <Dialog
        open={showScanner}
        onClose={() => setShowScanner(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Escanear QR Code
            </Typography>
            <IconButton onClick={() => setShowScanner(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={handleScan}
              containerStyle={{ width: '100%' }}
              videoStyle={{ width: '100%', borderRadius: '8px' }}
            />
          </Box>

          <Alert severity="info">
            Posicione o QR code do cupom dentro do quadro da câmera
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowScanner(false)} variant="outlined" fullWidth>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
