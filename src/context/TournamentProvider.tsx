import { useState, type ReactNode } from 'react';
import type { Tournament, TournamentPhase } from '../types/tournament';
import { TournamentContext } from './TournamentContext';

const defaultTournament: Tournament = {
    id: '',
    createdAt: '',
    phase: 'setup_players',
    playerCount: 2,
    teamCount: 2,
    assignmentMode: null,
    players: [],
    selectedTeams: [],
    matches: [],
    currentRound: 1,
    winner: null,
    potMode: false,
};

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
    const [tournament, setTournament] = useState<Tournament>(defaultTournament);

    const updatePhase = (phase: TournamentPhase) => {
        setTournament(prev => ({ ...prev, phase }));
    };

    const resetTournament = () => {
        setTournament({ ...defaultTournament, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    };

    const loadTournament = (t: Tournament) => setTournament(t);

    return (
        <TournamentContext.Provider value={{ tournament, setTournament, updatePhase, resetTournament, loadTournament }}>
            {children}
        </TournamentContext.Provider>
    );
};