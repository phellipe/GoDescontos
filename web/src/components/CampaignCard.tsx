import { Card, CardContent, CardMedia, Box, Typography, Chip, Button, CardActions } from '@mui/material';
import { LocationOn as LocationIcon, LocalOffer as OfferIcon } from '@mui/icons-material';

interface CampaignCardProps {
  campaign: {
    id: string;
    title: string;
    shortDescription?: string;
    priceOriginal: number;
    pricePromo: number;
    discountPercent: number;
    imageUrl?: string;
    city?: string;
    state?: string;
    category?: string;
  };
  onViewDetails: () => void;
}

export default function CampaignCard({ campaign, onViewDetails }: CampaignCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
          '& .campaign-image': {
            transform: 'scale(1.05)',
          },
        },
      }}
    >
      {/* Image Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          height: 200,
          bgcolor: 'grey.200',
        }}
      >
        <CardMedia
          className="campaign-image"
          component="div"
          sx={{
            height: '100%',
            backgroundImage: campaign.imageUrl ? `url(${campaign.imageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease-out',
          }}
        >
          {!campaign.imageUrl && (
            <Typography variant="h1" sx={{ fontSize: '72px' }}>
              🎫
            </Typography>
          )}
        </CardMedia>

        {/* Discount Badge */}
        <Chip
          label={`${Math.round(campaign.discountPercent)}% OFF`}
          className="discount-badge"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'error.main',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            height: 32,
            '& .MuiChip-label': {
              px: 2,
            },
          }}
        />

        {/* Category Badge */}
        {campaign.category && (
          <Chip
            label={campaign.category}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.3 }}>
          {campaign.title}
        </Typography>

        {campaign.shortDescription && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              flexGrow: 1,
            }}
          >
            {campaign.shortDescription}
          </Typography>
        )}

        {/* Location */}
        {campaign.city && campaign.state && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {campaign.city}, {campaign.state}
            </Typography>
          </Box>
        )}

        {/* Price Section */}
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            De{' '}
            <Typography
              component="span"
              sx={{
                textDecoration: 'line-through',
                fontWeight: 500,
              }}
            >
              R$ {Number(campaign.priceOriginal).toFixed(2)}
            </Typography>
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              R$ {Number(campaign.pricePromo).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight="600">
              Economize R$ {(Number(campaign.priceOriginal) - Number(campaign.pricePromo)).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ p: 3, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<OfferIcon />}
          onClick={onViewDetails}
          sx={{
            py: 1.5,
            fontWeight: 600,
          }}
        >
          Ver Oferta
        </Button>
      </CardActions>
    </Card>
  );
}
