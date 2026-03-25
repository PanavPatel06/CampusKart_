/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';
import { AlertModal } from '../components/ui/AlertModal';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [config, setConfig] = useState({ isOpen: false, message: '', type: 'info', onConfirm: null, onCloseCallback: null });

    const showAlert = (message, type = 'info') => {
        setConfig({ isOpen: true, message, type, onConfirm: null, onCloseCallback: null });
    };
    
    const showConfirm = (message) => new Promise((resolve) => {
        setConfig({ 
            isOpen: true, 
            message, 
            type: 'confirm', 
            onConfirm: () => resolve(true), 
            onCloseCallback: () => resolve(false) 
        });
    });

    const close = () => {
        if (config.onCloseCallback && config.type === 'confirm') config.onCloseCallback();
        setConfig(prev => ({ ...prev, isOpen: false }));
    };

    const confirm = () => {
        if (config.onConfirm) config.onConfirm();
        setConfig(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <AlertModal 
                isOpen={config.isOpen} 
                message={config.message} 
                type={config.type} 
                onClose={close} 
                onConfirm={config.type === 'confirm' ? confirm : null} 
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => useContext(AlertContext);
