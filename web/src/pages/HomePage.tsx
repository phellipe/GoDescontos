import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalOffer as OfferIcon,
  TrendingUp as TrendingIcon,
  Favorite as FavoriteIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import api from '@/services/api';
import Layout from '@/components/Layout';
import CampaignCard from '@/components/CampaignCard';
import EmptyState from '@/components/EmptyState';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery('campaigns', async () => {
    const response = await api.get('/campaigns');
    return response.data.data;
  });

  const filteredCampaigns = data?.filter((campaign: any) =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['Alimentação', 'Beleza', 'Entretenimento', 'Saúde', 'Serviços'];

  return (
    <Layout>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(60px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(80px)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="h1"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                  fontWeight: 800,
                  mb: 2,
                  textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                Descubra Ofertas Incríveis
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1.125rem', md: '1.5rem' },
                  opacity: 0.95,
                  fontWeight: 400,
                  maxWidth: 700,
                  mx: 'auto',
                  mb: 5,
                }}
              >
                Economize em restaurantes, serviços, entretenimento e muito mais.
                Cupons de desconto perto de você!
              </Typography>

              {/* Search Bar */}
              <Box
                sx={{
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Buscar por promoção, cidade ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        border: 'none',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchTerm('')} size="small">
                          <Typography sx={{ fontSize: '1.2rem' }}>✕</Typography>
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      py: 1.5,
                      fontSize: '1.125rem',
                    },
                  }}
                />
              </Box>
            </Box>
          </Fade>

          {/* Stats Section */}
          <Fade in timeout={1200}>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {[
                { icon: <OfferIcon fontSize="large" />, value: data?.length || 0, label: 'Promoções Ativas' },
                { icon: <StoreIcon fontSize="large" />, value: '150+', label: 'Parceiros' },
                { icon: <TrendingIcon fontSize="large" />, value: '50%', label: 'Desconto Médio' },
                { icon: <FavoriteIcon fontSize="large" />, value: '10k+', label: 'Clientes Satisfeitos' },
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <Box sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 1 }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Fade>
        </Container>
      </Box>

      {/* Category Chips */}
      <Container maxWidth="lg" sx={{ mt: -4, mb: 4, position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Categorias Populares
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSearchTerm(category)}
                sx={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  py: 2.5,
                  px: 1,
                  bgcolor: searchTerm === category ? 'primary.main' : 'grey.100',
                  color: searchTerm === category ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: searchTerm === category ? 'primary.dark' : 'grey.200',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Stack>
        </Box>
      </Container>

      {/* Campaigns Grid */}
      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {searchTerm ? `Resultados para "${searchTerm}"` : 'Promoções em Destaque'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredCampaigns?.length || 0} {filteredCampaigns?.length === 1 ? 'promoção encontrada' : 'promoções encontradas'}
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
          <Grid container spacing={3}>
            {filteredCampaigns.map((campaign: any, index: number) => (
              <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                <Fade in timeout={400 + index * 100}>
                  <div>
                    <CampaignCard
                      campaign={campaign}
                      onViewDetails={() => navigate(`/campaigns/${campaign.id}`)}
                    />
                  </div>
                </Fade>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState
            icon={<SearchIcon sx={{ fontSize: 60 }} />}
            title={searchTerm ? 'Nenhuma promoção encontrada' : 'Nenhuma promoção disponível'}
            description={
              searchTerm
                ? 'Tente buscar por outro termo ou categoria'
                : 'Não há promoções disponíveis no momento. Volte em breve!'
            }
            actionLabel={searchTerm ? 'Limpar busca' : undefined}
            onAction={searchTerm ? () => setSearchTerm('') : undefined}
          />
        )}
      </Container>

      {/* Call to Action Section */}
      {!searchTerm && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            py: 10,
          }}
        >
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                É um comerciante?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
                Cadastre seu negócio e alcance milhares de clientes com nossas campanhas promocionais
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Box
                  component="button"
                  onClick={() => navigate('/register')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 2,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    },
                  }}
                >
                  Cadastrar Meu Negócio
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      )}
    </Layout>
  );
}
