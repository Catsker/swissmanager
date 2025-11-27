import {useParams} from "react-router-dom";
import {useState, useEffect} from "react";
import "./TournamentPage.scss";
import type {Player, Tournament, Round, Pairing, TournamentPageProps} from "@/types";
import {tournamentMapper, playerMapper, roundMapper, pairingMapper} from '@/utils/mappers'
import EditorTournamentView from "./components/EditorTournamentView";
import SpectatorTournamentView from "./components/SpectatorTournamentView";
import InputPasswordDialog from "@/components/dialogs/InputPasswordDialog";
import NotFoundPage from "@/pages/NotFoundPage";
import {supabase} from "@/supabaseClient";
import Loading from "@/components/Loading";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import Button from "@/components/Button";
import {useNavigate} from "react-router-dom";

const TOURNAMENT_STORAGE_KEY = 'user_tournaments';

const TournamentPage = (props: TournamentPageProps) => {
  const {role} = props;
  const tournamentId = useParams().tournamentId ?? "";
  const navigate = useNavigate();

  const getTournamentPassword = (): string | null | undefined => {
    const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
    const storage: { [tournamentId: string]: string | null } = stored ? JSON.parse(stored) : {};
    return storage[tournamentId];
  };

  const saveTournamentToStorage = (password?: string | null) => {
    const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
    const storage: { [tournamentId: string]: string | null } = stored ? JSON.parse(stored) : {};
    storage[tournamentId] = password !== undefined ? password : null;
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(storage));
  };

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteTournamentDialogOpen, setIsDeleteTournamentDialogOpen] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;

    const storedPassword = getTournamentPassword();

    const fetchData = async () => {
      setLoading(true);
      try {
        const {data: tDB, error: tError} = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single();
        if (tError) throw tError;
        const t = tournamentMapper.fromDB(tDB);
        setTournament(t);

        saveTournamentToStorage(storedPassword);

        if (storedPassword && typeof storedPassword === 'string' && t.password === storedPassword) {
          setIsAuthorized(true);
        }

        const {data: pDB, error: pError} = await supabase
          .from('players')
          .select('*')
          .eq('tournament_id', tournamentId);
        if (pError) throw pError;
        const p = (pDB || []).map(playerMapper.fromDB);
        setPlayers(p);

        const {data: rDB, error: rError} = await supabase
          .from('rounds')
          .select('*')
          .eq('tournament_id', tournamentId);
        if (rError) throw rError;
        const r = (rDB || []).map(roundMapper.fromDB);
        setRounds(r);

        const {data: pairDB, error: pairError} = await supabase
          .from('pairings')
          .select('*')
          .eq('tournament_id', tournamentId);
        if (pairError) throw pairError;
        const pair = (pairDB || []).map(pairingMapper.fromDB);
        setPairings(pair);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Ошибка при загрузке турнира");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const tournamentsSubscription = supabase
      .channel('tournament-changes')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        (payload: any) => {
          console.log('Tournament updated:', payload);
          setTournament(tournamentMapper.fromDB(payload.new));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to tournament changes');
        }
      });

    const playersInsertUpdateSubscription = supabase
      .channel('players-insert-update')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload: any) => {
          console.log('Players INSERT/UPDATE:', payload);
          if (payload.eventType === 'INSERT') {
            setPlayers(prev => [...prev, playerMapper.fromDB(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setPlayers(prev => prev.map(p =>
              p.id === payload.new.id ? playerMapper.fromDB(payload.new) : p
            ));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to players insert/update changes');
        }
      });

    const playersDeleteSubscription = supabase
      .channel('players-delete')
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players'
        },
        (payload: any) => {
          console.log('Players DELETE:', payload);
          setPlayers(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to players delete changes');
        }
      });

    const roundsSubscription = supabase
      .channel('rounds-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload: any) => {
          console.log('Rounds changed:', payload);
          if (payload.eventType === 'INSERT') {
            setRounds(prev => [...prev, roundMapper.fromDB(payload.new)]);
          }
          if (payload.eventType === 'UPDATE') {
            setRounds(prev => prev.map(r =>
              r.id === payload.new.id ? roundMapper.fromDB(payload.new) : r
            ));
          }
          if (payload.eventType === 'DELETE') {
            setRounds(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to rounds changes');
        }
      });

    const pairingsSubscription = supabase
      .channel('pairings-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pairings',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload: any) => {
          console.log('Pairings changed:', payload);
          if (payload.eventType === 'INSERT') {
            setPairings(prev => [...prev, pairingMapper.fromDB(payload.new)]);
          }
          if (payload.eventType === 'UPDATE') {
            setPairings(prev => prev.map(p =>
              p.id === payload.new.id ? pairingMapper.fromDB(payload.new) : p
            ));
          }
          if (payload.eventType === 'DELETE') {
            setPairings(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to pairings changes');
        }
      });

    return () => {
      console.log('Unsubscribing from all channels');
      tournamentsSubscription.unsubscribe();
      playersInsertUpdateSubscription.unsubscribe();
      playersDeleteSubscription.unsubscribe();
      roundsSubscription.unsubscribe();
      pairingsSubscription.unsubscribe();
    };
  }, [tournamentId]);

  useEffect(() => {
    if (role === 'editor' && !isAuthorized) {
      const storedPassword = getTournamentPassword();
      const hasCorrectPassword = storedPassword && storedPassword === tournament?.password;

      if (!hasCorrectPassword) {
        setIsPasswordDialogOpen(true);
      }
    }
  }, [role, isAuthorized, tournament]);

  const handleDeleteTournament = async () => {
    if (!tournamentId) return;

    try {
      setLoading(true);

      const {error: pairingsError} = await supabase
        .from('pairings')
        .delete()
        .eq('tournament_id', tournamentId);

      if (pairingsError) throw pairingsError;

      const {error: playersError} = await supabase
        .from('players')
        .delete()
        .eq('tournament_id', tournamentId);

      if (playersError) throw playersError;

      const {error: roundsError} = await supabase
        .from('rounds')
        .delete()
        .eq('tournament_id', tournamentId);

      if (roundsError) throw roundsError;

      const {error: tournamentError} = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (tournamentError) throw tournamentError;

      const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
      if (stored) {
        const storage = JSON.parse(stored);
        delete storage[tournamentId];
        localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(storage));
      }

      setIsDeleteTournamentDialogOpen(false);

      console.log('Турнир успешно удален');
      navigate('/')

    } catch (err: any) {
      alert('Ошибка при удалении турнира');
      console.error('Ошибка при удалении турнира:', err);
      setError(err.message || "Ошибка при удалении турнира");
    } finally {
      setLoading(false);
    }
  }

  const handlePasswordConfirm = (enteredPassword: string) => {
    if (enteredPassword === tournament?.password) {
      setIsAuthorized(true);
      setIsPasswordDialogOpen(false);

      saveTournamentToStorage(enteredPassword);
      return true;
    } else {
      return false;
    }
  };

  const handleContinueAsSpectator = () => {
    setIsPasswordDialogOpen(false);
    saveTournamentToStorage(null)
    navigate(`/tournament/${tournamentId}`)
  };

  if (loading) return (<Loading/>)
  if (error) return <NotFoundPage/>;
  if (!tournament) return <NotFoundPage message="Турнир не найден :( Возможно, он был удалён"/>;

  return (
    <div className="container tournament-page">
      <h2 className="text-center tournament-page__tournament-name">{tournament.name}{tournament.status === 'active' && (` (раунд ${tournament.currentRound}/${tournament.totalRounds})`)}</h2>
      {role === "editor" && isAuthorized ? (
        <EditorTournamentView
          tournament={tournament}
          players={players}
          rounds={rounds}
          pairings={pairings}
        />
      ) : (
        <SpectatorTournamentView
          tournament={tournament}
          players={players}
          rounds={rounds}
          pairings={pairings}
        />
      )}

      {role === "editor" && !isAuthorized && (
        <InputPasswordDialog
          isOpen={isPasswordDialogOpen}
          isCreation={false}
          onSubmit={handlePasswordConfirm}
          onClose={handleContinueAsSpectator}
        />
      )}

      {role === "editor" && isAuthorized && (
        <Button
          variant="transparent-danger"
          onClick={() => setIsDeleteTournamentDialogOpen(true)}
        >
          Удалить турнир
        </Button>
      )}

      {role === "spectator" && (
        <Button
          variant="transparent"
          onClick={() => navigate(`/tournament/${tournamentId}/edit`)}
        >
          Войти как редактор
        </Button>
      )}

      <ConfirmDialog
        isOpen={isDeleteTournamentDialogOpen}
        entityName={`Вы уверены что хотите удалить турнир "${tournament.name}"? Отменить действие будет невозможно.`}
        onClose={() => setIsDeleteTournamentDialogOpen(false)}
        onConfirm={handleDeleteTournament}
        isWarning
        agreementText="Удалить турнир"
        rejectionText="Отмена"
      />
    </div>
  );
};

export default TournamentPage;
