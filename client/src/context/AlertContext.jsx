import { createContext, useContext, useState, useCallback } from 'react';
import AlertModal from '../components/ui/AlertModal';

const AlertContext = createContext();

export function AlertProvider({ children }) {
    const [alertConfig, setAlertConfig] = useState(null);

    const showAlert = useCallback((message, type = 'success', waitDuration = 3000) => {
        setAlertConfig({ message, type, showConfirm: false });
        // Auto-hide alert after duration
        if (waitDuration) {
            setTimeout(() => setAlertConfig(null), waitDuration);
        }
    }, []);

    const showConfirm = useCallback((message, type = 'danger') => {
        return new Promise((resolve) => {
            setAlertConfig({
                message,
                type,
                showConfirm: true,
                onConfirm: () => {
                    setAlertConfig(null);
                    resolve(true);
                },
                onCancel: () => {
                    setAlertConfig(null);
                    resolve(false);
                }
            });
        });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertConfig(null);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {alertConfig && (
                <AlertModal
                    isOpen={!!alertConfig}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    showConfirm={alertConfig.showConfirm}
                    onConfirm={alertConfig.onConfirm}
                    onCancel={alertConfig.onCancel}
                    onClose={closeAlert}
                />
            )}
        </AlertContext.Provider>
    );
}

export const useAlert = () => useContext(AlertContext);
