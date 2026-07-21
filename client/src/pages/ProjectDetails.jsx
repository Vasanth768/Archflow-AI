import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function ProjectDetails() {
    const navigate = useNavigate();
    const { getActiveProject, updateProjectStyleSelection, showToast } = useArchFlow();
    const proj = getActiveProject();

    if (!proj) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }} className="fade-in">
                <span style={{ fontSize: 40 }}>⚠️</span>
                <h3 style={{ marginTop: 16, color: 'white' }}>No Active Project</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Please select or create a project first.</p>
                <Link to="/my-projects" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>View My Projects</Link>
            </div>
        );
    }

    const applyStyle = (styleName) => {
        updateProjectStyleSelection(proj.id, styleName);
        showToast(`Applied ${styleName} as active selection.`, "success");
    };

    const getStyleImage = (styleName) => {
        switch (styleName) {
            case "Budget Friendly": return "/assets/budget.png";
            case "Premium Luxury":
            case "Luxury": return "/assets/luxury.png";
            case "Minimalist White":
            case "Minimalist": return "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80";
            case "Traditional Modern":
            case "Traditional": return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
            default: return "/assets/standard.png";
        }
    };

    return (
        <div className="fade-in dash-layout-grid">
            {/* LEFT DETAILS AND VARIATIONS */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <span className="badge badge-indigo">Active Project Workspace</span>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginTop: 4 }}>{proj.name}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Link to="/editor" className="btn btn-primary" style={{ textDecoration: 'none' }}>✏️ Edit 2D Layout</Link>
                        <Link to="/viewer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>🏡 View 3D Exterior</Link>
                    </div>
                </div>

                {/* PROJECT SPECS */}
                <div className="glass-card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Configuration Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Dimensions</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginTop: 4 }}>{proj.width} x {proj.length} ft</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Total Area</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginTop: 4 }}>{proj.area} sqft</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Facing</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginTop: 4 }}>{proj.facing}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Style Selected</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--indigo-light)', marginTop: 4 }}>{proj.selectedStyle}</div>
                        </div>
                    </div>
                </div>

                {/* 3D STYLE VARIATIONS */}
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Available 3D Elevations swatches</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                        {proj.variations.map(v => (
                            <div key={v.name} className={v.name === proj.selectedStyle ? "card selected" : "card"} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: 130, position: 'relative' }}>
                                    <img src={getStyleImage(v.name)} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 8, padding: '2px 6px', borderRadius: 4 }}>{v.tag}</span>
                                </div>
                                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{v.name}</h4>
                                    <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4, flex: 1 }}>{v.desc}</p>
                                    <button 
                                        onClick={() => applyStyle(v.name)} 
                                        className={v.name === proj.selectedStyle ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                                        style={{ marginTop: 12, width: '100%' }}
                                    >
                                        {v.name === proj.selectedStyle ? "✓ Active Swatch" : "Apply Swatch"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR SPECIFICATIONS */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>Room Layout Specifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {proj.rooms.map(r => (
                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
                                <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{r.name}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{r.w} x {r.h} ft</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>Custom Materials Selection</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Facade Treatment:</span>
                            <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{proj.materials.facade}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Balcony Railing:</span>
                            <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{proj.materials.railings}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Ambient Lighting:</span>
                            <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{proj.materials.lighting}</span>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 'auto' }}>
                    <Link to="/export" className="btn btn-secondary btn-full" style={{ textDecoration: 'none', textAlign: 'center' }}>📥 Compile Submissions</Link>
                </div>
            </div>
        </div>
    );
}
