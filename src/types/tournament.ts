export type PlayerCount = 2 | 4 | 8 | 16 | 32;
export type TeamCount = 2 | 4 | 8 | 16 | 32;

export interface Player {
  id: string;
  name: string;
  teamIds: string[]; // teams assigned to this player
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  league: string;
  country: string;
  pot?: 1 | 2; // assigned during team picking
}

export type AssignmentMode = 'manual' | 'random';

export type MatchStatus = 'pending' | 'ongoing' | 'completed';

export interface Match {
  id: string;
  round: number;
  matchIndex: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homePlayerId: string | null;
  awayPlayerId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  winnerPlayerId: string | null;
  status: MatchStatus;
  // for self-play scenario
  isSelfPlay: boolean;
  chosenTeamId: string | null; // which team the player chose to play with
  transferredTeamId: string | null;    // team that was transferred
  transferredFromPlayerId: string | null; // original owner
  transferredToPlayerId: string | null;   // new owner
}

export type TournamentPhase =
  | 'setup_players'
  | 'setup_teams'
  | 'pick_teams'
  | 'assign_teams'
  | 'bracket'
  | 'completed';

export interface Tournament {
  id: string;
  createdAt: string;
  phase: TournamentPhase;
  playerCount: PlayerCount;
  teamCount: TeamCount;
  assignmentMode: AssignmentMode | null;
  players: Player[];
  selectedTeams: Team[];
  matches: Match[];
  currentRound: number;
  winner: Player | null;
  potMode: boolean;
}