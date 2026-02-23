
export enum GameMode {
  CLASSIC = 'CLASSIC',
  BLACKOUT = 'BLACKOUT'
}

export interface BingoCell {
  value: number | 'FREE';
  isMarked: boolean;
  isWinning?: boolean;
}

export interface Player {
  id: string;
  name: string;
  card: BingoCell[];
  hasWon: boolean;
}

export interface GameState {
  card: BingoCell[];
  cardOptions: BingoCell[][] | null;
  calledNumbers: number[];
  isGameOver: boolean;
  gameMode: GameMode;
  lastCalled: number | null;
  winnerMessage: string | null;
  manualMarking: boolean;
  isHost: boolean;
  roomId: string | null;
}
