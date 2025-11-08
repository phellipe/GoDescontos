# GoDescontos Design System - Quick Reference

## Color Palette

### Primary Colors
```
Primary (Indigo):   #6366f1  ━━━━━━━━━━━━
Secondary (Pink):   #ec4899  ━━━━━━━━━━━━
Success (Emerald):  #10b981  ━━━━━━━━━━━━
Warning (Amber):    #f59e0b  ━━━━━━━━━━━━
Error (Red):        #ef4444  ━━━━━━━━━━━━
Info (Blue):        #3b82f6  ━━━━━━━━━━━━
```

### Gradients
```css
Primary:   linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
Success:   linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)
Info:      linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
```

## Typography

### Font Family
**Primary**: Inter (Google Fonts)
**Fallback**: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif

### Scale
| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| H1 | 3.5rem (56px) | 800 | Hero titles |
| H2 | 2.75rem (44px) | 700 | Page titles |
| H3 | 2.125rem (34px) | 700 | Section titles |
| H4 | 1.75rem (28px) | 600 | Card titles |
| H5 | 1.375rem (22px) | 600 | Subsections |
| H6 | 1.125rem (18px) | 600 | Small headings |
| Body1 | 1rem (16px) | 400 | Main content |
| Body2 | 0.875rem (14px) | 400 | Secondary content |
| Button | 0.9375rem (15px) | 600 | Buttons |
| Caption | 0.75rem (12px) | 400 | Small text |

## Spacing

### Base Unit: 8px
```
xs:  4px  (0.5 unit)
sm:  8px  (1 unit)
md:  16px (2 units)
lg:  24px (3 units)
xl:  32px (4 units)
xxl: 40px (5 units)
```

## Border Radius

```
Chips/Badges:     8px
Buttons:          10px
Text Fields:      10px
Cards:            16px
Dialogs:          16px
Large Components: 12-24px
```

## Shadows

```css
/* Level 1 - Subtle */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Level 2 - Cards (Default) */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);

/* Level 3 - Elevated */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Level 4 - Floating */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Level 5 - Hover (Dramatic) */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## Component Patterns

### Button States
```css
Default: py: 10px, px: 24px
Hover:   translateY(-1px) + shadow
Active:  translateY(0)
Focus:   2px outline, indigo
```

### Card Interactions
```css
Default: border-radius: 16px
Hover:   translateY(-8px) + enhanced shadow + scale(1.02)
Image:   scale(1.05) on card hover
```

### Animations
```css
Fade In:      0.5s ease-in
Slide Up:     0.6s ease-out
Pulse:        2s infinite
Button Hover: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
Card Hover:   0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

## Breakpoints

```
xs:  0px    (Mobile Portrait)
sm:  600px  (Mobile Landscape / Small Tablet)
md:  960px  (Tablet / Small Desktop)
lg:  1280px (Desktop)
xl:  1920px (Large Desktop)
```

## Component Library

### StatCard
```tsx
<StatCard
  title="Total de Cupons"
  value={125}
  subtitle="15 ativos esta semana"
  icon={<CouponIcon fontSize="large" />}
  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
/>
```

### EmptyState
```tsx
<EmptyState
  icon={<SearchIcon sx={{ fontSize: 60 }} />}
  title="Nenhum resultado encontrado"
  description="Tente ajustar seus filtros ou buscar por outro termo"
  actionLabel="Limpar Filtros"
  onAction={handleClear}
/>
```

### CampaignCard
```tsx
<CampaignCard
  campaign={campaignData}
  onViewDetails={() => navigate(`/campaigns/${id}`)}
/>
```

## Icon Usage

### Semantic Icons
- **OfferIcon**: Coupons, deals, main brand
- **CouponIcon**: User coupons, tickets
- **StoreIcon**: Merchants, business
- **TrendingIcon**: Growth, savings
- **FavoriteIcon**: Wishlist, favorites
- **CheckIcon**: Completed, redeemed
- **CancelIcon**: Expired, cancelled
- **LocationIcon**: Places, addresses

### Sizes
```tsx
fontSize="small"   // 20px
fontSize="medium"  // 24px (default)
fontSize="large"   // 35px
sx={{ fontSize: 60 }} // Custom
```

## Best Practices

### DO
✅ Use gradients for hero sections and stat cards
✅ Add hover states to all interactive elements
✅ Maintain consistent spacing (8px increments)
✅ Use semantic colors (success for savings, error for expired)
✅ Include loading and empty states
✅ Provide visual feedback on interactions
✅ Test on mobile first

### DON'T
❌ Mix flat and gradient styles inconsistently
❌ Use colors without semantic meaning
❌ Create custom spacing values
❌ Forget focus states for accessibility
❌ Ignore empty/error states
❌ Use very small touch targets on mobile
❌ Rely solely on color to convey information

## Accessibility

### Minimum Requirements
- Color contrast ratio: 4.5:1 (WCAG AA)
- Touch target size: 44x44px minimum
- Focus indicators: 2px visible outline
- Alt text: All images
- Semantic HTML: Proper heading hierarchy
- Keyboard navigation: All interactive elements

### Testing Tools
- Chrome DevTools Lighthouse
- WAVE Browser Extension
- axe DevTools
- Keyboard navigation testing
- Screen reader testing (NVDA/JAWS)

## Files Modified

### Core Files
```
web/src/theme.ts                      - Complete theme system
web/src/index.css                     - Global styles & animations
```

### Components
```
web/src/components/Layout.tsx         - Header/Footer/Navigation
web/src/components/StatCard.tsx       - Gradient stat cards
web/src/components/EmptyState.tsx     - Empty state displays
web/src/components/CampaignCard.tsx   - Campaign display cards
```

### Pages (Phase 1)
```
web/src/pages/HomePage.tsx            - Hero, search, campaigns grid
web/src/pages/LoginPage.tsx           - Full-screen gradient auth
```

### Pending (Phase 2)
```
web/src/pages/RegisterPage.tsx
web/src/pages/CampaignDetailPage.tsx
web/src/pages/MyCouponsPage.tsx
web/src/pages/DashboardPage.tsx
web/src/pages/merchant/*.tsx
```

## Quick Start Guide

### 1. Import the New Components
```tsx
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import CampaignCard from '@/components/CampaignCard';
```

### 2. Use Gradient Backgrounds
```tsx
<Box sx={{ background: theme => theme.palette.gradient.primary }}>
  Content here
</Box>
```

### 3. Apply Hover Effects
```tsx
<Card sx={{
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: 5,
  },
}}>
```

### 4. Use Utility Classes
```tsx
<Typography className="gradient-text">
  Gradient Text
</Typography>

<div className="fade-in slide-up">
  Animated content
</div>
```

### 5. Implement Empty States
```tsx
{data.length === 0 && (
  <EmptyState
    icon={<Icon />}
    title="No data"
    description="Description here"
  />
)}
```

## Support & Resources

### Documentation
- Full Report: `FRONTEND_REDESIGN_REPORT.md`
- This Guide: `DESIGN_SUMMARY.md`

### Design Tokens in Code
- Theme: `web/src/theme.ts`
- CSS Variables: `web/src/index.css`

### External Resources
- Material-UI Docs: https://mui.com
- Inter Font: https://fonts.google.com/specimen/Inter
- Color Palette Generator: https://coolors.co

---

**Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Phase 1 Complete
