import { useState, useRef, useEffect } from 'react';
import {
    Box, Button, Container, Typography, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ImageIcon from '@mui/icons-material/Image';
import { useTournament } from '../context/useTournament';
import type { Match, Player } from '../types/tournament';
import MatchCard from '../components/bracket/MatchCard';
import {
    getRoundName,
    getTotalRounds,
    getMatchesForRound,
    generateNextRoundMatches,
    findPlayerWithMinTeams,
} from '../utils/tournament';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

export default function Bracket() {
    const { tournament, setTournament, resetTournament } = useTournament();
    const { matches, players, selectedTeams, currentRound } = tournament;
    const totalRounds = getTotalRounds(selectedTeams.length);
    const [resetDialog, setResetDialog] = useState(false);
    const bracketRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tournament.phase === 'completed') {
            const duration = 4000;
            const end = Date.now() + duration;
            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#00D4AA', '#FF6B35', '#ffffff'],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#00D4AA', '#FF6B35', '#ffffff'],
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
        }
    }, [tournament.phase]);

    const handleSaveImage = async () => {
        if (!bracketRef.current) return;
        const canvas = await html2canvas(bracketRef.current, {
            backgroundColor: '#0A0E1A',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
        });
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament-bracket-${tournament.id}.png`;
        a.click();
    };

    // ── STEP 1: Self-play — player chooses which team to keep ────────
    const handleSelfPlayChoose = (matchId: string, chosenTeamId: string) => {
        const match = matches.find(m => m.id === matchId)!;

        // The OTHER team gets transferred
        const transferredTeamId = chosenTeamId === match.homeTeamId
            ? match.awayTeamId!
            : match.homeTeamId!;

        const originalPlayerId = match.homePlayerId!; // same as awayPlayerId in self-play

        // Find player with minimum teams in current round (excluding self)
        const currentRoundMatches = getMatchesForRound(matches, currentRound);
        const receivingPlayerId = findPlayerWithMinTeams(
            players, originalPlayerId, currentRoundMatches
        );

        // Determine new home/away assignment after transfer
        // chosenTeam stays with original player, transferredTeam goes to receiver
        const newHomeTeamId = chosenTeamId;
        const newHomePlayerId = originalPlayerId;
        const newAwayTeamId = transferredTeamId;
        const newAwayPlayerId = receivingPlayerId;

        const updatedMatch: Match = {
            ...match,
            homeTeamId: newHomeTeamId,
            homePlayerId: newHomePlayerId,
            awayTeamId: newAwayTeamId,
            awayPlayerId: newAwayPlayerId,
            chosenTeamId,
            transferredTeamId,
            transferredFromPlayerId: originalPlayerId,
            transferredToPlayerId: receivingPlayerId,
            isSelfPlay: false, // now it's two different players
        };

        // Update receiver's teamIds to include the transferred team
        const updatedPlayers = players.map(p => {
            if (p.id === receivingPlayerId && !p.teamIds.includes(transferredTeamId)) {
                return { ...p, teamIds: [...p.teamIds, transferredTeamId] };
            }
            return p;
        });

        setTournament({
            ...tournament,
            players: updatedPlayers,
            matches: matches.map(m => m.id === matchId ? updatedMatch : m),
        });
    };

    // ── STEP 2: Enter score and advance bracket ──────────────────────
    const handleMatchComplete = (
        matchId: string,
        homeScore: number,
        awayScore: number,
    ) => {
        const match = matches.find(m => m.id === matchId)!;
        const homeWins = homeScore > awayScore;

        const winnerTeamId = homeWins ? match.homeTeamId! : match.awayTeamId!;
        const winnerPlayerId = homeWins ? match.homePlayerId! : match.awayPlayerId!;

        const updatedMatch: Match = {
            ...match,
            homeScore,
            awayScore,
            winnerTeamId,
            winnerPlayerId,
            status: 'completed',
        };

        const updatedMatches = matches.map(m => m.id === matchId ? updatedMatch : m);
        const roundMatches = getMatchesForRound(updatedMatches, currentRound);
        const allDone = roundMatches.every(m => m.status === 'completed');

        // Update winner's teamIds to reflect only their winning team going forward
        const updatedPlayers: Player[] = players.map(p => p);

        if (allDone && currentRound < totalRounds) {
            const nextMatches = generateNextRoundMatches(roundMatches, updatedPlayers, currentRound + 1);
            setTournament({
                ...tournament,
                players: updatedPlayers,
                matches: [...updatedMatches, ...nextMatches],
                currentRound: currentRound + 1,
            });
        } else if (allDone && currentRound === totalRounds) {
            const winner = players.find(p => p.id === winnerPlayerId) ?? null;
            setTournament({
                ...tournament,
                players: updatedPlayers,
                matches: updatedMatches,
                phase: 'completed',
                winner,
            });
        } else {
            setTournament({ ...tournament, players: updatedPlayers, matches: updatedMatches });
        }
    };

    const handleSaveJSON = () => {
        const blob = new Blob([JSON.stringify(tournament, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament-${tournament.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const loaded = JSON.parse(evt.target?.result as string);
                setTournament(loaded);
            } catch {
                alert('Invalid tournament file');
            }
        };
        reader.readAsText(file);
    };

    const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

    return (
        <Box sx={{ minHeight: '100vh', py: 4 }}>
            <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontFamily: 'Rajdhani', color: 'primary.main', fontWeight: 700 }}>
                            🏆 TOURNAMENT BRACKET
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Round {currentRound} of {totalRounds} — {getRoundName(selectedTeams.length, currentRound)}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button variant="outlined" size="small" startIcon={<SaveAltIcon />} onClick={handleSaveJSON}>
                            Save JSON
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<ImageIcon />} onClick={handleSaveImage}>
                            Save Image
                        </Button>
                        <Button variant="outlined" size="small" component="label" startIcon={<SaveAltIcon />}>
                            Load JSON
                            <input type="file" accept=".json" hidden onChange={handleLoadJSON} />
                        </Button>
                        <Button variant="outlined" size="small" color="error"
                            startIcon={<RestartAltIcon />} onClick={() => setResetDialog(true)}>
                            Reset
                        </Button>
                    </Box>
                </Box>

                {/* Players legend */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                    {players.map((player, i) => (
                        <Chip
                            key={player.id}
                            label={`${player.name} — ${player.teamIds.length} team${player.teamIds.length !== 1 ? 's' : ''}`}
                            sx={{
                                fontWeight: 700,
                                background: i % 2 === 0 ? 'rgba(0,212,170,0.15)' : 'rgba(255,107,53,0.15)',
                                border: '1px solid',
                                borderColor: i % 2 === 0 ? 'rgba(0,212,170,0.4)' : 'rgba(255,107,53,0.4)',
                            }}
                        />
                    ))}
                </Box>

                {/* Bracket */}
                <Box
                    ref={bracketRef}
                    sx={{
                        display: 'flex',
                        gap: 6,
                        overflowX: 'auto',
                        pb: 4,
                        alignItems: 'flex-start',
                        background: '#0A0E1A', // solid bg for clean export
                        p: 3,
                        borderRadius: 3,
                    }}
                >
                    {rounds.map((round, idx) => {
                        const roundMatches = getMatchesForRound(matches, round);
                        const isCurrentRound = round === currentRound;
                        const roundName = getRoundName(selectedTeams.length, round);

                        return (
                            // Outer box wraps the round column + the arrow connector
                            <Box key={round} sx={{ display: 'flex', alignItems: 'flex-start' }}>

                                {/* Round column */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>

                                    {/* Round header chip */}
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Chip
                                            label={roundName}
                                            size="small"
                                            sx={{
                                                fontWeight: 700, letterSpacing: 1,
                                                background: isCurrentRound ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)',
                                                border: '1px solid',
                                                borderColor: isCurrentRound ? 'secondary.main' : 'rgba(255,255,255,0.1)',
                                                color: isCurrentRound ? 'secondary.main' : 'text.secondary',
                                            }}
                                        />
                                    </Box>

                                    {/* Match cards */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        {roundMatches.length === 0 ? (
                                            <Box sx={{
                                                width: 190, height: 80, borderRadius: 2,
                                                border: '1px dashed rgba(255,255,255,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Awaiting results
                                                </Typography>
                                            </Box>
                                        ) : (
                                            roundMatches.map(match => (
                                                <MatchCard
                                                    key={match.id}
                                                    match={match}
                                                    teams={selectedTeams}
                                                    players={players}
                                                    onSelfPlayChoose={handleSelfPlayChoose}
                                                    onMatchComplete={handleMatchComplete}
                                                    isCurrentRound={isCurrentRound}
                                                />
                                            ))
                                        )}
                                    </Box>
                                </Box>

                                {/* Arrow connector — only between rounds, not after the last one */}
                                {idx < rounds.length - 1 && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 2,
                                        pt: 5,
                                        flexShrink: 0,
                                    }}>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '1.4rem' }}>
                                            →
                                        </Typography>
                                    </Box>
                                )}

                            </Box>
                        );
                    })}

                    {/* Winner */}
                    {tournament.phase === 'completed' && tournament.winner && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                            <Chip label="WINNER" size="small" sx={{
                                fontWeight: 700, letterSpacing: 2,
                                background: 'rgba(0,212,170,0.2)', color: 'primary.main',
                                border: '1px solid rgba(0,212,170,0.5)',
                            }} />
                            <Box sx={{
                                p: 3, borderRadius: 3, border: '2px solid', borderColor: 'primary.main',
                                background: 'rgba(0,212,170,0.1)', textAlign: 'center',
                                boxShadow: '0 0 40px rgba(0,212,170,0.3)',
                            }}>
                                <EmojiEventsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h5" sx={{ fontFamily: 'Rajdhani', fontWeight: 800, color: 'primary.main' }}>
                                    {tournament.winner.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    TOURNAMENT CHAMPION
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Reset Dialog */}
                <Dialog open={resetDialog} onClose={() => setResetDialog(false)}
                    PaperProps={{ sx: { background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}>
                    <DialogTitle>Reset Tournament?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            This will clear everything. Save your JSON first if needed.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => setResetDialog(false)} fullWidth>Cancel</Button>
                        <Button variant="contained" color="error" fullWidth
                            onClick={() => { resetTournament(); setResetDialog(false); }}>
                            Reset
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}