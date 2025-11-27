import type { Player, Round, Pairing } from "@/types";

interface GenerateRoundResult {
  round: Round;
  pairings: Pairing[];
}

export function generatePairings(
  players: Player[],
  roundNumber: number,
  tournamentId: string,
  previousPairings: Pairing[] = []
): GenerateRoundResult {
  if (players.length % 2 !== 0) {
    throw new Error("generatePairings: требуется чётное количество игроков.");
  }

  type Stats = {
    score: number;
    whites: number;
    blacks: number;
    opponents: Set<string>;
  };

  const stats = new Map<string, Stats>();
  players.forEach(p =>
    stats.set(p.id, { score: 0, whites: 0, blacks: 0, opponents: new Set() })
  );

  const prev = previousPairings.filter(p => p.tournamentId === tournamentId);
  for (const g of prev) {
    const w = g.whitePlayerId;
    const b = g.blackPlayerId;
    if (!stats.has(w) || !stats.has(b)) continue;

    const sw = stats.get(w)!;
    const sb = stats.get(b)!;

    sw.whites += 1;
    sb.blacks += 1;
    sw.opponents.add(b);
    sb.opponents.add(w);

    if (g.result === "1-0") {
      sw.score += 1;
    } else if (g.result === "0-1") {
      sb.score += 1;
    } else if (g.result === "0.5-0.5") {
      sw.score += 0.5;
      sb.score += 0.5;
    } else if (g.result === "0-0") {

    }
  }

  const round: Round = {
    id: `round-${roundNumber}`,
    tournamentId,
    roundNumber,
    isFinished: false,
  };

  if (roundNumber === 1) {
    const sorted = [...players].sort((a, b) => b.rating - a.rating);
    const half = sorted.length / 2;
    const pairings: Pairing[] = [];
    for (let i = 0; i < half; i++) {
      pairings.push({
        id: crypto.randomUUID(),
        roundId: round.id,
        tournamentId,
        whitePlayerId: sorted[i].id,
        blackPlayerId: sorted[i + half].id,
        result: null,
        tableNumber: i + 1,
      });
    }
    return { round, pairings };
  }

  const ordered = [...players].sort((a, b) => {
    const sa = stats.get(a.id)!.score;
    const sb = stats.get(b.id)!.score;
    if (sb !== sa) return sb - sa;
    return b.rating - a.rating;
  });

  const idToPlayer = new Map(players.map(p => [p.id, p]));
  const unpaired = new Set(ordered.map(p => p.id));
  const newPairings: Pairing[] = [];

  const playedSet = new Set<string>();
  for (const g of prev) {
    if (g.whitePlayerId && g.blackPlayerId) {
      const key = [g.whitePlayerId, g.blackPlayerId].sort().join("|");
      playedSet.add(key);
    }
  }

  const scoreGroups = new Map<number, string[]>();
  for (const p of ordered) {
    const s = stats.get(p.id)!.score;
    const arr = scoreGroups.get(s) || [];
    arr.push(p.id);
    scoreGroups.set(s, arr);
  }
  const scoreValues = Array.from(scoreGroups.keys()).sort((a, b) => b - a);

  function candidateListFor(playerId: string) {
    const pScore = stats.get(playerId)!.score;
    const otherScores = scoreValues
      .filter(s => s !== pScore)
      .sort((a, b) => {
        const da = Math.abs(a - pScore);
        const db = Math.abs(b - pScore);
        if (da !== db) return da - db;
        return b - a;
      });
    const scoreOrder = [pScore, ...otherScores];

    const candidates: string[] = [];
    for (const s of scoreOrder) {
      const ids = scoreGroups.get(s) ?? [];
      for (const id of ids) {
        if (id === playerId) continue;
        if (!unpaired.has(id)) continue;
        candidates.push(id);
      }
    }
    return candidates;
  }

  function scoreCandidateFor(playerId: string, candId: string) {
    const p = idToPlayer.get(playerId)!;
    const c = idToPlayer.get(candId)!;
    const ps = stats.get(playerId)!;
    const cs = stats.get(candId)!;
    const scoreDiff = Math.abs(ps.score - cs.score);
    const ratingDiff = Math.abs(p.rating - c.rating);
    const colorBalDiff = Math.abs((ps.whites - ps.blacks) - (cs.whites - cs.blacks));
    const playedKey = [playerId, candId].sort().join("|");
    const playedPenalty = playedSet.has(playedKey) ? 1000000 : 0;
    return playedPenalty + Math.round(scoreDiff * 1000) + ratingDiff + colorBalDiff;
  }

  function findBestCandidate(playerId: string): string | null {
    const candidates = candidateListFor(playerId);
    if (candidates.length === 0) return null;

    const notPlayed = candidates.filter(c => {
      const key = [playerId, c].sort().join("|");
      return !playedSet.has(key);
    });
    const listToScore = notPlayed.length > 0 ? notPlayed : candidates;

    listToScore.sort((a, b) => scoreCandidateFor(playerId, a) - scoreCandidateFor(playerId, b));
    return listToScore[0] ?? null;
  }

  for (const pid of ordered.map(p => p.id)) {
    if (!unpaired.has(pid)) continue;

    const cand = findBestCandidate(pid);
    if (!cand) {
      const any = Array.from(unpaired).find(id => id !== pid) ?? null;
      if (!any) throw new Error("generatePairings: не удалось найти кандидата (крайняя ошибка)");
      makePair(pid, any);
    } else {
      makePair(pid, cand);
    }
  }

  function makePair(aId: string, bId: string) {
    if (!unpaired.has(aId) || !unpaired.has(bId) || aId === bId) return;

    const sa = stats.get(aId)!;
    const sb = stats.get(bId)!;

    let whiteId = aId;
    let blackId = bId;
    const balA = sa.whites - sa.blacks;
    const balB = sb.whites - sb.blacks;
    if (balA > balB) {
      whiteId = bId;
      blackId = aId;
    } else if (balB > balA) {
      whiteId = aId;
      blackId = bId;
    } else {
      const ra = idToPlayer.get(aId)!.rating;
      const rb = idToPlayer.get(bId)!.rating;
      if (rb > ra) {
        whiteId = bId;
        blackId = aId;
      } else {
        whiteId = aId;
        blackId = bId;
      }
    }

    stats.get(whiteId)!.whites += 1;
    stats.get(blackId)!.blacks += 1;
    stats.get(whiteId)!.opponents.add(blackId);
    stats.get(blackId)!.opponents.add(whiteId);

    const playedKey = [whiteId, blackId].sort().join("|");
    playedSet.add(playedKey);

    unpaired.delete(aId);
    unpaired.delete(bId);

    newPairings.push({
      id: crypto.randomUUID(),
      roundId: round.id,
      tournamentId,
      whitePlayerId: whiteId,
      blackPlayerId: blackId,
      result: null,
      tableNumber: newPairings.length + 1,
    });
  }

  return { round, pairings: newPairings };
}
