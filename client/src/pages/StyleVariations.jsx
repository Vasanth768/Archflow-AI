import React from 'react';
import { Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function StyleVariations() {
    const { getActiveProject, updateProjectStyleSelection, showToast, IMAGES } = useArchFlow();
    const proj = getActiveProject();

    if (!proj) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <span style={{ fontSize: 40 }}>⚠️</span>
                <h3 style={{ marginTop: 16, color: 'white' }}>No Active Project</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Select a project to review style variations.</p>
                <Link to="/my-projects" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>View Projects</Link>
            </div>
        );
    }

    const applyStyle = (styleName) => {
        updateProjectStyleSelection(proj.id, styleName);
        showToast(`Applied ${styleName} as active selection.`, "success");
    };

    const getStyleImage = (styleName) => {
        switch (styleName) {
            case "Budget Friendly": return IMAGES.budget;
            case "Premium Luxury": return IMAGES.luxury;
            case "Minimalist White": return IMAGES.minimalist;
            case "Traditional Modern": return IMAGES.traditional;
            default: return IMAGES.standard;
        }
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>3D Elevation Style Variations</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Compare different architectural finishes, cantilever styles, and rooflines for {proj.name}.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                {proj.variations.map(v => (
                    <div key={v.name} className="card" style={{ background: 'var(--bg-dark-card)', border: v.name === proj.selectedStyle ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color-dark)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: 160, position: 'relative' }}>
                            <img src={getStyleImage(v.name)} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 9, padding: '4px 8px', borderRadius: 4 }}>{v.tag}</span>
                        </div>
                        <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{v.name}</h3>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5, flex: 1 }}>{v.desc}</p>
                            
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button 
                                    onClick={() => applyStyle(v.name)} 
                                    className={v.name === proj.selectedStyle ? "btn btn-primary" : "btn btn-secondary"}
                                    style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
                                >
                                    {v.name === proj.selectedStyle ? "✓ Active Elevation" : "Apply Elevation"}
                                </button>
                                <Link to="/viewer" className="btn btn-ghost" style={{ textDecoration: 'none', padding: '10px 14px' }}>🏡 View</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
