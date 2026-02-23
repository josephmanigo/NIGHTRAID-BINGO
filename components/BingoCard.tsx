
import React from 'react';
import { BingoCell } from '../types';

interface BingoCardProps {
  card: BingoCell[];
  lastCalled: number | null;
  onCellClick?: (index: number) => void;
  isManualMarking?: boolean;
}

const BingoCard: React.FC<BingoCardProps> = ({ card, lastCalled, onCellClick, isManualMarking }) => {
  const headers = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="w-full max-w-md mx-auto glass-panel p-5 rounded-lg shadow-2xl relative z-10 border-t-2 border-[#b10000]">
      <div className="bingo-grid mb-4">
        {headers.map((h) => (
          <div key={h} className="text-center font-black text-3xl text-[#b10000] pb-2 italic">
            {h}
          </div>
        ))}
      </div>
      <div className="bingo-grid">
        {card.map((cell, idx) => {
          const isHighlight = lastCalled !== null && cell.value === lastCalled;
          const isWinningCell = cell.isWinning;

          return (
            <div
              key={idx}
              onClick={() => onCellClick?.(idx)}
              className={`
                aspect-square flex items-center justify-center rounded-sm text-lg font-black transition-all duration-500 relative overflow-hidden
                ${isManualMarking ? 'cursor-pointer hover:border-[#b10000] active:scale-90' : ''}
                ${cell.isMarked
                  ? 'bg-gradient-to-br from-[#b10000] to-[#7a0000] text-white border border-[#ff4444]/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'
                  : 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/50'}
                ${isHighlight ? 'pulse-red scale-105 z-20 bg-[#b10000] border-[#ffffff] text-white' : ''}
                ${isWinningCell ? 'animate-bounce border-yellow-500 bg-[#9a0000] shadow-[0_0_20px_rgba(177,0,0,0.8)]' : ''}
              `}
            >
              {/* Internal Honeycomb for marked cells */}
              {cell.isMarked && (
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '6px 6px' }} />
              )}
              <span className="relative z-10">{cell.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BingoCard;
