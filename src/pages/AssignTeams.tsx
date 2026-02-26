import { useState } from 'react';
import {
    Box, Button, Card, CardContent, Container,
    Typography, ToggleButton, ToggleButtonGroup,
    /*Divider,*/ Chip,/* Avatar,*/
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import PanToolIcon from '@mui/icons-material/PanTool';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import LockIcon from '@mui/icons-material/Lock';
import { useTournament } from '../context/useTournament';
import type { AssignmentMode, Player } from '../types/tournament';
import {
    distributeTeamsRandomly,
    distributeTeamsWithPots,
    generateKnockoutMatches,
} from '../utils/tournament';

export default function AssignTeams() {
    const { tournament, setTournament } = useTournament();
    const { players, selectedTeams, playerCount } = tournament;

    const teamsPerPlayer = selectedTeams.length / playerCount;

    const [mode, setMode] = useState<AssignmentMode>('manual');
    const [assignedPlayers, setAssignedPlayers] = useState<Player[]>(
        players.map(p => ({ ...p, teamIds: [] }))
    );
    const [randomized, setRandomized] = useState(false);

    // ─── Manual drag/click assignment ───────────────────────────────
    const [draggingTeamId, setDraggingTeamId] = useState<string | null>(null);

    const assignedTeamIds = assignedPlayers.flatMap(p => p.teamIds);
    const unassignedTeams = selectedTeams.filter(
        t => !assignedTeamIds.includes(t.id)
    );

    const handleDropOnPlayer = (playerId: string, teamId: string) => {
        setAssignedPlayers(prev =>
            prev.map(p => {
                if (p.id === playerId) {
                    if (p.teamIds.length >= teamsPerPlayer) return p;
                    if (p.teamIds.includes(teamId)) return p;
                    return { ...p, teamIds: [...p.teamIds, teamId] };
                }
                return p;
            })
        );
        setDraggingTeamId(null);
    };

    const handleClickAssign = (playerId: string, teamId: string) => {
        const player = assignedPlayers.find(p => p.id === playerId);
        if (!player || player.teamIds.length >= teamsPerPlayer) return;
        handleDropOnPlayer(playerId, teamId);
    };

    const handleRemoveTeam = (playerId: string, teamId: string) => {
        setAssignedPlayers(prev =>
            prev.map(p =>
                p.id === playerId
                    ? { ...p, teamIds: p.teamIds.filter(id => id !== teamId) }
                    : p
            )
        );
    };

    // ─── Random mode ────────────────────────────────────────────────
    const handleRandomize = () => {
        const updated = tournament.potMode
            ? distributeTeamsWithPots(players, selectedTeams)
            : distributeTeamsRandomly(players, selectedTeams);
        setAssignedPlayers(updated);
        setRandomized(true);
    };

    // ─── Proceed ────────────────────────────────────────────────────
    const allAssigned = assignedPlayers.every(
        p => p.teamIds.length === teamsPerPlayer
    );

    const handleGenerateBracket = () => {
        const updatedPlayers = assignedPlayers;
        const matches = generateKnockoutMatches(updatedPlayers, selectedTeams);
        setTournament({
            ...tournament,
            assignmentMode: mode,
            players: updatedPlayers,
            matches,
            phase: 'bracket',
        });
    };

    const handleBack = () => {
        setTournament({ ...tournament, phase: 'pick_teams' });
    };

    const getTeamById = (id: string) =>
        selectedTeams.find(t => t.id === id);

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <SportsSoccerIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                    <Typography variant="h3" sx={{ color: 'primary.main', fontFamily: 'Rajdhani' }}>
                        EA FC 26
                    </Typography>
                </Box>
                <Typography variant="h5">TOURNAMENT CREATOR</Typography>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 3 }}>
                        STEP 4 OF 4
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 0.5, mb: 3 }}>
                        Assign Teams to Players
                    </Typography>

                    {/* Mode selector */}
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={(_, v) => {
                            if (!v) return;
                            setMode(v);
                            setAssignedPlayers(players.map(p => ({ ...p, teamIds: [] })));
                            setRandomized(false);
                        }}
                        fullWidth
                        sx={{ mb: 4 }}
                    >
                        <ToggleButton
                            value="manual"
                            sx={{
                                gap: 1,
                                fontWeight: 700,
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    color: '#0A0E1A',
                                    '&:hover': { backgroundColor: 'primary.main' },
                                },
                            }}
                        >
                            <PanToolIcon fontSize="small" /> Manual
                        </ToggleButton>
                        <ToggleButton
                            value="random"
                            sx={{
                                gap: 1,
                                fontWeight: 700,
                                '&.Mui-selected': {
                                    backgroundColor: 'secondary.main',
                                    color: '#fff',
                                    '&:hover': { backgroundColor: 'secondary.main' },
                                },
                            }}
                        >
                            <ShuffleIcon fontSize="small" /> Random
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* ── MANUAL MODE ── */}
                    {mode === 'manual' && (
                        <Box>
                            {/* Unassigned teams pool */}
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                                Available teams — click a team, then click a player to assign
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    p: 2,
                                    mb: 3,
                                    minHeight: 64,
                                    borderRadius: 2,
                                    border: '1px dashed rgba(255,255,255,0.15)',
                                    background: 'rgba(255,255,255,0.02)',
                                }}
                            >
                                {unassignedTeams.length === 0 && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                                        ✓ All teams assigned
                                    </Typography>
                                )}
                                {unassignedTeams.map(team => (
                                    <Chip
                                        key={team.id}
                                        label={team.name}
                                        icon={
                                            <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>
                                                <img src={team.logoUrl} alt={team.name} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                                            </Box>
                                        }
                                        onClick={() =>
                                            setDraggingTeamId(prev => (prev === team.id ? null : team.id))
                                        }
                                        sx={{
                                            cursor: 'pointer',
                                            border: '1px solid',
                                            borderColor: draggingTeamId === team.id ? 'primary.main' : 'rgba(255,255,255,0.15)',
                                            background: draggingTeamId === team.id ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
                                            transition: 'all 0.15s',
                                            '&:hover': { borderColor: 'primary.main' },
                                        }}
                                    />
                                ))}
                            </Box>

                            {/* Players */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {assignedPlayers.map(player => {
                                    const isFull = player.teamIds.length >= teamsPerPlayer;
                                    const isTarget = !!draggingTeamId && !isFull;

                                    return (
                                        <Box
                                            key={player.id}
                                            onClick={() => {
                                                if (draggingTeamId && isTarget) {
                                                    handleClickAssign(player.id, draggingTeamId);
                                                }
                                            }}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: isTarget
                                                    ? 'primary.main'
                                                    : isFull
                                                        ? 'rgba(0,212,170,0.3)'
                                                        : 'rgba(255,255,255,0.1)',
                                                background: isTarget
                                                    ? 'rgba(0,212,170,0.07)'
                                                    : 'rgba(255,255,255,0.02)',
                                                cursor: isTarget ? 'pointer' : 'default',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {player.name}
                                                </Typography>
                                                <Chip
                                                    label={`${player.teamIds.length} / ${teamsPerPlayer}`}
                                                    size="small"
                                                    color={isFull ? 'primary' : 'default'}
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </Box>

                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 32 }}>
                                                {player.teamIds.length === 0 && (
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                                        {isTarget ? '👆 Click to assign selected team' : 'No teams yet'}
                                                    </Typography>
                                                )}
                                                {player.teamIds.map(tid => {
                                                    const team = getTeamById(tid);
                                                    if (!team) return null;
                                                    return (
                                                        <Chip
                                                            key={tid}
                                                            label={team.name}
                                                            size="small"
                                                            icon={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>
                                                                    <img src={team.logoUrl} alt={team.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                                                                </Box>
                                                            }
                                                            onDelete={() => handleRemoveTeam(player.id, tid)}
                                                            sx={{
                                                                background: 'rgba(0,212,170,0.12)',
                                                                border: '1px solid rgba(0,212,170,0.3)',
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* ── RANDOM MODE ── */}
                    {mode === 'random' && (
                        <Box>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<ShuffleIcon />}
                                    onClick={handleRandomize}
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        background: 'linear-gradient(90deg, #FF6B35, #FF8C42)',
                                        fontSize: '1rem',
                                        '&:hover': { background: 'linear-gradient(90deg, #e55a25, #ff7a30)' },
                                    }}
                                >
                                    {randomized ? 'Randomize Again' : 'Distribute Randomly'}
                                </Button>
                            </Box>

                            {randomized && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {assignedPlayers.map(player => (
                                        <Box
                                            key={player.id}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: '1px solid rgba(255,107,53,0.3)',
                                                background: 'rgba(255,107,53,0.05)',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {player.name}
                                                </Typography>
                                                <Chip
                                                    label={`${player.teamIds.length} teams`}
                                                    size="small"
                                                    sx={{ background: 'rgba(255,107,53,0.2)', color: 'secondary.main', fontWeight: 700 }}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {player.teamIds.map(tid => {
                                                    const team = getTeamById(tid);
                                                    if (!team) return null;
                                                    return (
                                                        <Chip
                                                            key={tid}
                                                            label={team.name}
                                                            size="small"
                                                            icon={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>
                                                                    <img src={team.logoUrl} alt={team.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                                                                </Box>
                                                            }
                                                            sx={{
                                                                background: 'rgba(255,107,53,0.12)',
                                                                border: '1px solid rgba(255,107,53,0.3)',
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    onClick={handleBack}
                    sx={{ py: 1.5 }}
                >
                    ← Back
                </Button>
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={!allAssigned}
                    startIcon={<LockIcon />}
                    onClick={handleGenerateBracket}
                    sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        background: allAssigned
                            ? 'linear-gradient(90deg, #00D4AA, #00B894)'
                            : undefined,
                    }}
                >
                    Generate Bracket →
                </Button>
            </Box>
        </Container>
    );
}