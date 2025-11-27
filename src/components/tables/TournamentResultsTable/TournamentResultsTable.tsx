import './TournamentResultsTable.scss'
import type {Tournament, Player, Pairing, Round, PlayerStats} from '@/types'
import {useMemo} from 'react'

interface TournamentResultsTableProps {
  tournament: Tournament
  players: Player[]
  pairings: Pairing[]
  rounds: Round[]
}

const TournamentResultsTable = ({
                                  tournament,
                                  players,
                                  pairings,
                                  rounds
                                }: TournamentResultsTableProps) => {

  const calculateAllStats = (): PlayerStats[] => {
    const pointsCache = new Map<string, number>();
    const winsCache = new Map<string, number>();

    players.forEach(player => {
      pointsCache.set(player.id, getPlayerPoints(player.id));
      winsCache.set(player.id, getPlayerWins(player.id));
    });

    const statsWithoutPersonal = players.map(player => ({
      player,
      points: pointsCache.get(player.id) || 0,
      sonnenborn: getSonnenborn(player.id),
      buchholz: getBuchholz(player.id, pointsCache),
      buchholzCut1: getBuchholzCut1(player.id, pointsCache),
      progressive: getProgressiveScore(player.id),
      wins: winsCache.get(player.id) || 0,
      personalMeetings: 0,
    }));

    return calculatePersonalMeetings(statsWithoutPersonal);
  };

  const calculatePersonalMeetings = (stats: PlayerStats[]): PlayerStats[] => {
    const groupsByPoints = new Map<number, PlayerStats[]>();

    stats.forEach(stat => {
      const group = groupsByPoints.get(stat.points) || [];
      group.push(stat);
      groupsByPoints.set(stat.points, group);
    });

    return stats.map(stat => {
      const group = groupsByPoints.get(stat.points) || [];

      if (group.length <= 1) {
        return { ...stat, personalMeetings: 0 };
      }

      const personalPoints = getPersonalMeetingPointsInGroup(stat.player.id, group);

      return { ...stat, personalMeetings: personalPoints };
    });
  };

  const getPersonalMeetingPointsInGroup = (playerId: string, group: PlayerStats[]): number => {
    return group.reduce((points, opponentStat) => {
      if (opponentStat.player.id === playerId) return points;

      const personalPairings = pairings.filter(p =>
        (p.whitePlayerId === playerId && p.blackPlayerId === opponentStat.player.id) ||
        (p.blackPlayerId === playerId && p.whitePlayerId === opponentStat.player.id)
      );

      return points + personalPairings.reduce((pairingPoints, pairing) => {
        if (!pairing.result) return pairingPoints;

        if (pairing.whitePlayerId === playerId && pairing.result === '1-0') {
          return pairingPoints + 1;
        }
        if (pairing.blackPlayerId === playerId && pairing.result === '0-1') {
          return pairingPoints + 1;
        }

        return pairingPoints;
      }, 0);
    }, 0);
  };

  const getOpponents = (playerId: string): string[] => {
    return pairings.reduce((acc: string[], pairing) => {
      if (pairing.whitePlayerId === playerId && pairing.blackPlayerId)
        acc.push(pairing.blackPlayerId)
      else if (pairing.blackPlayerId === playerId && pairing.whitePlayerId)
        acc.push(pairing.whitePlayerId)
      return acc
    }, [])
  }

  const getSonnenborn = (playerId: string): number => {
    return pairings.reduce((total, pairing) => {
      if (pairing.result === null) return total;

      let opponentId: string | null = null;
      let playerResult: number = 0;

      if (pairing.whitePlayerId === playerId) {
        opponentId = pairing.blackPlayerId;
        if (pairing.result === '1-0') playerResult = 1;
        else if (pairing.result === '0.5-0.5') playerResult = 0.5;
      }
      else if (pairing.blackPlayerId === playerId) {
        opponentId = pairing.whitePlayerId;
        if (pairing.result === '0-1') playerResult = 1;
        else if (pairing.result === '0.5-0.5') playerResult = 0.5;
      }

      if (!opponentId) return total;

      const opponentTotalPoints = getPlayerPoints(opponentId);

      return total + (playerResult * opponentTotalPoints);
    }, 0);
  };

  const getBuchholz = (playerId: string, pointsCache: Map<string, number>): number => {
    const opponents = getOpponents(playerId);
    return opponents.reduce((total, opponentId) => {
      return total + (pointsCache.get(opponentId) || 0);
    }, 0);
  };

  const getBuchholzCut1 = (playerId: string, pointsCache: Map<string, number>): number => {
    const opponents = getOpponents(playerId);
    const opponentPoints = opponents.map(id => pointsCache.get(id) || 0).sort((a, b) => a - b);
    if (opponentPoints.length > 0) opponentPoints.shift();
    return opponentPoints.reduce((a, b) => a + b, 0);
  };

  const getPlayerWins = (playerId: string): number => {
    return pairings.filter(p => {
      if (!p.result) return false;
      return (p.whitePlayerId === playerId && p.result === '1-0') ||
        (p.blackPlayerId === playerId && p.result === '0-1');
    }).length;
  };

  const getPlayerPoints = (playerId: string, roundId?: string): number => {
    const roundPairings = roundId ? pairings.filter(p => p.roundId === roundId) : pairings;

    return roundPairings.reduce((total, pairing) => {
      if (pairing.result === null) return total

      if (pairing.whitePlayerId === playerId) {
        if (pairing.result === '1-0') return total + 1
        if (pairing.result === '0.5-0.5') return total + 0.5
      }
      if (pairing.blackPlayerId === playerId) {
        if (pairing.result === '0-1') return total + 1
        if (pairing.result === '0.5-0.5') return total + 0.5
      }

      return total
    }, 0)
  }

  const getProgressiveScore = (playerId: string): number => {
    if (!rounds || rounds.length === 0) return 0;
    const roundsPoints = rounds.map(round =>
      getPlayerPoints(playerId, round.id)
    );

    let progressive = 0;
    let runningTotal = 0;

    roundsPoints.forEach(points => {
      runningTotal += points;
      progressive += runningTotal;
    });

    return progressive;
  };

  const sortPlayersByTiebreaks = (stats: PlayerStats[]): PlayerStats[] => {
    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;

      if (b.personalMeetings !== a.personalMeetings) return b.personalMeetings - a.personalMeetings;

      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;

      if (b.buchholzCut1 !== a.buchholzCut1) return b.buchholzCut1 - a.buchholzCut1;

      if (b.progressive !== a.progressive) return b.progressive - a.progressive;

      if (b.sonnenborn !== a.sonnenborn) return b.sonnenborn - a.sonnenborn;

      if (b.wins !== a.wins) return b.wins - a.wins;

      return b.player.rating - a.player.rating;
    });
  };

  const playerStats = useMemo(() => {
    const stats = calculateAllStats();
    return sortPlayersByTiebreaks(stats);
  }, [players, pairings, rounds]);

  return (
    <table className="tournament-table">
      <caption className="tournament-table__caption">
        <h3>{tournament.status === 'finished' && ('Турнир завершён!')} Финальная таблица</h3>
      </caption>

      <thead className="tournament-table__head">
      <tr className="tournament-table__row tournament-table__row--head">
        <th scope="col" className="tournament-table__cell tournament-table__cell--header">#</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header">Игрок</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title="Рейтинг игроков">Рейтинг</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title="Очки игроков">Очки</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title="Личные встречи">Л/В</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title="Коэффициент Бухгольца">BH</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title="Коэффициент Бухгольца без учёта самого слабого соперника">BH/C1</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title="Динамика набора очков">P/S</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title="Коэффицент Зонненборна-Бергера">З/Б</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title="Количество побед">W</th>
      </tr>
      </thead>

      <tbody className="tournament-table__body">
      {playerStats.map((stats, index) => {
        let rowClass = ''
        rowClass =
          index % 2 === 0
            ? 'tournament-table__row--even'
            : 'tournament-table__row--odd'
        if (tournament.status === 'finished') {
          if (index === 0) rowClass = 'tournament-table__row--first'
          else if (index === 1) rowClass = 'tournament-table__row--second'
          else if (index === 2) rowClass = 'tournament-table__row--third'
        }

        return (
          <tr key={stats.player.id} className={`tournament-table__row ${rowClass}`}>
            <td className="tournament-table__cell">{index + 1}</td>
            <td className="tournament-table__cell">{stats.player.name}</td>
            <td className="tournament-table__cell text-center">{stats.player.rating}</td>
            <td className="tournament-table__cell text-center">{stats.points}</td>
            <td className="tournament-table__cell text-center">{stats.personalMeetings}</td>
            <td className="tournament-table__cell text-center">{stats.buchholz}</td>
            <td className="tournament-table__cell text-center">{stats.buchholzCut1}</td>
            <td className="tournament-table__cell text-center">{stats.progressive}</td>
            <td className="tournament-table__cell text-center">{stats.sonnenborn}</td>
            <td className="tournament-table__cell text-center">{stats.wins}</td>
          </tr>
        )
      })}
      </tbody>
    </table>
  )
}

export default TournamentResultsTable
