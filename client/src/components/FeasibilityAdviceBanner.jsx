import React from 'react';
import { AlertTriangle, X, Lightbulb } from 'lucide-react';

/**
 * FeasibilityAdviceBanner.jsx - Accessible, Dismissible Feasibility Guidance Banner (Stage 8E-A)
 * 
 * Strict Architectural Contract & Safety Mandates:
 * 1. Accessibility: Marked with role="status", aria-live="polite", and accessible dismiss button.
 * 2. Cautious Language: Explicitly labeled as experimental planning guidance, not legal building-code advice
 *    or structural guarantees.
 * 3. No Raw Uncalibrated Percentages: Uses qualitative assessment labels rather than uncalibrated percentage claims.
 * 4. Immutability: Displays guidance for user information only; does not silently override user requirements.
 */
export default function FeasibilityAdviceBanner({ advice, onDismiss, onSelectAlternative }) {
    if (!advice) return null;

    // Only render when the status indicates constrained/tight spatial conditions
    const isWarning = advice.status === 'CONSTRAINED_WARNING' || advice.is_feasible === false;
    if (!isWarning) return null;

    const warnings = advice.warnings || [];
    const alternatives = advice.proposed_alternatives || [];

    return (
        <div 
            className="feasibility-advice-banner"
            role="status"
            aria-live="polite"
            style={{
                marginTop: '16px',
                marginBottom: '16px',
                padding: '14px 16px',
                borderRadius: '8px',
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                color: '#92400E',
                position: 'relative'
            }}
        >
            {/* Header with Title & Dismiss Button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#B45309' }}>
                        Experimental Planning Guidance
                    </span>
                    <span style={{
                        fontSize: '11px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #FDE68A'
                    }}>
                        Advisory Only
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss feasibility advice"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: '#92400E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.8
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Warnings Body */}
            <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: '1.5', color: '#78350F' }}>
                {warnings.map((w, idx) => (
                    <p key={idx} style={{ margin: '4px 0' }}>
                        • {w}
                    </p>
                ))}
            </div>

            {/* Proposed Alternatives (if available) */}
            {alternatives.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #FDE68A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#92400E' }}>
                        <Lightbulb size={14} color="#D97706" />
                        <span>Planning Considerations:</span>
                    </div>
                    <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '12px', color: '#78350F' }}>
                        {alternatives.map((alt, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                                <strong>{alt.recommendation}</strong>: {alt.reason}{' '}
                                {alt.feasibility_assessment && (
                                    <span style={{ fontStyle: 'italic', color: '#B45309' }}>
                                        ({alt.feasibility_assessment === 'HIGH_LIKELIHOOD' ? 'Favorable preliminary index' : 'Moderate preliminary index'})
                                    </span>
                                )}
                                {onSelectAlternative && (
                                    <button
                                        type="button"
                                        onClick={() => onSelectAlternative(alt)}
                                        style={{
                                            marginLeft: '8px',
                                            padding: '2px 8px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            background: '#FFFFFF',
                                            border: '1px solid #D97706',
                                            borderRadius: '4px',
                                            color: '#B45309',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Consider this BHK
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Non-Authoritative Statutory Disclaimer */}
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#A16207', fontStyle: 'italic' }}>
                Note: Preliminary neural estimate for planning guidance. Not a certified building-code or structural guarantee. Final constructible CAD geometry is determined authoritatively by DynamicLayoutSolver.
            </div>
        </div>
    );
}
