// client/src/pages/AddProduct.jsx  ← replace existing file entirely
// Logic IDENTICAL — same addProduct API, same formData, handleChange, handleSubmit.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addProduct } from '../services/api';

const AddProduct = () => {
    // ← identical to original
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', price: '', description: '' });
    const [error,   setError]     = useState(null);
    const [loading, setLoading]   = useState(false);

    const handleChange  = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit  = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addProduct(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50/40 to-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 shadow-xl shadow-green-200 mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Add New Product</h1>
                    <p className="text-gray-500 text-sm mt-1">List a product on the campus marketplace</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-5">
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm" role="alert">
                            <svg className="w-4 h-4 mt-0.5 shrink-0 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="name" className="text-sm font-semibold text-gray-700">Product Name</label>
                            <input id="name" name="name" type="text"
                                value={formData.name} onChange={handleChange}
                                placeholder="e.g. Chicken Burger, Print Paper A4"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/25 focus:border-green-400 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Price */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="price" className="text-sm font-semibold text-gray-700">Price (₹)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">₹</span>
                                <input id="price" name="price" type="number" min="0" step="0.01"
                                    value={formData.price} onChange={handleChange}
                                    placeholder="0.00"
                                    required
                                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/25 focus:border-green-400 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="description" className="text-sm font-semibold text-gray-700">
                                Description <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea id="description" name="description"
                                value={formData.description} onChange={handleChange}
                                placeholder="Describe your product briefly…"
                                rows={3}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400/25 focus:border-green-400 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Link to="/dashboard"
                                className="flex-1 py-3 text-center text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                ← Cancel
                            </Link>
                            <button type="submit" disabled={loading || !formData.name || !formData.price}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {loading ? 'Adding…' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
