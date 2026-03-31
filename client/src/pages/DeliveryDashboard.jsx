/* eslint-disable react-hooks/set-state-in-effect */
// client/src/pages/DeliveryDashboard.jsx
// Removed online/offline toggle — agent is always active when viewing this page.
// Added "All" option to delivery zone dropdown.

import { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import { updateOrderStatus, getAvailableOrders, getLocations } from '../services/api';
import { MapPin, User, Navigation, CheckCircle2, Package, Signal, SignalZero, BellRing, ChevronDown, AlertTriangle, Hourglass } from 'lucide-react';
import { AlertModal } from '../components/ui/AlertModal';

// socket initialized outside component
const socket = io('http://localhost:5001');

function cn(...c) { return c.filter(Boolean).join(' '); }

const DeliveryDashboard = () => {
    const { user } = useContext(AuthContext);
    const [availableOrders,  setAvailableOrders]  = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('All');
    const [locations,        setLocations]        = useState([]);
    const [isConnected,      setIsConnected]      = useState(socket.connected);
    const [alertConfig,      setAlertConfig]      = useState({ isOpen: false, message: '', type: 'error' });

    const showAlert = (message, type = 'error') => setAlertConfig({ isOpen: true, message, type });

    useEffect(() => {
        getLocations().then(({ data }) => {
            setLocations(data);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        // socket connection handlers
        socket.on('connect',       () => { console.log('Socket Connected:', socket.id); setIsConnected(true); });
        socket.on('disconnect',    () => { console.log('Socket Disconnected'); setIsConnected(false); });
        socket.on('connect_error', (err) => { console.error('Socket Connection Error:', err); setIsConnected(false); });

        if (user && selectedLocation) {
            if (selectedLocation === 'All') {
                // Join all location rooms
                locations.forEach(loc => {
                    socket.emit('join_delivery', { userId: user._id, location: loc.name });
                });
            } else {
                socket.emit('join_delivery', { userId: user._id, location: selectedLocation });
            }

            const fetchExisting = async () => {
                setAvailableOrders([]);
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
            if (selectedLocation !== 'All') {
                const orderLocation = order.deliveryLocation || '';
                if (orderLocation.trim().toLowerCase() !== selectedLocation.trim().toLowerCase()) return;
            }
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');
            audio.play().catch(e => console.log('Audio play failed', e));
            setAvailableOrders(prev => {
                if (prev.find(o => o._id === order._id)) return prev;
                return [order, ...prev];
            });
        });

        return () => {
            if (user) {
                if (selectedLocation === 'All') {
                    locations.forEach(loc => {
                        socket.emit('leave_delivery', { userId: user._id, location: loc.name });
                    });
                } else {
                    socket.emit('leave_delivery', { userId: user._id, location: selectedLocation });
                }
            }
            socket.off('new_delivery_request');
            socket.off('connect');
            socket.off('connect_error');
        };
    }, [user, selectedLocation, locations]);

    const handleAcceptOrder = async (orderId) => {
        try {
            await updateOrderStatus(orderId, 'out_for_delivery');
            showAlert('Order accepted! The user has been notified and will receive an OTP.', 'success');
            setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
        } catch (error) {
            console.error('Failed to accept order:', error);
            showAlert('Failed to accept order: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
            <AlertModal isOpen={alertConfig.isOpen} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} />
            {/* Top bar */}
            <div className="border-b border-white/10">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-white font-black text-xl">Delivery Hub</h1>
                        <p className="text-gray-500 text-xs mt-0.5">Real-time campus delivery</p>
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

                {/* Location selector */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <label className="block text-sm font-semibold text-gray-500 mb-3"><MapPin className="w-5 h-5 shrink-0" /> Your Delivery Zone</label>
                    <div className="relative">
                        <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all appearance-none cursor-pointer">
                            <option value="All" className="text-gray-900">All</option>
                            {locations.map(loc => (
                                <option key={loc._id} value={loc.name} className="text-gray-900">{loc.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {!isConnected && (
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold bg-amber-400/10 px-4 py-2 rounded-lg border border-amber-400/20">
                        <AlertTriangle className="w-5 h-5 shrink-0" /> Socket disconnected — check your network
                    </div>
                )}

                {/* Orders list */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-bold">Available Orders</h2>
                        {availableOrders.length > 0 && (
                            <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {availableOrders.length} new
                            </span>
                        )}
                    </div>

                    {availableOrders.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
                            <div className="flex justify-center text-4xl mb-3"><Hourglass className="w-5 h-5 shrink-0" /></div>
                            <p className="text-gray-500 font-semibold text-sm">No orders in {selectedLocation === 'All' ? 'any zone' : selectedLocation}</p>
                            <p className="text-gray-500 text-xs mt-1">New orders will appear here in real time</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {availableOrders.map(order => (
                                <div key={order._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-indigo-600 font-black text-sm">New Request!</span>
                                                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">Pending</span>
                                                </div>
                                                <p className="text-xs font-mono text-gray-500">#{order._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                            <span className="text-2xl font-black text-gray-900">₹{order.totalAmount}</span>
                                        </div>

                                        <div className="bg-gray-50/80 rounded-lg p-3 mb-4">
                                            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Pickup From</p>
                                            <p className="font-bold text-gray-900 text-sm">{order.vendor?.storeName || 'Vendor'}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <span><MapPin className="w-5 h-5 shrink-0" /></span>{order.vendor?.location || 'Unknown'}
                                            </p>
                                        </div>

                                        <button onClick={() => handleAcceptOrder(order._id)}
                                            className="w-full py-3 bg-indigo-600 text-white hover:bg-indigo-600 text-white active:scale-[0.98] text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                                            Request Delivery →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Zone',     value: selectedLocation || 'None',       color: 'text-white' },
                        { label: 'Pending',  value: availableOrders.length,           color: availableOrders.length > 0 ? 'text-indigo-600' : 'text-gray-500' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
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
