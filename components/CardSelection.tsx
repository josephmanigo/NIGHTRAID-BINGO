import React from 'react';
import { BingoCell } from '../types';
import BingoCard from './BingoCard';

interface CardSelectionProps {
  cards: BingoCell[][];
  onSelect: (card: BingoCell[]) => void;
}

const CardSelection: React.FC<CardSelectionProps> = ({ cards, onSelect }) => {
  return (
    <div className="relative z-10 w-full max-w-[1600px] flex flex-col items-center pt-8 pb-12 px-4">
      <h2 className="text-xl md:text-2xl font-black text-zinc-500 italic mb-8 tracking-widest uppercase text-center border-b-[1px] border-[#b10000]/50 pb-2">
        Pick Your Card Options
      </h2>
      <div className="flex flex-wrap justify-center gap-6 pb-12 w-full max-w-[1400px]">
        {cards.map((card, index) => (
          <div
            key={index}
            className="cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => onSelect(card)}
          >
            <div className="mb-2 text-center text-[#b10000] font-bold text-sm uppercase tracking-widest">Card {index + 1}</div>
            <div className="pointer-events-none scale-[0.6] origin-top md:scale-[0.8]">
              <BingoCard card={card} lastCalled={null} onCellClick={() => { }} isManualMarking={false} />
            </div>
            <button className="w-full mt-[-80px] md:mt-[-40px] py-3 bg-[#b10000] text-white font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-colors">
              Choose This Card
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardSelection;
