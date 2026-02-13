
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push, child, get } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyA5xFRi-NmEay27sw-2dJnYlwx3N-3hsu0",
    authDomain: "nightraid-bingo.firebaseapp.com",
    databaseURL: "https://nightraid-bingo-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nightraid-bingo",
    storageBucket: "nightraid-bingo.firebasestorage.app",
    messagingSenderId: "783756409959",
    appId: "1:783756409959:web:bb885b0973c402e92968c2",
    measurementId: "G-9M8M974EFH"
};

const isFirebaseConfigured = true;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const checkConfig = () => {
    // Already configured
};

export const createRoom = async (hostId: string, hostName: string, gameMode: string) => {
    const roomsRef = ref(db, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key;

    const roomData = {
        id: roomId,
        hostId,
        hostName,
        gameMode,
        calledNumbers: [],
        gameState: 'LOBBY',
        winner: null,
        players: {
            [hostId]: {
                name: hostName,
                isHost: true
            }
        }
    };

    await set(newRoomRef, roomData);
    return roomId;
};

export const joinRoom = async (roomId: string, playerId: string, playerName: string) => {
    const cleanId = roomId.trim();
    if (!cleanId) {
        throw new Error("Please enter a Room ID.");
    }

    // Check if room exists first
    const roomRef = ref(db, `rooms/${cleanId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error(`Room ID "${cleanId}" not found. Make sure the Host has started the game.`);
    }

    const playerRef = ref(db, `rooms/${cleanId}/players/${playerId}`);
    await set(playerRef, {
        name: playerName,
        isHost: false
    });
};

export const updateRoom = (roomId: string, data: any) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    return update(roomRef, data);
};

export const listenToRoom = (roomId: string, callback: (data: any) => void) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
        callback(snapshot.val());
    });
};

export const sendChatMessage = (roomId: string, playerName: string, text: string) => {
    const chatRef = ref(db, `rooms/${roomId}/chat`);
    const newMessageRef = push(chatRef);
    return set(newMessageRef, {
        sender: playerName,
        text,
        timestamp: Date.now()
    });
};

export const dbRef = db;
