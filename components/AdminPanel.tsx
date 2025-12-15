
import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { RoomInfo, GameSettings, LogEntry, GameState } from '../types';
import { Trash2, LogIn, Eye, Terminal, RefreshCw, XCircle, Search, Filter } from 'lucide-react';
import { DebugConsole } from './DebugConsole';

interface AdminPanelProps {
    onClose: () => void;
    onSimulation: () => void;
}

interface AdminRoomInfo extends RoomInfo {
    settings: GameSettings;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onSimulation }) => {
    const [rooms, setRooms] = useState<AdminRoomInfo[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState('');
    const [debugRoomId, setDebugRoomId] = useState<string | null>(null);
    const [mockState, setMockState] = useState<GameState | null>(null);

    useEffect(() => {
        // Initial fetch
        const unsubscribe = socketService.onAdminRoomList((data: any[]) => {
            setRooms(data as AdminRoomInfo[]);
        });

        // Listen for all logs globally if possible (server needs to broadcast to admin room)
        // For now, we simulate logs or use debug console logic
        return () => {
            unsubscribe();
        };
    }, []);

    const handleDeleteRoom = (id: string) => {
        if (confirm(`確定要刪除房間 ${id} 嗎？`)) {
            socketService.adminDeleteRoom(id);
        }
    };

    const handleJoinRoom = (id: string) => {
        socketService.adminJoinRoom(id, (res: any) => {
            if (res.success) {
                onClose(); // Close panel, user is now in room via main App logic
            } else {
                alert("加入失敗");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col p-6 overflow-hidden animate-fade-in font-mono text-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-green-500/30 pb-4">
                <div className="flex items-center gap-3">
                    <Terminal className="text-green-500" size={32} />
                    <h1 className="text-2xl font-bold text-green-400 tracking-widest">SYSTEM_ADMIN_PANEL</h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={onSimulation} className="px-4 py-2 bg-indigo-900/50 border border-indigo-500 text-indigo-300 hover:bg-indigo-900 hover:text-white rounded transition-all text-xs font-bold">
                        OPEN AI SIMULATION
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-red-900/50 rounded-full text-red-500 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Room Management */}
                <div className="lg:col-span-2 bg-black/50 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><RefreshCw size={16}/> Active Rooms ({rooms.length})</h3>
                        <div className="relative">
                            <Search className="absolute left-2 top-1.5 text-slate-500" size={14}/>
                            <input 
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                placeholder="Filter ID/Name..." 
                                className="bg-black border border-slate-700 rounded pl-8 pr-2 py-1 text-xs outline-none focus:border-green-500 w-48"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {rooms.filter(r => r.id.includes(filter) || r.name.includes(filter)).map(room => (
                            <div key={room.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded hover:border-slate-600 transition-all group">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400 font-bold">{room.name}</span>
                                        <span className="text-xs bg-slate-800 px-1 rounded text-slate-500">{room.id}</span>
                                        {room.hasPassword && <span className="text-xs text-yellow-500">🔒</span>}
                                        {!room.isPublic && <span className="text-xs text-indigo-400">PRIVATE</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Host: {room.hostName} | Players: {room.playerCount}/{room.maxPlayers} | Status: {room.status}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleJoinRoom(room.id)} className="p-2 bg-blue-900/30 text-blue-400 hover:bg-blue-900 hover:text-white rounded border border-blue-800" title="Force Join">
                                        <LogIn size={16}/>
                                    </button>
                                    <button onClick={() => handleDeleteRoom(room.id)} className="p-2 bg-red-900/30 text-red-400 hover:bg-red-900 hover:text-white rounded border border-red-800" title="Delete Room">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {rooms.length === 0 && <div className="text-center text-slate-600 py-10">No active rooms found.</div>}
                    </div>
                </div>

                {/* System Logs (Mockup for now as we don't have global log stream yet) */}
                <div className="bg-black/50 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-800">
                        <h3 className="font-bold flex items-center gap-2"><Terminal size={16}/> Server Logs</h3>
                    </div>
                    <div className="flex-1 p-4 font-mono text-xs text-slate-400 overflow-y-auto custom-scrollbar space-y-1">
                        <div className="text-green-500">[SYSTEM] Admin panel initialized.</div>
                        <div className="text-slate-500">[INFO] Listening for room events...</div>
                        {/* Real logs would stream here via socket */}
                    </div>
                </div>
            </div>
        </div>
    );
};
