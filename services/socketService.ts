
import { io, Socket } from 'socket.io-client';
import { ClientAction, GameState, RoomPlayer, RoomInfo, GameSettings } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private url: string = (import.meta as any).env?.VITE_SERVER_URL || 
                        ((import.meta as any).env?.PROD ? window.location.origin : 'http://localhost:3000');
  
  // Buffer for listeners registered before connection or needing re-attachment
  private pendingListeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  public connect(url?: string): Promise<void> {
    if (url) this.url = url;
    
    return new Promise((resolve, reject) => {
      // If already connected, ensure listeners are up to date and resolve
      if (this.socket && this.socket.connected) {
          this.flushPendingListeners(); // CRITICAL FIX: Always flush pending even if already connected
          resolve();
          return;
      }

      this.socket = io(this.url, {
        transports: ['websocket'],
        reconnectionAttempts: 3
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.flushPendingListeners();
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        reject(err);
      });
    });
  }

  private flushPendingListeners() {
      if (!this.socket) return;
      this.pendingListeners.forEach((callbacks, event) => {
          callbacks.forEach(cb => {
              // Prevent duplicates by turning off first (safe to call multiple times)
              this.socket?.off(event, cb);
              this.socket?.on(event, cb);
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

  // --- Internal Helper for Event Management ---
  
  private on(event: string, callback: (...args: any[]) => void): () => void {
      // 1. Add to pending buffer
      if (!this.pendingListeners.has(event)) {
          this.pendingListeners.set(event, []);
      }
      const list = this.pendingListeners.get(event)!;
      if (!list.includes(callback)) {
          list.push(callback);
      }

      // 2. If socket exists, attach immediately
      if (this.socket) {
          this.socket.off(event, callback); // Safety check
          this.socket.on(event, callback);
      }

      // 3. Return cleanup function
      return () => {
          const currentList = this.pendingListeners.get(event);
          if (currentList) {
              this.pendingListeners.set(event, currentList.filter(fn => fn !== callback));
          }
          if (this.socket) {
              this.socket.off(event, callback);
          }
      };
  }

  // --- Lobby Events ---

  public getRooms(callback: (rooms: RoomInfo[]) => void) {
      this.socket?.emit('get_rooms', callback);
  }

  public onRoomsChanged(callback: () => void) {
      return this.on('rooms_changed', callback);
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
      return this.on('settings_update', callback);
  }

  public startGame(callback?: (res: {success: boolean, message?: string}) => void) {
    this.socket?.emit('start_game', (response: any) => {
        if (callback) callback(response);
    });
  }

  public onRoomUpdate(callback: (players: RoomPlayer[], hostId: string) => void) {
    const wrapper = (data: { players: RoomPlayer[], hostId: string }) => {
        callback(data.players, data.hostId);
    };
    return this.on('room_update', wrapper);
  }

  public onKicked(callback: () => void) {
      return this.on('kicked', callback);
  }

  // --- Game Events ---

  public onGameStart(callback: (initialState: GameState) => void) {
    return this.on('game_start', (state: GameState) => {
        callback(state);
    });
  }

  public onStateUpdate(callback: (state: GameState) => void) {
    return this.on('state_update', (state: GameState) => {
        callback(state);
    });
  }

  public emitAction(action: ClientAction) {
    if (this.socket?.connected) {
        this.socket.emit('game_action', action);
    }
  }

  public onLog(callback: (msg: string) => void) {
      return this.on('server_log', (msg: string) => callback(msg));
  }
}

export const socketService = new SocketService();
