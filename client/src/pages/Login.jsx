// client/src/pages/Login.jsx  ← replace existing file entirely
// Logic is IDENTICAL to original (same state, same handleSubmit, same AuthContext usage).

import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Eye, Mail, EyeOff, XCircle, ShoppingBag, Lock } from 'lucide-react';

const Login = () => {
    // ← identical state/logic to original
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState(null);
    const [loading, setLoading]   = useState(false);
    const [showPw, setShowPw]     = useState(false);
    const { login }               = useContext(AuthContext);
    const navigate                = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600/10 via-white to-indigo-600/5 flex items-center justify-center px-4 py-12">
            {/* BG blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 text-white rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-600 shadow-xl shadow-indigo-500/20 mb-4">
                        <ShoppingBag className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Campus<span className="text-indigo-600">Kart</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1.5">Your campus marketplace</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl shadow-sm p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
                    <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue</p>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-5" role="alert">
                            <XCircle className="w-4 h-4 mt-0.5 shrink-0 fill-current" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-semibold text-gray-900">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                <input
                                    id="email" type="email" autoComplete="email" required
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@college.edu"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-sm font-semibold text-gray-900">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                <input
                                    id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-500 transition-colors focus:outline-none"
                                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                                    {showPw
                                        ? <EyeOff className="w-4 h-4" />
                                        : <Eye className="w-4 h-4" />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 mt-2 bg-indigo-600 text-white hover:bg-indigo-600 text-white active:scale-[0.98] text-white font-semibold rounded-lg shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-50/80" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-gray-50/80" />
                    </div>

                    <p className="text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-600 transition-colors">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
