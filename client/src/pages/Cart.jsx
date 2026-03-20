// client/src/pages/Cart.jsx  ← replace existing file entirely
// Logic is IDENTICAL — same contexts, same handleCheckout with per-vendor loop,
// same validItems logic, same alerts, same navigate('/dashboard').

import { useContext, useState, useEffect } from 'react';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import { createOrder, getLocations, getMyWallet } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronDown, MapPin, Trash2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';

const Cart = () => {
    // ← identical state/logic to original
    const { cartItems, removeFromCart, updateCartItemQty, clearCart, cartTotal } = useContext(CartContext);
    const { user }    = useContext(AuthContext);
    const navigate    = useNavigate();

    const [instructions,     setInstructions]     = useState('');
    const [locations,        setLocations]         = useState([]);
    const [deliveryLocation, setDeliveryLocation]  = useState('');
    const [walletBalance,    setWalletBalance]     = useState(0);
    const [showConfirm,      setShowConfirm]       = useState(false);

    useEffect(() => {
        getLocations().then(({ data }) => setLocations(data)).catch(console.error);
        if (user) {
            getMyWallet().then(({ data }) => setWalletBalance(data.balance)).catch(console.error);
        }
    }, [user]);

    // ← same validItems logic as original
    const validItems = cartItems.filter(item => item.vendor && (item.vendor._id || typeof item.vendor === 'string'));

    const handleCheckout = async () => {
        if (validItems.length === 0) return;
        if (!deliveryLocation) {
            alert('Please select a delivery location.');
            return;
        }
        if (walletBalance < cartTotal) {
            alert(`Insufficient Wallet Balance (₹${walletBalance}). Total Required: ₹${cartTotal}. Please report to Admin for recharge.`);
            return;
        }
        if (validItems.length < cartItems.length) {
            alert('Notice: Some items were removed due to invalid vendor data.');
        }

        // Open confirm modal instead of directly placing order
        setShowConfirm(true);
    };

    const confirmOrderPlacement = async () => {
        const itemsByVendor = validItems.reduce((acc, item) => {
            const vId = item.vendor?._id || item.vendor;
            if (!acc[vId]) acc[vId] = [];
            acc[vId].push(item);
            return acc;
        }, {});
        try {
            for (const vendorId of Object.keys(itemsByVendor)) {
                const vendorItems = itemsByVendor[vendorId];
                const vendorTotal = vendorItems.reduce((acc, item) => acc + item.qty * item.price, 0);
                const orderData = {
                    orderItems: vendorItems.map(item => ({ product: item._id, name: item.name, qty: item.qty, price: item.price })),
                    vendorId,
                    totalPrice: vendorTotal,
                    instructions,
                    deliveryLocation,
                };
                await createOrder(orderData);
            }
            clearCart();
            alert('Order Placed Successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Checkout failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const isAffordable = walletBalance >= cartTotal;

    // ─── Modal ─────────────────────────────────────────────────────────────
    const CheckoutModal = () => {
        if (!showConfirm) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-600 p-6 text-white">
                        <h3 className="text-xl font-black">Confirm Your Order</h3>
                        <p className="text-white text-sm mt-1 opacity-90">Please review your final bill</p>
                    </div>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Location */}
                        <div className="bg-indigo-600/10 p-3 rounded-lg border border-indigo-600 flex gap-3 text-sm">
                            <span className="text-xl shrink-0"><MapPin className="w-5 h-5 shrink-0" /></span>
                            <div>
                                <p className="font-bold text-gray-900">Delivery Address</p>
                                <p className="text-gray-500">{deliveryLocation}</p>
                            </div>
                        </div>
                        {/* Items */}
                        <div className="space-y-2">
                            <p className="font-bold text-gray-900 text-sm">Order Summary</p>
                            <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-200 space-y-3">
                                {validItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-sm pb-2 border-b border-gray-200/60 last:border-0 last:pb-0">
                                        <div className="pr-4">
                                            <p className="font-semibold text-gray-900 leading-tight">{item.name}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">₹{item.price} × {item.qty}</p>
                                        </div>
                                        <span className="font-bold text-gray-900 shrink-0">₹{(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Total */}
                        <div className="flex justify-between items-center py-2 text-lg font-black text-gray-900 border-t-2 border-dashed border-gray-200">
                            <span>Total Bill</span>
                            <span className="text-indigo-600">₹{cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="p-6 pt-2 flex gap-3 bg-gray-50/80">
                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 text-gray-500 font-bold bg-white border border-gray-200 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                            Cancel
                        </button>
                        <button onClick={confirmOrderPlacement} className="flex-1 py-3 text-white font-bold bg-green-500 hover:bg-green-600 shadow-md shadow-green-200 rounded-lg transition-all active:scale-[0.98]">
                            Confirm Order ✓
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Empty state ───────────────────────────────────────────────────────
    if (cartItems.length === 0) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-indigo-600/10 to-white flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="text-6xl opacity-40 mb-2">🛒</div>
                    <h2 className="text-2xl font-black text-gray-900">Your cart is empty</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Browse the marketplace and add some products to get started.
                    </p>
                    <a href="/products"
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md shadow-indigo-500/20 mt-2">
                        Browse Products →
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600/10 to-white">
            <CheckoutModal />
            
            {/* Page header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Your Cart</h2>
                            <p className="text-sm text-gray-500 mt-0.5">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
                        </div>
                        <a href="/products" className="text-sm font-semibold text-indigo-600 hover:text-indigo-600 transition-colors">
                            ← Continue shopping
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── Left: Items + options ──────────────────────────── */}
                    <div className="flex-1 min-w-0 space-y-6">

                        {/* Items table */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Desktop table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50/80/70">
                                            {['Product','Price','Qty','Total',''].map(h => (
                                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartItems.map((item) => (
                                            <tr key={item.product} className="border-b border-gray-50 hover:bg-gray-50/80/50 transition-colors group">
                                                <td className="px-5 py-4 text-sm font-semibold text-gray-900">{item.name}</td>
                                                <td className="px-5 py-4 text-sm text-gray-500">₹{item.price}</td>
                                                <td className="px-5 py-4">
                                                    <div className="inline-flex items-center bg-gray-50/80 rounded-lg p-1 space-x-2">
                                                        <button 
                                                            onClick={() => updateCartItemQty(item.product, item.qty - 1)}
                                                            className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-gray-500 font-bold hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-sm font-bold text-gray-900 w-4 text-center">{item.qty}</span>
                                                        <button 
                                                            onClick={() => updateCartItemQty(item.product, item.qty + 1)}
                                                            className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-gray-500 font-bold hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm font-bold text-gray-900">₹{item.price * item.qty}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => removeFromCart(item.product)}
                                                        className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 px-2 py-1 rounded-lg hover:bg-red-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile stacked cards */}
                            <div className="sm:hidden divide-y divide-gray-100">
                                {cartItems.map((item) => (
                                    <div key={item.product} className="flex items-start gap-4 p-4">
                                        <div className="w-14 h-14 rounded-lg bg-indigo-600/10 flex items-center justify-center text-2xl shrink-0"><ShoppingBag className="w-5 h-5 shrink-0" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <div className="inline-flex items-center bg-gray-50/80 rounded-lg p-0.5 space-x-1.5">
                                                    <button onClick={() => updateCartItemQty(item.product, item.qty - 1)} className="w-5 h-5 flex items-center justify-center bg-white rounded text-gray-500 font-bold hover:bg-gray-50/80">-</button>
                                                    <span className="text-xs font-bold text-gray-900 w-3 text-center">{item.qty}</span>
                                                    <button onClick={() => updateCartItemQty(item.product, item.qty + 1)} className="w-5 h-5 flex items-center justify-center bg-white rounded text-gray-500 font-bold hover:bg-gray-50/80">+</button>
                                                </div>
                                                <span className="text-xs text-gray-500">× ₹{item.price}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className="font-black text-gray-900 text-sm">₹{item.price * item.qty}</span>
                                            <button onClick={() => removeFromCart(item.product)}
                                                className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery options */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                            <h3 className="font-bold text-gray-900">Delivery Options</h3>

                            {/* Location select */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="location" className="text-sm font-semibold text-gray-900">
                                    Delivery Location <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select id="location" value={deliveryLocation}
                                        onChange={(e) => setDeliveryLocation(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all">
                                        <option value="">— Select a location —</option>
                                        {locations.map(loc => (
                                            <option key={loc._id} value={loc.name}>{loc.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="instructions" className="text-sm font-semibold text-gray-900">
                                    Delivery Instructions <span className="text-gray-500 font-normal">(optional)</span>
                                </label>
                                <textarea id="instructions" rows={3} value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="e.g. Leave at front desk, call upon arrival…"
                                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Order summary ──────────────────────────── */}
                    <div className="w-full lg:w-80 shrink-0 sticky top-20">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-200 bg-gradient-to-br from-indigo-600/10 to-white">
                                <h3 className="font-bold text-gray-900">Order Summary</h3>
                            </div>
                            <div className="p-5 space-y-3">
                                {/* Line items */}
                                {cartItems.map((item) => (
                                    <div key={item.product} className="flex justify-between text-sm">
                                        <span className="text-gray-500 truncate max-w-[160px]">{item.name} ×{item.qty}</span>
                                        <span className="font-semibold text-gray-900 shrink-0 ml-2">₹{item.price * item.qty}</span>
                                    </div>
                                ))}

                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between font-black text-base">
                                        <span className="text-gray-900">Total</span>
                                        <span className="text-gray-900">₹{cartTotal}</span>
                                    </div>
                                </div>

                                {/* Wallet */}
                                <div className={`flex items-center justify-between p-3 rounded-lg text-sm font-medium ${isAffordable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div>
                                        <p className="font-semibold text-gray-900">Wallet Balance</p>
                                        <p className={`text-xs mt-0.5 ${isAffordable ? 'text-green-600' : 'text-red-600'}`}>
                                            {isAffordable ? 'Sufficient ✓' : `₹${(cartTotal - walletBalance).toFixed(2)} short`}
                                        </p>
                                    </div>
                                    <span className={`font-black text-lg ${isAffordable ? 'text-green-700' : 'text-red-600'}`}>
                                        ₹{walletBalance}
                                    </span>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={handleCheckout}
                                    disabled={!isAffordable || !deliveryLocation || validItems.length === 0}
                                    className="w-full py-3 px-6 bg-indigo-600 text-white hover:bg-indigo-600 text-white active:scale-[0.98] text-white font-bold rounded-lg shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                                >
                                    Place Order →
                                </button>

                                {/* Inline warnings */}
                                {!deliveryLocation && (
                                    <p className="text-xs text-amber-600 text-center font-medium">⚠ Select a delivery location to proceed</p>
                                )}
                                {!isAffordable && (
                                    <p className="text-xs text-red-500 text-center font-medium">Insufficient wallet balance — contact Admin</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
