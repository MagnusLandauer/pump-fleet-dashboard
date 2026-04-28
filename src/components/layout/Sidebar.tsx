import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import { Link, useRouterState } from '@tanstack/react-router';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import type { DerivedStatus } from '../../domain/models';
import { useFleetStore, useStoreSnapshot } from '../../hooks/useStore';

export const SIDEBAR_WIDTH = 248;

interface SidebarProps {
  variant: 'permanent' | 'temporary';
  open: boolean;
  onClose: () => void;
}

const STATUS_COLOR: Record<DerivedStatus, 'success.main' | 'warning.main' | 'error.main'> = {
  green: 'success.main',
  yellow: 'warning.main',
  red: 'error.main',
  maintenance: 'warning.main',
};

type AnchorProps = ComponentPropsWithoutRef<'a'>;

const FleetIndexLink = forwardRef<HTMLAnchorElement, AnchorProps>(function FleetIndexLink(
  props,
  ref,
) {
  return <Link to="/" ref={ref} {...props} />;
});

interface PumpDetailLinkProps extends AnchorProps {
  pumpId: string;
}

const PumpDetailLink = forwardRef<HTMLAnchorElement, PumpDetailLinkProps>(function PumpDetailLink(
  { pumpId, ...rest },
  ref,
) {
  return <Link to="/pump/$id" params={{ id: pumpId }} ref={ref} {...rest} />;
});

function StatusDot({ status }: { status: DerivedStatus }) {
  return (
    <Box
      data-status={status}
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: STATUS_COLOR[status],
        flexShrink: 0,
      }}
    />
  );
}

function Brand() {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 2 }}>
      <Box
        aria-hidden
        sx={{
          width: 28,
          height: 28,
          borderRadius: 2,
          bgcolor: 'primary.main',
          boxShadow: (t) => `0 0 0 1px ${t.palette.divider}`,
        }}
      />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
        Pump Fleet
      </Typography>
    </Stack>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const store = useFleetStore();
  useStoreSnapshot();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pumps = store.getPumps();

  const isFleetActive = pathname === '/';

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{ width: SIDEBAR_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Brand />
      <Box sx={{ px: 1 }}>
        <List disablePadding>
          <ListItemButton
            component={FleetIndexLink}
            selected={isFleetActive}
            aria-current={isFleetActive ? 'page' : undefined}
            onClick={onNavigate}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
              <DashboardOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Overview" />
          </ListItemButton>
        </List>
      </Box>
      <Divider sx={{ my: 1.5 }} />
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pb: 0.5, letterSpacing: '0.08em' }}
      >
        Pumps
      </Typography>
      <Box sx={{ px: 1, flexGrow: 1, overflowY: 'auto' }}>
        <List disablePadding>
          {pumps.map((pump) => {
            const status = store.computeStatus(pump.id);
            const active = pathname === `/pump/${pump.id}`;
            return (
              <ListItemButton
                key={pump.id}
                component={PumpDetailLink}
                pumpId={pump.id}
                selected={active}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                data-testid={`sidebar-pump-${pump.id}`}
                sx={{ gap: 1.5 }}
              >
                <StatusDot status={status} />
                <ListItemText primary={pump.name} secondary={pump.location} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export function Sidebar({ variant, open, onClose }: SidebarProps) {
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: variant === 'permanent' ? SIDEBAR_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
      }}
      ModalProps={{ keepMounted: true }}
    >
      <SidebarContent onNavigate={variant === 'temporary' ? onClose : () => {}} />
    </Drawer>
  );
}
