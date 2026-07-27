import React, { useEffect } from 'react';

export default function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Are you sure?", 
    message = "This action cannot be undone.", 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    variant = "danger"
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter') {
                onConfirm();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onConfirm]);

    if (!isOpen) return null;

    const getBtnColor = () => {
        switch (variant) {
            case 'danger': return '#EF4444';
            case 'warning': return '#F59E0B';
            case 'primary': default: return '#2563EB';
        }
    };

    const getBtnHoverColor = () => {
        switch (variant) {
            case 'danger': return '#DC2626';
            case 'warning': return '#D97706';
            case 'primary': default: return '#1D4ED8';
        }
    };

    const getIcon = () => {
        if (variant === 'danger') {
            return (
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
            );
        } else if (variant === 'warning') {
            return (
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
            );
        } else {
            return (
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
            );
        }
    };

    return (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(9, 13, 22, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                animation: 'modalFadeIn 0.2s ease-out'
            }}
        >
            <div 
                style={{
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    width: '100%',
                    maxWidth: 420,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                    animation: 'modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    fontFamily: `'Inter', sans-serif`
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {getIcon()}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0, marginBottom: 6 }}>
                            {title}
                        </h3>
                        <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                            {message}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            height: 38,
                            padding: '0 16px',
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            color: '#475569',
                            fontSize: 13.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => { e.target.style.backgroundColor = '#F1F5F9'; e.target.style.color = '#0F172A'; }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = '#FFFFFF'; e.target.style.color = '#475569'; }}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            height: 38,
                            padding: '0 18px',
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: getBtnColor(),
                            color: '#FFFFFF',
                            fontSize: 13.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: `0 4px 12px ${variant === 'danger' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                            transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => { e.target.style.backgroundColor = getBtnHoverColor(); }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = getBtnColor(); }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScaleUp {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
