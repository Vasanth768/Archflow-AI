import React from 'react';

export default function Docs() {
    return (
        <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Help Center &amp; Documentation</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Access drafting tips, Vastu rules, and tutorials on exporting client presentation dossiers.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="glass-card" style={{ padding: 24, background: 'rgba(10,17,32,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 12 }}>1. Canvas Keyboard Shortcuts</h3>
                    <ul style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
                        <li><strong>Click + Drag:</strong> Moves selected room block snaps across the grid coordinate boundaries.</li>
                        <li><strong>Drag Corner Handle:</strong> Resizes rooms while enforcing a minimum width and height spacing.</li>
                        <li><strong>Save Blueprint button:</strong> Backs up coordinates to local workspace database cache.</li>
                    </ul>
                </div>

                <div className="glass-card" style={{ padding: 24, background: 'rgba(10,17,32,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 12 }}>2. Vastu Placement Guidelines</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>Ensure high Vastu scores by placing kitchen entities in the South-East corner (Fire quadrant), master bedrooms in the South-West (Earth quadrant), and prayer Pooja spaces in the North-East corner (Water quadrant).</p>
                </div>
            </div>
        </div>
    );
}
