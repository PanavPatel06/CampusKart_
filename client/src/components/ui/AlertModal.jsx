import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export default function AlertModal({ isOpen, message, type = 'info', showConfirm = false, onConfirm, onCancel, onClose }) {
    if (!isOpen) return null;

    const variants = {
        success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500', lightBs: 'bg-emerald-50' },
        error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500', lightBs: 'bg-red-50' },
        danger: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500', lightBs: 'bg-red-50' },
        info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500', lightBs: 'bg-blue-50' }
    };

    const variant = variants[type] || variants.info;
    const Icon = variant.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200`}>
                <div className={`absolute top-0 left-0 w-full h-1 ${variant.bg}`} />
                <div className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-full ${variant.lightBs}`}>
                            <Icon className={`w-8 h-8 ${variant.color}`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                            {type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'danger' ? 'Warning' : 'Information'}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                            {message}
                        </p>
                    </div>

                    <div className="mt-8 flex gap-3">
                        {showConfirm ? (
                            <>
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 px-4 py-2.5 ${variant.bg} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg transition-all`}
                                >
                                    Confirm
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className={`w-full px-4 py-3 ${variant.bg} hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all`}
                            >
                                Okay
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
