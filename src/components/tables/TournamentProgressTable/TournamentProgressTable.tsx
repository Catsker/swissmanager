import './TournamentProgressTable.scss'
import type {TournamentProgressTableProps} from "@/types";


const TournamentProgressTable = (props: TournamentProgressTableProps) => {
  const { players, rounds, pairings } = props;

  const getPlayerPointsPerRound = (playerId: string) => {
    return rounds.map(round => {
      const roundPairings = pairings.filter(p => p.roundId === round.id);
      const pairing = roundPairings.find(p => p.whitePlayerId === playerId || p.blackPlayerId === playerId);

      if (!pairing || pairing.result === null) return null;

      switch (pairing.result) {
        case '1-0':
          return pairing.whitePlayerId === playerId ? 1 : 0;
        case '0-1':
          return pairing.blackPlayerId === playerId ? 1 : 0;
        case '0.5-0.5':
          return 0.5;
        case '0-0':
          return 0;
        default:
          return null;
      }
    });
  };

  const getPlayerTotalPoints = (playerId: string) => getPlayerPointsPerRound(playerId).reduce<number>((a, b) => a + (b ?? 0), 0);

  return (
    <table className="tournament-table">
      <caption className="tournament-table__caption">
        <h3>Результаты по раундам</h3>
      </caption>

      <thead className="tournament-table__head">
      <tr className="tournament-table__row tournament-table__row--head">
        <th scope="col" className="tournament-table__cell tournament-table__cell--header">#</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header">Игрок</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center">Рейтинг</th>
        <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center">Очки</th>
        {rounds.map((_, i) => (
          <th key={i} scope="col" className="tournament-table__cell tournament-table__cell--header text-center" title={`Раунд ${i + 1}`}>
            {i + 1}
          </th>
        ))}
      </tr>
      </thead>

      <tbody className="tournament-table__body">
      {players
        .sort((a, b) => {
          const pointsA = getPlayerTotalPoints(a.id)
          const pointsB = getPlayerTotalPoints(b.id)
          if (pointsA !== pointsB) return pointsB - pointsA
          return b.rating - a.rating
        })
        .map((player, index) => {
          const rowClass = index % 2 === 0 ? 'tournament-table__row--even' : 'tournament-table__row--odd';
          const pointsPerRound = getPlayerPointsPerRound(player.id);
          const totalPoints = getPlayerTotalPoints(player.id);

          return (
            <tr key={player.id} className={`tournament-table__row ${rowClass}`}>
              <td className="tournament-table__cell">{index + 1}</td>
              <td className="tournament-table__cell">{player.name}</td>
              <td className="tournament-table__cell text-center">{player.rating}</td>
              <td className="tournament-table__cell text-center">{totalPoints}</td>
              {pointsPerRound.map((points, i) => (
                <td key={i} className="tournament-table__cell text-center">
                  {points === null ? '-' : points}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default TournamentProgressTable;
