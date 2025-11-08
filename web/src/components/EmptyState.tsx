import { Box, Typography, Button } from '@mui/material';

interface EmptyStateProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'primary.lighter',
          mb: 3,
          color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" size="large" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
