// client/src/pages/Dashboard.jsx  ← replace existing file entirely
// Logic is IDENTICAL — same API calls, same state, same handlers, same role checks.

import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import {
    getMyOrders, getVendorOrders, updateOrderStatus, getAllOrders,
    getMyDeliveries, getLocations, addLocation, deleteLocation,
    addFunds, searchUsers, getSystemEarnings, getCommissionRates,
    updateCommissionRates, getMyWallet,
} from '../services/api';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001');

// ─── helpers ──────────────────────────────────────────────────────────────
function cn(...c) { return c.filter(Boolean).join(' '); }

function StatusBadge({ status }) {
    const map = {
        pending:          'bg-amber-100 text-amber-800',
        accepted:         'bg-blue-100 text-blue-800',
        preparing:        'bg-blue-100 text-blue-800',
        ready:            'bg-purple-100 text-purple-800',
        agent_requested:  'bg-purple-100 text-purple-800',
        out_for_delivery: 'bg-indigo-100 text-indigo-800',
        delivered:        'bg-green-100 text-green-700',
        cancelled:        'bg-red-100 text-red-700',
        rejected:         'bg-red-100 text-red-700',
    };
    return (
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', map[status] || 'bg-gray-100 text-gray-700')}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
}

function StatCard({ label, value, icon, accent }) {
    const colors = {
        orange: 'from-orange-400 to-orange-600 shadow-orange-200',
        green:  'from-green-400 to-green-600 shadow-green-200',
        blue:   'from-blue-400 to-blue-600 shadow-blue-200',
        purple: 'from-purple-400 to-purple-600 shadow-purple-200',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl text-white shadow-md shrink-0', colors[accent || 'orange'])}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
            </div>
        </div>
    );
}

function Card({ children, className }) {
    return <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-6', className)}>{children}</div>;
}

function SectionTitle({ children }) {
    return <h2 className="text-lg font-bold text-gray-900 mb-5">{children}</h2>;
}

// ─── USER SECTION ─────────────────────────────────────────────────────────
function UserSection({ orders, userWalletBalance, handleStatusUpdate }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Wallet Balance" value={`₹${userWalletBalance ?? 0}`} icon="💰" accent="green" />
                <StatCard label="Total Orders"   value={orders.length}                                   icon="📦" accent="orange" />
                <StatCard label="Delivered"       value={orders.filter(o => o.status === 'delivered').length} icon="✅" accent="blue" />
            </div>

            <Card>
                <SectionTitle>Quick Actions</SectionTitle>
                <div className="flex flex-wrap gap-3">
                    <a href="/products"    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">🛍️ Browse Products</a>
                    <a href="/print-order" className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">🖨️ New Print Order</a>
                </div>
            </Card>

            <Card>
                <SectionTitle>My Orders</SectionTitle>
                {orders.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3 opacity-40">📭</div>
                        <p className="text-gray-500 font-medium text-sm">No orders yet</p>
                        <a href="/products" className="text-sm font-semibold text-orange-500 hover:underline mt-2 inline-block">Browse Products →</a>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <div key={order._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-mono text-gray-400">#{order._id.slice(-6).toUpperCase()}</p>
                                    <p className="font-bold text-gray-900 text-sm">₹{order.totalAmount}</p>
                                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <StatusBadge status={order.status} />
                                    {order.status === 'pending' && (
                                        <button onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                            className="text-xs font-semibold text-red-500 hover:text-red-700 underline transition-colors">
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
                                    <div className="w-full sm:w-auto p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                                        <p className="text-xs text-blue-700 font-bold mb-1">Share OTP with Agent</p>
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
        </div>
    );
}

// ─── VENDOR SECTION ───────────────────────────────────────────────────────
function VendorSection({ orders, handleStatusUpdate }) {

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Orders"  value={orders.length} icon="📦" accent="orange" />
                <StatCard label="Pending"        value={orders.filter(o => o.status === 'pending').length} icon="⏳" accent="blue" />
                <StatCard label="Delivered"      value={orders.filter(o => o.status === 'delivered').length} icon="✅" accent="green" />
            </div>

            <Card>
                <div className="flex items-center justify-between mb-5">
                    <SectionTitle>Manage Products</SectionTitle>
                </div>
                <p className="text-sm text-gray-500 mb-4">Add, edit, or remove your products from the marketplace.</p>
                <a href="/add-product" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-200">
                    + Add Product
                </a>
            </Card>

            <Card>
                <SectionTitle>Incoming Orders</SectionTitle>
                {orders.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3 opacity-40">📭</div>
                        <p className="text-gray-500 text-sm font-medium">No orders yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order._id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                                    <div>
                                        <p className="text-xs font-mono text-gray-400">#{order._id.slice(-6).toUpperCase()}</p>
                                        <p className="font-semibold text-sm text-gray-900">Customer: {order.customer?.name || 'Unknown'}</p>
                                        <p className="font-black text-gray-900 mt-0.5">₹{order.totalAmount}</p>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>

                                {order.instructions && (
                                    <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-gray-700">
                                        <span className="font-bold text-amber-700">Note:</span> {order.instructions}
                                    </div>
                                )}

                                {/* Order items */}
                                <div className="mb-3 pl-3 border-l-2 border-gray-200 space-y-1.5">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="text-xs text-gray-700">
                                            <p className="font-semibold">{item.name}</p>
                                            {item.printOptions && (
                                                <p className="text-gray-500">
                                                    {item.printOptions.color === 'color' ? 'Color' : 'B&W'} | {item.printOptions.pages} pages | {item.printOptions.copies} copies
                                                </p>
                                            )}
                                            {item.fileUrl && (
                                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                                                    className="text-orange-500 hover:underline font-semibold block mt-0.5">
                                                    View PDF ↗
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 flex-wrap border-t border-gray-100 pt-3">
                                    {order.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(order._id, 'accepted')}
                                                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors">
                                                ✓ Accept
                                            </button>
                                            <button onClick={() => handleStatusUpdate(order._id, 'rejected')}
                                                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
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
                                        <p className="text-xs text-blue-600 font-semibold py-2">🛵 Out for delivery</p>
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
    fetchLocations,
}) {
    const [activeTab, setActiveTab] = useState('orders');
    const tabs = [
        { id: 'orders',    label: 'Orders',      icon: '📦' },
        { id: 'wallet',    label: 'Wallet',      icon: '💰' },
        { id: 'locations', label: 'Locations',   icon: '📍' },
        { id: 'earnings',  label: 'Earnings',    icon: '📈' },
    ];
    const [newLocation, setNewLocation] = useState('');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Orders"  value={orders.length} icon="📦" accent="orange" />
                <StatCard label="Delivered"      value={orders.filter(o => o.status === 'delivered').length} icon="✅" accent="green" />
                <StatCard label="Revenue"        value={systemEarnings ? `₹${systemEarnings.totalSales?.toFixed(0)}` : '—'} icon="💹" accent="blue" />
                <StatCard label="Locations"      value={locations.length} icon="📍" accent="purple" />
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200',
                            activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        )}>
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Orders tab ── */}
            {activeTab === 'orders' && (
                <Card className="overflow-hidden p-0">
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">All Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {['Order ID','Customer','Vendor','Location','Agent','Status','Amount'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{order._id.slice(-6).toUpperCase()}</td>
                                        <td className="px-4 py-3.5 text-gray-800 font-medium">{order.customer?.name || 'User'}</td>
                                        <td className="px-4 py-3.5 text-gray-600">{order.vendor?.storeName || '—'}</td>
                                        <td className="px-4 py-3.5 text-gray-500 text-xs">{order.deliveryLocation || '—'}</td>
                                        <td className="px-4 py-3.5 text-gray-500 text-xs">{order.deliveryAgent?.name || '—'}</td>
                                        <td className="px-4 py-3.5"><StatusBadge status={order.status} /></td>
                                        <td className="px-4 py-3.5 font-bold text-gray-900">₹{order.totalAmount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orders.length === 0 && (
                            <p className="text-center py-10 text-gray-400 text-sm">No orders found</p>
                        )}
                    </div>
                </Card>
            )}

            {/* ── Wallet tab ── */}
            {activeTab === 'wallet' && (
                <Card>
                    <h3 className="font-bold text-gray-900 mb-5">Add Funds to User Wallet</h3>
                    <form onSubmit={handleUserSearch} className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Search by name or email"
                                value={walletSearch} onChange={(e) => setWalletSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 transition-all"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl transition-colors">
                            Search
                        </button>
                    </form>

                    {walletUsers.length > 0 && (
                        <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                            {walletUsers.map(u => (
                                <div key={u._id} onClick={() => setSelectedUser(u)}
                                    className={cn('flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-100 last:border-0 transition-colors text-sm',
                                        selectedUser?._id === u._id ? 'bg-orange-50 border-l-2 border-l-orange-400' : 'hover:bg-gray-50')}>
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
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm font-semibold text-blue-800 mb-3">Adding funds to: {selectedUser.name}</p>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Amount (₹)" value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-400"
                                />
                                <button onClick={handleAddFunds}
                                    className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors">
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
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 transition-all"
                        />
                        <button onClick={async () => {
                            if (!newLocation.trim()) return;
                            try { await addLocation(newLocation.trim()); setNewLocation(''); fetchLocations(); }
                            catch (e) { alert(e.message); }
                        }} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                            + Add
                        </button>
                    </div>
                    {locations.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No locations added yet</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {locations.map(loc => (
                                <div key={loc._id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 group">
                                    <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                        <span className="text-gray-400">📍</span>{loc.name}
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

            {/* ── Earnings tab ── */}
            {activeTab === 'earnings' && (
                <div className="space-y-6">
                    {systemEarnings && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Company Earnings', value: `₹${systemEarnings.totalCompanyEarnings?.toFixed(2)}`, accent: 'green' },
                                { label: 'Delivery Payouts', value: `₹${systemEarnings.totalDeliveryEarnings?.toFixed(2)}`, accent: 'blue' },
                                { label: 'Vendor Earnings',  value: `₹${systemEarnings.totalVendorEarnings?.toFixed(2)}`,  accent: 'orange' },
                                { label: 'Total Sales',      value: `₹${systemEarnings.totalSales?.toFixed(2)}`,            accent: 'purple' },
                            ].map(s => (
                                <StatCard key={s.label} label={s.label} value={s.value} icon="₹" accent={s.accent} />
                            ))}
                        </div>
                    )}
                    <Card>
                        <h3 className="font-bold text-gray-900 mb-4">Commission Rates</h3>
                        <div className="flex flex-wrap gap-5 items-end">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Company %</label>
                                <input type="number" value={commissionRates.companyRate}
                                    onChange={(e) => setCommissionRates({ ...commissionRates, companyRate: Number(e.target.value) })}
                                    className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Delivery %</label>
                                <input type="number" value={commissionRates.deliveryRate}
                                    onChange={(e) => setCommissionRates({ ...commissionRates, deliveryRate: Number(e.target.value) })}
                                    className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 transition-all"
                                />
                            </div>
                            <button onClick={handleUpdateCommission}
                                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors">
                                Save Rates
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

// ─── AGENT SECTION ────────────────────────────────────────────────────────
function AgentSection({ deliveries, handleStatusUpdate }) {
    const [otpInputs, setOtpInputs] = useState({});

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Assigned"  value={deliveries.length} icon="🛵" accent="orange" />
                <StatCard label="Active"    value={deliveries.filter(d => d.status === 'out_for_delivery').length} icon="📍" accent="blue" />
                <StatCard label="Delivered" value={deliveries.filter(d => d.status === 'delivered').length} icon="✅" accent="green" />
            </div>
            <Card>
                <SectionTitle>My Deliveries</SectionTitle>
                {deliveries.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3 opacity-40">🛵</div>
                        <p className="text-gray-500 text-sm font-medium">No deliveries assigned</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deliveries.map(order => (
                            <div key={order._id} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono text-gray-400">#{order._id.slice(-6).toUpperCase()}</p>
                                        <p className="font-bold text-gray-900 text-sm">₹{order.totalAmount}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>
                                {order.status === 'out_for_delivery' && (
                                    <div className="flex gap-2 border-t border-gray-100 pt-3">
                                        <input type="text" placeholder="Enter OTP from customer"
                                            value={otpInputs[order._id] || ''}
                                            onChange={e => setOtpInputs(prev => ({ ...prev, [order._id]: e.target.value }))}
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-orange-400"
                                        />
                                        <button onClick={() => handleStatusUpdate(order._id, 'delivered', otpInputs[order._id])}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors">
                                            Mark Delivered ✓
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
    // ← ALL identical to original
    const { user }   = useContext(AuthContext);
    const [orders,     setOrders]     = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [locations,  setLocations]  = useState([]);
    const [error,      setError]      = useState(null);

    const [walletSearch,    setWalletSearch]    = useState('');
    const [walletUsers,     setWalletUsers]     = useState([]);
    const [selectedUser,    setSelectedUser]    = useState(null);
    const [fundAmount,      setFundAmount]      = useState('');
    const [systemEarnings,  setSystemEarnings]  = useState(null);
    const [commissionRates, setCommissionRates] = useState({ companyRate: 5, deliveryRate: 5 });
    const [userWalletBalance, setUserWalletBalance] = useState(0);

    const fetchLocations = async () => {
        try { const { data } = await getLocations(); setLocations(data); }
        catch (e) { console.error(e); }
    };

    const fetchAdminWalletData = async () => {
        try {
            const earningsRes = await getSystemEarnings(); setSystemEarnings(earningsRes.data);
            const commRes     = await getCommissionRates(); setCommissionRates(commRes.data);
        } catch (e) { console.error('Failed to fetch admin wallet data', e); }
    };

    const fetchOrders = async () => {
        if (user) {
            try {
                let orderData = []; let deliveryData = [];
                if (user.role === 'vendor') {
                    const r = await getVendorOrders(); orderData = r.data;
                } else if (user.role === 'user') {
                    const r = await getMyOrders(); orderData = r.data;
                    try { const { data } = await getMyWallet(); console.log('[Dashboard] Wallet data:', data); setUserWalletBalance(data.balance); } catch (walletErr) { console.error('[Dashboard] Wallet fetch error:', walletErr); }
                    try { const r2 = await getMyDeliveries(); deliveryData = r2.data; } catch {}
                } else if (user.role === 'admin') {
                    const r = await getAllOrders(); orderData = r.data;
                    fetchLocations(); fetchAdminWalletData();
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
        try { await updateOrderStatus(orderId, newStatus, otp); fetchOrders(); }
        catch (error) { alert('Failed to update status: ' + (error.response?.data?.message || error.message)); }
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
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-2xl font-black text-white shadow-xl shrink-0">
                            {user.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">{ROLE_LABEL[user.role] ?? 'User'}</p>
                            <h1 className="text-xl sm:text-2xl font-black">Welcome back, {user.name?.split(' ')[0]}!</h1>
                            <p className="text-gray-400 text-xs mt-0.5">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
                        <svg className="w-4 h-4 mt-0.5 shrink-0 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                        <span>{error}</span>
                    </div>
                )}

                {user.role === 'user'   && <UserSection   orders={orders} userWalletBalance={userWalletBalance} handleStatusUpdate={handleStatusUpdate} />}
                {user.role === 'vendor' && <VendorSection orders={orders} handleStatusUpdate={handleStatusUpdate} />}
                {user.role === 'admin'  && (
                    <AdminSection
                        orders={orders} locations={locations}
                        walletSearch={walletSearch} setWalletSearch={setWalletSearch}
                        walletUsers={walletUsers} selectedUser={selectedUser} setSelectedUser={setSelectedUser}
                        fundAmount={fundAmount} setFundAmount={setFundAmount}
                        systemEarnings={systemEarnings} commissionRates={commissionRates} setCommissionRates={setCommissionRates}
                        handleUserSearch={handleUserSearch} handleAddFunds={handleAddFunds}
                        handleUpdateCommission={handleUpdateCommission} fetchLocations={fetchLocations}
                    />
                )}
                {user.role === 'agent'  && <AgentSection deliveries={deliveries} handleStatusUpdate={handleStatusUpdate} />}
            </div>
        </div>
    );
};

export default Dashboard;
