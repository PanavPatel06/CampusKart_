// client/src/pages/Register.jsx  ← replace existing file entirely
// Logic IDENTICAL to original — same formData, handleChange, handleSubmit, AuthContext.

import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { MapPin, Lock, Mail, GraduationCap, User, Eye, Bike, Store, EyeOff, ShoppingBag, XCircle } from 'lucide-react';

const ROLES = [
    { value: 'user',   label: 'Student',        icon: <GraduationCap className="w-5 h-5 shrink-0" />, desc: 'Shop on campus' },
    { value: 'vendor', label: 'Vendor',          icon: <Store className="w-5 h-5 shrink-0" />, desc: 'Sell products' },
    { value: 'agent',  label: 'Delivery Agent',  icon: <Bike className="w-5 h-5 shrink-0" />, desc: 'Deliver orders' },
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
            const data = await register(formData);
            if (data.token) {
                navigate('/dashboard');
            } else {
                alert(data.message || 'Registration successful! Please wait for admin approval before logging in.');
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const isVendor = formData.role === 'vendor';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600/10 via-white to-indigo-600/5 flex items-center justify-center px-4 py-12">
            {/* BG blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-600 text-white rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-lg">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-600 shadow-xl shadow-indigo-500/20 mb-4">
                        <ShoppingBag className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">Campus<span className="text-indigo-600">Kart</span></h1>
                    <p className="text-gray-500 text-sm mt-1.5">Create your free account</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl shadow-sm p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Get started</h2>
                    <p className="text-sm text-gray-500 mb-6">Join the campus community</p>

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-5" role="alert">
                            <XCircle className="w-4 h-4 mt-0.5 shrink-0 fill-current" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Role selector */}
                        <div>
                            <p className="text-sm font-semibold text-gray-900 mb-3">I am a…</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ROLES.map(role => (
                                    <button
                                        key={role.value} type="button"
                                        onClick={() => handleChange({ target: { name: 'role', value: role.value } })}
                                        aria-pressed={formData.role === role.value}
                                        className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                                            formData.role === role.value
                                                ? 'border-indigo-600 bg-indigo-600/10 shadow-md shadow-indigo-500/20'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80'
                                        }`}
                                    >
                                        <span className="text-2xl">{role.icon}</span>
                                        <span className={`text-xs font-bold ${formData.role === role.value ? 'text-indigo-600' : 'text-gray-900'}`}>{role.label}</span>
                                        <span className="text-[10px] text-gray-500 hidden sm:block leading-tight">{role.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name */}
                        <FieldInput label="Full Name" name="name" type="text" placeholder="Your full name"
                            value={formData.name} onChange={handleChange} autoComplete="name" required
                            icon={<User className="w-4 h-4" />}
                        />

                        {/* Email */}
                        <FieldInput label="Email address" name="email" type="email" placeholder="you@college.edu"
                            value={formData.email} onChange={handleChange} autoComplete="email" required
                            icon={<Mail className="w-4 h-4" />}
                        />

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-sm font-semibold text-gray-900">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                <input id="password" name="password" type={showPw ? 'text' : 'password'}
                                    value={formData.password} onChange={handleChange}
                                    placeholder="Create a strong password" autoComplete="new-password" required
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

                        {/* Vendor-only fields — animated expand */}
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isVendor ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`} aria-hidden={!isVendor}>
                            <div className="space-y-4 pt-1">
                                <div className="flex items-center gap-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <span className="text-indigo-500 shrink-0">🏪</span>
                                    <p className="text-xs text-indigo-700 font-medium">These details will appear on your store page</p>
                                </div>
                                <FieldInput label="Store Name" name="storeName" type="text"
                                    placeholder="e.g. Campus Bites, Print Hub"
                                    value={formData.storeName} onChange={handleChange}
                                    required={isVendor}
                                    icon={<Store className="w-4 h-4" />}
                                />
                                <FieldInput label="Store Location" name="location" type="text"
                                    placeholder="e.g. Block A, Ground Floor"
                                    value={formData.location} onChange={handleChange}
                                    required={isVendor}
                                    icon={<MapPin className="w-4 h-4" />}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading || !formData.name || !formData.email || !formData.password}
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white hover:bg-indigo-600 text-white active:scale-[0.98] text-white font-semibold rounded-lg shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {loading ? 'Creating account…' : 'Create Account →'}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-50/80" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">already registered?</span>
                        <div className="flex-1 h-px bg-gray-50/80" />
                    </div>
                    <p className="text-center text-sm text-gray-500">
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-600 transition-colors">Sign in to your account</Link>
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
            <label htmlFor={props.name} className="text-sm font-semibold text-gray-900">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{icon}</div>}
                <input id={props.name}
                    className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all`}
                    {...props}
                />
            </div>
        </div>
    );
}

export default Register;
