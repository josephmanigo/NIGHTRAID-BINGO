
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { GameMode, GameState, BingoCell } from './types';
import { generateBingoCard, checkWin, getBingoLetter, validateWin } from './logic/bingoLogic';
import { soundManager } from './components/SoundManager';
import BackgroundParticles from './components/BackgroundParticles';
import BingoCard from './components/BingoCard';
import Lobby from './components/Lobby';
import Chat from './components/Chat';
import CardSelection from './components/CardSelection';
import { createRoom, joinRoom, listenToRoom, updateRoom } from './logic/firebase';

const USER_ID = localStorage.getItem('bingo_user_id') || (() => {
  const id = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('bingo_user_id', id);
  return id;
})();

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    card: generateBingoCard(),
    cardOptions: null,
    calledNumbers: [],
    isGameOver: false,
    gameMode: GameMode.CLASSIC,
    lastCalled: null,
    winnerMessage: null,
    manualMarking: true,
    isHost: true,
    roomId: null,
  });

  const [playerName, setPlayerName] = useState(localStorage.getItem('bingo_player_name') || '');
  const [players, setPlayers] = useState<any>({});
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isAutoCalling, setIsAutoCalling] = useState(false);
  const callIntervalRef = useRef<number | null>(null);

  // Auto-join from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdParam = urlParams.get('room');
    const storedName = localStorage.getItem('bingo_player_name');

    if (roomIdParam && storedName && !state.roomId) {
      handleJoinRoom(roomIdParam, storedName);
    }
  }, []);

  // Sync with Firebase
  useEffect(() => {
    if (state.roomId) {
      const unsubscribe = listenToRoom(state.roomId, (data) => {
        if (!data) return;

        setState(prev => {
          const gameRestarted = prev.isGameOver && data.gameState !== 'ENDED';
          const winningStateChanged = !prev.isGameOver && data.gameState === 'ENDED';

          if (winningStateChanged) {
            setTimeout(() => triggerWinCelebration(), 0);
          }

          return {
            ...prev,
            card: gameRestarted ? generateBingoCard() : prev.card,
            cardOptions: gameRestarted ? Array.from({ length: 5 }, () => generateBingoCard()) : prev.cardOptions,
            calledNumbers: data.calledNumbers || [],
            lastCalled: data.calledNumbers?.[data.calledNumbers.length - 1] || null,
            isGameOver: data.gameState === 'ENDED',
            winnerMessage: data.gameState === 'ENDED' ? (data.winner ? `${data.winner} WON!` : prev.winnerMessage) : null,
            gameMode: data.gameMode as GameMode,
          };
        });

        if (data.chat) {
          setChatMessages(Object.values(data.chat));
        }

        if (data.players) {
          setPlayers(data.players);
          if (data.players[USER_ID]) {
            setState(prev => ({
              ...prev,
              isHost: data.players[USER_ID].isHost
            }));
          }
        }
      });
      return () => unsubscribe();
    }
  }, [state.roomId]);

  const triggerWinCelebration = () => {
    soundManager.playWin();
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#b10000', '#ffffff', '#000000'] });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#b10000', '#ffffff', '#000000'] });
    }, 250);
  };

  const handleCreateRoom = useCallback(async (name: string, mode: GameMode) => {
    try {
      soundManager.playClick();
      localStorage.setItem('bingo_player_name', name);
      setPlayerName(name);
      const id = await createRoom(USER_ID, name, mode);
      setState(prev => ({
        ...prev,
        roomId: id,
        isHost: true,
        gameMode: mode,
        card: generateBingoCard(),
        cardOptions: Array.from({ length: 5 }, () => generateBingoCard()),
        calledNumbers: [],
        isGameOver: false,
        winnerMessage: null,
      }));
    } catch (error: any) {
      alert(`Initialization Failed: ${error.message}`);
    }
  }, []);

  const handleJoinRoom = useCallback(async (roomId: string, name: string) => {
    try {
      soundManager.playClick();
      localStorage.setItem('bingo_player_name', name);
      setPlayerName(name);
      await joinRoom(roomId, USER_ID, name);
      setState(prev => ({
        ...prev,
        roomId: roomId.trim(),
        isHost: false,
        card: generateBingoCard(),
        cardOptions: Array.from({ length: 5 }, () => generateBingoCard()),
        calledNumbers: [],
        isGameOver: false,
        winnerMessage: null,
      }));
    } catch (error: any) {
      alert(`Join Failed: ${error.message}`);
    }
  }, []);

  const callNextNumber = useCallback(() => {
    if (state.isGameOver || state.calledNumbers.length >= 75 || !state.isHost) return;
    soundManager.playClick();
    let nextNum: number;
    do {
      nextNum = Math.floor(Math.random() * 75) + 1;
    } while (state.calledNumbers.includes(nextNum));

    const newCalled = [...state.calledNumbers, nextNum];
    updateRoom(state.roomId!, {
      calledNumbers: newCalled,
      lastCalled: nextNum
    });
  }, [state.isGameOver, state.calledNumbers, state.isHost, state.roomId]);

  const handleCellClick = useCallback((index: number) => {
    if (state.isGameOver) return;
    soundManager.playClick();
    setState(prev => {
      const newCard = [...prev.card];
      newCard[index] = { ...newCard[index], isMarked: !newCard[index].isMarked };
      return { ...prev, card: newCard };
    });
  }, [state.isGameOver]);

  const claimBingo = useCallback(() => {
    const { isValid, winningIndices } = validateWin(state.card, state.calledNumbers, state.gameMode);

    if (isValid) {
      const message = state.gameMode === GameMode.CLASSIC ? "BINGO!" : "BLACKOUT!";

      setState(prev => ({
        ...prev,
        card: prev.card.map((cell, idx) =>
          winningIndices.includes(idx) ? { ...cell, isWinning: true } : cell
        ),
        isGameOver: true,
        winnerMessage: `${playerName}: ${message}`
      }));

      if (state.roomId) {
        updateRoom(state.roomId, {
          gameState: 'ENDED',
          winner: playerName
        });
      }
      triggerWinCelebration();
    } else {
      alert("INCORRECT BINGO! Check your marks.");
    }
  }, [state.card, state.calledNumbers, state.gameMode, state.roomId, playerName]);

  const handleRestart = useCallback(async () => {
    if (!state.roomId) return;
    soundManager.playClick();

    if (state.isHost) {
      setIsAutoCalling(false);
    }

    try {
      await updateRoom(state.roomId, {
        calledNumbers: [],
        gameState: 'PLAYING',
        winner: null,
        lastCalled: null
      });
    } catch (error: any) {
      alert(`Restart Failed: ${error.message}`);
    }
  }, [state.roomId, state.isHost]);

  const toggleAutoCall = () => {
    if (!state.isHost) return;
    setIsAutoCalling(!isAutoCalling);
  };

  useEffect(() => {
    if (isAutoCalling && !state.isGameOver && state.isHost) {
      callIntervalRef.current = window.setInterval(callNextNumber, 5000);
    } else {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    }
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [isAutoCalling, state.isGameOver, state.isHost, callNextNumber]);

  if (!state.roomId) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
        <div className="tactical-gradient" />
        <div className="silk-flow" />
        <div className="honeycomb-overlay" />
        <BackgroundParticles />
        <Lobby onJoin={handleJoinRoom} onCreate={handleCreateRoom} />
      </div>
    );
  }

  if (state.cardOptions) {
    return (
      <div className="min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col items-center">
        <div className="tactical-gradient fixed inset-0 pointer-events-none" />
        <div className="silk-flow fixed inset-0 pointer-events-none" />
        <div className="honeycomb-overlay fixed inset-0 pointer-events-none" />
        <BackgroundParticles />

        <header className="relative z-20 w-full flex flex-col items-center pt-8 pb-4 mb-2 overflow-visible">
          <div className="absolute top-0 w-[500px] h-[200px] crest-shape -z-10 opacity-80 border-x border-zinc-800" />
          <div className="relative">
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter flex flex-col items-center leading-[0.8] text-center">
              <span className="text-[#b10000]">NIGHT</span>
              <span className="relative text-white flex items-center justify-center mt-[-0.1em]">RAID</span>
            </h1>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap flex gap-2 items-center z-30">
              <span className="px-4 py-1 bg-[#b10000] text-black text-[9px] font-black tracking-[0.3em] uppercase transform skew-x-[-12deg]">
                SELECT LOADOUT
              </span>
              <span className="px-4 py-1 bg-black text-[#b10000] border border-[#b10000]/30 text-[9px] font-black tracking-[0.3em] uppercase transform skew-x-[-12deg]">
                {Object.keys(players).length} {Object.keys(players).length === 1 ? 'PLAYER' : 'PLAYERS'} IN LOBBY
              </span>
            </div>
          </div>
        </header>

        <CardSelection
          cards={state.cardOptions}
          onSelect={(selected) => setState(prev => ({ ...prev, card: selected, cardOptions: null }))}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center">
      <div className="tactical-gradient" />
      <div className="silk-flow" />
      <div className="honeycomb-overlay" />
      <BackgroundParticles />

      {/* Hero Header */}
      <header className="relative z-20 w-full flex flex-col items-center pt-8 pb-8 mb-4 overflow-visible">
        <div className="absolute top-0 w-[500px] h-[200px] crest-shape -z-10 opacity-80 border-x border-zinc-800" />

        <div className="relative">
          <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter flex flex-col items-center leading-[0.8] text-center">
            <span className="text-[#b10000]">NIGHT</span>
            <span className="relative text-white flex items-center justify-center mt-[-0.1em]">RAID</span>
          </h1>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap flex gap-2 items-center z-30">
            <span className="px-4 py-1 bg-[#b10000] text-black text-[9px] font-black tracking-[0.3em] uppercase transform skew-x-[-12deg]">
              ROOM ID: {state.roomId}
            </span>
            <span className="px-4 py-1 bg-black text-[#b10000] border border-[#b10000]/30 text-[9px] font-black tracking-[0.3em] uppercase transform skew-x-[-12deg]">
              {Object.keys(players).length} ONLINE
            </span>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-black border border-[#b10000]/50 rounded-md text-[#b10000] font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-black">
            {state.gameMode} MODE
          </div>

          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}?room=${state.roomId}`;
              navigator.clipboard.writeText(url);
              alert("Invite link copied!");
            }}
            className="px-4 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors"
          >
            Copy Invite Link
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 w-full max-w-[1600px] px-4 pb-12">
        {/* Left Col: Info & Chat */}
        <section className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-panel p-5 rounded-lg tactical-border">
            <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest border-l-2 border-[#b10000] pl-2 mb-4 flex justify-between items-center">
              <span>PLAYERS</span>
              <span className="text-[#b10000] text-[9px] bg-[#b10000]/10 px-2 py-0.5 rounded-sm border border-[#b10000]/30">
                {Object.keys(players).length} TOTAL
              </span>
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Object.entries(players).map(([id, p]: [string, any]) => (
                <div key={id} className={`flex items-center justify-between p-2 rounded border ${id === USER_ID ? 'bg-[#b10000]/10 border-[#b10000]/30' : 'bg-black/50 border-zinc-800'}`}>
                  <span className={`text-[11px] font-bold ${id === USER_ID ? 'text-white' : 'text-zinc-400'}`}>
                    {p.name} {p.isHost && <span className="text-[#b10000] ml-1 text-[7px] border border-[#b10000] px-1 italic">HOST</span>}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
              ))}
            </div>
          </div>

          <Chat roomId={state.roomId} playerName={playerName} messages={chatMessages} />
        </section>

        {/* Center Col: Bingo Card (Spans 2 columns) */}
        <section className="flex flex-col items-center lg:col-span-2">
          <div className="relative w-full group">
            <div className="absolute -inset-1 bg-gradient-to-b from-[#b10000]/10 to-transparent blur-2xl opacity-50" />

            <div className="relative">
              <BingoCard
                card={state.card}
                lastCalled={state.lastCalled}
                onCellClick={handleCellClick}
                isManualMarking={true}
              />

              {state.isGameOver && (
                <div className="absolute inset-0 bg-gradient-to-b from-[#b10000] to-[#500000] z-30 rounded-xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-700 border-2 border-white/20 shadow-none">
                  <h2 className="text-5xl md:text-7xl font-black text-white italic mb-10 tracking-tighter uppercase">
                    {state.winnerMessage}
                  </h2>
                  {state.isHost ? (
                    <button
                      onClick={handleRestart}
                      className="px-12 py-5 bg-white text-[#b10000] font-black rounded-sm shadow-none transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.4em] text-sm skew-x-[-12deg]"
                    >
                      Play Again
                    </button>
                  ) : (
                    <p className="text-white text-xl font-bold uppercase tracking-widest mt-4">Waiting for Host to restart...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 w-full max-w-md mt-8">
            <button
              onClick={claimBingo}
              disabled={state.isGameOver}
              className="w-full py-5 bg-[#b10000] hover:bg-red-500 disabled:opacity-30 text-white font-black rounded-sm shadow-2xl transition-all active:scale-95 uppercase tracking-[0.4em] text-xl skew-x-[-12deg] border-2 border-[#ff4444]/40"
            >
              BINGO!
            </button>

            {state.isHost && (
              <div className="flex gap-4">
                <button
                  onClick={callNextNumber}
                  disabled={state.isGameOver || isAutoCalling}
                  className="flex-1 py-4 bg-zinc-900 border border-zinc-800 hover:border-[#b10000] text-white font-black rounded-sm transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px] skew-x-[-12deg]"
                >
                  Call Number
                </button>
                <button
                  onClick={toggleAutoCall}
                  className={`px-8 rounded-sm border-2 font-black text-[10px] uppercase tracking-widest transition-all ${isAutoCalling ? 'bg-zinc-800 border-[#b10000] text-[#b10000]' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
                >
                  {isAutoCalling ? 'Stop' : 'Auto'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Col: Current Number & Log */}
        <section className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-panel p-8 rounded-lg tactical-border flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#b10000 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-6 border-l-2 border-[#b10000] pl-2 self-start">CURRENT NUMBER</h3>
            <div className="relative group">
              <div className="absolute -inset-4 border border-[#b10000]/20 rounded-full animate-ping-slow" />
              <div className={`w-40 h-40 rounded-full border-[6px] flex flex-col items-center justify-center transition-all duration-700 shadow-[0_0_40px_rgba(0,0,0,1)] ${state.lastCalled ? 'border-[#b10000] bg-zinc-900/80 text-white' : 'border-zinc-900 bg-black/40 text-zinc-800'}`}>
                <span className="text-3xl font-black text-[#b10000] leading-none mb-1">
                  {state.lastCalled ? getBingoLetter(state.lastCalled) : ''}
                </span>
                <span className="text-6xl font-black leading-none drop-shadow-lg">
                  {state.lastCalled || '--'}
                </span>
              </div>
            </div>

            <p className="mt-8 text-center text-zinc-500 max-w-[200px] text-[10px] uppercase font-black tracking-widest leading-relaxed opacity-60">
              {state.isHost ? 'Call a number when you are ready.' : 'Waiting for host to call a number...'}
            </p>
          </div>

          <div className="glass-panel p-5 rounded-lg tactical-border flex-1">
            <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest border-l-2 border-[#b10000] pl-2 mb-4">CALLED NUMBERS</h3>
            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {state.calledNumbers.slice().reverse().map((num, i) => (
                <div key={i} className={`px-3 py-1 flex items-center justify-center rounded text-[11px] font-black border transition-all ${i === 0 ? 'bg-[#b10000] border-[#ff4444] text-white' : 'bg-black/80 border-zinc-800 text-zinc-500'}`}>
                  {getBingoLetter(num)}-{num}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;
