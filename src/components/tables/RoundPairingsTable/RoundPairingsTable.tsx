import type {RoundPairingsTableProps, Pairing} from "@/types";
import "./RoundPairingsTable.scss";

const RoundPairingsTable = (props: RoundPairingsTableProps) => {
  const {
    pairings,
    players,
    onResultChange,
    isEditable = false,
  } = props;

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name ?? "—";

  const formatResult = (result: Pairing["result"]) => {
    switch (result) {
      case "1-0":
        return "1–0";
      case "0-1":
        return "0–1";
      case "0.5-0.5":
        return "½–½";
      case "0-0":
        return "н/с";
      case null:
        return "-";
      default:
        return result ?? "-";
    }
  };

  return (
    <div className="round-pairings">
      <table className="tournament-table">
        <caption className="tournament-table__caption">
          <h3>Рассадка на текущий раунд</h3>
        </caption>
        <thead className="tournament-table__caption">
        <tr className="tournament-table__row tournament-table__row--head">
          <th scope="col" className="tournament-table__cell tournament-table__cell--header">Стол</th>
          <th scope="col" className="tournament-table__cell tournament-table__cell--header">Белые</th>
          <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center">Результат</th>
          <th scope="col" className="tournament-table__cell tournament-table__cell--header">Чёрные</th>
        </tr>
        </thead>
        <tbody className="tournament-table__body">
        {pairings
          .sort((a, b) => a.tableNumber - b.tableNumber)
          .map((pairing, index) => (
          <tr
            key={pairing.tableNumber}
            className={`tournament-table__row ${index % 2 === 0 ? 'tournament-table__row--even' : 'tournament-table__row--odd'}`}
          >
            <td className="tournament-table__cell">{pairing.tableNumber}</td>
            <td className="tournament-table__cell">{getPlayerName(pairing.whitePlayerId)}</td>
            <td className="tournament-table__cell text-center">
              {isEditable ? (
                <select
                  value={pairing.result ?? "-"}
                  onChange={(e) =>
                    onResultChange?.(pairing.id, e.target.value as Pairing["result"])
                  }
                >
                  <option disabled selected value="-">-</option>
                  <option value="1-0">1–0</option>
                  <option value="0-1">0–1</option>
                  <option value="0.5-0.5">½–½</option>
                  <option value="0-0">н/с</option>
                </select>
              ) : (
                <span>{formatResult(pairing.result)}</span>
              )}
            </td>
            <td className="tournament-table__cell">{getPlayerName(pairing.blackPlayerId)}</td>
          </tr>
        ))}
        </tbody>
      </table>
      {isEditable && (
        <span>н/с — не состоявшаяся партия. Отмечается в случае неявки двух игроков. В случае неявки одного из игроков отмечается автопоражение.</span>
      )}
    </div>
  );
};

export default RoundPairingsTable;
