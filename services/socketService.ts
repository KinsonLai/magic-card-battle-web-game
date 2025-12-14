
import { io, Socket } from 'socket.io-client';
import { ClientAction, GameState, RoomPlayer, RoomInfo, GameSettings } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private url: string = (import.meta as any).env?.VITE_SERVER_URL || 
                        ((import.meta as any).env?.PROD ? window.location.origin : 'http://localhost:3000');

  public connect(url?: string): Promise<void> {
    if (url) this.url = url;
    
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
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

  public getRooms(callback: (rooms: RoomInfo[]) => void) {
      this.socket?.emit('get_rooms', callback);
  }

  public onRoomsChanged(callback: () => void) {
      this.socket?.on('rooms_changed', callback);
  }

  public createRoom(params: { player: Partial<RoomPlayer>, roomName: string, password?: string, isPublic: boolean }, callback: (roomId: string) => void) {
    this.socket?.emit('create_room', params, (response: any) => {
        if (response.roomId) callback(response.roomId);
    });
  }

  public joinRoom(roomId: string, player: Partial<RoomPlayer>, password: string | undefined, callback: (success: boolean, msg?: string, needsPassword?: boolean) => void) {
    this.socket?.emit('join_room', { roomId, player, password }, (response: any) => {
        callback(response.success, response.message, response.needsPassword);
    });
  }

  public toggleReady() {
      this.socket?.emit('toggle_ready');
  }

  public addBot() {
      this.socket?.emit('add_bot');
  }

  public kickPlayer(targetId: string) {
      this.socket?.emit('kick_player', targetId);
  }

  public updateSettings(settings: GameSettings) {
      this.socket?.emit('update_settings', settings);
  }

  public onSettingsUpdate(callback: (settings: GameSettings) => void) {
      this.socket?.on('settings_update', callback);
  }

  public startGame() {
    this.socket?.emit('start_game');
  }

  public onRoomUpdate(callback: (players: RoomPlayer[], hostId: string) => void) {
    this.socket?.on('room_update', (data: { players: RoomPlayer[], hostId: string }) => {
        callback(data.players, data.hostId);
    });
  }

  public onKicked(callback: () => void) {
      this.socket?.on('kicked', callback);
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
