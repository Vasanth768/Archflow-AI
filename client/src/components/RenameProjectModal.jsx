import React, { useState, useEffect, useRef } from 'react';

export default function RenameProjectModal({ isOpen, onClose, onSave, currentName = "" }) {
    const [name, setName] = useState(currentName);
    const [error, setError] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setName(currentName);
            setError(false);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 50);
        }
    }, [isOpen, currentName]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSave = (e) => {
        if (e) e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError(true);
            return;
        }
        onSave(trimmed);
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave(e);
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
                    maxWidth: 440,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                    animation: 'modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    fontFamily: `'Inter', sans-serif`
                }}
            >
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0, marginBottom: 6 }}>
                        Rename Project
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                        Update the project name below.
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Project Name
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); if (error) setError(false); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Project Name"
                        style={{
                            width: '100%',
                            height: 42,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: `1px solid ${error ? '#EF4444' : '#CBD5E1'}`,
                            backgroundColor: '#F8FAFC',
                            color: '#0F172A',
                            fontSize: 14,
                            fontWeight: 500,
                            outline: 'none',
                            transition: 'all 0.15s ease',
                            boxSizing: 'border-box',
                            boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
                        }}
                        onFocus={(e) => {
                            if (!error) e.target.style.borderColor = '#2563EB';
                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                            if (!error) e.target.style.borderColor = '#CBD5E1';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    {error && (
                        <span style={{ display: 'block', fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 500 }}>
                            Project name cannot be empty.
                        </span>
                    )}
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
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!name.trim()}
                        style={{
                            height: 38,
                            padding: '0 18px',
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: !name.trim() ? '#94A3B8' : '#2563EB',
                            color: '#FFFFFF',
                            fontSize: 13.5,
                            fontWeight: 600,
                            cursor: !name.trim() ? 'not-allowed' : 'pointer',
                            boxShadow: !name.trim() ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => { if (name.trim()) e.target.style.backgroundColor = '#1D4ED8'; }}
                        onMouseOut={(e) => { if (name.trim()) e.target.style.backgroundColor = '#2563EB'; }}
                    >
                        Save Changes
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
