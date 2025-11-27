export interface Tournament {
  id: string;
  name: string;
  totalRounds: number;
  currentRound: number;
  status: 'created' | 'active' | 'finished';
  password: string;
}

export interface Player {
  id: string;
  tournamentId: string;
  name: string;
  rating: number;
}

export interface Round {
  id: string;
  tournamentId: string;
  roundNumber: number;
  isFinished: boolean;
}

export interface Pairing {
  id: string;
  roundId: string;
  tournamentId: string;
  whitePlayerId: string;
  blackPlayerId: string;
  result: '1-0' | '0-1' | '0.5-0.5' | '0-0' | null;
  tableNumber: number;
}

export interface FinalResultsTableProps {
  players: Player[];
  tournament: Tournament;
}

export interface PlayerStats {
  player: Player;
  points: number;
  personalMeetings: number;
  sonnenborn: number;
  buchholz: number;
  buchholzCut1: number;
  progressive: number;
  wins: number;
}

export interface TournamentProgressTableProps {
  players: Player[];
  rounds: Round[];
  pairings: Pairing[];
}

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement, MouseEvent>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'passive' | 'transparent' | 'transparent-danger' | 'none';
  href?: string;
  target?: '_self' | '_blank';
}

export interface PlayersTableProps {
  players: Player[];
  onDelete?: (id: string) => void;
  onAddClick?: (name: string, rating: number) => void;
  onStartTournamentClick?: () => void;
  totalRounds?: number;
  isEditable?: boolean;
}

export interface AddPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, rating: number) => void;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  entityName: string;
  onClose: () => void;
  onConfirm: () => void;
  isWarning?: boolean
  agreementText: string;
  rejectionText: string;
}

export interface InputPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<boolean> | boolean;
  isCreation?: boolean;
}

export interface IconProps {
  name?: string;
  size?: number;
  className?: string;
  alt?: string;
  fill?: string;
}

export interface RoundPairingsTableProps {
  pairings: Pairing[];
  players: Player[];
  onResultChange?: (pairingId: string, result: '1-0' | '0-1' | '0.5-0.5' | '0-0' | null) => void;
  isEditable?: boolean;
}

export interface TournamentPageProps {
  role: 'editor' | 'spectator';
}

export interface NotFoundPageProps {
  message?: string;
}