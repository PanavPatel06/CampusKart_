import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export const AlertModal = ({ isOpen, message, type = 'error', onClose, onConfirm = null }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
            if (e.key === 'Enter' && isOpen && !onConfirm) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onConfirm]);

    if (!isOpen) return null;

    const isConfirm = !!onConfirm;
    
    const icons = {
        error: <AlertCircle className="w-8 h-8 text-red-500" />,
        success: <CheckCircle2 className="w-8 h-8 text-green-500" />,
        info: <Info className="w-8 h-8 text-blue-500" />,
        confirm: <AlertCircle className="w-8 h-8 text-amber-500" />
    };

    const gradient = {
        error: 'from-red-600 to-red-500',
        success: 'from-green-600 to-green-500',
        info: 'from-blue-600 to-blue-500',
        confirm: 'from-amber-500 to-amber-600'
    };

    const textGrad = {
        error: 'bg-red-50',
        success: 'bg-green-50',
        info: 'bg-blue-50',
        confirm: 'bg-amber-50'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`bg-gradient-to-r ${gradient[isConfirm ? 'confirm' : type]} p-6 text-white text-center shadow-inner relative`}>
                    <button onClick={onClose} className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                        {icons[isConfirm ? 'confirm' : type]}
                    </div>
                    <h3 className="text-xl font-black">{isConfirm ? 'Are you sure?' : (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice')}</h3>
                </div>
                
                <div className={`p-6 space-y-4 ${textGrad[isConfirm ? 'confirm' : type]} text-center`}>
                    <p className="text-sm font-semibold text-gray-700 leading-relaxed overflow-hidden text-ellipsis max-h-32 overflow-y-auto">
                        {message}
                    </p>
                </div>

                <div className="p-6 pt-0 flex gap-3 bg-white border-t border-gray-100 mt-4">
                    {isConfirm ? (
                        <>
                            <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-3 text-white font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 rounded-lg transition-all active:scale-[0.98]">
                                Confirm
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className={`w-full py-3 text-white font-bold rounded-lg transition-all active:scale-[0.98] bg-gradient-to-r ${gradient[type]}`}>
                            Okay
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
