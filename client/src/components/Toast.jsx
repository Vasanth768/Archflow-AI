import React from 'react';

export default function Toast({ toast, onClose }) {
    if (!toast) return null;

    const { message, type = "success" } = toast;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
            case 'danger':
                return (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return '#10B981';
            case 'error':
            case 'danger': return '#EF4444';
            case 'warning': return '#F59E0B';
            case 'info':
            default: return '#3B82F6';
        }
    };

    return (
        <div 
            className="toast-notification show"
            style={{
                position: 'fixed',
                top: 24,
                right: 24,
                bottom: 'auto',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #E2E8F0',
                borderLeft: `4px solid ${getBorderColor()}`,
                borderRadius: 12,
                padding: '14px 18px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: `'Inter', sans-serif`,
                animation: 'toastSlideInTop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                minWidth: 280,
                maxWidth: 420
            }}
        >
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {getIcon()}
            </div>
            <div style={{ flex: 1, lineHeight: 1.4 }}>
                {message}
            </div>
            {onClose && (
                <button 
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 6
                    }}
                >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            )}
            <style>{`
                @keyframes toastSlideInTop {
                    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
