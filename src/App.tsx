import { useTournament } from './context/useTournament';
import SetupPlayers from './pages/SetupPlayers';
import SetupTeamCount from './pages/SetupTeamCount';
import PickTeams from './pages/PickTeams';
import AssignTeams from './pages/AssignTeams';
import Bracket from './pages/Bracket';
import { Box, LinearProgress, Typography, Chip } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

const PHASES = ['setup_players', 'setup_teams', 'pick_teams', 'assign_teams', 'bracket', 'completed'];
const PHASE_LABELS: Record<string, string> = {
  setup_players: 'Players',
  setup_teams: 'Teams',
  pick_teams: 'Pick Teams',
  assign_teams: 'Assign',
  bracket: 'Bracket',
  completed: 'Done',
};

export default function App() {
  const { tournament } = useTournament();
  const phaseIndex = PHASES.indexOf(tournament.phase);
  const progress = (phaseIndex / (PHASES.length - 1)) * 100;
  const inBracket = tournament.phase === 'bracket' || tournament.phase === 'completed';

  const renderPhase = () => {
    switch (tournament.phase) {
      case 'setup_players': return <SetupPlayers />;
      case 'setup_teams': return <SetupTeamCount />;
      case 'pick_teams': return <PickTeams />;
      case 'assign_teams': return <AssignTeams />;
      case 'bracket': return <Bracket />;
      case 'completed': return <Bracket />;
      default: return <SetupPlayers />;
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0E1A 0%, #0D1B2A 50%, #0A1628 100%)',
      color: 'text.primary',
    }}>
      {/* Top bar */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,14,26,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        px: 3, py: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsEsportsIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography sx={{
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.1rem',
            color: 'primary.main', letterSpacing: 2,
          }}>
            EA FC 26
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', ml: 0.5 }}>
            TOURNAMENT
          </Typography>
        </Box>

        {/* Phase steps */}
        {!inBracket && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {PHASES.slice(0, 5).map((phase, i) => (
              <Chip
                key={phase}
                label={PHASE_LABELS[phase]}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.65rem',
                  background: i < phaseIndex
                    ? 'rgba(0,212,170,0.15)'
                    : i === phaseIndex
                      ? 'rgba(0,212,170,0.3)'
                      : 'rgba(255,255,255,0.05)',
                  color: i <= phaseIndex ? 'primary.main' : 'text.secondary',
                  border: '1px solid',
                  borderColor: i < phaseIndex
                    ? 'rgba(0,212,170,0.3)'
                    : i === phaseIndex
                      ? 'primary.main'
                      : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </Box>
        )}

        {/* Tournament info when in bracket */}
        {inBracket && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${tournament.playerCount} Players`}
              size="small"
              sx={{ fontSize: '0.7rem', background: 'rgba(0,212,170,0.1)', color: 'primary.main', border: '1px solid rgba(0,212,170,0.3)' }}
            />
            <Chip
              label={`${tournament.teamCount} Teams`}
              size="small"
              sx={{ fontSize: '0.7rem', background: 'rgba(255,107,53,0.1)', color: 'secondary.main', border: '1px solid rgba(255,107,53,0.3)' }}
            />
          </Box>
        )}
      </Box>

      {/* Progress bar */}
      {!inBracket && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 2,
            background: 'rgba(255,255,255,0.05)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #00D4AA, #FF6B35)',
            },
          }}
        />
      )}

      {renderPhase()}
    </Box>
  );
}