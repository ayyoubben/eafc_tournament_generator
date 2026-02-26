import { useState } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Chip,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { Match, Player, Team } from '../../types/tournament';
import { TeamDisplay } from './TeamDisplay';

interface Props {
    match: Match;
    teams: Team[];
    players: Player[];
    onSelfPlayChoose: (matchId: string, chosenTeamId: string) => void;
    onMatchComplete: (matchId: string, homeScore: number, awayScore: number) => void;
    isCurrentRound: boolean;
}

export default function MatchCard({
    match, teams, players,
    onSelfPlayChoose, onMatchComplete, isCurrentRound,
}: Props) {
    const [open, setOpen] = useState(false);
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');

    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);
    const homePlayer = players.find(p => p.id === match.homePlayerId);
    const awayPlayer = players.find(p => p.id === match.awayPlayerId);

    const isCompleted = match.status === 'completed';
    const isPending = match.status === 'pending';
    const isTBD = !match.homeTeamId || !match.awayTeamId;

    // Self-play: needs team choice before score can be entered
    const needsChoice = match.isSelfPlay && !match.chosenTeamId && isPending;
    // Ready to enter score: not self-play, OR self-play with choice already made
    //const readyForScore = isPending && !isTBD && (!match.isSelfPlay || !!match.chosenTeamId);

    const canSubmit = () => {
        const h = parseInt(homeScore);
        const a = parseInt(awayScore);
        if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return false;
        if (h === a) return false;
        return true;
    };

    const handleSubmit = () => {
        onMatchComplete(match.id, parseInt(homeScore), parseInt(awayScore));
        setOpen(false);
        setHomeScore('');
        setAwayScore('');
    };

    const handleChooseTeam = (teamId: string) => {
        onSelfPlayChoose(match.id, teamId);
    };

    const isTransferred = !!match.transferredTeamId;
    const transferredTeam = teams.find(t => t.id === match.transferredTeamId);
    const transferFromPlayer = players.find(p => p.id === match.transferredFromPlayerId);
    const transferToPlayer = players.find(p => p.id === match.transferredToPlayerId);

    const isHomeTransferred = match.transferredTeamId === match.homeTeamId;
    const isAwayTransferred = match.transferredTeamId === match.awayTeamId;

    return (
        <>
            <Box
                onClick={() => {
                    if (!isCurrentRound || isTBD || isCompleted) return;
                    setOpen(true);
                }}
                sx={{
                    width: 190,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isCompleted
                        ? 'rgba(0,212,170,0.25)'
                        : needsChoice
                            ? 'rgba(255,193,7,0.6)'
                            : isCurrentRound && !isTBD
                                ? 'rgba(255,107,53,0.5)'
                                : 'rgba(255,255,255,0.1)',
                    background: isCompleted
                        ? 'rgba(0,212,170,0.04)'
                        : needsChoice
                            ? 'rgba(255,193,7,0.06)'
                            : isCurrentRound && !isTBD
                                ? 'rgba(255,107,53,0.06)'
                                : 'rgba(255,255,255,0.02)',
                    cursor: isCurrentRound && !isTBD && !isCompleted ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': isCurrentRound && !isTBD && !isCompleted ? {
                        transform: 'translateY(-1px)',
                        borderColor: needsChoice ? 'rgba(255,193,7,0.9)' : 'secondary.main',
                    } : {},
                }}
            >
                {/* Self-play needs choice badge */}
                {needsChoice && (
                    <Chip label="⚠ CHOOSE TEAM FIRST" size="small" sx={{
                        mb: 1, width: '100%', height: 18, fontSize: '0.58rem',
                        background: 'rgba(255,193,7,0.2)', color: '#FFC107',
                        border: '1px solid rgba(255,193,7,0.5)',
                    }} />
                )}

                {/* Choice made badge */}
                {match.isSelfPlay && match.chosenTeamId && isPending && (
                    <Chip label="✓ READY TO PLAY" size="small" sx={{
                        mb: 1, width: '100%', height: 18, fontSize: '0.58rem',
                        background: 'rgba(0,212,170,0.15)', color: 'primary.main',
                        border: '1px solid rgba(0,212,170,0.4)',
                    }} />
                )}

                <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5 }}>
                    <TeamDisplay
                        team={homeTeam} player={homePlayer}
                        score={match.homeScore}
                        isWinner={match.winnerTeamId === match.homeTeamId}
                        isTransferredTeam={isHomeTransferred}
                        isCompleted={isCompleted}
                        transferFromPlayer={transferFromPlayer}
                        transferToPlayer={transferToPlayer}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>VS</Typography>
                    </Box>
                    <TeamDisplay
                        team={awayTeam} player={awayPlayer}
                        score={match.awayScore}
                        isWinner={match.winnerTeamId === match.awayTeamId}
                        isTransferredTeam={isAwayTransferred}
                        isCompleted={isCompleted}
                        transferFromPlayer={transferFromPlayer}
                        transferToPlayer={transferToPlayer}
                    />
                </Box>

                {isPending && isCurrentRound && !isTBD && !needsChoice && (
                    <Typography variant="caption" sx={{
                        display: 'block', textAlign: 'center', mt: 1,
                        color: 'secondary.main', fontSize: '0.65rem',
                    }}>
                        Click to enter result
                    </Typography>
                )}
                {needsChoice && (
                    <Typography variant="caption" sx={{
                        display: 'block', textAlign: 'center', mt: 1,
                        color: '#FFC107', fontSize: '0.65rem',
                    }}>
                        Click to choose team
                    </Typography>
                )}
            </Box>

            {/* Dialog */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    sx: {
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3,
                        minWidth: 360,
                    },
                }}
            >
                {/* STEP 1: Self-play — choose team to keep */}
                {match.isSelfPlay && !match.chosenTeamId ? (
                    <>
                        <DialogTitle sx={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>
                            🔀 Self-Play — Choose Team to Keep
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                <strong>{homePlayer?.name}</strong> owns both teams.
                                Choose which team you want to <strong>keep</strong>.
                                The other team will be transferred to <strong>{
                                    players.find(p => p.id !== homePlayer?.id)?.name
                                }</strong>.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {[homeTeam, awayTeam].map(team => {
                                    if (!team) return null;
                                    return (
                                        <Box
                                            key={team.id}
                                            onClick={() => {
                                                handleChooseTeam(team.id);
                                                setOpen(false);
                                            }}
                                            sx={{
                                                flex: 1, p: 2.5, borderRadius: 2,
                                                border: '2px solid rgba(255,255,255,0.1)',
                                                cursor: 'pointer', textAlign: 'center',
                                                transition: 'all 0.15s',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    background: 'rgba(0,212,170,0.1)',
                                                    transform: 'translateY(-2px)',
                                                },
                                            }}
                                        >
                                            <img src={team.logoUrl} alt={team.name}
                                                style={{ width: 56, height: 56, objectFit: 'contain' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
                                                {team.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'primary.main' }}>
                                                Keep this team
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button variant="outlined" fullWidth onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    /* STEP 2: Enter score */
                    <>
                        <DialogTitle sx={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>
                            Enter Match Result
                        </DialogTitle>
                        <DialogContent>
                            {/* Transfer notice */}
                            {isTransferred && (
                                <Box sx={{
                                    mb: 2, p: 1.5, borderRadius: 2,
                                    background: 'rgba(255,193,7,0.08)',
                                    border: '1px solid rgba(255,193,7,0.3)',
                                    display: 'flex', alignItems: 'center', gap: 1,
                                }}>
                                    <SwapHorizIcon sx={{ color: '#FFC107', fontSize: 18 }} />
                                    <Typography variant="caption" sx={{ color: '#FFC107' }}>
                                        <strong>{transferredTeam?.name}</strong> transferred from{' '}
                                        <strong>{transferFromPlayer?.name}</strong> →{' '}
                                        <strong>{transferToPlayer?.name}</strong>
                                    </Typography>
                                </Box>
                            )}

                            {/* Teams */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box sx={{ textAlign: 'center', flex: 1 }}>
                                    <img src={homeTeam?.logoUrl} alt={homeTeam?.name}
                                        style={{ width: 48, height: 48, objectFit: 'contain' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{homeTeam?.name}</Typography>
                                    <Typography variant="caption" sx={{ color: 'primary.main' }}>{homePlayer?.name}</Typography>
                                </Box>
                                <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 800 }}>VS</Typography>
                                <Box sx={{ textAlign: 'center', flex: 1 }}>
                                    <img src={awayTeam?.logoUrl} alt={awayTeam?.name}
                                        style={{ width: 48, height: 48, objectFit: 'contain' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{awayTeam?.name}</Typography>
                                    <Typography variant="caption" sx={{ color: 'primary.main' }}>{awayPlayer?.name}</Typography>
                                </Box>
                            </Box>

                            {/* Score */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    label={homeTeam?.name} type="number"
                                    value={homeScore} onChange={e => setHomeScore(e.target.value)}
                                    inputProps={{ min: 0, max: 99 }} fullWidth
                                />
                                <Typography variant="h5" sx={{ color: 'text.secondary' }}>—</Typography>
                                <TextField
                                    label={awayTeam?.name} type="number"
                                    value={awayScore} onChange={e => setAwayScore(e.target.value)}
                                    inputProps={{ min: 0, max: 99 }} fullWidth
                                />
                            </Box>
                            {homeScore !== '' && awayScore !== '' && homeScore === awayScore && (
                                <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
                                    ⚠️ No draws — one team must win
                                </Typography>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5, gap: 1 }}>
                            <Button variant="outlined" onClick={() => setOpen(false)} fullWidth>Cancel</Button>
                            <Button
                                variant="contained" onClick={handleSubmit}
                                disabled={!canSubmit()} fullWidth
                                sx={{ background: canSubmit() ? 'linear-gradient(90deg,#00D4AA,#00B894)' : undefined }}
                            >
                                Confirm Result
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
}