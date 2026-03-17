// client/src/components/Navbar.jsx  ← replace existing file entirely
// Logic is IDENTICAL to original. Only the JSX/styles are redesigned.

import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';

const ROLE_PILL = {
    admin:  'bg-purple-100 text-purple-700',
    vendor: 'bg-blue-100 text-blue-700',
    agent:  'bg-green-100 text-green-700',
    user:   'bg-orange-100 text-orange-700',
};

// ─── Profile Dropdown ──────────────────────────────────────────────────────
function ProfileDropdown({ user, onLogout, showCart, showDelivery }) {
    const [open, setOpen] = useState(false);
    const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-expanded={open}
                aria-haspopup="true"
            >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-gray-800 max-w-[100px] truncate">{user.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 rounded-full capitalize mt-0.5 ${ROLE_PILL[user.role] || ROLE_PILL.user}`}>
                        {user.role}
                    </span>
                </div>
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-slideDown">
                        <div className="px-4 py-3 bg-gradient-to-br from-orange-50 to-white border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role} account</p>
                        </div>
                        <div className="py-1">
                            {[
                                { to: '/dashboard', icon: '📊', label: 'Dashboard' },
                                ...(user.role !== 'agent' ? [{ to: '/products',  icon: '🛍️', label: 'Browse Products' }] : []),
                                ...(showCart ? [{ to: '/cart', icon: '🛒', label: 'Cart' }] : []),
                                ...(showDelivery ? [{ to: '/delivery', icon: '🚚', label: 'Delivery Hub' }] : []),
                            ].map(item => (
                                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                                    <span>{item.icon}</span>{item.label}
                                </Link>
                            ))}
                        </div>
                        <div className="border-t border-gray-100 py-1">
                            <button onClick={() => { onLogout(); setOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                                <span>🚪</span> Log out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Mobile Drawer ─────────────────────────────────────────────────────────
function MobileMenu({ open, onClose, user, cartCount, onLogout, showCart, showDelivery }) {
    if (!open) return null;
    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-72 bg-white z-50 shadow-2xl flex flex-col animate-slideDown">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <span className="text-xl font-black text-gray-900">Campus<span className="text-orange-500">Kart</span></span>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {user && (
                    <div className="px-5 py-4 bg-gradient-to-br from-orange-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-sm font-bold">
                                {user.name?.slice(0,2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">{user.name}</p>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_PILL[user.role] || ROLE_PILL.user}`}>{user.role}</span>
                            </div>
                        </div>
                    </div>
                )}
                <nav className="flex-1 py-2">
                    {user ? (
                        <>
                            {[
                                { to: '/dashboard', icon: '📊', label: 'Dashboard' },
                                ...(user.role !== 'agent' ? [{ to: '/products',  icon: '🛍️', label: 'Browse Products' }] : []),
                                ...(showCart ? [{ to: '/cart', icon: '🛒', label: 'Cart', badge: cartCount }] : []),
                                ...(showDelivery ? [{ to: '/delivery', icon: '🚚', label: 'Delivery Hub' }] : []),
                            ].map(item => (
                                <Link key={item.to} to={item.to} onClick={onClose}
                                    className="flex items-center gap-4 px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                    <span className="text-lg">{item.icon}</span>
                                    {item.label}
                                    {item.badge > 0 && (
                                        <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                                    )}
                                </Link>
                            ))}
                        </>
                    ) : (
                        <div className="px-5 py-4 space-y-2">
                            <Link to="/login" onClick={onClose} className="block w-full text-center py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">Sign In</Link>
                            <Link to="/register" onClick={onClose} className="block w-full text-center py-2.5 bg-white border border-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-50 transition-colors">Register</Link>
                        </div>
                    )}
                </nav>
                {user && (
                    <div className="px-5 py-4 border-t border-gray-100">
                        <button onClick={() => { onLogout(); onClose(); }} className="flex items-center gap-3 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
                            <span>🚪</span> Log out
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Navbar ────────────────────────────────────────────────────────────────
const Navbar = () => {
    // ← same context usage as original
    const { user, logout } = useContext(AuthContext);
    const { cartItems }    = useContext(CartContext);
    const navigate         = useNavigate();
    const location         = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const cartCount   = cartItems.length;
    const isActive    = (path) => location.pathname === path;
    const showCart    = user?.role === 'user';
    const showDelivery = user?.role === 'agent';

    return (
        <>
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-xl shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <span className="text-xl font-black tracking-tight text-gray-900">
                                Campus<span className="text-orange-500">Kart</span>
                            </span>
                        </Link>

                        {/* Desktop nav links */}
                        {user && (
                            <nav className="hidden md:flex items-center gap-1 ml-2" aria-label="Main navigation">
                                {[
                                    { to: '/dashboard', label: 'Dashboard' },
                                    ...(user.role !== 'agent' ? [{ to: '/products',  label: 'Browse' }] : []),
                                    ...(showDelivery ? [{ to: '/delivery', label: 'Delivery' }] : []),
                                ].map(item => (
                                    <Link key={item.to} to={item.to}
                                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive(item.to) ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        )}

                        <div className="flex-1" />

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            {user ? (
                                <>
                                    {/* Cart button — only for user role */}
                                    {showCart && (
                                        <Link to="/cart" aria-label={`Cart, ${cartCount} items`}
                                            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            {cartCount > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                                                    {cartCount > 99 ? '99+' : cartCount}
                                                </span>
                                            )}
                                        </Link>
                                    )}

                                    {/* Profile dropdown */}
                                    <ProfileDropdown user={user} onLogout={handleLogout} showCart={showCart} showDelivery={showDelivery} />
                                </>
                            ) : (
                                <div className="hidden sm:flex items-center gap-2">
                                    <Link to="/login"
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                                        Sign In
                                    </Link>
                                    <Link to="/register"
                                        className="px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors shadow-sm">
                                        Register
                                    </Link>
                                </div>
                            )}

                            {/* Hamburger */}
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                                aria-label="Open menu"
                            >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <MobileMenu
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                user={user}
                cartCount={cartCount}
                onLogout={handleLogout}
                showCart={showCart}
                showDelivery={showDelivery}
            />
        </>
    );
};

export default Navbar;
