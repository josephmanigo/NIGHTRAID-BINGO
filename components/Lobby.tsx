
import React, { useState } from 'react';
import { GameMode } from '../types';

interface LobbyProps {
    onJoin: (roomId: string, name: string) => void;
    onCreate: (name: string, mode: GameMode) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin, onCreate }) => {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [mode, setMode] = useState<GameMode>(GameMode.CLASSIC);
    const [isJoining, setIsJoining] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center p-8 glass-panel rounded-xl tactical-border max-w-md w-full animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-black text-[#b10000] mb-8 tracking-tighter italic uppercase">NIGHTRAID BINGO</h2>

            <div className="w-full space-y-6">
                <div>
                    <label className="block text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-2">Your Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ENTER NAME..."
                        className="w-full bg-black/50 border border-zinc-800 p-4 text-white font-bold rounded focus:border-[#b10000] outline-none transition-colors"
                    />
                </div>

                <div className="h-px bg-zinc-800/50 w-full" />

                {!isJoining ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-2">Game Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setMode(GameMode.CLASSIC)}
                                    className={`py-3 rounded text-xs font-black tracking-widest border transition-all ${mode === GameMode.CLASSIC ? 'bg-[#b10000] border-[#b10000] text-white' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
                                >
                                    CLASSIC
                                </button>
                                <button
                                    onClick={() => setMode(GameMode.BLACKOUT)}
                                    className={`py-3 rounded text-xs font-black tracking-widest border transition-all ${mode === GameMode.BLACKOUT ? 'bg-[#b10000] border-[#b10000] text-white' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
                                >
                                    BLACKOUT
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => onCreate(name, mode)}
                            disabled={!name}
                            className="w-full py-4 bg-[#b10000] hover:bg-red-500 disabled:opacity-30 text-white font-black rounded-sm shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-sm skew-x-[-12deg]"
                        >
                            Start New Game
                        </button>

                        <button
                            onClick={() => setIsJoining(true)}
                            className="w-full py-3 text-zinc-500 hover:text-white text-[10px] font-black tracking-widest uppercase transition-colors"
                        >
                            Or Join Room
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-2">Room ID</label>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="ENTER ROOM ID..."
                                className="w-full bg-black/50 border border-zinc-800 p-4 text-white font-bold rounded focus:border-[#b10000] outline-none transition-colors"
                            />
                        </div>

                        <button
                            onClick={() => onJoin(roomId, name)}
                            disabled={!name || !roomId}
                            className="w-full py-4 bg-[#b10000] hover:bg-red-500 disabled:opacity-30 text-white font-black rounded-sm shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-sm skew-x-[-12deg]"
                        >
                            Join Game
                        </button>

                        <button
                            onClick={() => setIsJoining(false)}
                            className="w-full py-3 text-zinc-500 hover:text-white text-[10px] font-black tracking-widest uppercase transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Lobby;
