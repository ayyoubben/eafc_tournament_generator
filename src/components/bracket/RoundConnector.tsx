import { Box } from "@mui/material";

export const RoundConnector = () => (
    <Box sx={{
        width: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        mt: 5, // offset to align with match cards
    }}>
        <Box sx={{ width: 20, height: 1, background: 'rgba(255,255,255,0.15)' }} />
    </Box>
);