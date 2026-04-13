import { useAlert } from '../context/AlertContext';
// client/src/pages/ProductList.jsx  ← replace existing file entirely
// Logic IDENTICAL — same getAllProducts, addToCart, alert, loading state.

import { useState, useEffect, useContext } from 'react';
import { getAllProducts } from '../services/api';
import { Link } from 'react-router-dom';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import { Search, ShoppingCart, PackageSearch, ShoppingBag, ImageIcon, Sparkles } from 'lucide-react';

// ─── Skeleton card ─────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite_linear]" />
            <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-50/80 rounded-lg animate-pulse w-3/4" />
                <div className="h-3 bg-gray-50/80 rounded-lg animate-pulse w-full" />
                <div className="h-3 bg-gray-50/80 rounded-lg animate-pulse w-2/3" />
                <div className="flex items-center justify-between pt-2">
                    <div className="h-6 bg-gray-50/80 rounded-lg animate-pulse w-16" />
                    <div className="h-9 bg-gray-50/80 rounded-lg animate-pulse w-24" />
                </div>
            </div>
        </div>
    );
}

// ─── Product card ──────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, justAdded, userRole }) {
    return (
        <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
            {/* Image area */}
            <div className="relative h-40 bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 overflow-hidden">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-25 group-hover:scale-110 transition-transform duration-500 select-none">
                        <PackageSearch className="w-8 h-8 text-gray-300" />
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-5 gap-3">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                    </h3>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                    <span className="text-xl font-black text-gray-900">₹{product.price}</span>
                    {userRole === 'user' && (
                        <button
                            onClick={() => onAddToCart(product)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                                justAdded
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 hover:shadow-lg active:scale-95'
                            }`}
                        >
                            {justAdded ? '✓ Added' : '+ Cart'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const ProductList = () => {
    const { showAlert } = useAlert();
    // ← identical to original
    const [products, setProducts] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [addedIds, setAddedIds] = useState(new Set());
    const { addToCart }           = useContext(CartContext);
    const { user }                = useContext(AuthContext);

    const handleAddToCart = (product) => {
        addToCart(product);
        showAlert('Added to Cart!');               // ← same alert as original
        setAddedIds(prev => new Set([...prev, product._id]));
        setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(product._id); return n; }), 2000);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await getAllProducts();
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch products', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filtered = products.filter(p =>
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.vendor?.storeName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600/10 to-white">
            {/* Hero header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-white">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Campus Marketplace</h2>
                            <p className="text-indigo-600 text-sm mt-1">
                                {loading ? 'Loading…' : `${products.length} products available`}
                            </p>
                        </div>
                        <Link to="/dashboard"
                            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-fit">
                            ← Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="flex gap-3 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="search" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search products, vendors…"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                        />
                    </div>
                    {search && (
                        <button onClick={() => setSearch('')}
                            className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50/80 transition-colors shadow-sm">
                            Clear
                        </button>
                    )}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-5xl mb-4 opacity-40"><PackageSearch className="w-8 h-8 text-gray-300" /></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {search ? `No results for "${search}"` : 'No products yet'}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                            {search ? 'Try a different search.' : 'Products will appear once vendors add them.'}
                        </p>
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="mt-5 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-50/80 transition-colors shadow-sm">
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map(product => (
                            <ProductCard key={product._id} product={product}
                                onAddToCart={handleAddToCart}
                                justAdded={addedIds.has(product._id)}
                                userRole={user?.role} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductList;
