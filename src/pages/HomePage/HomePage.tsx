import { useState, useEffect } from 'react';
import './HomePage.scss';
import Button from "@/components/Button";
import type { Tournament } from '@/types';
import InputPasswordDialog from "@/components/dialogs/InputPasswordDialog";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { tournamentMapper } from "@/utils/mappers";
import Loading from "@/components/Loading";

type TournamentStatus = 'all' | 'created' | 'active' | 'finished';

interface TournamentStorage {
  [tournamentId: string]: string | null;
}

const TOURNAMENT_STORAGE_KEY = 'user_tournaments';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTournamentName, setNewTournamentName] = useState('');
  const [filterStatus, setFilterStatus] = useState<TournamentStatus>('all');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [userTournaments, setUserTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadUserTournaments();
  }, []);

  const loadUserTournaments = async () => {
    try {
      setLoading(true);

      const storedTournaments = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
      const storage: TournamentStorage = storedTournaments ? JSON.parse(storedTournaments) : {};

      if (Object.keys(storage).length === 0) {
        setUserTournaments([]);
        return;
      }

      const tournamentIds = Object.keys(storage);

      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .in('id', tournamentIds);

      if (error) {
        console.error('Ошибка загрузки турниров:', error);
        return;
      }

      const existingTournamentIds = data.map(t => t.id);
      const deletedTournamentIds = tournamentIds.filter(id => !existingTournamentIds.includes(id));

      if (deletedTournamentIds.length > 0) {
        deletedTournamentIds.forEach(id => {
          delete storage[id];
        });
        localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(storage));
        console.log('Удалены из localStorage:', deletedTournamentIds);
      }

      const tournaments = data.map(dbTournament => {
        const password = storage[dbTournament.id];
        const tournament = tournamentMapper.fromDB(dbTournament);

        return {
          ...tournament,
          password: password || ''
        };
      });

      setUserTournaments(tournaments);

    } catch (error) {
      alert(`Ошибка:' ${error}`);
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTournamentToStorage = (tournamentId: string, password?: string) => {
    const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
    const storage: TournamentStorage = stored ? JSON.parse(stored) : {};
    storage[tournamentId] = password !== undefined ? password : null;
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(storage));
  };

  const getTournamentPassword = (tournamentId: string): string | null | undefined => {
    const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
    const storage: TournamentStorage = stored ? JSON.parse(stored) : {};
    return storage[tournamentId];
  };

  const mockTournaments: Tournament[] = [];

  const allTournaments = [...mockTournaments, ...userTournaments];

  const filteredByStatus = allTournaments.filter(tournament =>
    filterStatus === 'all' || tournament.status === filterStatus
  );

  const filteredTournaments = filteredByStatus.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTournamentName.trim()) {
      alert('Введите название турнира');
      return;
    }
    setIsPasswordDialogOpen(true);
  };

  const handleConfirmCreateTournament = async (password: string) => {
    if (isCreating) {
      console.log('⏸️ Tournament creation already in progress');
      return false;
    }

    if (password.length < 8) {
      return false;
    }

    setIsCreating(true);

    try {
      const tournamentId = crypto.randomUUID();
      const newTournament: Tournament = {
        id: tournamentId,
        name: newTournamentName.trim(),
        totalRounds: 0,
        currentRound: 0,
        status: "created",
        password,
      };

      const { data, error } = await supabase
        .from("tournaments")
        .insert(tournamentMapper.toDB(newTournament))
        .select("*")
        .single();

      if (error) {
        alert("Ошибка при создании турнира: " + error.message);
        return false;
      }

      const createdTournament = tournamentMapper.fromDB(data);

      saveTournamentToStorage(createdTournament.id, password);

      setUserTournaments(prev => [...prev, { ...createdTournament, password }]);

      setNewTournamentName("");
      setIsPasswordDialogOpen(false);

      navigate(`/tournament/${createdTournament.id}/edit`);

      return true;

    } catch (error) {
      console.error('Ошибка создания турнира:', error);
      alert('Ошибка при создании турнира');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const handleClosePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const hasTournamentPassword = (tournamentId: string): boolean => {
    const password = getTournamentPassword(tournamentId);
    return typeof password === 'string';
  };

  const getTournamentPath = (tournamentId: string) => {
    return hasTournamentPassword(tournamentId)
      ? `/tournament/${tournamentId}/edit`
      : `/tournament/${tournamentId}`;
  };

  const handleFilterClick = (status: TournamentStatus) => {
    setFilterStatus(status);
  };

  const getTournamentCount = (status: TournamentStatus) => {
    if (status === 'all') return allTournaments.length;
    return allTournaments.filter(t => t.status === status).length;
  };

  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'created': 'Турнир ещё не начался',
      'active': 'Турнир в процессе',
      'finished': 'Завершен'
    };
    return statusMap[status] || status;
  }

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div className="container">
      <div className="home-page">
        <section className="create-section">
          <form className="create-section__form" onSubmit={handleCreateTournament}>
            <label htmlFor="create-tournament">
              <h2 className="create-section__title section-title">Создать новый турнир</h2>
            </label>
            <div className="create-section__content">
              <input
                id="create-tournament"
                className="create-section__input basicInput"
                type="text"
                autoComplete="off"
                name="tournament-title"
                placeholder="Название турнира"
                value={newTournamentName}
                onChange={(e) => setNewTournamentName(e.target.value)}
              />
              <Button
                className="create-section__button"
                type="submit"
                disabled={!newTournamentName.trim()}
              >
                Создать турнир
              </Button>
            </div>
          </form>
        </section>

        <section className="tournaments-section">
          <h2 className="tournaments-section__title section-title">
            Отслеживаемые турниры ({filteredTournaments.length})
          </h2>

          <nav className="tournaments-section__filters" aria-label="Фильтры турниров">
            <ul className="filters-list" role="list">
              <li className="filters-list__item">
                <Button
                  variant={filterStatus === 'all' ? 'primary' : 'passive'}
                  onClick={() => handleFilterClick('all')}
                  aria-pressed={filterStatus === 'all'}
                >
                  Все ({getTournamentCount('all')})
                </Button>
              </li>
              <li className="filters-list__item">
                <Button
                  variant={filterStatus === 'created' ? 'primary' : 'passive'}
                  onClick={() => handleFilterClick('created')}
                  aria-pressed={filterStatus === 'created'}
                >
                  Будущие ({getTournamentCount('created')})
                </Button>
              </li>
              <li className="filters-list__item">
                <Button
                  variant={filterStatus === 'active' ? 'primary' : 'passive'}
                  onClick={() => handleFilterClick('active')}
                  aria-pressed={filterStatus === 'active'}
                >
                  Текущие ({getTournamentCount('active')})
                </Button>
              </li>
              <li className="filters-list__item">
                <Button
                  variant={filterStatus === 'finished' ? 'primary' : 'passive'}
                  onClick={() => handleFilterClick('finished')}
                  aria-pressed={filterStatus === 'finished'}
                >
                  Прошедшие ({getTournamentCount('finished')})
                </Button>
              </li>
            </ul>
          </nav>

          <div className="tournaments-section__search">
            <input
              autoComplete="off"
              name="search-tournaments"
              type="text"
              className="tournaments-section__search-input basicInput"
              placeholder="Поиск турниров..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="tournaments-section__list">
            {filteredTournaments.length === 0 ? (
              <p className="tournaments-section__empty">
                {searchTerm || filterStatus !== 'all'
                  ? 'Турниры не найдены'
                  : 'У вас пока нет турниров'
                }
              </p>
            ) : (
              filteredTournaments.map((tournament) => {
                const hasAccess = getTournamentPassword(tournament.id) !== undefined;

                return (
                  <Link
                    key={tournament.id}
                    className={`tournaments-section__card tournaments-section__card--${tournament.status} ${hasAccess ? 'tournaments-section__card--owned' : ''}`}
                    to={getTournamentPath(tournament.id)}
                  >
                    <h3 className="tournaments-section__card-title">
                      {tournament.name}
                    </h3>
                    <div className="tournaments-section__info">
                      <span className={`status status--${tournament.status}`}>
                        {getStatusText(tournament.status)}
                      </span>
                      {tournament.status === 'active' && (
                        <span>Раунд: {tournament.currentRound}/{tournament.totalRounds}</span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <InputPasswordDialog
        isCreation
        isOpen={isPasswordDialogOpen}
        onClose={handleClosePasswordDialog}
        onSubmit={handleConfirmCreateTournament}
      />
    </div>
  );
};

export default HomePage;