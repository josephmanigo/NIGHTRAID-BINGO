
import { GameMode, BingoCell } from '../types';

export const BINGO_RANGES = {
  B: { min: 1, max: 15 },
  I: { min: 16, max: 30 },
  N: { min: 31, max: 45 },
  G: { min: 46, max: 60 },
  O: { min: 61, max: 75 },
};

export const getBingoLetter = (num: number | 'FREE'): string => {
  if (num === 'FREE') return 'N';
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateBingoCard = (): BingoCell[] => {
  const card: BingoCell[] = [];
  const columns: number[][] = [[], [], [], [], []];

  // Generate 5 unique numbers for each column
  Object.values(BINGO_RANGES).forEach((range, colIdx) => {
    const used = new Set<number>();
    while (used.size < 5) {
      const val = getRandomInt(range.min, range.max);
      used.add(val);
    }
    columns[colIdx] = Array.from(used);
  });

  // Map to a 5x5 grid (row by row)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        card.push({ value: 'FREE', isMarked: true });
      } else {
        card.push({ value: columns[col][row], isMarked: false });
      }
    }
  }

  return card;
};

export const checkWin = (card: BingoCell[], mode: GameMode): { hasWon: boolean; winningIndices: number[]; winningPatterns: number[][] } => {
  const winningPatterns: number[][] = [];

  if (mode === GameMode.BLACKOUT) {
    const indices = Array.from({ length: 25 }, (_, i) => i);
    if (indices.every(idx => card[idx].isMarked)) {
      winningPatterns.push(indices);
    }
  } else {
    // Rows
    for (let r = 0; r < 5; r++) {
      const startIndex = r * 5;
      const rowIdx = [startIndex, startIndex + 1, startIndex + 2, startIndex + 3, startIndex + 4];
      if (rowIdx.every(i => card[i].isMarked)) winningPatterns.push(rowIdx);
    }
    // Columns
    for (let c = 0; c < 5; c++) {
      const colIdx = [c, c + 5, c + 10, c + 15, c + 20];
      if (colIdx.every(i => card[i].isMarked)) winningPatterns.push(colIdx);
    }
    // Diagonals
    const diag1 = [0, 6, 12, 18, 24];
    if (diag1.every(i => card[i].isMarked)) winningPatterns.push(diag1);
    const diag2 = [4, 8, 12, 16, 20];
    if (diag2.every(i => card[i].isMarked)) winningPatterns.push(diag2);
  }

  const allWinningIndices = Array.from(new Set(winningPatterns.flat()));
  return {
    hasWon: winningPatterns.length > 0,
    winningIndices: allWinningIndices,
    winningPatterns
  };
};

export const validateWin = (card: BingoCell[], calledNumbers: number[], mode: GameMode): { isValid: boolean; winningIndices: number[] } => {
  const { hasWon, winningPatterns } = checkWin(card, mode);

  if (!hasWon) return { isValid: false, winningIndices: [] };

  // A win is valid if at least one pattern is fully comprised of called numbers
  const validPatterns = winningPatterns.filter(pattern =>
    pattern.every(idx => {
      const cell = card[idx];
      return cell.value === 'FREE' || calledNumbers.includes(cell.value);
    })
  );

  const isValid = validPatterns.length > 0;
  return {
    isValid,
    winningIndices: isValid ? Array.from(new Set(validPatterns.flat())) : []
  };
};
