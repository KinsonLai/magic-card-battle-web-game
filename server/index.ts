
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { RoomPlayer, GameState, GameSettings, ClientAction, RoomInfo, NationType } from '../types';
import { createInitialState, nextTurn, executeCardEffect, executeAttackAction, buyCard, sellCard, resolveAttack, replaceLand } from '../services/gameEngine';

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

// Admin Credentials (SHA-256 of 'admin' = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918)
const ADMIN_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; 

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
    // console.log(`User connected: ${socket.id}`);

    let currentRoomId: string | null = null;
    let isAdmin = false;

    // --- Admin: Login ---
    socket.on('admin_login', (data: { user: string, passHash: string }, callback: (success: boolean) => void) => {
        // Compare hash
        if (data.user === 'admin' && data.passHash === ADMIN_HASH) {
            isAdmin = true;
            socket.join('admin_channel');
            if (typeof callback === 'function') callback(true);
            
            // Send full room data to admin
            const allRooms = Object.values(rooms).map(r => ({
                id: r.id,
                name: r.name,
                playerCount: r.players.length,
                maxPlayers: r.settings.maxPlayers,
                isPublic: r.isPublic,
                hasPassword: !!r.password,
                hostName: r.players.find(p => p.isHost)?.name || 'Unknown',
                status: r.state ? 'PLAYING' : 'WAITING',
                settings: r.settings
            }));
            socket.emit('admin_room_list', allRooms);
        } else {
            if (typeof callback === 'function') callback(false);
        }
    });

    // --- Admin: Get Rooms Manual ---
    socket.on('admin_get_rooms', () => {
        if (!isAdmin) return;
        const allRooms = Object.values(rooms).map(r => ({
            id: r.id,
            name: r.name,
            playerCount: r.players.length,
            maxPlayers: r.settings.maxPlayers,
            isPublic: r.isPublic,
            hasPassword: !!r.password,
            hostName: r.players.find(p => p.isHost)?.name || 'Unknown',
            status: r.state ? 'PLAYING' : 'WAITING',
            settings: r.settings
        }));
        socket.emit('admin_room_list', allRooms);
    });

    // --- Admin: Delete Room ---
    socket.on('admin_delete_room', (roomId: string) => {
        if (!isAdmin) return;
        if (rooms[roomId]) {
            io.to(roomId).emit('kicked'); // Kick everyone
            io.to(roomId).emit('server_log', '管理員強制關閉了房間。');
            io.in(roomId).socketsLeave(roomId);
            delete rooms[roomId];
            io.emit('rooms_changed');
            
            // Update admin list
            const allRooms = Object.values(rooms).map(r => ({
                id: r.id,
                name: r.name,
                playerCount: r.players.length,
                maxPlayers: r.settings.maxPlayers,
                isPublic: r.isPublic,
                hasPassword: !!r.password,
                hostName: r.players.find(p => p.isHost)?.name || 'Unknown',
                status: r.state ? 'PLAYING' : 'WAITING',
                settings: r.settings
            }));
            io.to('admin_channel').emit('admin_room_list', allRooms); 
        }
    });

    // --- Admin: Join Any Room ---
    socket.on('admin_join_room', (roomId: string, callback: (res: any) => void) => {
        if (!isAdmin) return;
        const room = rooms[roomId];
        if (!room) { if(callback) callback({success: false}); return; }

        const adminPlayer: RoomPlayer = {
            id: socket.id,
            name: '⚡ADMIN⚡',
            nation: NationType.MAGIC,
            isHost: false,
            isBot: false,
            isReady: true,
            isAdmin: true,
            botDifficulty: 'normal'
        };
        
        // Force join even if full (Admin privilege)
        room.players.push(adminPlayer);
        socket.join(roomId);
        currentRoomId = roomId;
        
        if (callback) callback({ success: true });
        io.to(roomId).emit('room_update', { players: room.players, hostId: room.players.find(p=>p.isHost)?.id || '' });
        io.to(roomId).emit('server_log', '⚡系統管理員已進入房間⚡');
    });

    // --- Lobby: Get Room List ---
    socket.on('get_rooms', (callback: (rooms: RoomInfo[]) => void) => {
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
            if (typeof callback === 'function') callback({ error: "無效的數據" });
            return;
        }

        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const hostPlayer: RoomPlayer = {
            id: socket.id,
            name: data.player.name || 'Player 1',
            nation: data.player.nation as any || 'FIGHTER',
            isHost: true,
            isBot: false,
            isReady: true, 
            botDifficulty: 'normal',
            isAdmin: isAdmin
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
                rarityWeights: { common: 60, rare: 30, epic: 8, legendary: 2 },
                manaRegenPerTurn: 15,
                maxPlaysPerTurn: 3,
                enableRandomEvents: true,
                banRitualCards: false,
                randomizeNations: false,
                freeShopMode: false,
                crazyMode: false
            }
        };

        socket.join(roomId);
        currentRoomId = roomId;
        
        if (typeof callback === 'function') callback({ roomId });
        io.to(roomId).emit('room_update', { players: rooms[roomId].players, hostId: socket.id });
        io.emit('rooms_changed');
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

        if (room.players.length >= room.settings.maxPlayers && !isAdmin) {
            if (typeof callback === 'function') callback({ success: false, message: '房間已滿' });
            return;
        }

        if (room.state && !isAdmin) {
            if (typeof callback === 'function') callback({ success: false, message: '遊戲已經開始' });
            return;
        }

        if (room.password && room.password !== password && !isAdmin) {
            if (typeof callback === 'function') callback({ success: false, message: '密碼錯誤', needsPassword: true });
            return;
        }

        // Avoid duplicate join
        const existingPlayer = room.players.find(p => p.id === socket.id);
        if (existingPlayer) {
             if (typeof callback === 'function') callback({ success: true });
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
            isAdmin: isAdmin
        };

        room.players.push(newPlayer);
        socket.join(roomId);
        currentRoomId = roomId;
        
        if (typeof callback === 'function') callback({ success: true });
        
        const currentHost = room.players.find(p => p.isHost);
        io.to(roomId).emit('room_update', { players: room.players, hostId: currentHost?.id || room.players[0].id });
        io.to(roomId).emit('server_log', `${newPlayer.name} 加入了房間。`);
        io.emit('rooms_changed');
    });

    // --- Lobby: Toggle Ready ---
    socket.on('toggle_ready', () => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        const player = room.players.find(p => p.id === socket.id);
        
        if (player) {
            player.isReady = !player.isReady;
            const currentHost = room.players.find(p => p.isHost);
            io.to(currentRoomId).emit('room_update', { players: room.players, hostId: currentHost?.id || room.players[0].id });
        }
    });

    // --- Lobby: Add Bot ---
    socket.on('add_bot', (slotIndex?: number) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) return;

        if (room.players.length >= room.settings.maxPlayers) return;

        const nations = Object.values(NationType);
        const randomNation = nations[Math.floor(Math.random() * nations.length)];
        const botId = `bot_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        
        const botPlayer: RoomPlayer = {
            id: botId,
            name: `AI Player ${Math.floor(Math.random() * 100)}`,
            nation: randomNation,
            isHost: false,
            isBot: true,
            isReady: true, 
            botDifficulty: 'normal'
        };

        // Insert at specific index if possible (basic array handling, ideally map slots)
        room.players.push(botPlayer);
        
        io.to(currentRoomId).emit('room_update', { players: room.players, hostId: player.id });
        io.to(currentRoomId).emit('server_log', `房主加入了 AI: ${botPlayer.name}`);
        io.emit('rooms_changed');
    });

    // --- Lobby: Kick Player ---
    socket.on('kick_player', (targetId: string) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        const player = room.players.find(p => p.id === socket.id);
        if (!player || (!player.isHost && !player.isAdmin)) return; // Admin can kick
        if (targetId === player.id) return;

        const targetIndex = room.players.findIndex(p => p.id === targetId);
        if (targetIndex === -1) return;

        const targetPlayer = room.players[targetIndex];
        room.players.splice(targetIndex, 1);

        io.to(currentRoomId).emit('room_update', { players: room.players, hostId: player.id });
        io.to(currentRoomId).emit('server_log', `${targetPlayer.name} 被踢出了房間。`);
        
        io.to(targetId).emit('kicked'); 
        
        const targetSocket = io.sockets.sockets.get(targetId);
        if (targetSocket) {
            targetSocket.leave(currentRoomId);
        }
        io.emit('rooms_changed');
    });

    // --- Lobby: Update Settings ---
    socket.on('update_settings', (settings: GameSettings) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        const player = room.players.find(p => p.id === socket.id);
        if (!player || (!player.isHost && !player.isAdmin)) return;

        room.settings = { ...room.settings, ...settings };
        io.to(currentRoomId).emit('settings_update', room.settings);
    });

    // --- Lobby: Update Player Nation ---
    socket.on('update_player_nation', (targetId: string, nation: NationType) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        const player = room.players.find(p => p.id === socket.id);
        
        const isSelf = targetId === socket.id;
        if (!isSelf && !player?.isHost && !player?.isAdmin) return;

        const target = room.players.find(p => p.id === targetId);
        if (target) {
            target.nation = nation;
            io.to(currentRoomId).emit('room_update', { players: room.players, hostId: room.players.find(p=>p.isHost)?.id || '' });
        }
    });

    // --- Game: Start ---
    socket.on('start_game', (callback: (res: any) => void) => {
        if (!currentRoomId || !rooms[currentRoomId]) {
            if (typeof callback === 'function') callback({ success: false, message: '房間不存在' });
            return;
        }
        const room = rooms[currentRoomId];
        const player = room.players.find(p => p.id === socket.id);
        
        if (!player || (!player.isHost && !player.isAdmin)) {
            if (typeof callback === 'function') callback({ success: false, message: '權限不足' });
            return;
        }

        player.isReady = true;

        const unreadyPlayers = room.players.filter(p => !p.isReady);
        if (unreadyPlayers.length > 0) {
            const names = unreadyPlayers.map(p => p.name).join(', ');
            if (typeof callback === 'function') callback({ success: false, message: `等待玩家準備: ${names}` });
            return; 
        }

        try {
            const initialState = createInitialState(room.players, room.settings);
            initialState.isMultiplayer = true;
            initialState.roomId = currentRoomId;
            
            room.state = initialState;
            
            io.to(currentRoomId).emit('game_start', initialState);
            io.to(currentRoomId).emit('server_log', '遊戲開始！');
            io.emit('rooms_changed');
            
            if (typeof callback === 'function') callback({ success: true });
        } catch (e) {
            console.error("Start Game Error:", e);
            if (typeof callback === 'function') callback({ success: false, message: '伺服器內部錯誤' });
        }
    });

    // --- Game: Actions ---
    socket.on('game_action', (action: ClientAction) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        let gameState = room.state;

        if (!gameState) return;

        // --- Admin Cheats ---
        if (action.type === 'ADMIN_COMMAND' && isAdmin) {
            const cmd = action.command;
            const p = gameState.players.find(p => p.id === socket.id);
            if (p) {
                if (cmd === 'gold') p.gold += 1000;
                if (cmd === 'mana') p.mana = p.maxMana;
                if (cmd === 'heal') p.hp = p.maxHp;
                if (cmd === 'draw') { /* Handle card draw logic if simple enough, or skip */ }
                
                io.to(currentRoomId).emit('state_update', gameState);
                io.to(currentRoomId).emit('server_log', `⚡ ADMIN used command: ${cmd}`);
            }
            return;
        }

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const isTurnAction = ['PLAY_CARD', 'ATTACK', 'BUY_CARD', 'SELL_CARD', 'END_TURN', 'REPLACE_LAND'].includes(action.type);
        
        let isAllowed = false;
        if (currentPlayer.id === socket.id && isTurnAction) isAllowed = true;
        if (action.type === 'REPEL' || action.type === 'TAKE_DAMAGE') {
             if (gameState.pendingAttack && gameState.pendingAttack.targetId === socket.id) {
                 isAllowed = true;
             }
        }
        if (action.type === 'SEND_CHAT') isAllowed = true;
        if (isAdmin) isAllowed = true;

        if (!isAllowed) return;

        try {
            switch (action.type) {
                case 'PLAY_CARD': {
                    const card = currentPlayer.hand.find(c => c.id === action.cardId);
                    if (card) {
                        gameState = executeCardEffect(gameState, card, action.targetId || currentPlayer.id);
                    }
                    break;
                }
                case 'REPLACE_LAND': {
                    gameState = replaceLand(gameState, action.cardId, action.slotIndex);
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
                            text: action.message,
                            isAdmin: sender.isAdmin
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
        // console.log(`User disconnected: ${socket.id}`);
        if (currentRoomId && rooms[currentRoomId]) {
            const room = rooms[currentRoomId];
            const wasHost = room.players.find(p => p.id === socket.id)?.isHost;
            
            room.players = room.players.filter(p => p.id !== socket.id);
            
            if (wasHost && room.players.length > 0) {
                const realPlayer = room.players.find(p => !p.isBot);
                if (realPlayer) {
                    realPlayer.isHost = true;
                    realPlayer.isReady = true; 
                    io.to(currentRoomId).emit('server_log', `${realPlayer.name} 現在是房主。`);
                    io.to(currentRoomId).emit('room_update', { players: room.players, hostId: realPlayer.id });
                } else {
                    delete rooms[currentRoomId];
                    io.emit('rooms_changed');
                    return;
                }
            } else if (room.players.length > 0) {
                 const currentHost = room.players.find(p => p.isHost);
                 io.to(currentRoomId).emit('room_update', { 
                    players: room.players, 
                    hostId: currentHost?.id || ''
                });
            }
            
            io.to(currentRoomId).emit('server_log', '有玩家離開了房間。');
            
            if (room.players.length === 0) {
                delete rooms[currentRoomId];
            }
            io.emit('rooms_changed');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Socket.IO Server running on port ${PORT}`);
});
