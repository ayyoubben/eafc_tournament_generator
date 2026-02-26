import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TournamentProvider } from './context/TournamentProvider';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <TournamentProvider>
        <CssBaseline />
        <App />
      </TournamentProvider>
    </ThemeProvider>
  </React.StrictMode>
);