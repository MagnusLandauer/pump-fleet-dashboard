import { Box, useMediaQuery, useTheme } from '@mui/material';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { Sidebar, SIDEBAR_WIDTH } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <Box
        component="div"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          showMenuButton={!isDesktop}
        />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
