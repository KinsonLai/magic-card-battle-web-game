
import { io, Socket } from 'socket.io-client';
import { ClientAction, GameSettings, GameState, RoomInfo, RoomPlayer, ChatMessage } from '../types';

class SocketService {
  private socket: Socket | null = null;
  // Use window.location.origin in production (PROD), otherwise localhost
  // We safely check if import.meta.env exists to avoid "Cannot read properties of undefined (reading 'PROD')"
  private url: string = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) 
    ? window.location.origin 
    : 'http://localhost:3000';

  public connect(url?: string): Promise<void> {
    if (url) this.url = url;
    
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        reconnectionAttempts: 5,
        timeout: 10000,
        autoConnect: true
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

  public getRooms() {
      this.socket?.emit('get_rooms');
  }

  public onRoomListUpdate(callback: (rooms: RoomInfo[]) => void) {
      this.socket?.on('room_list_update', callback);
  }

  public createRoom(data: { player: Partial<RoomPlayer>, roomName: string, isPrivate: boolean, password?: string }, callback: (res: any) => void) {
    this.socket?.emit('create_room', data, callback);
  }

  public joinRoom(data: { roomId: string, player: Partial<RoomPlayer>, password?: string }, callback: (res: any) => void) {
    this.socket?.emit('join_room', data, callback);
  }

  public onKicked(callback: () => void) {
      this.socket?.on('kicked', callback);
  }

  // --- Room Wait Events ---

  public toggleReady() {
      this.socket?.emit('toggle_ready');
  }

  public updateSettings(settings: GameSettings) {
      this.socket?.emit('update_settings', settings);
  }

  public kickPlayer(playerId: string) {
      this.socket?.emit('kick_player', playerId);
  }

  public mutePlayer(playerId: string) {
      this.socket?.emit('mute_player', playerId);
  }

  public transferHost(playerId: string) {
      this.socket?.emit('transfer_host', playerId);
  }

  public addBot() {
      this.socket?.emit('add_bot');
  }

  public sendChat(msg: string) {
      this.socket?.emit('send_chat', msg);
  }

  public onRoomUpdate(callback: (data: { players: RoomPlayer[], settings: GameSettings }) => void) {
    this.socket?.on('room_update', callback);
  }

  public onChatMessage(callback: (msg: ChatMessage) => void) {
      this.socket?.on('chat_message', callback);
  }

  public startGame() {
    this.socket?.emit('start_game');
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
