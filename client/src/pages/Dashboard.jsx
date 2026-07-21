import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Dashboard() {
    const { projects } = useArchFlow();
    const [currentTime, setCurrentTime] = useState('');
    const [credits, setCredits] = useState(100);

    useEffect(() => {
        // Date formatting matching legacy
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const today = new Date();
        setCurrentTime(`Live • ${today.toLocaleDateString('en-US', options)}`);
        
        const savedCredits = localStorage.getItem("archflow_credits");
        if (savedCredits) {
            setCredits(parseInt(savedCredits) || 100);
        }
    }, []);    return (
        <>
            {/* HERO BANNER */}
            <div className="hero-banner fade-in">
                <div>
                    <div className="hero-live-badge">
                        <div className="online-dot"></div>
                        <span id="dashboard-current-time-badge">{currentTime}</span>
                    </div>
                    <h1 className="hero-title">
                        <span id="dashboard-dynamic-greeting">Good Morning, <span className="gradient-name">Architect!</span></span>
                    </h1>
                    <p className="hero-sub">Workspace database initialized. You have access to real-time 2D drafting blueprint engine &amp; 3D rendering cluster.</p>
                </div>
                <Link to="/new-project" className="hero-btn">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    Start Designing Plan
                </Link>
            </div>

            {/* KPI GRID */}
            <div className="kpi-grid">
                {/* Projects */}
                <div className="kpi-card kpi-indigo">
                    <div className="kpi-header">
                        <div className="kpi-label">Active Projects</div>
                        <div className="kpi-icon-wrap bg-indigo">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"/></svg>
                        </div>
                    </div>
                    <div className="kpi-value" id="stat-total-projects">{projects.length}</div>
                    <div className="kpi-trend up">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                        Up to date
                    </div>
                    <div className="kpi-ring-wrap">
                        <svg className="kpi-ring" width="44" height="44" viewBox="0 0 44 44">
                            <circle className="ring-track" cx="22" cy="22" r="14" fill="none" strokeWidth="3"/>
                            <circle className="ring-fill" cx="22" cy="22" r="14" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="88" strokeDashoffset={Math.max(0, 88 - (projects.length * 10))} />
                        </svg>
                    </div>
                </div>

                {/* Credits */}
                <div className="kpi-card kpi-amber">
                    <div className="kpi-header">
                        <div className="kpi-label">AI Render Credits</div>
                        <div className="kpi-icon-wrap bg-amber">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        </div>
                    </div>
                    <div className="kpi-value" id="stat-credits">{credits}</div>
                    <div className="kpi-trend warn">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        Auto-renewing
                    </div>
                    <div className="kpi-ring-wrap">
                        <svg className="kpi-ring" width="44" height="44" viewBox="0 0 44 44">
                            <circle className="ring-track" cx="22" cy="22" r="14" fill="none" strokeWidth="3"/>
                            <circle className="ring-fill" cx="22" cy="22" r="14" fill="none" stroke="#f59e0b" stroke-width="3" strokeDasharray="88" strokeDashoffset={88 - credits} />
                        </svg>
                    </div>
                </div>

                {/* Exports */}
                <div className="kpi-card kpi-blue">
                    <div className="kpi-header">
                        <div className="kpi-label">Presentation Exports</div>
                        <div className="kpi-icon-wrap bg-blue">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                    </div>
                    <div className="kpi-value" id="stat-exports">{projects.filter(p => p.status === "Finalized").length}</div>
                    <div className="kpi-trend info">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        All finalized
                    </div>
                    <div className="kpi-ring-wrap">
                        <svg className="kpi-ring" width="44" height="44" viewBox="0 0 44 44">
                            <circle className="ring-track" cx="22" cy="22" r="14" fill="none" strokeWidth="3"/>
                            <circle className="ring-fill" cx="22" cy="22" r="14" fill="none" stroke="#3b82f6" strokeWidth="3"/>
                        </svg>
                    </div>
                </div>

                {/* Team */}
                <div className="kpi-card kpi-violet">
                    <div className="kpi-header">
                        <div className="kpi-label">Team Workspace</div>
                        <div className="kpi-icon-wrap bg-violet">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </div>
                    </div>
                    <div className="kpi-value">1 <span className="kpi-unit">/ 5</span></div>
                    <div className="kpi-trend violet">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        Admin active
                    </div>
                    <div className="kpi-ring-wrap">
                        <svg className="kpi-ring" width="44" height="44" viewBox="0 0 44 44">
                            <circle className="ring-track" cx="22" cy="22" r="14" fill="none" strokeWidth="3"/>
                            <circle className="ring-fill" cx="22" cy="22" r="14" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="88" strokeDashoffset="70" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className="dash-grid">
                {/* TELEMETRY CHART */}
                <div className="glass-card chart-card fade-in">
                    <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Render Telemetry</h3>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Live credit consumption &amp; cluster health</span>
                        </div>
                        <span className="status-chip done" style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: 99 }}>Active Cluster</span>
                    </div>

                    <div className="chart-legend" style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="legend-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }}></div>Credits Used</div>
                        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="legend-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee' }}></div>Node Load</div>
                    </div>

                    <div className="chart-wrap">
                        <svg viewBox="0 0 560 140" style={{ width: '100%', height: 140 }} xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                                </linearGradient>
                                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2"/>
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            <line x1="0" y1="25" x2="560" y2="25" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                            <line x1="0" y1="65" x2="560" y2="65" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                            <line x1="0" y1="105" x2="560" y2="105" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                            
                            <path d="M 0 110 C 40 110, 60 75, 80 80 S 140 40, 160 45 S 230 70, 250 60 S 330 20, 360 30 S 430 50, 460 40 L 560 25 L 560 130 L 0 130 Z" fill="url(#grad1)"/>
                            <path d="M 0 90 C 50 90, 80 100, 110 85 S 170 60, 200 70 S 280 50, 320 55 S 400 65, 440 55 L 560 45 L 560 130 L 0 130 Z" fill="url(#grad2)"/>
                            
                            <path d="M 0 110 C 40 110, 60 75, 80 80 S 140 40, 160 45 S 230 70, 250 60 S 330 20, 360 30 S 430 50, 460 40 L 560 25" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
                            <path d="M 0 90 C 50 90, 80 100, 110 85 S 170 60, 200 70 S 280 50, 320 55 S 400 65, 440 55 L 560 45" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
                            
                            <circle cx="360" cy="30" r="4" fill="#6366f1" stroke="rgba(10,17,32,0.8)" strokeWidth="2"/>
                            <circle cx="560" cy="25" r="4" fill="#6366f1" stroke="rgba(10,17,32,0.8)" strokeWidth="2"/>
                            <circle cx="320" cy="55" r="4" fill="#22d3ee" stroke="rgba(10,17,32,0.8)" strokeWidth="2"/>
                        </svg>
                    </div>

                    <div className="telemetry-metrics">
                        <div className="telemetry-metric">
                            <div className="tm-label">Active Cluster</div>
                            <div className="tm-value">AP-SOUTH-02</div>
                        </div>
                        <div className="telemetry-metric">
                            <div className="tm-label">Avg Latency</div>
                            <div className="tm-value">210 ms</div>
                        </div>
                        <div className="telemetry-metric">
                            <div className="tm-label">Node Health</div>
                            <div className="tm-value">99.98%</div>
                        </div>
                    </div>
                </div>

                {/* PROJECTS LIST PANEL */}
                <div className="glass-card proj-table-card fade-in">
                    <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Drafts</h3>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Quick launch or edit drafts</span>
                        </div>
                        <Link to="/my-projects" style={{ fontSize: 12, color: 'var(--accent-indigo)', textDecoration: 'none', fontWeight: 600 }}>View All</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, maxHeight: 220 }}>
                        {projects.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                                No projects generated yet.
                                <Link to="/new-project" style={{ display: 'block', color: 'var(--accent-indigo)', marginTop: 8, textDecoration: 'none', fontWeight: 600 }}>Create New project</Link>
                            </div>
                        ) : (
                            projects.slice(0, 3).map(p => (
                                <Link to={`/project-details`} key={p.id} className="card" style={{ display: 'flex', gap: 14, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, textDecoration: 'none', color: 'inherit', alignItems: 'center' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: '#0f172a', flexShrink: 0 }}>
                                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none">
                                            <rect x="10" y="10" width="80" height="80"/>
                                            <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="3"/>
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-1)' }}>{p.name}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{p.width}x{p.length} • {p.facing} Facing • {p.floors} Floor</div>
                                    </div>
                                    <span className={`status-chip ${p.status === "Finalized" ? "done" : "draft"}`} style={{ fontSize: 9 }}>{p.status}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
