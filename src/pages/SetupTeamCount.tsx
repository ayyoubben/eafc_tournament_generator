import { useState } from 'react';
import {
    Box, Button, Card, CardContent, Container,
    Typography, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTournament } from '../context/useTournament';
import type { TeamCount } from '../types/tournament';

const TEAM_COUNTS: TeamCount[] = [2, 4, 8, 16, 32];

export default function SetupTeamCount() {
    const { tournament, setTournament } = useTournament();
    const [teamCount, setTeamCount] = useState<TeamCount>(
        tournament.teamCount ?? tournament.playerCount
    );

    const handleCountChange = (_: React.MouseEvent<HTMLElement>, value: TeamCount) => {
        if (!value) return;
        setTeamCount(value);
    };

    // teams must be >= players
    const isValid = teamCount >= tournament.playerCount;

    const handleNext = () => {
        setTournament({ ...tournament, teamCount, phase: 'pick_teams' });
    };

    const handleBack = () => {
        setTournament({ ...tournament, phase: 'setup_players' });
    };

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <GroupsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                    <Typography variant="h3" sx={{ color: 'primary.main', fontFamily: 'Rajdhani' }}>
                        EA FC 26
                    </Typography>
                </Box>
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 1 }}>
                    TOURNAMENT CREATOR
                </Typography>
            </Box>

            <Card>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 3 }}>
                        STEP 2 OF 4
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 0.5, mb: 1 }}>
                        How many teams?
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Must be ≥ number of players ({tournament.playerCount})
                    </Typography>

                    <ToggleButtonGroup
                        value={teamCount}
                        exclusive
                        onChange={handleCountChange}
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        {TEAM_COUNTS.map(count => {
                            const disabled = count < tournament.playerCount;
                            return (
                                <ToggleButton
                                    key={count}
                                    value={count}
                                    disabled={disabled}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.main',
                                            color: '#0A0E1A',
                                            '&:hover': { backgroundColor: 'primary.main' },
                                        },
                                    }}
                                >
                                    {count}
                                </ToggleButton>
                            );
                        })}
                    </ToggleButtonGroup>

                    {!isValid && (
                        <Typography variant="body2" sx={{ color: 'error.main', mb: 2 }}>
                            ⚠️ Teams must be equal to or greater than players
                        </Typography>
                    )}

                    {isValid && (
                        <Box
                            sx={{
                                mt: 2,
                                mb: 3,
                                p: 2,
                                borderRadius: 2,
                                background: 'rgba(0,212,170,0.08)',
                                border: '1px solid rgba(0,212,170,0.2)',
                            }}
                        >
                            <Typography variant="body2" sx={{ color: 'primary.main' }}>
                                ✓ Each player will get{' '}
                                <strong>{teamCount / tournament.playerCount}</strong>{' '}
                                team{teamCount / tournament.playerCount > 1 ? 's' : ''}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
                            disabled={!isValid}
                            onClick={handleNext}
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                background: isValid
                                    ? 'linear-gradient(90deg, #00D4AA, #00B894)'
                                    : undefined,
                            }}
                        >
                            Next: Pick Teams →
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}