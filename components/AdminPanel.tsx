
import React, { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { RoomInfo, GameSettings } from '../types';
import { SimulationScreen } from './SimulationScreen';
import { Trash2, LogIn, Activity, X, ShieldAlert, Brain, RefreshCw, Lock, Globe, Terminal, Filter, ArrowUp, ArrowDown } from 'lucide-react';

interface AdminRoomInfo extends RoomInfo {
    settings?: GameSettings;
}

interface AdminPanelProps {
    onClose: () => void;
    onSimulation?: () => void; // Keep for compatibility if needed, though replaced by internal logic
}

type TabType = 'rooms' | 'logs' | 'simulation';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('rooms');
    const [rooms, setRooms] = useState<AdminRoomInfo[]>([]);
    const [logs, setLogs] = useState<{timestamp: number, message: string}[]>([]);
    const [filterLog, setFilterLog] = useState('');
    const [sortLogDesc, setSortLogDesc] = useState(true);

    useEffect(() => {
        // Subscribe to admin data
        const cleanupRooms = socketService.onAdminRoomList((data) => {
            setRooms(data);
        });
        
        const cleanupLogs = socketService.onLog((msg) => {
            setLogs(prev => [...prev, { timestamp: Date.now(), message: msg }]);
        });
        
        // Initial Fetch
        socketService.adminGetRooms();

        return () => {
            cleanupRooms();
            cleanupLogs();
        };
    }, []);

    const handleDelete = (id: string) => {
        if(window.confirm('確定要強制刪除此房間嗎？所有玩家將被踢出。')) {
            socketService.adminDeleteRoom(id);
        }
    };

    const handleJoin = (id: string) => {
        socketService.adminJoinRoom(id, (res) => {
            if(res.success) {
                onClose(); // Close panel to reveal game view
            } else {
                alert('加入失敗');
            }
        });
    };

    const filteredLogs = logs
        .filter(l => l.message.toLowerCase().includes(filterLog.toLowerCase()))
        .sort((a, b) => sortLogDesc ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="w-full max-w-7xl bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-indigo-500/30 bg-slate-950 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/50 animate-pulse">
                            <ShieldAlert className="text-indigo-400" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-wider flex items-center gap-2">
                                ADMIN CONTROL <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white font-mono shadow-[0_0_10px_red]">ROOT ACCESS</span>
                            </h2>
                            <p className="text-slate-400 text-xs font-mono">System Monitor & Room Management</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={24}/>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900/50">
                    <button 
                        onClick={() => setActiveTab('rooms')} 
                        className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'rooms' ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Activity size={16}/> 房間監控 ({rooms.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'logs' ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Terminal size={16}/> 系統日誌
                    </button>
                    <button 
                        onClick={() => setActiveTab('simulation')} 
                        className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'simulation' ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Brain size={16}/> AI 模擬戰場
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-black/20 relative">
                    
                    {/* ROOMS TAB */}
                    {activeTab === 'rooms' && (
                        <div className="h-full flex flex-col p-6">
                            <div className="flex justify-end mb-4">
                                <button onClick={() => socketService.adminGetRooms()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-white border border-slate-700 transition-colors">
                                    <RefreshCw size={14}/> 刷新列表
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-800 rounded-xl bg-slate-900">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-950 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 text-slate-500 font-bold uppercase text-xs tracking-wider">Room ID</th>
                                            <th className="p-4 text-slate-500 font-bold uppercase text-xs tracking-wider">Name</th>
                                            <th className="p-4 text-slate-500 font-bold uppercase text-xs tracking-wider">Host</th>
                                            <th className="p-4 text-slate-500 font-bold uppercase text-xs tracking-wider">Players</th>
                                            <th className="p-4 text-slate-500 font-bold uppercase text-xs tracking-wider">Status</th>
                                            <th className="p-4 text-slate-500 font-bold uppercase text-xs tracking-wider">Access</th>
                                            <th className="p-4 text-slate-500 font-bold uppercase text-xs tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {rooms.map(room => (
                                            <tr key={room.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 font-mono text-slate-400 text-xs">{room.id}</td>
                                                <td className="p-4 font-bold text-white">{room.name}</td>
                                                <td className="p-4 text-indigo-300">{room.hostName}</td>
                                                <td className="p-4">
                                                    <span className={`font-mono font-bold ${room.playerCount >= room.maxPlayers ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {room.playerCount} / {room.maxPlayers}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${room.status === 'PLAYING' ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                        {room.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {room.isPublic ? <Globe size={14} className="text-emerald-500"/> : <span className="text-slate-600 text-xs">Private</span>}
                                                        {room.hasPassword && <Lock size={14} className="text-yellow-500"/>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleJoin(room.id)}
                                                            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg" 
                                                            title="Force Join"
                                                        >
                                                            <LogIn size={16}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(room.id)}
                                                            className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg" 
                                                            title="Force Delete"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {rooms.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                                                    No active rooms found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* LOGS TAB */}
                    {activeTab === 'logs' && (
                        <div className="h-full flex flex-col p-6">
                            <div className="flex gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Filter className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                    <input 
                                        value={filterLog}
                                        onChange={(e) => setFilterLog(e.target.value)}
                                        placeholder="Filter logs..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <button 
                                    onClick={() => setSortLogDesc(!sortLogDesc)}
                                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center gap-2 text-sm font-bold"
                                >
                                    {sortLogDesc ? <ArrowDown size={16}/> : <ArrowUp size={16}/>} Time
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black rounded-xl border border-slate-800 p-4 font-mono text-xs">
                                {filteredLogs.map((log, i) => (
                                    <div key={i} className="mb-1.5 border-b border-slate-900/50 pb-1 flex gap-3 hover:bg-white/5 p-1 rounded">
                                        <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className="text-emerald-400">SERVER:</span>
                                        <span className="text-slate-300">{log.message}</span>
                                    </div>
                                ))}
                                {filteredLogs.length === 0 && <div className="text-slate-600 italic">No logs found.</div>}
                            </div>
                        </div>
                    )}

                    {/* SIMULATION TAB */}
                    {activeTab === 'simulation' && (
                        <div className="h-full w-full">
                            <SimulationScreen onBack={() => setActiveTab('rooms')} />
                        </div>
                    )}

                </div>
                
                {/* Footer Status */}
                <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs font-mono text-slate-500 flex justify-between">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> SYSTEM_ONLINE</span>
                    <span>SESSION_HASH: {Math.random().toString(36).substring(7)}</span>
                </div>
            </div>
        </div>
    );
};
