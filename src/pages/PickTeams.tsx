import { useState, useMemo } from 'react';
import {
    Box, Button, Card, CardContent, Container, Typography,
    TextField, InputAdornment, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTournament } from '../context/useTournament';
import { EA_FC_TEAMS } from '../data/teams';
import type { Team } from '../types/tournament';

const LEAGUES = ['All', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];

export default function PickTeams() {
    const { tournament, setTournament } = useTournament();
    const [search, setSearch] = useState('');
    const [leagueFilter, setLeagueFilter] = useState('All');

    const needed = tournament.teamCount;
    const usePots = needed > 2;
    const potSize = needed / 2;

    // pot1 and pot2 are separate lists
    const [pot1, setPot1] = useState<Team[]>(
        tournament.selectedTeams.filter(t => t.pot === 1) ?? []
    );
    const [pot2, setPot2] = useState<Team[]>(
        tournament.selectedTeams.filter(t => t.pot === 2) ?? []
    );

    const allSelected = [...pot1, ...pot2];

    const filtered = useMemo(() => {
        return EA_FC_TEAMS.filter(team => {
            const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
            const matchesLeague = leagueFilter === 'All' || team.league === leagueFilter;
            return matchesSearch && matchesLeague;
        });
    }, [search, leagueFilter]);

    const getTeamPot = (teamId: string): 0 | 1 | 2 => {
        if (pot1.find(t => t.id === teamId)) return 1;
        if (pot2.find(t => t.id === teamId)) return 2;
        return 0;
    };

    const handleTeamClick = (team: Team, targetPot: 1 | 2) => {
        const currentPot = getTeamPot(team.id);

        // If already in this pot → remove it
        if (currentPot === targetPot) {
            if (targetPot === 1) setPot1(prev => prev.filter(t => t.id !== team.id));
            else setPot2(prev => prev.filter(t => t.id !== team.id));
            return;
        }

        // If in the other pot → move it
        if (currentPot !== 0) {
            if (currentPot === 1) setPot1(prev => prev.filter(t => t.id !== team.id));
            else setPot2(prev => prev.filter(t => t.id !== team.id));
        }

        // Add to target pot if not full
        if (targetPot === 1 && pot1.length < potSize) {
            setPot1(prev => [...prev, { ...team, pot: 1 }]);
        } else if (targetPot === 2 && pot2.length < potSize) {
            setPot2(prev => [...prev, { ...team, pot: 2 }]);
        }
    };

    // No-pots mode (teamCount === 2)
    const handleTeamClickNoPots = (team: Team) => {
        const already = allSelected.find(t => t.id === team.id);
        if (already) {
            setPot1(prev => prev.filter(t => t.id !== team.id));
            setPot2(prev => prev.filter(t => t.id !== team.id));
        } else if (allSelected.length < needed) {
            setPot1(prev => [...prev, { ...team, pot: 1 }]);
        }
    };

    const isReady = usePots
        ? pot1.length === potSize && pot2.length === potSize
        : allSelected.length === needed;

    const handleNext = () => {
        const selectedTeams: Team[] = [
            ...pot1.map(t => ({ ...t, pot: 1 as const })),
            ...pot2.map(t => ({ ...t, pot: 2 as const })),
        ];
        setTournament({
            ...tournament,
            selectedTeams,
            potMode: usePots,
            phase: 'assign_teams',
        });
    };

    const handleBack = () => {
        setTournament({ ...tournament, phase: 'setup_teams' });
    };

    const TeamChip = ({ team, activePot }: { team: Team; activePot: 1 | 2 | null }) => {
        const teamPot = getTeamPot(team.id);
        const isInThisPot = activePot !== null && teamPot === activePot;
        const isInOtherPot = teamPot !== 0 && !isInThisPot;

        return (
            <Box
                sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isInThisPot
                        ? activePot === 1 ? 'primary.main' : 'secondary.main'
                        : 'rgba(255,255,255,0.08)',
                    background: isInThisPot
                        ? activePot === 1 ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,53,0.1)'
                        : 'rgba(255,255,255,0.03)',
                    opacity: isInOtherPot ? 0.35 : 1,
                    cursor: isInOtherPot ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    position: 'relative',
                    transition: 'all 0.15s',
                    '&:hover': !isInOtherPot ? {
                        borderColor: activePot === 1 ? 'primary.main' : 'secondary.main',
                    } : {},
                }}
                onClick={() => {
                    if (isInOtherPot) return;
                    if (!usePots) {
                        handleTeamClickNoPots(team);
                    } else if (activePot) {
                        handleTeamClick(team, activePot);
                    }
                }}
            >
                {isInThisPot && (
                    <CheckCircleIcon sx={{
                        position: 'absolute', top: 5, right: 5, fontSize: 14,
                        color: activePot === 1 ? 'primary.main' : 'secondary.main',
                    }} />
                )}
                <Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={team.logoUrl} alt={team.name} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', fontSize: '0.7rem', lineHeight: 1.2 }}>
                    {team.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
                    {team.league}
                </Typography>
            </Box>
        );
    };

    // ── NO POTS MODE (2 teams) ────────────────────────────────────────
    if (!usePots) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <SportsSoccerIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                        <Typography variant="h3" sx={{ color: 'primary.main', fontFamily: 'Rajdhani' }}>EA FC 26</Typography>
                    </Box>
                    <Typography variant="h5">TOURNAMENT CREATOR</Typography>
                </Box>
                <Card>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 3 }}>STEP 3 OF 4</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, mb: 3 }}>
                            <Typography variant="h5">Pick {needed} teams</Typography>
                            <Chip label={`${allSelected.length} / ${needed}`}
                                color={allSelected.length === needed ? 'primary' : 'default'}
                                sx={{ fontWeight: 700 }} />
                        </Box>
                        <TextField fullWidth placeholder="Search teams..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                            sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            {LEAGUES.map(l => (
                                <Chip key={l} label={l} onClick={() => setLeagueFilter(l)}
                                    variant={leagueFilter === l ? 'filled' : 'outlined'}
                                    color={leagueFilter === l ? 'primary' : 'default'}
                                    sx={{ cursor: 'pointer' }} />
                            ))}
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1.5, maxHeight: 380, overflowY: 'auto', mb: 3 }}>
                            {filtered.map(team => (
                                <TeamChip key={team.id} team={team} activePot={1} />
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="outlined" fullWidth size="large" onClick={handleBack} sx={{ py: 1.5 }}>← Back</Button>
                            <Button variant="contained" fullWidth size="large" disabled={!isReady} onClick={handleNext}
                                sx={{ py: 1.5, background: isReady ? 'linear-gradient(90deg,#00D4AA,#00B894)' : undefined }}>
                                Next: Assign Teams →
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    // ── TWO POTS MODE ─────────────────────────────────────────────────
    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <SportsSoccerIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                    <Typography variant="h3" sx={{ color: 'primary.main', fontFamily: 'Rajdhani' }}>EA FC 26</Typography>
                </Box>
                <Typography variant="h5">TOURNAMENT CREATOR</Typography>
            </Box>

            <Card>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 3 }}>STEP 3 OF 4</Typography>
                    <Typography variant="h5" sx={{ mt: 0.5, mb: 1 }}>Distribute teams into pots</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Each pot needs <strong>{potSize} teams</strong>. Click a team in the pool to add it to Pot 1 or Pot 2.
                    </Typography>

                    {/* Search + filter */}
                    <TextField fullWidth placeholder="Search teams..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                        sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                        {LEAGUES.map(l => (
                            <Chip key={l} label={l} onClick={() => setLeagueFilter(l)}
                                variant={leagueFilter === l ? 'filled' : 'outlined'}
                                color={leagueFilter === l ? 'primary' : 'default'}
                                sx={{ cursor: 'pointer' }} />
                        ))}
                    </Box>

                    {/* Three columns: Pot1 | Pool | Pot2 */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 3 }}>

                        {/* POT 1 */}
                        <Box>
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                mb: 2, pb: 1, borderBottom: '2px solid', borderColor: 'primary.main',
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    🟢 POT 1
                                </Typography>
                                <Chip label={`${pot1.length} / ${potSize}`} size="small"
                                    color={pot1.length === potSize ? 'primary' : 'default'} sx={{ fontWeight: 700 }} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 200 }}>
                                {pot1.length === 0 && (
                                    <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed rgba(0,212,170,0.2)', textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Click teams from pool →
                                        </Typography>
                                    </Box>
                                )}
                                {pot1.map(team => (
                                    <Box key={team.id} sx={{
                                        display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.5,
                                        border: '1px solid rgba(0,212,170,0.3)', background: 'rgba(0,212,170,0.08)',
                                        cursor: 'pointer', '&:hover': { background: 'rgba(0,212,170,0.15)' },
                                    }}
                                        onClick={() => setPot1(prev => prev.filter(t => t.id !== team.id))}
                                    >
                                        <img src={team.logoUrl} alt={team.name} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>{team.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'error.main', fontSize: '0.65rem' }}>✕</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        {/* TEAM POOL */}
                        <Box>
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                mb: 2, pb: 1, borderBottom: '2px solid rgba(255,255,255,0.15)',
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                    TEAM POOL
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Click team → select pot below
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))', gap: 1, maxHeight: 440, overflowY: 'auto' }}>
                                {filtered.map(team => {
                                    const teamPot = getTeamPot(team.id);
                                    const isAssigned = teamPot !== 0;
                                    return (
                                        <Box key={team.id} sx={{
                                            p: 1, borderRadius: 2, border: '1px solid',
                                            borderColor: teamPot === 1 ? 'primary.main' : teamPot === 2 ? 'secondary.main' : 'rgba(255,255,255,0.08)',
                                            background: teamPot === 1 ? 'rgba(0,212,170,0.08)' : teamPot === 2 ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.03)',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                                            position: 'relative',
                                        }}>
                                            {isAssigned && (
                                                <Chip label={`P${teamPot}`} size="small" sx={{
                                                    position: 'absolute', top: 3, right: 3, height: 16, fontSize: '0.55rem',
                                                    background: teamPot === 1 ? 'rgba(0,212,170,0.3)' : 'rgba(255,107,53,0.3)',
                                                    color: teamPot === 1 ? 'primary.main' : 'secondary.main',
                                                }} />
                                            )}
                                            <img src={team.logoUrl} alt={team.name} loading="lazy"
                                                style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', fontSize: '0.65rem', lineHeight: 1.2 }}>
                                                {team.name}
                                            </Typography>
                                            {/* Pot selector buttons */}
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                <Button size="small" onClick={() => handleTeamClick(team, 1)}
                                                    disabled={pot1.length >= potSize && teamPot !== 1}
                                                    sx={{
                                                        minWidth: 0, px: 1, py: 0.25, fontSize: '0.6rem', height: 20,
                                                        background: teamPot === 1 ? 'rgba(0,212,170,0.3)' : 'rgba(0,212,170,0.1)',
                                                        color: 'primary.main', '&:hover': { background: 'rgba(0,212,170,0.3)' },
                                                    }}>P1</Button>
                                                <Button size="small" onClick={() => handleTeamClick(team, 2)}
                                                    disabled={pot2.length >= potSize && teamPot !== 2}
                                                    sx={{
                                                        minWidth: 0, px: 1, py: 0.25, fontSize: '0.6rem', height: 20,
                                                        background: teamPot === 2 ? 'rgba(255,107,53,0.3)' : 'rgba(255,107,53,0.1)',
                                                        color: 'secondary.main', '&:hover': { background: 'rgba(255,107,53,0.3)' },
                                                    }}>P2</Button>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* POT 2 */}
                        <Box>
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                mb: 2, pb: 1, borderBottom: '2px solid', borderColor: 'secondary.main',
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                    🟠 POT 2
                                </Typography>
                                <Chip label={`${pot2.length} / ${potSize}`} size="small"
                                    sx={{
                                        fontWeight: 700, background: pot2.length === potSize ? 'rgba(255,107,53,0.2)' : undefined,
                                        color: pot2.length === potSize ? 'secondary.main' : undefined
                                    }} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 200 }}>
                                {pot2.length === 0 && (
                                    <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed rgba(255,107,53,0.2)', textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            ← Click teams from pool
                                        </Typography>
                                    </Box>
                                )}
                                {pot2.map(team => (
                                    <Box key={team.id} sx={{
                                        display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.5,
                                        border: '1px solid rgba(255,107,53,0.3)', background: 'rgba(255,107,53,0.08)',
                                        cursor: 'pointer', '&:hover': { background: 'rgba(255,107,53,0.15)' },
                                    }}
                                        onClick={() => setPot2(prev => prev.filter(t => t.id !== team.id))}
                                    >
                                        <img src={team.logoUrl} alt={team.name} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>{team.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'error.main', fontSize: '0.65rem' }}>✕</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    {/* Progress */}
                    <Box sx={{ mt: 3, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Total selected: {pot1.length + pot2.length} / {needed}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isReady ? 'primary.main' : 'text.secondary' }}>
                                {isReady ? '✓ Ready to proceed' : `Need ${potSize - pot1.length} more in Pot 1, ${potSize - pot2.length} more in Pot 2`}
                            </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                            <Box sx={{
                                height: '100%', borderRadius: 3,
                                background: 'linear-gradient(90deg, #00D4AA, #FF6B35)',
                                width: `${((pot1.length + pot2.length) / needed) * 100}%`,
                                transition: 'width 0.3s ease',
                            }} />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="outlined" fullWidth size="large" onClick={handleBack} sx={{ py: 1.5 }}>← Back</Button>
                        <Button variant="contained" fullWidth size="large" disabled={!isReady} onClick={handleNext}
                            sx={{ py: 1.5, background: isReady ? 'linear-gradient(90deg,#00D4AA,#00B894)' : undefined }}>
                            Next: Assign Teams →
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}