import './PlayersTable.scss';
import { useState } from "react";
import AddPlayerDialog from "@/components/dialogs/AddPlayerDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import type { PlayersTableProps, Player } from "@/types";
import Button from "@/components/Button";
import Icon from "@/components/Icon";

const PlayersTable = (props: PlayersTableProps) => {
  const {
    players,
    onDelete,
    onAddClick,
    onStartTournamentClick,
    totalRounds,
    isEditable = false,
  } = props;

  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [isDeletePlayerDialogOpen, setIsDeletePlayerDialogOpen] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<Player | null>(null);

  const handleAddPlayer = (name: string, rating: number) => {
    onAddClick?.(name, rating);
    setIsAddPlayerDialogOpen(false);
  };

  const handleDeleteClick = (player: Player) => {
    setTargetPlayer(player);
    setIsDeletePlayerDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (targetPlayer) {
      onDelete?.(targetPlayer.id);
    }
    setTargetPlayer(null);
    setIsDeletePlayerDialogOpen(false);
  };

  return (
    <div className="players-table">
      <div className="players-table__header">

        {isEditable && (
          <Button onClick={() => setIsAddPlayerDialogOpen(true)}>
            Добавить игрока
          </Button>
        )}
      </div>
      {players.length === 0 ? (
        <h3>
          <i className="text-center center-x">На турнире пока нет зарегистрированных игроков</i>
        </h3>
      ) : (
        <table className="tournament-table">
          <caption className="tournament-table__caption">
            <h3>Список зарегистрированных игроков</h3>
          </caption>
          <thead className="tournament-table__head">
          <tr className="tournament-table__row tournament-table__row--head">
            <th scope="col" className="tournament-table__cell tournament-table__cell--header">{isEditable ? "ID игрока" : "№"}</th>
            <th scope="col" className="tournament-table__cell tournament-table__cell--header">Имя</th>
            <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center">Рейтинг</th>
            {isEditable && (
              <th scope="col" className="tournament-table__cell tournament-table__cell--header text-center">Удалить</th>
            )}
          </tr>
          </thead>
          <tbody className="tournament-table__body">
          {players
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((player, index) => (
              <tr
                key={player.id}
                className={`tournament-table__row ${index % 2 === 0 ? 'tournament-table__row--even' : 'tournament-table__row--odd'}`}
              >
                <td className="tournament-table__cell">
                  {isEditable ? player.id : index + 1}
                </td>
                <td className="tournament-table__cell">{player.name}</td>
                <td className="tournament-table__cell text-center">{player.rating}</td>
                {isEditable && (
                  <td className="tournament-table__cell text-center">
                    <Button
                      variant="none"
                      onClick={() => handleDeleteClick(player)}
                    >
                      <Icon
                        name="delete-cross"
                        size={30}
                      />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div>
        {isEditable && (
          <>
            {players.length < 4 ? (
              <p>Минимальное количество игроков — <b>4</b></p>
            ) : players.length % 2 !== 0 ? (
              <p>На турнире должно быть <b>чётное</b> количество игроков</p>
            ) : (
              <div>
                <p>Общее количество игроков — <b>{players.length}</b></p>
                <p>Оптимальное количество раундов — <b>{totalRounds}</b></p>
              </div>
            )}
            <Button
              onClick={onStartTournamentClick}
              disabled={players.length < 4 || players.length % 2 !== 0}
            >
              Запустить турнир
            </Button>
          </>
        )}

      </div>

      {isEditable && (
        <AddPlayerDialog
          isOpen={isAddPlayerDialogOpen}
          onClose={() => setIsAddPlayerDialogOpen(false)}
          onAdd={handleAddPlayer}
        />
      )}

      {isEditable && (
        <ConfirmDialog
          isOpen={isDeletePlayerDialogOpen}
          entityName={`Вы уверены что хотите удалить ${targetPlayer ? `игрока "${targetPlayer.name}"` : 'игрока'}?`}
          onClose={() => setIsDeletePlayerDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          isWarning
          agreementText="Удалить"
          rejectionText="Отмена"
        />
      )}
    </div>
  );
};

export default PlayersTable;
