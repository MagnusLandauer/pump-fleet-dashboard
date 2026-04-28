import { AppBar, Box, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import MenuOutlined from '@mui/icons-material/MenuOutlined';
import { useRouterState } from '@tanstack/react-router';
import { useStoreSnapshot } from '../../hooks/useStore';

interface TopBarProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

function pageTitleFor(pathname: string): string {
  if (pathname.startsWith('/pump/')) return 'Pump Detail';
  return 'Fleet Overview';
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour12: false });
}

export function TopBar({ onMenuClick, showMenuButton }: TopBarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const snapshot = useStoreSnapshot();
  const title = pageTitleFor(pathname);

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ minHeight: 56, gap: 1 }}>
        {showMenuButton && (
          <IconButton
            onClick={onMenuClick}
            edge="start"
            aria-label="open navigation"
            sx={{ mr: 1 }}
          >
            <MenuOutlined />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component="div"
          data-testid="page-title"
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          {title}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', color: 'text.secondary' }}
          aria-label="live status"
        >
          <Box
            aria-hidden
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              boxShadow: (t) => `0 0 8px ${t.palette.primary.main}`,
              '@media (prefers-reduced-motion: no-preference)': {
                animation: 'topbar-pulse 1.6s ease-in-out infinite',
              },
              '@keyframes topbar-pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.35 },
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}
          >
            live • {formatTime(snapshot.now)}
          </Typography>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
