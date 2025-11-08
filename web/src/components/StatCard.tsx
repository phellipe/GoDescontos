import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement;
  gradient: string;
  onClick?: () => void;
}

export default function StatCard({ title, value, subtitle, icon, gradient, onClick }: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        background: gradient,
        color: 'white',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        } : {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.25)',
              width: 56,
              height: 56,
              mr: 2,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" sx={{ lineHeight: 1 }}>
              {value}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
