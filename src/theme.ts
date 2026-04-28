import { createTheme, alpha } from '@mui/material/styles';

// Opted for MUI Theme over Tailwind for simplicity and better integration with MUI components & Recharts, which is used throughout the app.
// The theme is designed to be dark and modern, with a focus on readability and clear visual hierarchy.

// Color palette
const ACCENT = '#22d3ee';
const ACCENT_HOVER = '#67e8f9';
const ACCENT_DEEP = '#0891b2';
const BG = '#0b0d12';
const SURFACE = '#141821';
const SURFACE_2 = '#1a1f2b';
const BORDER = '#1f2430';
const TEXT = '#e6e8ef';
const TEXT_MUTED = '#8a93a4';
const OK = '#34d399';
const WARN = '#fbbf24';
const ERR = '#f87171';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: ACCENT,
      light: ACCENT_HOVER,
      dark: ACCENT_DEEP,
      contrastText: BG,
    },
    secondary: { main: '#a78bfa', contrastText: BG },
    success: { main: OK, contrastText: BG },
    warning: { main: WARN, contrastText: BG },
    error: { main: ERR, contrastText: BG },
    info: { main: ACCENT, contrastText: BG },
    background: { default: BG, paper: SURFACE },
    text: {
      primary: TEXT,
      secondary: TEXT_MUTED,
      disabled: alpha(TEXT_MUTED, 0.5),
    },
    divider: BORDER,
    action: {
      hover: alpha(ACCENT, 0.08),
      selected: alpha(ACCENT, 0.16),
      focus: alpha(ACCENT, 0.24),
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Roboto, system-ui, "Segoe UI", sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: BG, color: TEXT },
        '*::selection': { background: alpha(ACCENT, 0.35) },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-track': { background: BG },
        '*::-webkit-scrollbar-thumb': { background: BORDER, borderRadius: 8 },
        '*::-webkit-scrollbar-thumb:hover': { background: SURFACE_2 },
      },
    },
    MuiAppBar: {
      defaultProps: { color: 'transparent', elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: SURFACE,
          backgroundImage: 'none',
          borderBottom: `1px solid ${BORDER}`,
          color: TEXT,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE,
          backgroundImage: 'none',
          borderRight: `1px solid ${BORDER}`,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: {
          borderColor: BORDER,
          backgroundColor: SURFACE,
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          borderColor: BORDER,
          backgroundColor: SURFACE,
          backgroundImage: 'none',
          transition: 'border-color 120ms ease, transform 120ms ease',
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: alpha(ACCENT, 0.04) },
          '&:hover .MuiCardActionArea-focusHighlight': { opacity: 0 },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8 },
        outlined: {
          borderColor: BORDER,
          '&:hover': { borderColor: ACCENT },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            color: BG,
            '&:hover': { backgroundColor: ACCENT_HOVER },
          },
        },
      ],
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: BORDER,
          color: TEXT_MUTED,
          textTransform: 'none',
          '&.Mui-selected': {
            backgroundColor: alpha(ACCENT, 0.16),
            color: ACCENT,
            '&:hover': { backgroundColor: alpha(ACCENT, 0.24) },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: BORDER },
        head: {
          color: TEXT_MUTED,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.72rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: alpha(ACCENT, 0.04) } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        colorSuccess: {
          backgroundColor: alpha(OK, 0.16),
          color: OK,
          border: `1px solid ${alpha(OK, 0.4)}`,
        },
        colorWarning: {
          backgroundColor: alpha(WARN, 0.16),
          color: WARN,
          border: `1px solid ${alpha(WARN, 0.4)}`,
        },
        colorError: {
          backgroundColor: alpha(ERR, 0.16),
          color: ERR,
          border: `1px solid ${alpha(ERR, 0.4)}`,
        },
        colorInfo: {
          backgroundColor: alpha(ACCENT, 0.16),
          color: ACCENT,
          border: `1px solid ${alpha(ACCENT, 0.4)}`,
        },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(BG, 0.6),
          '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(ACCENT, 0.6),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: ACCENT,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: SURFACE_2,
          border: `1px solid ${BORDER}`,
          color: TEXT,
          fontSize: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE,
          backgroundImage: 'none',
          border: `1px solid ${BORDER}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: alpha(ACCENT, 0.16),
            color: ACCENT,
            '&:hover': { backgroundColor: alpha(ACCENT, 0.24) },
            '& .MuiListItemIcon-root': { color: ACCENT },
          },
        },
      },
    },
  },
});
