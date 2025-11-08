import { ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Stack,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Badge,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  LocalOffer as OfferIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Favorite as FavoriteIcon,
  ConfirmationNumber as CouponIcon,
  Store as StoreIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setAnchorEl(null);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const navItems = isAuthenticated
    ? user?.role === 'MERCHANT'
      ? [
          { label: 'Dashboard', icon: <DashboardIcon />, path: '/merchant/dashboard' },
          { label: 'Campanhas', icon: <StoreIcon />, path: '/merchant/campaigns' },
          { label: 'Validar Cupom', icon: <CouponIcon />, path: '/merchant/validate' },
        ]
      : [
          { label: 'Explorar', icon: <OfferIcon />, path: '/' },
          { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
          { label: 'Meus Cupons', icon: <CouponIcon />, path: '/my-coupons' },
        ]
    : [
        { label: 'Explorar', icon: <OfferIcon />, path: '/' },
      ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', px: { xs: 0, sm: 2 } }}>
            {/* Logo */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                mr: 4,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  mr: 1.5,
                }}
              >
                <OfferIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                GoDescontos
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      bgcolor: location.pathname === item.path ? 'primary.lighter' : 'transparent',
                      '&:hover': {
                        bgcolor: location.pathname === item.path ? 'primary.lighter' : 'grey.100',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            )}

            <Box sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />

            {/* Right Side Actions */}
            {isAuthenticated ? (
              <Stack direction="row" spacing={1} alignItems="center">
                {!isMobile && user?.role !== 'MERCHANT' && (
                  <IconButton color="default" size="large">
                    <Badge badgeContent={0} color="error">
                      <FavoriteIcon />
                    </Badge>
                  </IconButton>
                )}
                <IconButton onClick={handleProfileMenuOpen} size="small">
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.main',
                      fontWeight: 600,
                      fontSize: '1rem',
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  component={RouterLink}
                  to="/login"
                  startIcon={!isMobile && <LoginIcon />}
                  variant="text"
                  sx={{ fontWeight: 600 }}
                >
                  Entrar
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  startIcon={!isMobile && <RegisterIcon />}
                  variant="contained"
                  sx={{ fontWeight: 600 }}
                >
                  {isMobile ? 'Cadastrar' : 'Criar Conta'}
                </Button>
              </Stack>
            )}

            {/* Mobile Menu Button */}
            {isMobile && isAuthenticated && (
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Container>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="600">
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <MenuItem
          onClick={() => {
            navigate(user?.role === 'MERCHANT' ? '/merchant/dashboard' : '/dashboard');
            handleProfileMenuClose();
          }}
        >
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          Dashboard
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Sair</Typography>
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: { width: 280 },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Menu
          </Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.900',
          color: 'white',
          py: 8,
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      mr: 1.5,
                    }}
                  >
                    <OfferIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="800">
                    GoDescontos
                  </Typography>
                </Box>
                <Typography variant="body2" color="grey.400" sx={{ mb: 2 }}>
                  A plataforma de cupons e descontos que conecta você às melhores promoções da sua região.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" sx={{ bgcolor: 'grey.800', color: 'white', '&:hover': { bgcolor: 'grey.700' } }}>
                    <FacebookIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ bgcolor: 'grey.800', color: 'white', '&:hover': { bgcolor: 'grey.700' } }}>
                    <InstagramIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ bgcolor: 'grey.800', color: 'white', '&:hover': { bgcolor: 'grey.700' } }}>
                    <TwitterIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Para Você
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: 'Explorar Promoções', path: '/' },
                  { label: 'Minha Conta', path: '/login' },
                  { label: 'Meus Cupons', path: '/my-coupons' },
                ].map((link) => (
                  <Typography
                    key={link.path}
                    component={RouterLink}
                    to={link.path}
                    variant="body2"
                    color="grey.400"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': { color: 'white' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Para Empresas
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: 'Cadastre seu Negócio', path: '/register' },
                  { label: 'Painel Merchant', path: '/merchant/dashboard' },
                  { label: 'Planos', path: '/plans' },
                ].map((link) => (
                  <Typography
                    key={link.path}
                    component={RouterLink}
                    to={link.path}
                    variant="body2"
                    color="grey.400"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': { color: 'white' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Suporte
              </Typography>
              <Stack spacing={1}>
                {[
                  'Central de Ajuda',
                  'Termos de Uso',
                  'Política de Privacidade',
                  'Contato',
                ].map((label) => (
                  <Typography
                    key={label}
                    variant="body2"
                    color="grey.400"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: 'white' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Legal
              </Typography>
              <Stack spacing={1}>
                {[
                  'Sobre Nós',
                  'Trabalhe Conosco',
                  'Blog',
                  'Imprensa',
                ].map((label) => (
                  <Typography
                    key={label}
                    variant="body2"
                    color="grey.400"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: 'white' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: 'grey.800' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" color="grey.500">
              © {new Date().getFullYear()} GoDescontos. Todos os direitos reservados.
            </Typography>
            <Typography variant="body2" color="grey.500">
              Feito com ❤️ no Brasil
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

// Import Grid for the footer
import { Grid } from '@mui/material';
