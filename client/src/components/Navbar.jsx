// client/src/components/Navbar.jsx  ← replace existing file entirely
// Logic is IDENTICAL to original. Only the JSX/styles are redesigned.

import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import { LogOut, ChevronDown, ShoppingCart, ShoppingBag, BarChart2, Bike } from 'lucide-react';

const ROLE_PILL = {
    admin:  'bg-purple-100 text-purple-700',
    vendor: 'bg-indigo-100 text-indigo-700',
    agent:  'bg-green-100 text-green-700',
    user:   'bg-indigo-600 text-white text-indigo-600',
};

// ─── Profile Dropdown ──────────────────────────────────────────────────────
function ProfileDropdown({ user, onLogout, showCart, showDelivery }) {
    const [open, setOpen] = useState(false);
    const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                aria-expanded={open}
                aria-haspopup="true"
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                </div>
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-gray-900 max-w-[100px] truncate">{user.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 rounded-full capitalize mt-0.5 ${ROLE_PILL[user.role] || ROLE_PILL.user}`}>
                        {user.role}
                    </span>
                </div>
                <ChevronDown className="" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-slideDown">
                        <div className="px-4 py-3 bg-gradient-to-br from-indigo-600/10 to-white border-b border-gray-200">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role} account</p>
                        </div>
                        <div className="py-1">
                            {[
                                { to: '/dashboard', icon: <BarChart2 className="w-5 h-5 shrink-0" />, label: 'Dashboard' },
                                ...(user.role !== 'agent' ? [{ to: '/products',  icon: <ShoppingBag className="w-5 h-5 shrink-0" />, label: 'Browse Products' }] : []),
                                ...(showCart ? [{ to: '/cart', icon: <ShoppingCart className="w-5 h-5 shrink-0" />, label: 'Cart' }] : []),
                                ...(showDelivery ? [{ to: '/delivery', icon: <Bike className="w-5 h-5 shrink-0" />, label: 'Delivery Hub' }] : []),
                            ].map(item => (
                                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50/80 transition-colors font-medium">
                                    <span>{item.icon}</span>{item.label}
                                </Link>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 py-1">
                            <button onClick={() => { onLogout(); setOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                                <span><LogOut className="w-5 h-5 shrink-0" /></span> Log out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Removed MobileMenu
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
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg shrink-0">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                                <ShoppingBag className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-gray-900">
                                Campus<span className="text-indigo-600">Kart</span>
                            </span>
                        </Link>

                        {/* Desktop nav links */}
                        {user && (
                            <nav className="flex items-center gap-1 ml-2" aria-label="Main navigation">
                                {[
                                    { to: '/dashboard', label: 'Dashboard' },
                                    ...(user.role !== 'agent' ? [{ to: '/products',  label: 'Browse' }] : []),
                                    ...(showDelivery ? [{ to: '/delivery', label: 'Delivery' }] : []),
                                ].map(item => (
                                    <Link key={item.to} to={item.to}
                                        className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${isActive(item.to) ? 'text-indigo-600 bg-indigo-600/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'}`}>
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
                                            className="relative p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                                            <ShoppingCart className="w-5 h-5 text-gray-900" />
                                            {cartCount > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                                                    {cartCount > 99 ? '99+' : cartCount}
                                                </span>
                                            )}
                                        </Link>
                                    )}

                                    {/* Profile dropdown */}
                                    <ProfileDropdown user={user} onLogout={handleLogout} showCart={showCart} showDelivery={showDelivery} />
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link to="/login"
                                        className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                                        Sign In
                                    </Link>
                                    <Link to="/register"
                                        className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-sm">
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Navbar;
