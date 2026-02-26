import { useState } from 'react';
import {
    Box, Button, Card, CardContent, Container,
    TextField, Typography, ToggleButton, ToggleButtonGroup,
    /*IconButton,*/ Divider,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
//import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useTournament } from '../context/useTournament';
import type { Player, PlayerCount } from '../types/tournament';

const PLAYER_COUNTS: PlayerCount[] = [2, 4, 8, 16, 32];

export default function SetupPlayers() {
    const { tournament, setTournament } = useTournament();
    const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
    const [players, setPlayers] = useState<Player[]>([
        { id: crypto.randomUUID(), name: '', teamIds: [] },
        { id: crypto.randomUUID(), name: '', teamIds: [] },
    ]);

    const handleCountChange = (_: React.MouseEvent<HTMLElement>, value: PlayerCount) => {
        if (!value) return;
        setPlayerCount(value);
        const newPlayers: Player[] = Array.from({ length: value }, (_, i) => ({
            id: players[i]?.id ?? crypto.randomUUID(),
            name: players[i]?.name ?? '',
            teamIds: [],
        }));
        setPlayers(newPlayers);
    };

    const handleNameChange = (id: string, name: string) => {
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    };

    const canProceed = players.every(p => p.name.trim().length > 0);

    const handleNext = () => {
        setTournament({
            ...tournament,
            id: tournament.id || crypto.randomUUID(),
            createdAt: tournament.createdAt || new Date().toISOString(),
            playerCount,
            players,
            phase: 'setup_teams',
        });
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

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <SportsEsportsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                    <Typography variant="h3" sx={{ color: 'primary.main', fontFamily: 'Rajdhani' }}>
                        EA FC 26
                    </Typography>
                </Box>
                <Typography variant="h5" sx={{ color: 'text.primary', mb: 1 }}>
                    TOURNAMENT CREATOR
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Set up your tournament in minutes
                </Typography>
            </Box>

            <Card>
                <CardContent sx={{ p: 4 }}>
                    {/* Step indicator */}
                    <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 3 }}>
                        STEP 1 OF 4
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 0.5, mb: 3 }}>
                        How many players?
                    </Typography>

                    <ToggleButtonGroup
                        value={playerCount}
                        exclusive
                        onChange={handleCountChange}
                        fullWidth
                        sx={{ mb: 4 }}
                    >
                        {PLAYER_COUNTS.map(count => (
                            <ToggleButton
                                key={count}
                                value={count}
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
                        ))}
                    </ToggleButtonGroup>

                    <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.07)' }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                        <PersonAddIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6">Name your players</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {players.map((player, index) => (
                            <TextField
                                key={player.id}
                                label={`Player ${index + 1}`}
                                value={player.name}
                                onChange={e => handleNameChange(player.id, e.target.value)}
                                placeholder={`Enter player ${index + 1} name`}
                                fullWidth
                                variant="outlined"
                                inputProps={{ maxLength: 20 }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                    },
                                }}
                            />
                        ))}
                    </Box>

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={!canProceed}
                        onClick={handleNext}
                        sx={{
                            mt: 4,
                            py: 1.5,
                            fontSize: '1rem',
                            background: canProceed
                                ? 'linear-gradient(90deg, #00D4AA, #00B894)'
                                : undefined,
                        }}
                    >
                        Next: Select Teams →
                    </Button>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                            — or —
                        </Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            startIcon={<UploadFileIcon />}
                            sx={{ py: 1.5, borderStyle: 'dashed' }}
                        >
                            Load Existing Tournament
                            <input type="file" accept=".json" hidden onChange={handleLoadJSON} />
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}