
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomPlayer, GameState, GameSettings, ClientAction, RoomInfo } from '../types';
import { createInitialState, nextTurn, executeCardEffect, executeAttackAction, buyCard, sellCard, resolveAttack } from '../services/gameEngine';

// ESM dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    password?: string;
    isPublic: boolean;
    players: RoomPlayer[];
    state: GameState | null;
    settings: GameSettings;
}

const rooms: Record<string, RoomData> = {};

// Serve Static Files (Vite Build)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath) as any);

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    let currentRoomId: string | null = null;

    // --- Lobby: Get Room List ---
    socket.on('get_rooms', (callback: (rooms: RoomInfo[]) => void) => {
        // Filter out private rooms or playing rooms
        const roomList: RoomInfo[] = Object.values(rooms)
            .filter(r => r.isPublic && !r.state) 
            .map(r => ({
                id: r.id,
                name: r.name,
                playerCount: r.players.length,
                maxPlayers: r.settings.maxPlayers,
                isPublic: r.isPublic,
                hasPassword: !!r.password,
                hostName: r.players.find(p => p.isHost)?.name || 'Unknown',
                status: r.state ? 'PLAYING' : 'WAITING'
            }));
        if (typeof callback === 'function') callback(roomList);
    });

    // --- Lobby: Create Room ---
    socket.on('create_room', (data: { player: Partial<RoomPlayer>, roomName: string, password?: string, isPublic: boolean }, callback: (res: any) => void) => {
        if (!data || !data.player) {
            console.error("Invalid create_room data:", data);
            if (typeof callback === 'function') callback({ error: "無效的數據" });
            return;
        }

        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const hostPlayer: RoomPlayer = {
            id: socket.id,
            name: data.player.name || 'Player 1',
            nation: data.player.nation as any || 'FIGHTER',
            isHost: true, // Explicitly set host
            isBot: false,
            isReady: true,
            botDifficulty: 'normal'
        };

        rooms[roomId] = {
            id: roomId,
            name: data.roomName || `Room ${roomId}`,
            password: data.password || undefined,
            isPublic: data.isPublic,
            players: [hostPlayer],
            state: null,
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
        console.log(`Room created: ${roomId} by ${hostPlayer.name}`);
        
        if (typeof callback === 'function') callback({ roomId });
        io.to(roomId).emit('room_update', { players: rooms[roomId].players, hostId: socket.id });
        io.emit('rooms_changed'); // Notify all lobbies to update list
    });

    // --- Lobby: Join Room ---
    socket.on('join_room', (data: { roomId: string, player: Partial<RoomPlayer>, password?: string }, callback: (res: any) => void) => {
        if (!data || !data.roomId || !data.player) {
             if (typeof callback === 'function') callback({ success: false, message: '無效的請求' });
             return;
        }

        const { roomId, player, password } = data;
        const room = rooms[roomId];

        if (!room) {
            if (typeof callback === 'function') callback({ success: false, message: '房間不存在' });
            return;
        }

        if (room.players.length >= room.settings.maxPlayers) {
            if (typeof callback === 'function') callback({ success: false, message: '房間已滿' });
            return;
        }

        if (room.state) {
            if (typeof callback === 'function') callback({ success: false, message: '遊戲已經開始' });
            return;
        }

        // Password Check
        if (room.password && room.password !== password) {
            if (typeof callback === 'function') callback({ success: false, message: '密碼錯誤', needsPassword: true });
            return;
        }

        // Avoid duplicate join
        if (room.players.find(p => p.id === socket.id)) {
             if (typeof callback === 'function') callback({ success: true }); // Already joined
             return;
        }

        const newPlayer: RoomPlayer = {
            id: socket.id,
            name: player.name || `Player ${room.players.length + 1}`,
            nation: player.nation as any || 'FIGHTER',
            isHost: false,
            isBot: false,
            isReady: true,
            botDifficulty: 'normal'
        };

        room.players.push(newPlayer);
        socket.join(roomId);
        currentRoomId = roomId;
        
        if (typeof callback === 'function') callback({ success: true });
        
        // Find current host ID to ensure sync
        const currentHost = room.players.find(p => p.isHost);
        io.to(roomId).emit('room_update', { players: room.players, hostId: currentHost?.id || room.players[0].id });
        io.to(roomId).emit('server_log', `${newPlayer.name} 加入了房間。`);
        io.emit('rooms_changed');
    });

    // --- Lobby: Update Room Settings ---
    socket.on('update_settings', (settings: GameSettings) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        
        // Only host check
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) return;

        room.settings = { ...room.settings, ...settings };
        // Broadcast new settings to room
        io.to(currentRoomId).emit('settings_update', room.settings);
    });

    // --- Game: Start ---
    socket.on('start_game', () => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        
        // Only host can start
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) return;

        // Initialize Game
        const initialState = createInitialState(room.players, room.settings);
        initialState.isMultiplayer = true;
        initialState.roomId = currentRoomId;
        
        room.state = initialState;
        
        io.to(currentRoomId).emit('game_start', initialState);
        io.to(currentRoomId).emit('server_log', '遊戲開始！');
        io.emit('rooms_changed'); // Room no longer waiting
    });

    // --- Game: Actions ---
    socket.on('game_action', (action: ClientAction) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        let gameState = room.state;

        if (!gameState) return;

        // Validate Turn
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const isTurnAction = ['PLAY_CARD', 'ATTACK', 'BUY_CARD', 'SELL_CARD', 'END_TURN'].includes(action.type);
        if (isTurnAction && currentPlayer.id !== socket.id) {
            socket.emit('server_log', '這不是你的回合！');
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
                    const sender = gameState.players.find(p => p.id === socket.id);
                    if (sender) {
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

            if (gameState.winnerId) {
                io.to(currentRoomId).emit('server_log', `遊戲結束！獲勝者: ${gameState.winnerId}`);
            }

        } catch (e) {
            console.error("Game Logic Error:", e);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (currentRoomId && rooms[currentRoomId]) {
            const room = rooms[currentRoomId];
            const wasHost = room.players.find(p => p.id === socket.id)?.isHost;
            
            room.players = room.players.filter(p => p.id !== socket.id);
            
            // Host Migration Logic
            if (wasHost && room.players.length > 0) {
                room.players[0].isHost = true;
                io.to(currentRoomId).emit('server_log', `${room.players[0].name} 現在是房主。`);
                io.to(currentRoomId).emit('room_update', { 
                    players: room.players, 
                    hostId: room.players[0].id
                });
            } else if (room.players.length > 0) {
                 // Even if not host, update player list
                 io.to(currentRoomId).emit('room_update', { 
                    players: room.players, 
                    hostId: room.players.find(p => p.isHost)?.id || ''
                });
            }
            
            io.to(currentRoomId).emit('server_log', '有玩家離開了房間。');
            
            // If room empty, delete
            if (room.players.length === 0) {
                delete rooms[currentRoomId];
                console.log(`Room ${currentRoomId} deleted`);
            }
            io.emit('rooms_changed'); // Update room lists counts
        }
    });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Socket.IO Server running on port ${PORT}`);
});
