// client/src/pages/Dashboard.jsx  ← replace existing file entirely
// Logic is IDENTICAL — same API calls, same state, same handlers, same role checks.

import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import {
    getMyOrders, getVendorOrders, updateOrderStatus, getAllOrders,
    getMyDeliveries, getLocations, addLocation, deleteLocation,
    updateCommissionRates, getMyWallet, getVendorProducts, deleteProduct,
    clearMyOrders, getPendingUsers, approveUser, rejectUser,
    getAdminAnalytics, resetSystem, searchUsers,
    addFunds, getSystemEarnings, getCommissionRates,
    getAllUsers, deleteUser, getAdminReport,
} from '../services/api';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BarChart2, ShoppingBag, Search, AlertCircle, Wallet, PackageSearch, ShieldCheck, MapPin, Package, TrendingUp, CheckCircle2, Settings, Hourglass, Printer, Truck, UserCircle, Users, Trash2, FileBarChart } from 'lucide-react';

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:5001' : 'https://campuskart-hadi-vl28.onrender.com';
const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

// ─── helpers ──────────────────────────────────────────────────────────────
const ROLE_LABEL = {
    user:   'Student',
    vendor: 'Vendor',
    agent:  'Delivery Agent',
    admin:  'Admin'
};

function cn(...c) { return c.filter(Boolean).join(' '); }

function StatusBadge({ status }) {
    const map = {
        pending:          'bg-amber-100 text-amber-800',
        processing:       'bg-amber-100 text-amber-800', // user sees this when vendor accepts
        accepted:         'bg-indigo-100 text-blue-800',
        confirmed:        'bg-indigo-600 text-white text-indigo-600', // user sees this when agent accepts
        preparing:        'bg-indigo-100 text-blue-800',
        ready:            'bg-purple-100 text-purple-800',
        agent_requested:  'bg-purple-100 text-purple-800',
        out_for_delivery: 'bg-indigo-600 text-white text-indigo-600',
        delivered:        'bg-green-100 text-green-700',
        cancelled:        'bg-red-100 text-red-700',
        rejected:         'bg-red-100 text-red-700',
    };
    return (
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', map[status] || 'bg-gray-50/80 text-gray-900')}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
}

function StatCard({ label, value, icon, accent }) {
    const bg = {
        orange: 'bg-indigo-50 border-indigo-100',
        green:  'bg-emerald-50 border-emerald-100',
        blue:   'bg-blue-50 border-blue-100',
        purple: 'bg-purple-50 border-purple-100',
    };
    const iconColor = {
        orange: 'text-indigo-600',
        green:  'text-emerald-600',
        blue:   'text-blue-600',
        purple: 'text-purple-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border', bg[accent || 'orange'])}>
                <span className={iconColor[accent || 'orange']}>{icon}</span>
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{value}</p>
            </div>
        </div>
    );
}

function Card({ children, className }) {
    return <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm p-6', className)}>{children}</div>;
}

function SectionTitle({ children }) {
    return <h2 className="text-lg font-bold text-gray-900 mb-5">{children}</h2>;
}

// ─── USER SECTION ─────────────────────────────────────────────────────────
function UserSection({ orders, deliveries, userWalletBalance, handleStatusUpdate, isUpdating, handleClearHistory }) {
    const [otpInputs, setOtpInputs] = useState({});
    const [paymentOrder, setPaymentOrder] = useState(null);

    const handleAcceptDelivery = (order) => {
        setPaymentOrder(order);
    };

    const confirmPaymentAndAccept = () => {
        if (!paymentOrder) return;
        handleStatusUpdate(paymentOrder._id, 'out_for_delivery');
        setPaymentOrder(null);
    };
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Wallet Balance" value={`₹${userWalletBalance ?? 0}`} icon={<Wallet className="w-5 h-5 shrink-0" />} accent="green" />
                <StatCard label="Total Orders"   value={orders.length}                                   icon={<Package className="w-5 h-5 shrink-0" />} accent="orange" />
                <StatCard label="Delivered"       value={orders.filter(o => o.status === 'delivered').length} icon={<CheckCircle2 className="w-5 h-5 shrink-0" />} accent="blue" />
            </div>

            <Card>
                <SectionTitle>Quick Actions</SectionTitle>
                <div className="flex flex-wrap gap-3">
                    <a href="/products"    className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97] text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm"><ShoppingBag className="w-5 h-5 shrink-0" /> Browse Products</a>
                    <a href="/print-order" className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50/80 text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"><Printer className="w-5 h-5 shrink-0" /> New Print Order</a>
                </div>
            </Card>

            <Card>
                <div className="flex items-center justify-between pl-1 mb-5">
                    <SectionTitle>My Orders</SectionTitle>
                    {orders.length > 0 && (
                        <button onClick={handleClearHistory}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors uppercase tracking-widest bg-gray-50/80 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg shrink-0"
                            title="Clear completed/cancelled orders from view">
                            🗑️ Clear History
                        </button>
                    )}
                </div>
                {orders.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3 opacity-40"><PackageSearch className="w-10 h-10 shrink-0" /></div>
                        <p className="text-gray-500 font-medium text-sm">No orders yet</p>
                        <a href="/products" className="text-sm font-semibold text-indigo-600 hover:underline mt-2 inline-block">Browse Products →</a>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <div key={order._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50/80/50 hover:bg-gray-50/80 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-mono text-gray-500">#{order._id.slice(-6).toUpperCase()}</p>
                                    <p className="font-bold text-gray-900 text-sm">₹{order.totalAmount}</p>
                                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <StatusBadge status={
                                        order.status === 'accepted' ? 'processing' :
                                        order.status === 'out_for_delivery' ? 'confirmed' :
                                        order.status
                                    } />
                                    {(order.status === 'pending' || order.status === 'accepted') && (
                                        <button onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                            disabled={isUpdating}
                                            className="text-xs font-semibold text-red-500 hover:text-red-700 underline transition-colors disabled:opacity-50">
                                            Cancel
                                        </button>
                                    )}
                                    {order.status === 'rejected' && (
                                        <div className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                                            ❌ Rejected by vendor
                                        </div>
                                    )}
                                </div>
                                {order.status === 'out_for_delivery' && (
                                    <div className="w-full sm:w-auto p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
                                        <p className="text-xs text-indigo-700 font-bold mb-1">Share OTP with Agent</p>
                                        <p className="text-2xl font-mono font-black tracking-[0.3em] text-blue-900">
                                            {order.deliveryOtp || '----'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* ── My Deliveries (user acting as agent) ── */}
            {deliveries && deliveries.length > 0 && (
                <Card>
                    <SectionTitle>My Deliveries</SectionTitle>
                    <div className="space-y-3">
                        {deliveries.map(order => (
                            <div key={order._id} className="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50/80 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono text-gray-500">#{order._id.slice(-6).toUpperCase()}</p>
                                        <p className="font-bold text-gray-900 text-sm">₹{order.totalAmount}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        {order.deliveryLocation && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{order.deliveryLocation}</p>
                                        )}
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>
                                {order.status === 'accepted' && (
                                    <div className="flex gap-2 border-t border-gray-200 pt-3">
                                        <button onClick={() => handleAcceptDelivery(order)}
                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg transition-colors w-full flex items-center justify-center gap-2">
                                            Accept Delivery <Truck className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {order.status === 'out_for_delivery' && (
                                    <div className="flex gap-2 border-t border-gray-200 pt-3">
                                        <input type="text" placeholder="Enter OTP from customer"
                                            value={otpInputs[order._id] || ''}
                                            onChange={e => setOtpInputs(prev => ({ ...prev, [order._id]: e.target.value }))}
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-indigo-600"
                                        />
                                        <button onClick={() => {
                                            const otp = otpInputs[order._id]?.trim();
                                            if (!otp || otp.length !== 4) {
                                                alert('Please enter the 4-digit OTP from the customer.');
                                                return;
                                            }
                                            handleStatusUpdate(order._id, 'delivered', otp);
                                        }}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors shrink-0">
                                            Mark Delivered ✓
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Payment Modal */}
            {paymentOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white text-center shadow-inner">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                                <span className="text-3xl">💳</span>
                            </div>
                            <h3 className="text-xl font-black">Payment Required</h3>
                            <p className="text-blue-50 text-sm mt-1 opacity-90">Confirm payment to accept this delivery.</p>
                        </div>
                        <div className="p-6 space-y-4 bg-gray-50">
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Bill</p>
                                <p className="text-4xl font-black text-gray-900 tracking-tight">₹{paymentOrder.totalAmount}</p>
                            </div>
                            <p className="text-xs text-gray-500 text-center leading-relaxed">
                                By pressing <span className="font-bold">Pay Money</span>, this amount will be immediately deducted from the customer's wallet and the order will be marked as <span className="font-semibold text-indigo-600">Out for Delivery</span>.
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex gap-3 bg-gray-50">
                            <button onClick={() => setPaymentOrder(null)} className="flex-1 py-3.5 text-gray-500 font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                            <button onClick={confirmPaymentAndAccept} className="flex-1 py-3.5 text-white font-bold bg-green-500 hover:bg-green-600 shadow-md shadow-green-200 rounded-lg transition-all active:scale-[0.98]">
                                Pay Money 💸
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── VENDOR SECTION ───────────────────────────────────────────────────────
function VendorSection({ 
    orders, handleStatusUpdate, isUpdating, products, handleDeleteProduct,
    locations, fetchLocations
}) {
    const [newLocation, setNewLocation] = useState('');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Orders"  value={orders.length} icon={<Package className="w-5 h-5 shrink-0" />} accent="orange" />
                <StatCard label="Pending"        value={orders.filter(o => o.status === 'pending').length} icon={<Hourglass className="w-5 h-5 shrink-0" />} accent="blue" />
                <StatCard label="Delivered"      value={orders.filter(o => o.status === 'delivered').length} icon={<CheckCircle2 className="w-5 h-5 shrink-0" />} accent="green" />
            </div>

            <Card>
                <div className="flex items-center justify-between mb-5">
                    <SectionTitle>Manage Products</SectionTitle>
                    <Link to="/add-product" className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97] text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">
                        + Add Product
                    </Link>
                </div>
                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                        {products.map(product => (
                            <div key={product._id} className="flex gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50/80/50 hover:bg-gray-50/80 transition-colors">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-50/80 border border-gray-200" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-50/80 border border-gray-200 flex items-center justify-center text-xl shrink-0"><ShoppingBag className="w-5 h-5 shrink-0" /></div>
                                )}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{product.name}</h3>
                                        <p className="text-gray-500 text-xs mt-0.5 font-bold">₹{product.price}</p>
                                    </div>
                                    <div className="flex gap-3 mt-2">
                                        <Link to="/add-product" state={{ product }} className="text-xs font-semibold text-indigo-600 hover:text-blue-800 transition-colors">Edit</Link>
                                        <button onClick={() => handleDeleteProduct(product._id)} className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No products listed. Add your first product!</p>
                    </div>
                )}
            </Card>

            <Card>
                <SectionTitle>Manage Delivery Locations</SectionTitle>
                <div className="flex gap-2 mb-5">
                    <input type="text" placeholder="New location (e.g. Hostel A)"
                        value={newLocation} onChange={e => setNewLocation(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                    />
                    <button onClick={async () => {
                        if (!newLocation.trim()) return;
                        try { await addLocation(newLocation.trim()); setNewLocation(''); fetchLocations(); }
                        catch (e) { alert(e.message); }
                    }} className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97] text-sm font-bold rounded-lg transition-all shadow-sm">
                        + Add
                    </button>
                </div>
                {locations?.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No locations added yet</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-2">
                        {locations?.map(loc => (
                            <div key={loc._id} className="flex items-center justify-between bg-gray-50/80 border border-gray-200 rounded-lg px-4 py-3 group">
                                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <span className="text-gray-500"><MapPin className="w-5 h-5 shrink-0" /></span>{loc.name}
                                </span>
                                <button onClick={async () => {
                                    if (window.confirm('Delete this location?')) {
                                        try { await deleteLocation(loc._id); fetchLocations(); }
                                        catch (e) { alert(e.message); }
                                    }
                                }} className="text-red-400 hover:text-red-600 font-bold text-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50">
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
            <Card>
                <SectionTitle>Incoming Orders</SectionTitle>
                {orders.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3 opacity-40"><PackageSearch className="w-10 h-10 shrink-0" /></div>
                        <p className="text-gray-500 text-sm font-medium">No orders yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/80/40 hover:bg-gray-50/80 transition-colors">
                                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                                    <div>
                                        <p className="text-xs font-mono text-gray-500">#{order._id.slice(-6).toUpperCase()}</p>
                                        <p className="font-semibold text-sm text-gray-900">Customer: {order.customer?.name || 'Unknown'}</p>
                                        <p className="font-black text-gray-900 mt-0.5">₹{order.totalAmount}</p>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>

                                {order.instructions && (
                                    <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-gray-900">
                                        <span className="font-bold text-amber-700">Note:</span> {order.instructions}
                                    </div>
                                )}

                                {/* Order items */}
                                <div className="mb-3 pl-3 border-l-2 border-gray-200 space-y-1.5">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="text-xs text-gray-900">
                                            <p className="font-semibold">{item.name}</p>
                                            {item.printOptions && (
                                                <p className="text-gray-500">
                                                    {item.printOptions.color === 'color' ? 'Color' : 'B&W'} | {item.printOptions.pages} pages | {item.printOptions.copies} copies
                                                </p>
                                            )}
                                            {item.fileUrl && (
                                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:underline font-semibold block mt-0.5">
                                                    View PDF ↗
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 flex-wrap border-t border-gray-200 pt-3">
                                    {order.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(order._id, 'accepted')}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                                                ✓ Accept
                                            </button>
                                            <button onClick={() => handleStatusUpdate(order._id, 'rejected')}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                                                ✕ Reject
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'accepted' && (
                                        <p className="text-xs text-gray-500 italic py-2">Waiting for delivery agent…</p>
                                    )}
                                    {order.status === 'rejected' && (
                                        <p className="text-xs text-red-500 font-semibold py-2">❌ Order rejected</p>
                                    )}
                                    {order.status === 'out_for_delivery' && (
                                        <p className="text-xs text-indigo-600 font-semibold py-2"><Truck className="w-5 h-5 shrink-0" /> Out for delivery</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

// ─── ADMIN SECTION ────────────────────────────────────────────────────────
function AdminSection({
    orders, locations, walletSearch, setWalletSearch,
    walletUsers, selectedUser, setSelectedUser, fundAmount, setFundAmount,
    systemEarnings, commissionRates, setCommissionRates,
    handleUserSearch, handleAddFunds, handleUpdateCommission,
    fetchLocations, fetchAdminWalletData, // Added fetchAdminWalletData to refresh after reset
}) {
    const [activeTab, setActiveTab] = useState('orders');
    const [pendingUsers, setPendingUsers] = useState([]);
    const [analyticsData, setAnalyticsData] = useState([]);
    const [analyticsType, setAnalyticsType] = useState('weekly');
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    // Users tab state
    const [allUsers, setAllUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    // Reports tab state
    const [report, setReport] = useState(null);
    const [reportPeriod, setReportPeriod] = useState('allTime');
    const [loadingReport, setLoadingReport] = useState(false);

    const fetchPendingUsers = async () => {
        try {
            const { data } = await getPendingUsers();
            setPendingUsers(data);
        } catch (e) {
            console.error('Failed to fetch pending users');
        }
    };

    const fetchAnalytics = async (type) => {
        setLoadingAnalytics(true);
        try {
            const { data } = await getAdminAnalytics(type);
            setAnalyticsData(data);
        } catch (e) {
            console.error('Failed to fetch analytics', e);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const fetchAllUsers = async (search = '') => {
        setLoadingUsers(true);
        try {
            const { data } = await getAllUsers(search);
            setAllUsers(data);
        } catch (e) { console.error('Failed to fetch users', e); }
        finally { setLoadingUsers(false); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this user? If they are a vendor, their products will also be removed.')) return;
        try {
            await deleteUser(id);
            setAllUsers(prev => prev.filter(u => u._id !== id));
        } catch (e) {
            alert('Failed to delete user: ' + (e.response?.data?.message || e.message));
        }
    };

    const fetchReport = async () => {
        setLoadingReport(true);
        try {
            const { data } = await getAdminReport();
            setReport(data);
        } catch (e) { console.error('Failed to fetch report', e); }
        finally { setLoadingReport(false); }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'earnings') {
            fetchAnalytics(analyticsType);
        }
        if (activeTab === 'users') {
            fetchAllUsers();
        }
        if (activeTab === 'reports') {
            fetchReport();
        }
    }, [activeTab, analyticsType]);

    const handleApprove = async (id) => {
        try {
            await approveUser(id);
            alert('User approved!');
            fetchPendingUsers();
        } catch (e) {
            alert('Error approving user');
        }
    };

    const handleReject = async (id) => {
        if (window.confirm("Are you sure you want to reject and delete this registration?")) {
            try {
                await rejectUser(id);
                alert('User rejected!');
                fetchPendingUsers();
            } catch (e) {
                alert('Error rejecting user');
            }
        }
    };

    const handleReset = async () => {
        if (window.confirm("CRITICAL WARNING: This will permanently DELETE all orders, transactions, products, and vendors. All user wallets will be reset to 0. This cannot be undone. Are you absolutely sure?")) {
            const confirmText = prompt("Type 'RESET' to confirm system-wide data deletion:");
            if (confirmText === 'RESET') {
                try {
                    await resetSystem();
                    alert('System reset successfully.');
                    window.location.reload(); // Refresh to clear state
                } catch (e) {
                    alert('Reset failed: ' + e.message);
                }
            }
        }
    };

    const tabs = [
        { id: 'orders',    label: 'Orders',      icon: <Package className="w-5 h-5 shrink-0" /> },
        { id: 'wallet',    label: 'Wallet',      icon: <Wallet className="w-5 h-5 shrink-0" /> },
        { id: 'locations', label: 'Locations',   icon: <MapPin className="w-5 h-5 shrink-0" /> },
        { id: 'earnings',  label: 'Analytics',   icon: <TrendingUp className="w-5 h-5 shrink-0" /> },
        { id: 'users',     label: 'Users',       icon: <Users className="w-5 h-5 shrink-0" /> },
        { id: 'reports',   label: 'Reports',     icon: <FileBarChart className="w-5 h-5 shrink-0" /> },
        { id: 'approvals', label: 'Approvals',   icon: <ShieldCheck className="w-5 h-5 shrink-0" />, badge: pendingUsers.length },
        { id: 'settings',  label: 'Settings',    icon: <Settings className="w-5 h-5 shrink-0" /> },
    ];
    const [newLocation, setNewLocation] = useState('');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Orders"  value={orders.length} icon={<Package className="w-5 h-5 shrink-0" />} accent="orange" />
                <StatCard label="Delivered"      value={orders.filter(o => o.status === 'delivered').length} icon={<CheckCircle2 className="w-5 h-5 shrink-0" />} accent="green" />
                <StatCard label="Net Revenue"        value={systemEarnings ? `₹${systemEarnings.totalCompanyEarnings?.toFixed(0)}` : '—'} icon={<BarChart2 className="w-5 h-5 shrink-0" />} accent="blue" />
                <StatCard label="Total Sales"      value={systemEarnings ? `₹${systemEarnings.totalSales?.toFixed(0)}` : '—'} icon={<Wallet className="w-5 h-5 shrink-0" />} accent="purple" />
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-gray-50/80 p-1 rounded-lg">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 relative',
                            activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        )}>
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.badge > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Orders tab ── */}
            {activeTab === 'orders' && (
                <Card className="overflow-hidden p-0">
                    <div className="p-5 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900">All Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/80">
                                    {['Order ID','Customer','Items','Location','Status','Amount'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{order._id.slice(-6).toUpperCase()}</td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-gray-900 font-medium">{order.customer?.name || 'User'}</p>
                                            <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{order.customer?.email}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500 max-w-xs">
                                            <div className="flex flex-wrap gap-1">
                                                {order.items?.map((it, i) => (
                                                    <span key={i} className="bg-gray-50/80 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200">
                                                        {it.qty}x {it.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500 text-xs">{order.deliveryLocation || '—'}</td>
                                        <td className="px-4 py-3.5"><StatusBadge status={order.status} /></td>
                                        <td className="px-4 py-3.5 font-bold text-gray-900">₹{order.totalAmount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orders.length === 0 && (
                            <p className="text-center py-10 text-gray-500 text-sm">No orders found</p>
                        )}
                    </div>
                </Card>
            )}

            {/* ── Tracking / Analytics Tab ── */}
            {activeTab === 'earnings' && (() => {
                // X-axis label formatter per period
                const fmtTick = (val) => {
                    if (analyticsType === 'daily')   return val + 'h';     // "08" → "08h"
                    if (analyticsType === 'weekly') {
                        const d = new Date(val);
                        return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }); // "Mon, Apr 7"
                    }
                    if (analyticsType === 'monthly') return val;           // "Week 1"
                    if (analyticsType === 'yearly') {
                        const [y, m] = val.split('-');
                        return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }); // "Apr '25"
                    }
                    return val;
                };
                const useBar = analyticsType === 'daily' || analyticsType === 'monthly';
                return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900">Revenue Growth</h3>
                                <div className="flex bg-gray-50/80 p-1 rounded-lg border border-gray-200">
                                    {['daily', 'weekly', 'monthly', 'yearly'].map(t => (
                                        <button key={t} onClick={() => setAnalyticsType(t)}
                                            className={cn('px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all',
                                                analyticsType === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900')}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[300px] w-full mt-4">
                                {loadingAnalytics ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : analyticsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {useBar ? (
                                            <BarChart data={analyticsData} barCategoryGap="30%">
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="_id" tickFormatter={fmtTick} axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} interval={0} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                                <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} labelFormatter={fmtTick}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} />
                                                <Bar dataKey="revenue" radius={[6,6,0,0]}>
                                                    {analyticsData.map((_, i) => (
                                                        <Cell key={i} fill={`hsl(${237 - i * 8}, 75%, ${58 + i * 2}%)`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        ) : (
                                            <LineChart data={analyticsData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="_id" tickFormatter={fmtTick} axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} interval={0} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                                <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} labelFormatter={fmtTick}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} />
                                                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 text-sm font-medium">
                                        No data available for this period
                                    </div>
                                )}
                            </div>
                        </Card>
                        
                        <div className="space-y-4">
                            <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-indigo-500/20">
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Total Commission (Profit)</p>
                                <p className="text-4xl font-black mt-2">₹{systemEarnings?.totalCompanyEarnings?.toFixed(2) || '0'}</p>
                            </Card>
                            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-blue-100">
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Delivery Payouts</p>
                                <p className="text-4xl font-black mt-2">₹{systemEarnings?.totalDeliveryEarnings?.toFixed(2) || '0'}</p>
                            </Card>
                            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-green-100">
                                <p className="text-green-100 text-xs font-bold uppercase tracking-widest">Vendor Earnings</p>
                                <p className="text-4xl font-black mt-2">₹{systemEarnings?.totalVendorEarnings?.toFixed(2) || '0'}</p>
                            </Card>
                        </div>
                    </div>

                    <Card>
                        <h3 className="font-bold text-gray-900 mb-4">Commission Rates</h3>
                        <div className="flex flex-wrap gap-5 items-end">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Company %</label>
                                <input type="number" min="0" max="100" value={commissionRates.companyRate}
                                    onChange={(e) => {
                                        let val = Number(e.target.value);
                                        if (val > 100) val = 100;
                                        setCommissionRates({ ...commissionRates, companyRate: val });
                                    }}
                                    className="w-24 px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Delivery %</label>
                                <input type="number" min="0" max="100" value={commissionRates.deliveryRate}
                                    onChange={(e) => {
                                        let val = Number(e.target.value);
                                        if (val > 100) val = 100;
                                        setCommissionRates({ ...commissionRates, deliveryRate: val });
                                    }}
                                    className="w-24 px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                                />
                            </div>
                            <button onClick={handleUpdateCommission}
                            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-700 active:scale-[0.97] text-white text-sm font-bold rounded-lg transition-all">
                                Save Rates
                            </button>
                        </div>
                    </Card>
                </div>
                );
            })()}

            {/* ── Wallet tab ── */}
            {activeTab === 'wallet' && (
                <Card>
                    <h3 className="font-bold text-gray-900 mb-5">Add Funds to User Wallet</h3>
                    <form onSubmit={handleUserSearch} className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            <input type="text" placeholder="Search by name or email"
                                value={walletSearch} onChange={(e) => setWalletSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2.5 bg-accent hover:bg-accent text-white text-sm font-semibold rounded-lg transition-colors">
                            Search
                        </button>
                    </form>

                    {walletUsers.length > 0 && (
                        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                            {walletUsers.map(u => (
                                <div key={u._id} onClick={() => setSelectedUser(u)}
                                    className={cn('flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-200 last:border-0 transition-colors text-sm',
                                        selectedUser?._id === u._id ? 'bg-indigo-600/10 border-l-2 border-indigo-600' : 'hover:bg-gray-50/80')}>
                                    <div>
                                        <p className="font-semibold text-gray-900">{u.name}</p>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">₹{u.walletBalance}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedUser && (
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <p className="text-sm font-semibold text-blue-800 mb-3">Adding funds to: {selectedUser.name}</p>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Amount (₹)" value={fundAmount}
                                    onChange={(e) => {
                                        let val = Number(e.target.value);
                                        if (val > 10000000) val = 10000000;
                                        setFundAmount(val);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-400"
                                />
                                <button onClick={handleAddFunds}
                                    className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors">
                                    Add Funds
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* ── Locations tab ── */}
            {activeTab === 'locations' && (
                <Card>
                    <h3 className="font-bold text-gray-900 mb-5">Manage Delivery Locations</h3>
                    <div className="flex gap-2 mb-5">
                        <input type="text" placeholder="New location (e.g. Hostel A)"
                            value={newLocation} onChange={e => setNewLocation(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                        />
                        <button onClick={async () => {
                            if (!newLocation.trim()) return;
                            try { await addLocation(newLocation.trim()); setNewLocation(''); fetchLocations(); }
                            catch (e) { alert(e.message); }
                        }} className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97] text-sm font-bold rounded-lg transition-all shadow-sm">
                            + Add
                        </button>
                    </div>
                    {locations.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No locations added yet</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {locations.map(loc => (
                                <div key={loc._id} className="flex items-center justify-between bg-gray-50/80 border border-gray-200 rounded-lg px-4 py-3 group">
                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                        <span className="text-gray-500"><MapPin className="w-5 h-5 shrink-0" /></span>{loc.name}
                                    </span>
                                    <button onClick={async () => {
                                        if (window.confirm('Delete this location?')) {
                                            try { await deleteLocation(loc._id); fetchLocations(); }
                                            catch (e) { alert(e.message); }
                                        }
                                    }} className="text-red-400 hover:text-red-600 font-bold text-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50">
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ── Approvals tab ── */}
            {activeTab === 'approvals' && (
                <Card>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-900">Pending Registrations</h3>
                        {pendingUsers.length > 0 && (
                            <span className="bg-red-100 text-red-700 text-xs font-black px-2.5 py-1 rounded-full">
                                {pendingUsers.length} pending
                            </span>
                        )}
                    </div>
                    {pendingUsers.length === 0 ? (
                        <p className="text-center py-10 text-gray-500 text-sm">No pending registrations</p>
                    ) : (
                        <div className="space-y-3">
                            {pendingUsers.map(u => (
                                <div key={u._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50/80">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900">{u.name}</p>
                                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide', 
                                                u.role === 'vendor' ? 'bg-indigo-600 text-white text-indigo-600' : 'bg-indigo-100 text-indigo-700'
                                            )}>{u.role}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">{u.email}</p>
                                        <p className="text-xs text-gray-500 mt-1">Requested: {new Date(u.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => handleApprove(u._id)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors">
                                            ✓ Approve
                                        </button>
                                        <button onClick={() => handleReject(u._id)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors">
                                            ✕ Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ── Users Tab ── */}
            {activeTab === 'users' && (
                <Card>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-gray-900">All Users</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-semibold">{allUsers.length} users</span>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); fetchAllUsers(userSearch); }} className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input type="text" placeholder="Search by name or email"
                                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">Search</button>
                        {userSearch && <button type="button" onClick={() => { setUserSearch(''); fetchAllUsers(''); }} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-lg transition-colors">Clear</button>}
                    </form>
                    {loadingUsers ? (
                        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                    ) : allUsers.length === 0 ? (
                        <p className="text-center py-10 text-gray-500 text-sm">No users found</p>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                            {allUsers.map(u => (
                                <div key={u._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                                            {u.name?.slice(0,1).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                                                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                                                    u.role === 'vendor'  ? 'bg-purple-100 text-purple-700' :
                                                    u.role === 'agent'   ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                )}>{u.role}</span>
                                                {!u.isApproved && u.role !== 'user' && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700">Pending</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteUser(u._id)}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-semibold rounded-lg transition-colors border border-red-200">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ── Reports Tab ── */}
            {activeTab === 'reports' && (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                            {[['allTime', 'All Time'], ['monthly', 'Last 30 Days'], ['weekly', 'Last 7 Days']].map(([key, label]) => (
                                <button key={key} onClick={() => setReportPeriod(key)}
                                    className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all',
                                        reportPeriod === key ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    )}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        {report && (
                            <div className="flex gap-2">
                                <button onClick={async () => {
                                    const XLSX = await import('xlsx');
                                    const periodLabel = reportPeriod === 'allTime' ? 'All Time' : reportPeriod === 'monthly' ? 'Last 30 Days' : 'Last 7 Days';
                                    const rows = [['Metric', periodLabel]];
                                    rows.push(['Orders Delivered', report[reportPeriod]?.totalOrders ?? 0]);
                                    rows.push(['Total Sales (₹)', (report[reportPeriod]?.totalSales ?? 0).toFixed(2)]);
                                    rows.push(['Net Revenue (₹)',  (report[reportPeriod]?.netRevenue ?? 0).toFixed(2)]);
                                    rows.push(['Total Commission (₹)', (report[reportPeriod]?.totalCommission ?? 0).toFixed(2)]);
                                    const ws = XLSX.utils.aoa_to_sheet(rows);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, 'CampusKart Report');
                                    XLSX.writeFile(wb, `CampusKart_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
                                }} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm">
                                    📊 Excel
                                </button>
                                <button onClick={async () => {
                                    const { default: jsPDF } = await import('jspdf');
                                    const { default: autoTable } = await import('jspdf-autotable');
                                    const doc = new jsPDF();
                                    doc.setFontSize(18); doc.setTextColor(79, 70, 229);
                                    doc.text('CampusKart Analytics Report', 14, 22);
                                    doc.setFontSize(10); doc.setTextColor(100, 100, 100);
                                    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
                                    const periodLabel = reportPeriod === 'allTime' ? 'All Time' : reportPeriod === 'monthly' ? 'Last 30 Days' : 'Last 7 Days';
                                    autoTable(doc, {
                                        startY: 38,
                                        head: [['Metric', periodLabel]],
                                        body: [
                                            ['Orders Delivered', report[reportPeriod]?.totalOrders ?? 0],
                                            ['Total Sales (₹)',  `₹${(report[reportPeriod]?.totalSales ?? 0).toFixed(2)}`],
                                            ['Net Revenue (₹)',  `₹${(report[reportPeriod]?.netRevenue ?? 0).toFixed(2)}`],
                                            ['Total Commission (₹)', `₹${(report[reportPeriod]?.totalCommission ?? 0).toFixed(2)}`],
                                        ],
                                        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
                                        styles: { fontSize: 11, cellPadding: 6 },
                                        alternateRowStyles: { fillColor: [245, 245, 255] },
                                    });
                                    doc.save(`CampusKart_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                                }} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm">
                                    📄 PDF
                                </button>
                            </div>
                        )}
                    </div>
                    {loadingReport ? (
                        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                    ) : report ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Orders Delivered', value: report[reportPeriod]?.totalOrders ?? 0,                               accent: 'orange', icon: <Package className="w-5 h-5" /> },
                                { label: 'Total Sales',      value: `₹${(report[reportPeriod]?.totalSales ?? 0).toFixed(0)}`,      accent: 'purple', icon: <Wallet className="w-5 h-5" /> },
                                { label: 'Net Revenue',      value: `₹${(report[reportPeriod]?.netRevenue ?? 0).toFixed(0)}`,      accent: 'blue',   icon: <BarChart2 className="w-5 h-5" /> },
                                { label: 'Total Commission', value: `₹${(report[reportPeriod]?.totalCommission ?? 0).toFixed(0)}`, accent: 'green',  icon: <TrendingUp className="w-5 h-5" /> },
                            ].map(s => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent} />)}
                        </div>
                    ) : (
                        <p className="text-center py-10 text-gray-500 text-sm">No report data available</p>
                    )}
                </div>
            )}

            {/* ── Settings Tab ── */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <Card className="border-red-100 bg-red-50/20">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl"><AlertCircle className="w-5 h-5 shrink-0" /></span>
                            <div>
                                <h3 className="font-bold text-red-700">Danger Zone</h3>
                                <p className="text-xs text-red-600/70 font-medium">Sensitive system-wide actions</p>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-white border border-red-100 rounded-xl shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="font-bold text-gray-900">Reset System from Scratch</p>
                                    <p className="text-xs text-gray-500 mt-1">Wipe all orders, products, vendors, and transactions. Start from 0.</p>
                                </div>
                                <button onClick={handleReset}
                                    className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-red-100 active:scale-95">
                                    Destroy & Restart
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

// ─── AGENT SECTION ────────────────────────────────────────────────────────
function AgentSection({ deliveries, handleStatusUpdate, isUpdating }) {
    const [otpInputs, setOtpInputs] = useState({});
    const [paymentOrder, setPaymentOrder] = useState(null);

    const handleAcceptDelivery = (order) => {
        setPaymentOrder(order);
    };

    const confirmPaymentAndAccept = () => {
        if (!paymentOrder) return;
        handleStatusUpdate(paymentOrder._id, 'out_for_delivery');
        setPaymentOrder(null);
    };

    const agentEarnings = deliveries.filter(d => d.status === 'delivered').reduce((sum, d) => sum + (d.commission?.delivery || 0), 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard label="Earnings"  value={`₹${agentEarnings.toFixed(2)}`} icon={<Wallet className="w-5 h-5 shrink-0" />} accent="green" />
                <StatCard label="Assigned"  value={deliveries.length} icon={<Truck className="w-5 h-5 shrink-0" />} accent="orange" />
                <StatCard label="Active"    value={deliveries.filter(d => d.status === 'out_for_delivery').length} icon={<MapPin className="w-5 h-5 shrink-0" />} accent="blue" />
                <StatCard label="Delivered" value={deliveries.filter(d => d.status === 'delivered').length} icon={<CheckCircle2 className="w-5 h-5 shrink-0" />} accent="green" />
            </div>
            <Card>
                <SectionTitle>My Deliveries</SectionTitle>
                {deliveries.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3 opacity-40"><Truck className="w-5 h-5 shrink-0" /></div>
                        <p className="text-gray-500 text-sm font-medium">No deliveries assigned</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deliveries.map(order => (
                            <div key={order._id} className="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50/80/50 hover:bg-gray-50/80 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono text-gray-500">#{order._id.slice(-6).toUpperCase()}</p>
                                        <p className="font-bold text-gray-900 text-sm">₹{order.totalAmount}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>
                                {order.status === 'accepted' && (
                                    <div className="flex gap-2 border-t border-gray-200 pt-3">
                                        <button onClick={() => handleAcceptDelivery(order)}
                                            disabled={isUpdating}
                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors w-full">
                                            {isUpdating ? 'Processing...' : 'Accept Delivery'} <Truck className="w-5 h-5 shrink-0" />
                                        </button>
                                    </div>
                                )}
                                {order.status === 'out_for_delivery' && (
                                    <div className="flex gap-2 border-t border-gray-200 pt-3">
                                        <input type="text" placeholder="Enter OTP from customer"
                                            value={otpInputs[order._id] || ''}
                                            onChange={e => setOtpInputs(prev => ({ ...prev, [order._id]: e.target.value }))}
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-indigo-600"
                                        />
                                        <button onClick={() => {
                                            const otp = otpInputs[order._id]?.trim();
                                            if (!otp || otp.length !== 4) {
                                                alert('Please enter the 4-digit OTP from the customer.');
                                                return;
                                            }
                                            handleStatusUpdate(order._id, 'delivered', otp);
                                        }}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors shrink-0">
                                            Mark Delivered ✓
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Payment Modal */}
            {paymentOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white text-center shadow-inner">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                                <span className="text-3xl">💳</span>
                            </div>
                            <h3 className="text-xl font-black">Payment Required</h3>
                            <p className="text-blue-50 text-sm mt-1 opacity-90">Confirm payment to accept this delivery.</p>
                        </div>
                        
                        <div className="p-6 space-y-4 bg-gray-50/80/50">
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Bill</p>
                                <p className="text-4xl font-black text-gray-900 tracking-tight">₹{paymentOrder.totalAmount}</p>
                            </div>
                            
                            <p className="text-xs text-gray-500 text-center leading-relaxed">
                                By pressing <span className="font-bold">Pay Money</span>, this amount will be immediately deducted from the customer's wallet and the order will be marked as <span className="font-semibold text-indigo-600">Out for Delivery</span>.
                            </p>
                        </div>

                        <div className="p-6 pt-0 flex gap-3 bg-gray-50/80/50">
                            <button onClick={() => setPaymentOrder(null)} className="flex-1 py-3.5 text-gray-500 font-bold bg-white border border-gray-200 rounded-lg hover:bg-accent hover:text-accent-foreground hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                            <button onClick={confirmPaymentAndAccept} className="flex-1 py-3.5 text-white font-bold bg-green-500 hover:bg-green-600 shadow-md shadow-green-200 rounded-lg transition-all active:scale-[0.98]">
                                Pay Money 💸
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
    // ← ALL identical to original
    const { user }   = useContext(AuthContext);
    const [orders,     setOrders]     = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [vendorProducts, setVendorProducts] = useState([]);
    const [locations,  setLocations]  = useState([]);
    const [error,      setError]      = useState(null);

    const [walletSearch,    setWalletSearch]    = useState('');
    const [walletUsers,     setWalletUsers]     = useState([]);
    const [selectedUser,    setSelectedUser]    = useState(null);
    const [fundAmount,      setFundAmount]      = useState('');
    const [systemEarnings,  setSystemEarnings]  = useState(null);
    const [commissionRates, setCommissionRates] = useState({ companyRate: 5, deliveryRate: 5 });
    const [userWalletBalance, setUserWalletBalance] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchLocations = async () => {
        try { const { data } = await getLocations(); setLocations(data); }
        catch (e) { console.error(e); }
    };

    const fetchAdminWalletData = async () => {
        try {
            const [earningsRes, commRes] = await Promise.all([
                getSystemEarnings(),
                getCommissionRates()
            ]);
            setSystemEarnings(earningsRes.data);
            setCommissionRates(commRes.data);
        } catch (e) { console.error('Failed to fetch admin wallet data', e); }
    };

    const fetchOrders = async () => {
        if (user) {
            try {
                let orderData = []; let deliveryData = [];
                if (user.role === 'vendor') {
                    const [ordersRes, locationsRes, productsRes] = await Promise.all([
                        getVendorOrders(),
                        getLocations(),
                        getVendorProducts().catch(() => ({ data: [] }))
                    ]);
                    orderData = ordersRes.data;
                    setLocations(locationsRes.data);
                    setVendorProducts(productsRes.data);
                } else if (user.role === 'user') {
                    const [ordersRes, walletRes, deliveriesRes] = await Promise.all([
                        getMyOrders(),
                        getMyWallet().catch(() => ({ data: { balance: 0 } })),
                        getMyDeliveries().catch(() => ({ data: [] }))
                    ]);
                    orderData = ordersRes.data;
                    setUserWalletBalance(walletRes.data.balance);
                    deliveryData = deliveriesRes.data;
                } else if (user.role === 'admin') {
                    const [ordersRes, locationsRes, earningsRes, commRes] = await Promise.all([
                        getAllOrders(),
                        getLocations(),
                        getSystemEarnings(),
                        getCommissionRates()
                    ]);
                    orderData = ordersRes.data;
                    setLocations(locationsRes.data);
                    setSystemEarnings(earningsRes.data);
                    setCommissionRates(commRes.data);
                } else if (user.role === 'agent') {
                    const r = await getMyDeliveries(); deliveryData = r.data;
                }
                setOrders(orderData); setDeliveries(deliveryData);
            } catch (error) {
                setError('Failed to load data. ' + (error.response?.data?.message || 'Server error.'));
            }
        }
    };

    const handleUserSearch = async (e) => {
        e.preventDefault();
        try { const { data } = await searchUsers(walletSearch); setWalletUsers(data); }
        catch (e) { alert(e.message); }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
                setVendorProducts(vendorProducts.filter(p => p._id !== id));
            } catch (e) { alert('Failed to delete product'); }
        }
    };

    const handleAddFunds = async () => {
        if (!selectedUser || !fundAmount) return;
        try {
            await addFunds(selectedUser._id, fundAmount);
            alert('Funds added successfully');
            setFundAmount('');
            setSelectedUser(null);
            // Re-fetch the user list so the admin sees the updated balance
            if (walletSearch) {
                const { data } = await searchUsers(walletSearch);
                setWalletUsers(data);
            }
            fetchAdminWalletData();
        } catch (e) { alert(e.response?.data?.message || e.message); }
    };

    const handleUpdateCommission = async () => {
        try { await updateCommissionRates(commissionRates); alert('Commission rates updated'); }
        catch (e) { alert(e.message); }
    };

    const handleStatusUpdate = async (orderId, newStatus, otp = null) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try { await updateOrderStatus(orderId, newStatus, otp); fetchOrders(); }
        catch (error) { alert('Failed to update status: ' + (error.response?.data?.message || error.message)); }
        finally { setIsUpdating(false); }
    };

    const handleClearHistory = async () => {
        if (window.confirm('Are you sure you want to clear your completed and cancelled orders from view?')) {
            try {
                await clearMyOrders();
                fetchOrders();
            } catch (error) {
                alert('Failed to clear order history: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    useEffect(() => { fetchOrders(); }, [user]);

    // Listen for live updates via socket
    useEffect(() => {
        if (!user) return;
        
        const handleRefresh = () => {
            console.log('[Socket] Refreshing dashboard orders...');
            fetchOrders();
        };

        socket.on('new_vendor_order', handleRefresh);
        socket.on('order_updated', handleRefresh);

        return () => {
            socket.off('new_vendor_order', handleRefresh);
            socket.off('order_updated', handleRefresh);
        };
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const ROLE_LABEL = { user: 'Student', vendor: 'Vendor', admin: 'Administrator', agent: 'Delivery Agent' };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shrink-0">
                            {user.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">{ROLE_LABEL[user.role] ?? 'User'}</p>
                            <h1 className="text-xl sm:text-2xl font-black">Welcome back, {user.name?.split(' ')[0]}!</h1>
                            <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 fill-current" />
                        <span>{error}</span>
                    </div>
                )}

                {user.role === 'user'   && <UserSection   orders={orders} deliveries={deliveries} userWalletBalance={userWalletBalance} handleStatusUpdate={handleStatusUpdate} isUpdating={isUpdating} handleClearHistory={handleClearHistory} />}
                {user.role === 'vendor' && <VendorSection orders={orders} handleStatusUpdate={handleStatusUpdate} isUpdating={isUpdating} products={vendorProducts} handleDeleteProduct={handleDeleteProduct} locations={locations} fetchLocations={fetchLocations} />}
                {user.role === 'admin'  && (
                    <AdminSection
                        orders={orders} locations={locations}
                        walletSearch={walletSearch} setWalletSearch={setWalletSearch}
                        walletUsers={walletUsers} selectedUser={selectedUser} setSelectedUser={setSelectedUser}
                        fundAmount={fundAmount} setFundAmount={setFundAmount}
                        systemEarnings={systemEarnings} commissionRates={commissionRates} setCommissionRates={setCommissionRates}
                        handleUserSearch={handleUserSearch} handleAddFunds={handleAddFunds}
                        handleUpdateCommission={handleUpdateCommission} fetchLocations={fetchLocations}
                        fetchAdminWalletData={fetchAdminWalletData}
                    />
                )}
                {user.role === 'agent'  && <AgentSection deliveries={deliveries} handleStatusUpdate={handleStatusUpdate} isUpdating={isUpdating} user={user} />}
            </div>
        </div>
    );
};

export default Dashboard;
