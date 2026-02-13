
import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../logic/firebase';

interface ChatProps {
    roomId: string;
    playerName: string;
    messages: any[];
}

const Chat: React.FC<ChatProps> = ({ roomId, playerName, messages }) => {
    const [text, setText] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        sendChatMessage(roomId, playerName, text.trim());
        setText('');
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="glass-panel rounded-lg tactical-border flex flex-col h-[300px] overflow-hidden relative">
            <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none bg-no-repeat"
                style={{
                    backgroundImage: 'url("/nightraid logo - Edited.png")',
                    backgroundSize: '80%',
                    backgroundPosition: 'center 50%'
                }}
            />
            <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest border-l-2 border-[#b10000] pl-2 m-4 relative z-10">CHAT</h3>

            <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar text-[11px] relative z-10">
                {messages.map((m, i) => (
                    <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className={`font-black uppercase tracking-tighter ${m.sender === playerName ? 'text-[#b10000]' : 'text-zinc-400'}`}>
                            {m.sender}:
                        </span>
                        <span className="text-white ml-2 opacity-90">{m.text}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-black/50 border-t border-zinc-800 flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="SEND MSG..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-white text-[10px] p-2 rounded focus:border-[#b10000] outline-none"
                />
                <button className="px-3 bg-[#b10000] text-black font-black text-[10px] rounded skew-x-[-12deg]">
                    SEND
                </button>
            </form>
        </div>
    );
};

export default Chat;
