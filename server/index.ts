
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomPlayer, GameState, GameSettings, ClientAction, RoomInfo, NationType } from '../types';
import { createInitialState, nextTurn, executeCardEffect, executeAttackAction, buyCard, sellCard, resolveAttack } from '../services/gameEngine';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

interface RoomData {
    id: string;
    name: string;
    players: RoomPlayer[];
    state: GameState | null;
    settings: GameSettings;
    password?: string;
    isPrivate: boolean;
}

const rooms: Record<string, RoomData> = {};

// Helper to broadcast room list
const broadcastRoomList = () => {
    const roomList: RoomInfo[] = Object.values(rooms).map(r => ({
        id: r.id,
        name: r.name,
        isPrivate: r.isPrivate,
        playerCount: r.players.length,
        maxPlayers: r.settings.maxPlayers,
        status: r.state ? 'PLAYING' : 'WAITING',
        hostName: r.players.find(p => p.isHost)?.name || 'Unknown'
    }));
    io.emit('room_list_update', roomList);
};

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Send initial list
    const roomList: RoomInfo[] = Object.values(rooms).map(r => ({
        id: r.id,
        name: r.name,
        isPrivate: r.isPrivate,
        playerCount: r.players.length,
        maxPlayers: r.settings.maxPlayers,
        status: r.state ? 'PLAYING' : 'WAITING',
        hostName: r.players.find(p => p.isHost)?.name || 'Unknown'
    }));
    socket.emit('room_list_update', roomList);

    let currentRoomId: string | null = null;

    socket.on('get_rooms', () => {
        broadcastRoomList();
    });

    socket.on('create_room', (data: { player: Partial<RoomPlayer>, roomName: string, isPrivate: boolean, password?: string }, callback: (res: any) => void) => {
        const roomId = Math.random().toString(36).substring(2, 6).toUpperCase(); // Short code for UX
        
        const hostPlayer: RoomPlayer = {
            id: socket.id,
            name: data.player.name || 'Player 1',
            nation: data.player.nation as any || 'FIGHTER',
            isHost: true,
            isBot: false,
            isReady: true, // Host is always ready
            botDifficulty: 'normal',
            isMuted: false
        };

        rooms[roomId] = {
            id: roomId,
            name: data.roomName || `${hostPlayer.name}的房間`,
            players: [hostPlayer],
            state: null,
            isPrivate: data.isPrivate,
            password: data.password,
            settings: {
                initialGold: 100,
                initialMana: 50,
                maxPlayers: 4,
                cardsDrawPerTurn: 2,
                maxHandSize: 12,
                incomeMultiplier: 1,
                eventFrequency: 5,
                isMultiplayer: true,
                roomCode: roomId,
                shopSize: 3,
                healthMultiplier: 1,
                damageMultiplier: 1,
                priceMultiplier: 1,
                rarityWeights: { common: 60, rare: 30, epic: 8, legendary: 2 }
            }
        };

        socket.join(roomId);
        currentRoomId = roomId;
        console.log(`Room created: ${roomId}`);
        
        callback({ roomId });
        io.to(roomId).emit('room_update', { players: rooms[roomId].players, settings: rooms[roomId].settings });
        broadcastRoomList();
    });

    socket.on('join_room', (data: { roomId: string, player: Partial<RoomPlayer>, password?: string }, callback: (res: any) => void) => {
        const { roomId, player, password } = data;
        const room = rooms[roomId];

        if (!room) {
            callback({ success: false, message: '房間不存在' });
            return;
        }

        if (room.isPrivate && room.password && room.password !== password) {
             callback({ success: false, message: '密碼錯誤' });
             return;
        }

        if (room.players.length >= room.settings.maxPlayers) {
            callback({ success: false, message: '房間已滿' });
            return;
        }

        if (room.state) {
            callback({ success: false, message: '遊戲已開始' });
            return;
        }

        const newPlayer: RoomPlayer = {
            id: socket.id,
            name: player.name || `Player ${room.players.length + 1}`,
            nation: player.nation as any || 'FIGHTER',
            isHost: false,
            isBot: false,
            isReady: false,
            botDifficulty: 'normal',
            isMuted: false
        };

        room.players.push(newPlayer);
        socket.join(roomId);
        currentRoomId = roomId;
        
        callback({ success: true });
        io.to(roomId).emit('room_update', { players: room.players, settings: room.settings });
        io.to(roomId).emit('chat_message', { id: Date.now().toString(), sender: '系統', text: `${newPlayer.name} 加入了房間`, isSystem: true });
        broadcastRoomList();
    });

    socket.on('toggle_ready', () => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.isReady = !player.isReady;
            io.to(currentRoomId).emit('room_update', { players: room.players, settings: room.settings });
        }
    });

    socket.on('update_settings', (newSettings: GameSettings) => {
         if (!currentRoomId || !rooms[currentRoomId]) return;
         const room = rooms[currentRoomId];
         // Check Host
         if (room.players[0].id !== socket.id) return;
         
         room.settings = newSettings;
         io.to(currentRoomId).emit('room_update', { players: room.players, settings: room.settings });
         broadcastRoomList(); // In case max players changed
    });

    socket.on('kick_player', (playerId: string) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        if (room.players[0].id !== socket.id) return; // Only host

        const targetSocket = io.sockets.sockets.get(playerId);
        if (targetSocket) {
            targetSocket.leave(currentRoomId);
            targetSocket.emit('kicked');
        }

        room.players = room.players.filter(p => p.id !== playerId);
        io.to(currentRoomId).emit('room_update', { players: room.players, settings: room.settings });
        broadcastRoomList();
    });

    socket.on('mute_player', (playerId: string) => {
         if (!currentRoomId || !rooms[currentRoomId]) return;
         const room = rooms[currentRoomId];
         if (room.players[0].id !== socket.id) return;
         
         const p = room.players.find(p => p.id === playerId);
         if (p) p.isMuted = !p.isMuted;
         io.to(currentRoomId).emit('room_update', { players: room.players, settings: room.settings });
    });

    socket.on('transfer_host', (playerId: string) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        if (room.players[0].id !== socket.id) return;
        
        // Find new host
        const newHostIdx = room.players.findIndex(p => p.id === playerId);
        if (newHostIdx === -1) return;

        // Swap to front or just flag? simpler to just flag isHost
        room.players.forEach(p => p.isHost = false);
        room.players[newHostIdx].isHost = true;
        // Also move to front of array for simpler logic elsewhere
        const newHost = room.players.splice(newHostIdx, 1)[0];
        room.players.unshift(newHost);

        io.to(currentRoomId).emit('room_update', { players: room.players, settings: room.settings });
        broadcastRoomList();
    });

    socket.on('add_bot', () => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        if (room.players[0].id !== socket.id) return;
        if (room.players.length >= room.settings.maxPlayers) return;

        const botId = `bot_${Date.now()}_${Math.random()}`;
        room.players.push({
            id: botId,
            name: `Bot ${Math.floor(Math.random() * 100)}`,
            nation: NationType.FIGHTER,
            isHost: false,
            isBot: true,
            isReady: true,
            botDifficulty: 'normal',
            isMuted: false
        });
        io.to(currentRoomId).emit('room_update', { players: room.players, settings: room.settings });
        broadcastRoomList();
    });

    socket.on('start_game', () => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        
        if (room.players[0].id !== socket.id) return;

        // Check all ready
        if (room.players.some(p => !p.isReady)) return;

        // Initialize Game
        const initialState = createInitialState(room.players, room.settings);
        initialState.isMultiplayer = true;
        initialState.roomId = currentRoomId;
        
        room.state = initialState;
        
        io.to(currentRoomId).emit('game_start', initialState);
        io.to(currentRoomId).emit('chat_message', { id: 'sys', sender: '系統', text: '遊戲開始！', isSystem: true });
        broadcastRoomList();
    });

    socket.on('send_chat', (message: string) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        const sender = room.players.find(p => p.id === socket.id);
        
        if (sender && !sender.isMuted) {
             const msg = {
                id: Date.now().toString(),
                sender: sender.name,
                text: message
            };
            
            // If game started, add to game state chat
            if (room.state) {
                 room.state.chat.push(msg);
                 io.to(currentRoomId).emit('state_update', room.state);
            } else {
                 io.to(currentRoomId).emit('chat_message', msg);
            }
        }
    });

    socket.on('game_action', (action: ClientAction) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        let gameState = room.state;

        if (!gameState) return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const isTurnAction = ['PLAY_CARD', 'ATTACK', 'BUY_CARD', 'SELL_CARD', 'END_TURN'].includes(action.type);
        
        // Basic turn validation for human players
        if (isTurnAction && currentPlayer.id !== socket.id) {
            return;
        }

        try {
            switch (action.type) {
                case 'PLAY_CARD': {
                    const card = currentPlayer.hand.find(c => c.id === action.cardId);
                    if (card) {
                        gameState = executeCardEffect(gameState, card, action.targetId || currentPlayer.id);
                    }
                    break;
                }
                case 'ATTACK': {
                    const cards = currentPlayer.hand.filter(c => action.cardIds.includes(c.id));
                    if (cards.length > 0 && action.targetId) {
                        gameState = executeAttackAction(gameState, cards, action.targetId);
                    }
                    break;
                }
                case 'REPEL': {
                    if (gameState.pendingAttack && gameState.pendingAttack.targetId === socket.id) {
                        const targetPlayer = gameState.players.find(p => p.id === socket.id);
                        if (targetPlayer) {
                            const cards = targetPlayer.hand.filter(c => action.cardIds.includes(c.id));
                            gameState = resolveAttack(gameState, cards, true);
                        }
                    }
                    break;
                }
                case 'TAKE_DAMAGE': {
                    if (gameState.pendingAttack && gameState.pendingAttack.targetId === socket.id) {
                        gameState = resolveAttack(gameState, [], false);
                    }
                    break;
                }
                case 'BUY_CARD': {
                    const card = gameState.shopCards.find(c => c.id === action.cardId);
                    if (card) {
                        gameState = buyCard(gameState, card);
                    }
                    break;
                }
                case 'SELL_CARD': {
                    const card = currentPlayer.hand.find(c => c.id === action.cardId);
                    if (card) {
                        gameState = sellCard(gameState, card);
                    }
                    break;
                }
                case 'END_TURN': {
                    gameState = nextTurn(gameState);
                    break;
                }
                case 'SEND_CHAT': {
                    // Handled by separate event for lobby, but if in game:
                    const sender = gameState.players.find(p => p.id === socket.id);
                    if (sender && !sender.isMuted) {
                        gameState.chat.push({
                            id: Date.now().toString(),
                            sender: sender.name,
                            text: action.message
                        });
                    }
                    break;
                }
            }

            room.state = gameState;
            io.to(currentRoomId).emit('state_update', gameState);

        } catch (e) {
            console.error("Game Logic Error:", e);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (currentRoomId && rooms[currentRoomId]) {
            const room = rooms[currentRoomId];
            const wasHost = room.players[0]?.id === socket.id;
            
            room.players = room.players.filter(p => p.id !== socket.id);
            
            if (room.players.length === 0) {
                delete rooms[currentRoomId];
                console.log(`Room ${currentRoomId} deleted`);
            } else {
                if (wasHost) {
                    // Assign new host to next player
                    room.players[0].isHost = true;
                }
                io.to(currentRoomId).emit('room_update', { players: room.players, settings: room.settings });
                io.to(currentRoomId).emit('chat_message', { id: 'sys', sender: '系統', text: '有玩家離開了房間', isSystem: true });
            }
            broadcastRoomList();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Socket.IO Server running on port ${PORT}`);
});
