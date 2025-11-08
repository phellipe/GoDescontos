import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
  Fade,
} from '@mui/material';
import {
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);

      if (user.role === 'MERCHANT') {
        navigate('/merchant/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Background */}
      <Box
        sx={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(80px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -300,
          left: -300,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(100px)',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 4,
          }}
        >
          {/* Back Button */}
          <Fade in timeout={400}>
            <Box sx={{ mb: 3 }}>
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Box>
          </Fade>

          <Fade in timeout={600}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                {/* Logo and Title */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      mb: 2,
                    }}
                  >
                    <LoginIcon sx={{ fontSize: 36, color: 'white' }} />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    Bem-vindo!
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Entre com sua conta para continuar
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      fullWidth
                      autoComplete="email"
                      autoFocus
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'grey.50',
                        },
                      }}
                    />

                    <TextField
                      label="Senha"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      fullWidth
                      autoComplete="current-password"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'grey.50',
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading}
                      sx={{
                        py: 1.75,
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </Stack>
                </form>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    ou
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Não tem uma conta?{' '}
                    <Link
                      component={RouterLink}
                      to="/register"
                      underline="hover"
                      fontWeight="600"
                      color="primary"
                    >
                      Cadastre-se grátis
                    </Link>
                  </Typography>
                </Box>

                {/* Test Credentials */}
                <Box
                  sx={{
                    mt: 4,
                    p: 2.5,
                    bgcolor: 'info.lighter',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'info.light',
                  }}
                >
                  <Typography variant="caption" fontWeight="600" color="info.dark" gutterBottom display="block">
                    CREDENCIAIS DE TESTE
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="caption" color="info.dark" component="div">
                      <strong>Admin:</strong> admin@godescontos.com / Admin123!@#
                    </Typography>
                    <Typography variant="caption" color="info.dark" component="div">
                      <strong>Usuário:</strong> joao.silva@example.com / User123!@#
                    </Typography>
                    <Typography variant="caption" color="info.dark" component="div">
                      <strong>Lojista:</strong> contato@pizzariabellanapoli.com / Merchant123!@#
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
}
