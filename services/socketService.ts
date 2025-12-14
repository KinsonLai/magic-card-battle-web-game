
import { io, Socket } from 'socket.io-client';
import { ClientAction, GameState, RoomPlayer } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private url: string = 'http://localhost:3000'; // Default dev URL

  public connect(url: string): Promise<void> {
    this.url = url;
    return new Promise((resolve, reject) => {
      this.socket = io(url, {
        transports: ['websocket'],
        reconnectionAttempts: 3
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        reject(err);
      });
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getId(): string | undefined {
    return this.socket?.id;
  }

  // --- Lobby Events ---

  public createRoom(player: Partial<RoomPlayer>, callback: (roomId: string) => void) {
    this.socket?.emit('create_room', player, (response: any) => {
        if (response.roomId) callback(response.roomId);
    });
  }

  public joinRoom(roomId: string, player: Partial<RoomPlayer>, callback: (success: boolean, msg?: string) => void) {
    this.socket?.emit('join_room', { roomId, player }, (response: any) => {
        callback(response.success, response.message);
    });
  }

  public startGame() {
    this.socket?.emit('start_game');
  }

  public onRoomUpdate(callback: (players: RoomPlayer[], hostId: string) => void) {
    this.socket?.on('room_update', (data: { players: RoomPlayer[], hostId: string }) => {
        callback(data.players, data.hostId);
    });
  }

  // --- Game Events ---

  public onGameStart(callback: (initialState: GameState) => void) {
    this.socket?.on('game_start', (state: GameState) => {
        callback(state);
    });
  }

  public onStateUpdate(callback: (state: GameState) => void) {
    this.socket?.on('state_update', (state: GameState) => {
        callback(state);
    });
  }

  public emitAction(action: ClientAction) {
    if (this.socket?.connected) {
        this.socket.emit('game_action', action);
    }
  }

  public onLog(callback: (msg: string) => void) {
      this.socket?.on('server_log', (msg: string) => callback(msg));
  }
}

export const socketService = new SocketService();
