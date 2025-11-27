import './SpectatorTournamentView.scss';
import type { Player, Tournament, Round, Pairing } from '@/types';
import TournamentProgressTable from '@/components/tables/TournamentProgressTable';
import TournamentResultsTable from '@/components/tables/TournamentResultsTable';
import PlayersTable from "@/components/tables/PlayersTable";
import RoundPairingsTable from "@/components/tables/RoundPairingsTable";

interface SpectatorTournamentViewProps {
  tournament: Tournament;
  players: Player[];
  rounds: Round[];
  pairings: Pairing[];
}

const SpectatorTournamentView = (props: SpectatorTournamentViewProps) => {
  const { tournament, players, rounds, pairings } = props;

  return (
    <div className="spectator-tournament-view">

      {tournament.status === 'created' && (
        <div>
          <PlayersTable
            players={players}
          />
        </div>
      )}

      {tournament.status === 'active' && (
        <div>
          {rounds.find(r => r.roundNumber === tournament.currentRound)?.isFinished === false && (
            <div>
              <RoundPairingsTable
                pairings={pairings.filter(p => p.roundId === rounds.find(r => r.roundNumber === tournament.currentRound)?.id)}
                players={players}
              />
            </div>
          )}

          <TournamentProgressTable
            players={players}
            rounds={rounds}
            pairings={pairings}
          />
        </div>
      )}

      {tournament.status === 'finished' && (
        <div>
          <TournamentResultsTable
            players={players}
            tournament={tournament}
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
    </div>
  );
};

export default SpectatorTournamentView;
