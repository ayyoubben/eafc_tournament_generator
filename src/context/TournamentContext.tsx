import { createContext } from 'react';
import type { Tournament, TournamentPhase } from '../types/tournament';

interface TournamentContextType {
    tournament: Tournament;
    setTournament: (t: Tournament) => void;
    updatePhase: (phase: TournamentPhase) => void;
    resetTournament: () => void;
    loadTournament: (t: Tournament) => void;
}

export const TournamentContext = createContext<TournamentContextType | null>(null);