// client/src/pages/Register.jsx  ← replace existing file entirely
// Logic IDENTICAL to original — same formData, handleChange, handleSubmit, AuthContext.

import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ROLES = [
    { value: 'user',   label: 'Student',        icon: '🎓', desc: 'Shop on campus' },
    { value: 'vendor', label: 'Vendor',          icon: '🏪', desc: 'Sell products' },
    { value: 'agent',  label: 'Delivery Agent',  icon: '🛵', desc: 'Deliver orders' },
];

const Register = () => {
    // ← identical to original
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        role: 'user', storeName: '', location: '',
    });
    const [error, setError]     = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw]   = useState(false);
    const { register }          = useContext(AuthContext);
    const navigate              = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await register(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const isVendor = formData.role === 'vendor';

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex items-center justify-center px-4 py-12">
            {/* BG blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-lg">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl shadow-orange-200 mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">Campus<span className="text-orange-500">Kart</span></h1>
                    <p className="text-gray-500 text-sm mt-1.5">Create your free account</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl shadow-gray-200/50 p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Get started</h2>
                    <p className="text-sm text-gray-500 mb-6">Join the campus community</p>

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5" role="alert">
                            <svg className="w-4 h-4 mt-0.5 shrink-0 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Role selector */}
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-3">I am a…</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ROLES.map(role => (
                                    <button
                                        key={role.value} type="button"
                                        onClick={() => handleChange({ target: { name: 'role', value: role.value } })}
                                        aria-pressed={formData.role === role.value}
                                        className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                                            formData.role === role.value
                                                ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-2xl">{role.icon}</span>
                                        <span className={`text-xs font-bold ${formData.role === role.value ? 'text-orange-700' : 'text-gray-700'}`}>{role.label}</span>
                                        <span className="text-[10px] text-gray-400 hidden sm:block leading-tight">{role.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name */}
                        <FieldInput label="Full Name" name="name" type="text" placeholder="Your full name"
                            value={formData.name} onChange={handleChange} autoComplete="name" required
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                        />

                        {/* Email */}
                        <FieldInput label="Email address" name="email" type="email" placeholder="you@college.edu"
                            value={formData.email} onChange={handleChange} autoComplete="email" required
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>}
                        />

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</label>
                            <div className="relative">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input id="password" name="password" type={showPw ? 'text' : 'password'}
                                    value={formData.password} onChange={handleChange}
                                    placeholder="Create a strong password" autoComplete="new-password" required
                                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 focus:bg-white transition-all"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                                    {showPw
                                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Vendor-only fields — animated expand */}
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isVendor ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`} aria-hidden={!isVendor}>
                            <div className="space-y-4 pt-1">
                                <div className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <span className="text-blue-500 shrink-0">🏪</span>
                                    <p className="text-xs text-blue-700 font-medium">These details will appear on your store page</p>
                                </div>
                                <FieldInput label="Store Name" name="storeName" type="text"
                                    placeholder="e.g. Campus Bites, Print Hub"
                                    value={formData.storeName} onChange={handleChange}
                                    required={isVendor}
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                />
                                <FieldInput label="Store Location" name="location" type="text"
                                    placeholder="e.g. Block A, Ground Floor"
                                    value={formData.location} onChange={handleChange}
                                    required={isVendor}
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading || !formData.name || !formData.email || !formData.password}
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold rounded-xl shadow-md shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {loading ? 'Creating account…' : 'Create Account →'}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">already registered?</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <p className="text-center text-sm text-gray-600">
                        <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">Sign in to your account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

// Small helper to avoid repetition
function FieldInput({ label, icon, ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={props.name} className="text-sm font-semibold text-gray-700">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>}
                <input id={props.name}
                    className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 focus:bg-white transition-all`}
                    {...props}
                />
            </div>
        </div>
    );
}

export default Register;
