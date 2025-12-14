
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomPlayer, GameState, GameSettings, ClientAction, CardType } from '../types';
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
    players: RoomPlayer[];
    state: GameState | null;
    settings: GameSettings;
}

const rooms: Record<string, RoomData> = {};

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    let currentRoomId: string | null = null;

    socket.on('create_room', (playerInfo: Partial<RoomPlayer>, callback: (res: any) => void) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const hostPlayer: RoomPlayer = {
            id: socket.id,
            name: playerInfo.name || 'Player 1',
            nation: playerInfo.nation as any || 'FIGHTER',
            isHost: true,
            isBot: false,
            isReady: true,
            botDifficulty: 'normal'
        };

        rooms[roomId] = {
            id: roomId,
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
        callback({ roomId });
        io.to(roomId).emit('room_update', { players: rooms[roomId].players, hostId: socket.id });
    });

    socket.on('join_room', (data: { roomId: string, player: Partial<RoomPlayer> }, callback: (res: any) => void) => {
        const { roomId, player } = data;
        const room = rooms[roomId];

        if (!room) {
            callback({ success: false, message: 'Room not found' });
            return;
        }

        if (room.players.length >= room.settings.maxPlayers) {
            callback({ success: false, message: 'Room full' });
            return;
        }

        if (room.state) {
            callback({ success: false, message: 'Game already started' });
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
        
        callback({ success: true });
        io.to(roomId).emit('room_update', { players: room.players, hostId: room.players[0].id });
        io.to(roomId).emit('server_log', `${newPlayer.name} joined the room.`);
    });

    socket.on('start_game', () => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        
        // Only host can start
        if (room.players[0].id !== socket.id) return;

        // Initialize Game
        const initialState = createInitialState(room.players, room.settings);
        // Force multiplayer flag
        initialState.isMultiplayer = true;
        initialState.roomId = currentRoomId;
        
        room.state = initialState;
        
        io.to(currentRoomId).emit('game_start', initialState);
        io.to(currentRoomId).emit('server_log', 'Game Started!');
    });

    socket.on('game_action', (action: ClientAction) => {
        if (!currentRoomId || !rooms[currentRoomId]) return;
        const room = rooms[currentRoomId];
        let gameState = room.state;

        if (!gameState) return;

        // Validate Turn
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        // If action needs current player authority
        const isTurnAction = ['PLAY_CARD', 'ATTACK', 'BUY_CARD', 'SELL_CARD', 'END_TURN'].includes(action.type);
        if (isTurnAction && currentPlayer.id !== socket.id) {
            socket.emit('server_log', 'Not your turn!');
            return;
        }

        // Handle Actions
        try {
            switch (action.type) {
                case 'PLAY_CARD': {
                    const card = currentPlayer.hand.find(c => c.id === action.cardId);
                    if (card) {
                        gameState = executeCardEffect(gameState, card, action.targetId || currentPlayer.id);
                        io.to(currentRoomId).emit('server_log', `${currentPlayer.name} played ${card.name}`);
                    }
                    break;
                }
                case 'ATTACK': {
                    const cards = currentPlayer.hand.filter(c => action.cardIds.includes(c.id));
                    if (cards.length > 0 && action.targetId) {
                        gameState = executeAttackAction(gameState, cards, action.targetId);
                        io.to(currentRoomId).emit('server_log', `${currentPlayer.name} is attacking!`);
                    }
                    break;
                }
                case 'REPEL': {
                    // Only target of pending attack can repel
                    if (gameState.pendingAttack && gameState.pendingAttack.targetId === socket.id) {
                        const targetPlayer = gameState.players.find(p => p.id === socket.id);
                        if (targetPlayer) {
                            const cards = targetPlayer.hand.filter(c => action.cardIds.includes(c.id));
                            gameState = resolveAttack(gameState, cards, true);
                            io.to(currentRoomId).emit('server_log', `${targetPlayer.name} repelled the attack!`);
                        }
                    }
                    break;
                }
                case 'TAKE_DAMAGE': {
                    if (gameState.pendingAttack && gameState.pendingAttack.targetId === socket.id) {
                        gameState = resolveAttack(gameState, [], false);
                        io.to(currentRoomId).emit('server_log', `Damage taken!`);
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

            // Save and Broadcast State
            room.state = gameState;
            io.to(currentRoomId).emit('state_update', gameState);

            // Check for Winner
            if (gameState.winnerId) {
                io.to(currentRoomId).emit('server_log', `Game Over! Winner: ${gameState.winnerId}`);
            }

        } catch (e) {
            console.error("Game Logic Error:", e);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (currentRoomId && rooms[currentRoomId]) {
            const room = rooms[currentRoomId];
            room.players = room.players.filter(p => p.id !== socket.id);
            
            io.to(currentRoomId).emit('room_update', { players: room.players, hostId: room.players[0]?.id });
            io.to(currentRoomId).emit('server_log', 'A player disconnected.');

            if (room.players.length === 0) {
                delete rooms[currentRoomId];
                console.log(`Room ${currentRoomId} deleted`);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Socket.IO Server running on port ${PORT}`);
});
