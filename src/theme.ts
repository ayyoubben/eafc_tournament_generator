import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D4AA',
    },
    secondary: {
      main: '#FF6B35',
    },
    background: {
      default: '#0A0E1A',
      paper: '#111827',
    },
    text: {
      primary: '#F0F4FF',
      secondary: '#8892A4',
    },
  },
  typography: {
    fontFamily: '"Rajdhani", "Barlow", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '0.05em' },
    h2: { fontWeight: 700, letterSpacing: '0.04em' },
    h3: { fontWeight: 600, letterSpacing: '0.03em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 700, letterSpacing: '0.08em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          padding: '10px 28px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
  },
});

export default theme;