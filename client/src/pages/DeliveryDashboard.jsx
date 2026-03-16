// client/src/pages/DeliveryDashboard.jsx  ← replace existing file entirely
// Logic is IDENTICAL — same socket.io, same handlers, same API calls.
// Only the JSX/styling is redesigned. Debug section removed (was marked as debug).

import { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import { updateOrderStatus, getAvailableOrders, getLocations } from '../services/api';

// ← identical to original: socket initialized outside component
const socket = io('http://localhost:5001');

function cn(...c) { return c.filter(Boolean).join(' '); }

const DeliveryDashboard = () => {
    // ← identical state to original
    const { user } = useContext(AuthContext);
    const [isOnline,         setIsOnline]         = useState(false);
    const [availableOrders,  setAvailableOrders]  = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [locations,        setLocations]        = useState([]);
    const [isConnected,      setIsConnected]      = useState(socket.connected);

    useEffect(() => {
        getLocations().then(({ data }) => {
            setLocations(data);
            if (data.length > 0 && !selectedLocation) setSelectedLocation(data[0].name);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        // ← identical socket logic to original
        socket.on('connect',       () => { console.log('Socket Connected:', socket.id); setIsConnected(true); });
        socket.on('disconnect',    () => { console.log('Socket Disconnected'); setIsConnected(false); });
        socket.on('connect_error', (err) => { console.error('Socket Connection Error:', err); setIsConnected(false); });

        if (isOnline && user && selectedLocation) {
            socket.emit('join_delivery', { userId: user._id, location: selectedLocation });
            setAvailableOrders([]);
            const fetchExisting = async () => {
                try {
                    const res = await getAvailableOrders(selectedLocation);
                    setAvailableOrders(prev => {
                        const newOrders = res.data.filter(newO => !prev.find(p => p._id === newO._id));
                        return [...prev, ...newOrders];
                    });
                } catch (err) { console.error('Failed to fetch existing orders:', err); }
            };
            fetchExisting();
        }

        socket.on('new_delivery_request', (order) => {
            const orderLocation = order.vendor?.location || '';
            if (orderLocation.trim().toLowerCase() !== selectedLocation.trim().toLowerCase()) return;
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');
            audio.play().catch(e => console.log('Audio play failed', e));
            setAvailableOrders(prev => {
                if (prev.find(o => o._id === order._id)) return prev;
                return [order, ...prev];
            });
        });

        return () => {
            if (user) socket.emit('leave_delivery', { userId: user._id, location: selectedLocation });
            socket.off('new_delivery_request');
            socket.off('connect');
            socket.off('connect_error');
        };
    }, [isOnline, user, selectedLocation]);

    const handleAcceptOrder = async (orderId) => {
        try {
            await updateOrderStatus(orderId, 'agent_requested');
            alert('Request sent to Vendor! Please wait for approval in your main Dashboard.');
            setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
        } catch (error) {
            console.error('Failed to accept order:', error);
            alert('Failed to accept order.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
            {/* Top bar */}
            <div className="border-b border-white/10">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-white font-black text-xl">Delivery Hub</h1>
                        <p className="text-gray-400 text-xs mt-0.5">Real-time campus delivery</p>
                    </div>
                    {/* Connection pill */}
                    <div className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
                        isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    )}>
                        <span className={cn('w-2 h-2 rounded-full shrink-0', isConnected ? 'bg-green-400' : 'bg-red-400')} />
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Online toggle card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-5">
                    {/* Big toggle button */}
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        aria-label={isOnline ? 'Go offline' : 'Go online'}
                        className={cn(
                            'relative w-24 h-24 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-4',
                            isOnline
                                ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-[0_0_0_12px_rgba(74,222,128,0.15)] focus-visible:ring-green-400 hover:shadow-[0_0_0_16px_rgba(74,222,128,0.2)] active:scale-95'
                                : 'bg-gradient-to-br from-gray-500 to-gray-600 focus-visible:ring-gray-400 hover:from-gray-400 hover:to-gray-500 active:scale-95'
                        )}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d={isOnline
                                        ? 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 12h.01'
                                        : 'M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728m12.728-12.728L5.636 18.364M12 12h.01'}
                                />
                            </svg>
                        </div>
                        {isOnline && <span className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />}
                    </button>

                    <div className="text-center">
                        <p className={cn('text-lg font-black', isOnline ? 'text-green-400' : 'text-gray-400')}>
                            {isOnline ? 'You are ONLINE' : 'You are OFFLINE'}
                        </p>
                        <p className="text-gray-500 text-xs mt-1 max-w-[200px]">
                            {isOnline
                                ? `Receiving requests for ${selectedLocation}`
                                : 'Tap the button to start receiving delivery requests'}
                        </p>
                    </div>

                    {!isConnected && (
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold bg-amber-400/10 px-4 py-2 rounded-xl border border-amber-400/20">
                            ⚠️ Socket disconnected — check your network
                        </div>
                    )}
                </div>

                {/* Location selector */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <label className="block text-sm font-semibold text-gray-300 mb-3">📍 Your Delivery Zone</label>
                    {!isOnline ? (
                        <div className="relative">
                            <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400/60 transition-all appearance-none cursor-pointer">
                                {locations.map(loc => (
                                    <option key={loc._id} value={loc.name} className="text-gray-900">{loc.name}</option>
                                ))}
                            </select>
                            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                            <span className="text-green-300 text-sm font-semibold">{selectedLocation}</span>
                            <span className="text-green-500/60 text-xs ml-auto">Go offline to change</span>
                        </div>
                    )}
                </div>

                {/* Offline warning */}
                {!isOnline && (
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm">
                        <span className="shrink-0 mt-0.5">💡</span>
                        <p>Select your zone above, then go online to start receiving delivery requests.</p>
                    </div>
                )}

                {/* Orders list */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-bold">Available Orders</h2>
                        {availableOrders.length > 0 && (
                            <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {availableOrders.length} new
                            </span>
                        )}
                    </div>

                    {!isOnline ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                            <div className="text-4xl mb-3 opacity-40">🛵</div>
                            <p className="text-gray-400 text-sm font-semibold">Go online to see orders</p>
                        </div>
                    ) : availableOrders.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                            <div className="text-4xl mb-3">⏳</div>
                            <p className="text-gray-300 font-semibold text-sm">No orders in {selectedLocation}</p>
                            <p className="text-gray-500 text-xs mt-1">New orders will appear here in real time</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {availableOrders.map(order => (
                                <div key={order._id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-orange-500 font-black text-sm">New Request!</span>
                                                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">Pending</span>
                                                </div>
                                                <p className="text-xs font-mono text-gray-400">#{order._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                            <span className="text-2xl font-black text-gray-900">₹{order.totalAmount}</span>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                                            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Pickup From</p>
                                            <p className="font-bold text-gray-900 text-sm">{order.vendor?.storeName || 'Vendor'}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <span>📍</span>{order.vendor?.location || 'Unknown'}
                                            </p>
                                        </div>

                                        <button onClick={() => handleAcceptOrder(order._id)}
                                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-md shadow-orange-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                                            Request Delivery →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Status',   value: isOnline ? 'Online' : 'Offline', color: isOnline ? 'text-green-400' : 'text-gray-400' },
                        { label: 'Zone',     value: selectedLocation || 'None',       color: 'text-white' },
                        { label: 'Pending',  value: availableOrders.length,           color: availableOrders.length > 0 ? 'text-orange-400' : 'text-gray-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                            <p className={cn('font-black text-lg leading-tight truncate', s.color)}>{s.value}</p>
                            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeliveryDashboard;
