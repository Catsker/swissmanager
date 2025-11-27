import type { Tournament, Player, Round, Pairing } from "@/types";

export const tournamentMapper = {
  fromDB: (db: any): Tournament => ({
    id: db.id,
    name: db.name,
    totalRounds: db.total_rounds,
    currentRound: db.current_round,
    status: db.status,
    password: db.password,
  }),
  toDB: (t: Partial<Tournament>) => ({
    ...(t.id && { id: t.id }),
    ...(t.name && { name: t.name }),
    ...(t.totalRounds !== undefined && { total_rounds: t.totalRounds }),
    ...(t.currentRound !== undefined && { current_round: t.currentRound }),
    ...(t.status && { status: t.status }),
    ...(t.password && { password: t.password }),
  }),
};

export const playerMapper = {
  fromDB: (db: any): Player => ({
    id: db.id,
    tournamentId: db.tournament_id,
    name: db.name,
    rating: db.rating,
  }),
  toDB: (p: Partial<Player>) => ({
    ...(p.id && { id: p.id }),
    ...(p.tournamentId && { tournament_id: p.tournamentId }),
    ...(p.name && { name: p.name }),
    ...(p.rating !== undefined && { rating: p.rating }),
  }),
};

export const roundMapper = {
  fromDB: (db: any): Round => ({
    id: db.id,
    tournamentId: db.tournament_id,
    roundNumber: db.round_number,
    isFinished: db.is_finished,
  }),
  toDB: (r: Partial<Round>) => ({
    ...(r.id && { id: r.id }),
    ...(r.tournamentId && { tournament_id: r.tournamentId }),
    ...(r.roundNumber !== undefined && { round_number: r.roundNumber }),
    ...(r.isFinished !== undefined && { is_finished: r.isFinished }),
  }),
};

export const pairingMapper = {
  fromDB: (db: any): Pairing => ({
    id: db.id,
    roundId: db.round_id,
    tournamentId: db.tournament_id,
    whitePlayerId: db.white_player_id,
    blackPlayerId: db.black_player_id,
    result: db.result,
    tableNumber: db.table_number,
  }),
  toDB: (p: Partial<Pairing>) => ({
    ...(p.id && { id: p.id }),
    ...(p.roundId && { round_id: p.roundId }),
    ...(p.tournamentId && { tournament_id: p.tournamentId }),
    ...(p.whitePlayerId && { white_player_id: p.whitePlayerId }),
    ...(p.blackPlayerId !== undefined && { black_player_id: p.blackPlayerId }),
    ...(p.result !== undefined && { result: p.result }),
    ...(p.tableNumber !== undefined && { table_number: p.tableNumber }),
  }),
};
