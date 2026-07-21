import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Templates() {
    const navigate = useNavigate();
    const { createProject, showToast } = useArchFlow();

    const handleApplyTemplate = (title, width, length, facing) => {
        createProject({
            name: `${title} - Standard`,
            client: "Self",
            width,
            length,
            facing,
            floors: 1,
            bedrooms: 2,
            bathrooms: 2,
            style: "Standard Modern",
            budget: "Mid Range",
            prompt: `Template generation for ${width}x${length} facing ${facing}`
        });

        showToast(`Template ${title} loaded as active draft!`, "success");
        navigate("/editor");
    };

    const templatesList = [
        { title: "Standard 30x40 East Face", desc: "Most popular layout size in Indian residential areas. Optimized for morning sun in living hall, and North-East Pooja space.", width: 30, length: 40, facing: "East" },
        { title: "Compact 20x30 North Face", desc: "Space-optimized structure for narrow city plots. Places bedrooms in South-West stability zones.", width: 20, length: 30, facing: "North" },
        { title: "Spacious 40x60 West Face", desc: "Large luxury villa template. Double height entrance porch, parking space, and rear garden margins.", width: 40, length: 60, facing: "West" }
    ];

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Architectural Templates Library</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Accelerate design workflows by launching standardized plot sizes and configurations instantly.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                {templatesList.map(t => (
                    <div key={t.title} className="card" style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color-dark)', borderRadius: 12, overflow: 'hidden', padding: 24, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{t.title}</h3>
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 4 }}>{t.width}x{t.length} ft</span>
                            <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: 'var(--indigo-light)', padding: '2px 8px', borderRadius: 4 }}>🧭 {t.facing} Facing</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.5, flex: 1 }}>{t.desc}</p>
                        <button onClick={() => handleApplyTemplate(t.title, t.width, t.length, t.facing)} className="btn btn-primary" style={{ marginTop: 20, width: '100%', padding: '10px 0', fontSize: 13 }}>
                            Launch Template
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
