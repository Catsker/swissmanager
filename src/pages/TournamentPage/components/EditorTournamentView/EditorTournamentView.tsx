import './EditorTournamentView.scss';
import type {Tournament, Player, Round, Pairing} from '@/types';
import { tournamentMapper, playerMapper, roundMapper, pairingMapper } from "@/utils/mappers";
import PlayersTable from "@/components/tables/PlayersTable";
import RoundPairingsTable from "@/components/tables/RoundPairingsTable";
import TournamentProgressTable from "@/components/tables/TournamentProgressTable";
import TournamentResultsTable from "@/components/tables/TournamentResultsTable";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import Button from "@/components/Button";
import {useState} from "react";
import {generatePairings} from "@/utils/tournament";
import {supabase} from "@/supabaseClient";

interface EditorTournamentViewProps {
  tournament: Tournament;
  players: Player[];
  rounds: Round[];
  pairings: Pairing[];
}

const EditorTournamentView = (props: EditorTournamentViewProps) => {
  const {
    tournament,
    players,
    rounds,
    pairings,
  } = props;

  const [isStartTournamentDialogOpen, setIsStartTournamentDialogOpen] = useState(false);
  const totalRounds = Math.ceil(Math.log2(players.length));

  const handleAddPlayer = async (name: string, rating: number) => {
    const newPlayer: Player = { id: crypto.randomUUID(), tournamentId: tournament.id, name, rating };
    const { error } = await supabase
      .from('players')
      .insert(playerMapper.toDB(newPlayer));
    if (error) return alert('Ошибка при добавлении игрока: ' + error.message);
  };

  const handleDeletePlayer = async (id: string) => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) return alert('Ошибка при удалении игрока: ' + error.message);
  };

  const handleStartTournamentClick = () => setIsStartTournamentDialogOpen(true);

  const handleConfirmStart = async () => {
    const newRoundId = crypto.randomUUID();

    const newRound: Round = {
      id: newRoundId,
      tournamentId: tournament.id,
      roundNumber: 1,
      isFinished: false
    };

    const { error: roundError } = await supabase
      .from('rounds')
      .insert(roundMapper.toDB(newRound))

    if (roundError) return alert('Ошибка при создании раунда: ' + roundError.message);


    const { pairings: firstPairings } = generatePairings(players, 1, tournament.id);
    const newPairingsDB = firstPairings.map(p => pairingMapper.toDB({
      ...p,
      tournamentId: tournament.id,
      roundId: newRoundId
    }));

    const { error: pairError } = await supabase.from('pairings').insert(newPairingsDB);
    if (pairError) return alert('Ошибка при создании пар: ' + pairError.message);

    const { error: tournamentError } = await supabase
      .from('tournaments')
      .update({
        status: 'active',
        current_round: 1,
        total_rounds: totalRounds
      })
      .eq('id', tournament.id)

    if (tournamentError) return alert('Ошибка при обновлении турнира: ' + tournamentError.message);

    setIsStartTournamentDialogOpen(false);
  };

  const handleResultChange = async (
    pairingId: string,
    result: '1-0' | '0-1' | '0.5-0.5' | '0-0' | null
  ) => {
    const { error } = await supabase
      .from('pairings')
      .update({ result })
      .eq('id', pairingId);

    if (error) return alert('Ошибка при сохранении результата: ' + error.message);
  };

  const handleFinishRound = async () => {
    const currentRound = rounds.find(r => r.roundNumber === tournament.currentRound);
    if (!currentRound) return;

    const hasUnfinished = pairings
      .filter(p => p.roundId === currentRound.id)
      .some(p => !p.result && p.blackPlayerId);

    if (hasUnfinished) return alert("Не все партии завершены!");

    const { error } = await supabase
      .from('rounds')
      .update(roundMapper.toDB({ isFinished: true }))
      .eq('id', currentRound.id);

    if (error) return alert('Ошибка при завершении раунда: ' + error.message);
  };

  const handleGenerateNextRound = async () => {
    const nextRoundNumber = tournament.currentRound + 1;
    if (nextRoundNumber > tournament.totalRounds) return;

    const newRoundId = crypto.randomUUID();

    const newRound: Round = {
      id: newRoundId,
      tournamentId: tournament.id,
      roundNumber: nextRoundNumber,
      isFinished: false
    };

    const { error: roundError } = await supabase
      .from('rounds')
      .insert(roundMapper.toDB(newRound))
    if (roundError) return alert('Ошибка при создании нового раунда: ' + roundError.message);

    const { pairings: nextPairings } = generatePairings(players, nextRoundNumber, tournament.id, pairings);
    const newPairingsDB = nextPairings.map(p => pairingMapper.toDB({
      ...p,
      tournamentId: tournament.id,
      roundId: newRoundId
    }));

    const { error: pairError } = await supabase.from('pairings').insert(newPairingsDB);
    if (pairError) return alert('Ошибка при создании пар нового раунда: ' + pairError.message);

    const { error: tournamentError } = await supabase
      .from('tournaments')
      .update({ current_round: nextRoundNumber })
      .eq('id', tournament.id)

    if (tournamentError) return alert('Ошибка при обновлении текущего раунда турнира: ' + tournamentError.message);
  };

  const handleFinishTournament = async () => {
    const { error } = await supabase
      .from('tournaments')
      .update(tournamentMapper.toDB({ ...tournament, status: 'finished' }))
      .eq('id', tournament.id);
    if (error) return alert('Ошибка при завершении турнира: ' + error.message);
  };

  return (
    <div className="editor-tournament-view">
      {tournament.status === 'created' && (
        <PlayersTable
          players={players}
          onAddClick={handleAddPlayer}
          onDelete={handleDeletePlayer}
          onStartTournamentClick={handleStartTournamentClick}
          totalRounds={totalRounds}
          isEditable
        />
      )}

      {tournament.status === 'active' && (
        <div>
          <RoundPairingsTable
            pairings={pairings.filter(p => p.roundId === rounds.find(r => r.roundNumber === tournament.currentRound)?.id)}
            players={players}
            onResultChange={handleResultChange}
            isEditable={rounds.find(r => r.roundNumber === tournament.currentRound)?.isFinished === false}
          />

          <div className="editor-buttons">
            {rounds.find(r => r.roundNumber === tournament.currentRound)?.isFinished === true ? (
              <div>
                {tournament.currentRound < tournament.totalRounds && (
                  <Button onClick={handleGenerateNextRound}>Сгенерировать следующий раунд</Button>
                )}
                <Button
                  onClick={handleFinishTournament}
                  variant={tournament.currentRound === tournament.totalRounds ? 'primary' : 'transparent'}
                >
                  {tournament.currentRound === tournament.totalRounds ? 'Завершить турнир' : 'Завершить турнир досрочно'}
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  disabled={pairings.some((p) => p.result === null)}
                  onClick={handleFinishRound}
                >
                  Завершить раунд
                </Button>
              </div>
            )}

          </div>

          <TournamentProgressTable
            players={players}
            rounds={rounds}
            pairings={pairings}
          />

          <TournamentResultsTable
            tournament={tournament}
            players={players}
            pairings={pairings}
            rounds={rounds}
          />
        </div>
      )}

      {tournament.status === 'finished' && (
        <div>
          <TournamentResultsTable
            tournament={tournament}
            players={players}
            pairings={pairings}
            rounds={rounds}
          />

          <TournamentProgressTable
            players={players}
            rounds={rounds}
            pairings={pairings}
          />
        </div>
      )}

      {isStartTournamentDialogOpen && (
        <ConfirmDialog
          isOpen={isStartTournamentDialogOpen}
          entityName={`Запустить турнир с ${players.length} игроками на ${totalRounds} раундов?`}
          onClose={() => setIsStartTournamentDialogOpen(false)}
          onConfirm={handleConfirmStart}
          agreementText="Запустить"
          rejectionText="Отмена"
        />
      )}
    </div>
  );
};

export default EditorTournamentView;
