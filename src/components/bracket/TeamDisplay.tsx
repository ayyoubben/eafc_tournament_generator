import { Box, Tooltip, Typography, } from "@mui/material";
import type { Player, Team } from "../../types/tournament";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

export const TeamDisplay = ({
    team, player, score, isWinner, isTransferredTeam, isCompleted, transferFromPlayer, transferToPlayer
}: {
    team: Team | undefined;
    player: Player | undefined;
    score: number | null;
    isWinner: boolean;
    isTransferredTeam?: boolean;
    isCompleted: boolean;
    transferFromPlayer?: Player;
    transferToPlayer?: Player;
}) => (
    <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        p: 1,
        borderRadius: 1.5,
        background: isWinner ? 'rgba(0,212,170,0.12)' : 'transparent',
        border: isWinner ? '1px solid rgba(0,212,170,0.3)' : '1px solid transparent',
        opacity: isCompleted && !isWinner ? 0.45 : 1,
        transition: 'all 0.2s',
        position: 'relative',
    }}>
        {isTransferredTeam && (
            <Tooltip title={`Transferred from ${transferFromPlayer?.name} → ${transferToPlayer?.name}`}>
                <Box sx={{
                    position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(255,193,7,0.9)', borderRadius: 1, px: 0.5, py: 0.1,
                    display: 'flex', alignItems: 'center', gap: 0.3, whiteSpace: 'nowrap',
                }}>
                    <SwapHorizIcon sx={{ fontSize: 10, color: '#000' }} />
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#000' }}>
                        TRANSFERRED
                    </Typography>
                </Box>
            </Tooltip>
        )}
        {team ? (
            <>
                <Box sx={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: isTransferredTeam ? 0.5 : 0 }}>
                    <img src={team.logoUrl} alt={team.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center', fontSize: '0.68rem', lineHeight: 1.2 }}>
                    {team.name}
                </Typography>
                <Typography variant="caption" sx={{
                    color: isTransferredTeam ? '#FFC107' : 'text.secondary',
                    fontSize: '0.62rem', fontWeight: isTransferredTeam ? 700 : 400,
                }}>
                    {player?.name ?? '—'}
                </Typography>
                {isCompleted && score !== null && (
                    <Typography variant="h6" sx={{ fontWeight: 800, color: isWinner ? 'primary.main' : 'text.secondary' }}>
                        {score}
                    </Typography>
                )}
                {isWinner && <EmojiEventsIcon sx={{ fontSize: 13, color: 'primary.main' }} />}
            </>
        ) : (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>TBD</Typography>
        )}
    </Box>
);