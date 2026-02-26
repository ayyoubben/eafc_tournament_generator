import type { Match, Player, Team } from '../types/tournament';

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getRoundName(totalTeams: number, round: number): string {
  const matchesInRound = totalTeams / Math.pow(2, round);
  if (matchesInRound === 1) return 'Final';
  if (matchesInRound === 2) return 'Semi Finals';
  if (matchesInRound === 4) return 'Quarter Finals';
  return `Round of ${matchesInRound * 2}`;
}

export function getTotalRounds(teamCount: number): number {
  return Math.log2(teamCount);
}

export function getMatchesForRound(matches: Match[], round: number): Match[] {
  return matches.filter(m => m.round === round);
}

export function generateNextRoundMatches(
  completedMatches: Match[],
  _players: Player[],
  round: number
): Match[] {
  // Get all winners from completed round in order
  const winners = completedMatches
    .sort((a, b) => a.matchIndex - b.matchIndex)
    .map(m => ({
      teamId: m.winnerTeamId!,
      playerId: m.winnerPlayerId!,
    }));

  const nextMatches: Match[] = [];
  const totalMatches = winners.length / 2;

  for (let i = 0; i < totalMatches; i++) {
    const home = winners[i * 2];
    const away = winners[i * 2 + 1];
    const isSelfPlay = home.playerId === away.playerId;

    nextMatches.push({
      id: crypto.randomUUID(),
      round,
      matchIndex: i,
      homeTeamId: home.teamId,
      awayTeamId: away.teamId,
      homePlayerId: home.playerId,
      awayPlayerId: away.playerId,
      homeScore: null,
      awayScore: null,
      winnerTeamId: null,
      winnerPlayerId: null,
      status: 'pending',
      isSelfPlay,
      chosenTeamId: null,
      transferredTeamId: null,
      transferredFromPlayerId: null,
      transferredToPlayerId: null,
    });
  }

  return nextMatches;
}

export function findPlayerWithMinTeams(
  players: Player[],
  excludePlayerId: string,
  currentRoundMatches: Match[]
): string {
  // Count how many teams each player still has in this round
  const counts: Record<string, number> = {};
  players.forEach(p => { counts[p.id] = 0; });

  currentRoundMatches.forEach(m => {
    if (m.status !== 'completed') {
      if (m.homePlayerId) counts[m.homePlayerId] = (counts[m.homePlayerId] || 0) + 1;
      if (m.awayPlayerId) counts[m.awayPlayerId] = (counts[m.awayPlayerId] || 0) + 1;
    }
  });

  // Find player with min teams excluding self
  let minPlayer = '';
  let minCount = Infinity;
  players.forEach(p => {
    if (p.id !== excludePlayerId && counts[p.id] < minCount) {
      minCount = counts[p.id];
      minPlayer = p.id;
    }
  });

  return minPlayer;
}

export function distributeTeamsWithPots(players: Player[], teams: Team[]): Player[] {
  const pot1 = shuffleArray(teams.filter(t => t.pot === 1));
  const pot2 = shuffleArray(teams.filter(t => t.pot === 2));
  const teamsPerPlayer = teams.length / players.length;
  const perPot = teamsPerPlayer / 2;

  return players.map((player, index) => ({
    ...player,
    teamIds: [
      ...pot1.slice(index * perPot, (index + 1) * perPot).map(t => t.id),
      ...pot2.slice(index * perPot, (index + 1) * perPot).map(t => t.id),
    ],
  }));
}

export function distributeTeamsRandomly(players: Player[], teams: Team[]): Player[] {
  // If potMode, use pot-aware distribution
  if (teams.some(t => t.pot)) {
    return distributeTeamsWithPots(players, teams);
  }
  const shuffled = shuffleArray(teams);
  const teamsPerPlayer = teams.length / players.length;
  return players.map((player, index) => ({
    ...player,
    teamIds: shuffled
      .slice(index * teamsPerPlayer, (index + 1) * teamsPerPlayer)
      .map(t => t.id),
  }));
}

export function generateKnockoutMatches(players: Player[], teams: Team[]): Match[] {
  const usePots = teams.some(t => t.pot);

  if (!usePots || teams.length === 2) {
    const entries: { teamId: string; playerId: string }[] = [];
    players.forEach(player => {
      player.teamIds.forEach(teamId => {
        entries.push({ teamId, playerId: player.id });
      });
    });
    const shuffled = shuffleArray(entries);
    return buildMatches(shuffled, 1);
  }

  // Build per-player pot buckets, shuffled individually
  const pot1ByPlayer: Record<string, { teamId: string; playerId: string }[]> = {};
  const pot2ByPlayer: Record<string, { teamId: string; playerId: string }[]> = {};

  players.forEach(p => {
    pot1ByPlayer[p.id] = shuffleArray(
      p.teamIds
        .filter(tid => teams.find(t => t.id === tid)?.pot === 1)
        .map(tid => ({ teamId: tid, playerId: p.id }))
    );
    pot2ByPlayer[p.id] = shuffleArray(
      p.teamIds
        .filter(tid => teams.find(t => t.id === tid)?.pot === 2)
        .map(tid => ({ teamId: tid, playerId: p.id }))
    );
  });

  // Shuffle player order for variety
  const shuffledPlayers = shuffleArray([...players]);
  const teamsPerPlayer = teams.length / players.length;
  const matchesPerPlayerPair = teamsPerPlayer / 2; // each player contributes this many pot1 teams

  const paired: { teamId: string; playerId: string }[] = [];

  // For each "slot", alternate: playerA pot1 vs playerB pot2, then playerB pot1 vs playerA pot2
  // Works for 2+ players by cycling through player pairs
  for (let slot = 0; slot < matchesPerPlayerPair; slot++) {
    for (let pi = 0; pi < shuffledPlayers.length; pi++) {
      const playerA = shuffledPlayers[pi];
      const playerB = shuffledPlayers[(pi + 1) % shuffledPlayers.length];

      const p1Team = pot1ByPlayer[playerA.id].pop();
      const p2Team = pot2ByPlayer[playerB.id].pop();

      if (p1Team && p2Team) {
        paired.push(p1Team); // home: playerA pot1
        paired.push(p2Team); // away: playerB pot2
      }
    }
  }

  return buildMatches(paired, 1);
}

export function fixSelfPlay(
  pot1: { teamId: string; playerId: string }[],
  pot2: { teamId: string; playerId: string }[]
): { teamId: string; playerId: string }[] {
  const result = [...pot2];
  const maxAttempts = result.length * result.length;
  let attempts = 0;

  for (let i = 0; i < result.length; i++) {
    // If same player, find the next entry in result that has a different player and swap
    if (pot1[i].playerId === result[i].playerId) {
      let swapped = false;
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].playerId !== pot1[i].playerId && result[j].playerId !== pot1[j]?.playerId) {
          // swap i and j
          [result[i], result[j]] = [result[j], result[i]];
          swapped = true;
          break;
        }
        if (attempts++ > maxAttempts) break;
      }
      // If no valid swap found forward, look backward
      if (!swapped) {
        for (let j = 0; j < i; j++) {
          if (result[j].playerId !== pot1[i].playerId && result[i].playerId !== pot1[j].playerId) {
            [result[i], result[j]] = [result[j], result[i]];
            break;
          }
        }
      }
    }
  }

  return result;
}

function buildMatches(
  entries: { teamId: string; playerId: string }[],
  round: number
): Match[] {
  const matches: Match[] = [];
  const totalMatches = entries.length / 2;
  for (let i = 0; i < totalMatches; i++) {
    const home = entries[i * 2];
    const away = entries[i * 2 + 1];
    matches.push({
      id: crypto.randomUUID(),
      round,
      matchIndex: i,
      homeTeamId: home.teamId,
      awayTeamId: away.teamId,
      homePlayerId: home.playerId,
      awayPlayerId: away.playerId,
      homeScore: null,
      awayScore: null,
      winnerTeamId: null,
      winnerPlayerId: null,
      status: 'pending',
      isSelfPlay: home.playerId === away.playerId,
      chosenTeamId: null,
      transferredTeamId: null,
      transferredFromPlayerId: null,
      transferredToPlayerId: null,
    });
  }
  return matches;
}