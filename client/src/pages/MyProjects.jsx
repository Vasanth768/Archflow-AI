import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function MyProjects() {
    const navigate = useNavigate();
    const { projects, selectProject, duplicateProject, deleteProject } = useArchFlow();
    const [search, setSearch] = useState('');

    const handleSelectProject = (id) => {
        selectProject(id);
        navigate("/project-details");
    };

    const handleEditProject = (id) => {
        selectProject(id);
        navigate("/editor");
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.client.toLowerCase().includes(search.toLowerCase()) ||
        p.facing.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>My Design Database</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage your blueprints, elevations, client briefs, and review compliance states.</p>
                </div>
                <Link to="/new-project" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    New Project
                </Link>
            </div>

            {/* SEARCH AND FILTER */}
            <div className="glass-card" style={{ padding: 16, background: 'rgba(10,17,32,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24, display: 'flex', gap: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <svg style={{ position: 'absolute', top: 13, left: 14, color: 'var(--text-muted)' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input 
                        type="text" 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by plan name, client, facing direction..." 
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px 10px 38px', borderRadius: 6, color: 'white', fontSize: 13 }} 
                    />
                </div>
            </div>

            {/* PROJECTS GRID */}
            {filteredProjects.length === 0 ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center', background: 'rgba(10,17,32,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: 40 }}>📂</span>
                    <h3 style={{ marginTop: 16, fontSize: 16, color: 'var(--text-white)' }}>No Projects Found</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>We couldn't find any projects matching your search. Create a new plan to get started.</p>
                    <Link to="/new-project" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block', textDecoration: 'none' }}>Create First Design</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                    {filteredProjects.map(p => (
                        <div key={p.id} className="card" style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color-dark)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            {/* Card thumbnail */}
                            <div style={{ height: 160, background: '#0b0f19', display: 'flex', alignItems: 'center', justify: 'center', position: 'relative', borderBottom: '1px solid var(--border-color-dark)' }}>
                                <svg viewBox="0 0 100 100" style={{ width: 80, height: 80 }} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none">
                                    <rect x="5" y="5" width="90" height="90" strokeDasharray="2 2"/>
                                    <line x1="5" y1="50" x2="95" y2="50" strokeDasharray="2 2"/>
                                    <rect x="15" y="15" width="30" height="30"/>
                                    <rect x="55" y="15" width="30" height="30"/>
                                    <rect x="15" y="55" width="70" height="30"/>
                                </svg>
                                <span className={`status-chip ${p.status === "Finalized" ? "done" : "draft"}`} style={{ position: 'absolute', top: 12, right: 12, fontSize: 9 }}>{p.status}</span>
                                <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 10, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, color: 'white' }}>
                                    {p.width} x {p.length} ({p.area} sqft)
                                </div>
                            </div>

                            {/* Card content */}
                            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{p.name}</h3>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Client: <strong>{p.client}</strong></p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11, color: 'var(--text-secondary)', marginTop: 12, background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                                    <div>🧭 Facing: <strong>{p.facing}</strong></div>
                                    <div>🏢 Floors: <strong>{p.floors}</strong></div>
                                    <div>🛏️ Beds: <strong>{p.bedrooms}</strong></div>
                                    <div>🛁 Baths: <strong>{p.bathrooms}</strong></div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                                    <button onClick={() => handleSelectProject(p.id)} className="btn btn-secondary" style={{ flex: 1, padding: '8px 0', fontSize: 12 }}>Open</button>
                                    <button onClick={() => handleEditProject(p.id)} className="btn btn-ghost" style={{ padding: '8px 10px', fontSize: 12 }} title="Edit 2D Plan">✏️</button>
                                    <button onClick={() => duplicateProject(p.id)} className="btn btn-ghost" style={{ padding: '8px 10px', fontSize: 12 }} title="Duplicate">📋</button>
                                    <button onClick={() => deleteProject(p.id)} className="btn btn-ghost" style={{ padding: '8px 10px', fontSize: 12, color: 'var(--rose)' }} title="Delete">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
