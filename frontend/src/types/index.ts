export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Game {
  id: string;
  weekNumber: number;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  gameTime: string;
  isCompleted: boolean;
}

export interface Pick {
  id: string;
  userId: string;
  weekNumber: number;
  gameId: string;
  selectedTeam: string;
  isCorrect?: boolean;
  submittedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalCorrect: number;
  weeklyCorrect?: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, groupCode: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}