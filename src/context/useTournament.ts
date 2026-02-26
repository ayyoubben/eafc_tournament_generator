import { useContext } from 'react';
import { TournamentContext } from './TournamentContext';

export const useTournament = () => {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used inside TournamentProvider');
  return ctx;
};