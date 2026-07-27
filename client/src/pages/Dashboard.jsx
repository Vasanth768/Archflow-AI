import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';
import RenameProjectModal from '../components/RenameProjectModal';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Dashboard() {
    const { projects, duplicateProject, deleteProject, renameProject, archiveProject } = useArchFlow();
    const navigate = useNavigate();
    const [userName, setUserName] = useState("Ramesh");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [renameModalProject, setRenameModalProject] = useState(null);
    const [deleteModalProject, setDeleteModalProject] = useState(null);
    const [archiveModalProject, setArchiveModalProject] = useState(null);

    useEffect(() => {
        const savedProfile = localStorage.getItem("archflow_profile_name");
        if (savedProfile) {
            const first = savedProfile.split(" ")[0];
            setUserName(first);
        }
    }, []);

    // Dismiss 3-dot dropdown on outside click or Escape key
    useEffect(() => {
        const handleOutsideClick = () => {
            if (activeMenuId !== null) {
                setActiveMenuId(null);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && activeMenuId !== null) {
                setActiveMenuId(null);
            }
        };
        window.addEventListener('click', handleOutsideClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('click', handleOutsideClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeMenuId]);

    // Ensure exactly 4 project items matching the reference UI presentation
    const fallbackProjects = [
        { id: 'f1', name: '30x40 East Facing House', client: 'Ramesh C', width: 30, length: 40, floors: 2, status: 'In Progress', time: '2 hours ago', badge: 'ref-badge-blue' },
        { id: 'f2', name: 'Duplex Villa - 40x60', client: 'Suresh Builders', width: 40, length: 60, floors: 2, status: 'AI Generated', time: '1 day ago', badge: 'ref-badge-green' },
        { id: 'f3', name: 'Modern House - 20x30', client: 'Kumar Family', width: 20, length: 30, floors: 1, status: 'Completed', time: '2 days ago', badge: 'ref-badge-teal' },
        { id: 'f4', name: 'Premium Villa - 50x80', client: 'Greenfield Developers', width: 50, length: 80, floors: 2, status: 'In Progress', time: '3 days ago', badge: 'ref-badge-blue' }
    ];

    const existingIds = new Set((projects || []).map(p => p.id));
    const displayProjects = (projects || []).slice(0, 4).map((p, idx) => {
        const fb = fallbackProjects[idx % 4] || {};
        return {
            id: p.id || `p-${idx}`,
            name: p.name || fb.name || "Untitled Project",
            client: p.client || fb.client || "Self",
            width: p.width || fb.width || 30,
            length: p.length || fb.length || 40,
            floors: p.floors || fb.floors || 1,
            status: p.status === 'Finalized' ? 'Completed' : (p.status || fb.status || "In Progress"),
            time: p.time || fb.time || "Just now",
            badge: p.status === 'Finalized' ? 'ref-badge-teal' : (p.badge || fb.badge || "ref-badge-blue")
        };
    });

    for (const fb of fallbackProjects) {
        if (displayProjects.length < 4 && !existingIds.has(fb.id)) {
            displayProjects.push(fb);
            existingIds.add(fb.id);
        }
    }

    const toggleMenu = (e, id) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    return (
        <div>
            {/* HERO BANNER SECTION */}
            <div className="ref-hero-card">
                <div className="ref-hero-left">
                    <h1 className="ref-hero-title">
                        Welcome back, {userName} 👋
                    </h1>
                    <p className="ref-hero-sub">
                        Create stunning floor plans, 3D designs and wow your clients with AI.
                    </p>
                    <Link to="/new-project" className="ref-hero-btn">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>New Project</span>
                        <span className="ref-hero-btn-arrow">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                        </span>
                    </Link>
                </div>

                <div className="ref-hero-right">
                    <img src="/assets/luxury.png" className="ref-hero-img" alt="Modern Architectural House Render" />
                </div>
            </div>

            {/* TWO COLUMN MAIN GRID */}
            <div className="ref-grid-layout">
                {/* LEFT COLUMN */}
                <div className="ref-col-left">
                    {/* STATS ROW (3 CARDS) */}
                    <div className="ref-stats-row">
                        {/* 1. Total Projects */}
                        <div className="ref-stat-card" onClick={() => navigate('/my-projects')} style={{cursor:'pointer'}}>
                            <div className="ref-stat-top">
                                <span className="ref-stat-label">Total Projects</span>
                                <div className="ref-stat-icon-box" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"/></svg>
                                </div>
                            </div>
                            <div className="ref-stat-val" id="stat-total-projects">{projects && projects.length ? projects.length : 24}</div>
                            <div className="ref-stat-trend">
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                <span>↑ 12% this month</span>
                            </div>
                        </div>

                        {/* 2. Plans Generated */}
                        <div className="ref-stat-card" onClick={() => navigate('/my-projects')} style={{cursor:'pointer'}}>
                            <div className="ref-stat-top">
                                <span className="ref-stat-label">Plans Generated</span>
                                <div className="ref-stat-icon-box" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                </div>
                            </div>
                            <div className="ref-stat-val">48</div>
                            <div className="ref-stat-trend">
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                <span>↑ 18% this month</span>
                            </div>
                        </div>

                        {/* 3. 3D Designs */}
                        <div className="ref-stat-card" onClick={() => navigate('/viewer')} style={{cursor:'pointer'}}>
                            <div className="ref-stat-top">
                                <span className="ref-stat-label">3D Designs</span>
                                <div className="ref-stat-icon-box" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                </div>
                            </div>
                            <div className="ref-stat-val">36</div>
                            <div className="ref-stat-trend">
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                <span>↑ 16% this month</span>
                            </div>
                        </div>
                    </div>

                    {/* RECENT PROJECTS CARD */}
                    <div className="ref-card">
                        <div className="ref-card-head">
                            <h2 className="ref-card-title">Recent Projects</h2>
                            <Link to="/my-projects" className="ref-card-link">View All Projects -&gt;</Link>
                        </div>

                        <div className="ref-project-list">
                            {displayProjects.map((p, idx) => (
                                <div className="ref-project-row" key={p.id || idx}>
                                    <div className="ref-proj-thumbs">
                                        {/* House Preview Thumbnail */}
                                        <img src={idx % 2 === 0 ? "/assets/standard.png" : "/assets/luxury.png"} className="ref-proj-img" alt="House thumbnail" />
                                        {/* 2D Blueprint Floor Plan Thumbnail */}
                                        <div className="ref-proj-blueprint" title="2D Blueprint Floor Plan">
                                            <svg viewBox="0 0 100 75" className="ref-blueprint-svg">
                                                <rect width="100" height="75" fill="#ffffff" />
                                                <path d="M 0 15 L 100 15 M 0 30 L 100 30 M 0 45 L 100 45 M 0 60 L 100 60 M 20 0 L 20 75 M 40 0 L 40 75 M 60 0 L 60 75 M 80 0 L 80 75" stroke="#f1f5f9" strokeWidth="0.8" />
                                                <rect x="8" y="8" width="84" height="59" fill="none" stroke="#334155" strokeWidth="2.5" />
                                                <line x1="50" y1="8" x2="50" y2="67" stroke="#334155" strokeWidth="1.8" />
                                                <line x1="8" y1="38" x2="50" y2="38" stroke="#334155" strokeWidth="1.8" />
                                                <line x1="50" y1="33" x2="92" y2="33" stroke="#334155" strokeWidth="1.8" />
                                                <path d="M 32 38 Q 32 28 22 28" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,1" />
                                                <path d="M 50 22 Q 60 22 60 32" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,1" />
                                                <rect x="13" y="13" width="14" height="11" fill="none" stroke="#64748b" strokeWidth="0.8" />
                                                <rect x="60" y="42" width="20" height="15" fill="none" stroke="#64748b" strokeWidth="0.8" />
                                                <line x1="8" y1="4" x2="92" y2="4" stroke="#94a3b8" strokeWidth="0.7" />
                                                <line x1="4" y1="8" x2="4" y2="67" stroke="#94a3b8" strokeWidth="0.7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ref-proj-info">
                                        <div className="ref-proj-name">{p.name}</div>
                                        <div className="ref-proj-client">Client: {p.client}</div>
                                        <div className="ref-proj-meta">
                                            <span>{p.width} X {p.length} ft</span>
                                            <span>•</span>
                                            <span>{p.floors} {p.floors === 1 ? 'Floor' : 'Floors'}</span>
                                        </div>
                                    </div>
                                    <div className="ref-proj-badge-col">
                                        <span className={`ref-proj-badge ${p.badge}`}>{p.status}</span>
                                    </div>
                                    <div className="ref-proj-time">
                                        <span style={{ fontSize: 11.5, color: '#94A3B8', display: 'block', marginBottom: 2 }}>Updated</span>
                                        <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>{p.time}</span>
                                    </div>
                                    <div className="ref-proj-actions">
                                        <button type="button" className="ref-action-btn" title="Open Folder" onClick={() => navigate('/my-projects')}>
                                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"/></svg>
                                        </button>
                                        <button type="button" className="ref-action-btn" title="More Options" aria-label="More Options" aria-haspopup="true" aria-expanded={activeMenuId === p.id} onClick={(e) => toggleMenu(e, p.id)}>
                                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                                        </button>

                                        {/* Enterprise 3-Dot Dropdown Menu */}
                                        {activeMenuId === p.id && (
                                            <div className="ref-dropdown-menu" onClick={(e) => e.stopPropagation()} role="menu" aria-label="Project Options">
                                                <button type="button" className="ref-dropdown-item" role="menuitem" onClick={() => { navigate('/my-projects'); setActiveMenuId(null); }}>
                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                    <span>Open</span>
                                                </button>
                                                <button type="button" className="ref-dropdown-item" role="menuitem" onClick={() => { setRenameModalProject(p); setActiveMenuId(null); }}>
                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                    <span>Rename</span>
                                                </button>
                                                <button type="button" className="ref-dropdown-item" role="menuitem" onClick={() => { duplicateProject(p.id); setActiveMenuId(null); }}>
                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
                                                    <span>Duplicate</span>
                                                </button>
                                                <button type="button" className="ref-dropdown-item" role="menuitem" onClick={() => { setArchiveModalProject(p); setActiveMenuId(null); }}>
                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                                                    <span>Archive</span>
                                                </button>
                                                <div className="ref-dropdown-divider"></div>
                                                <button type="button" className="ref-dropdown-item ref-dropdown-delete" role="menuitem" onClick={() => { setDeleteModalProject(p); setActiveMenuId(null); }}>
                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* QUICK ACTIONS SECTION */}
                    <div className="ref-quick-actions-section">
                        <h2 className="ref-card-title">Quick Actions</h2>
                        <div className="ref-quick-grid">
                            <Link to="/new-project" className="ref-quick-btn">
                                <div className="ref-quick-icon">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                </div>
                                <span className="ref-quick-label">New Project</span>
                            </Link>

                            <Link to="/new-project?mode=ai" className="ref-quick-btn">
                                <div className="ref-quick-icon">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                </div>
                                <span className="ref-quick-label">AI Generate</span>
                            </Link>

                            <Link to="/editor" className="ref-quick-btn">
                                <div className="ref-quick-icon">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                </div>
                                <span className="ref-quick-label">2D Editor</span>
                            </Link>

                            <Link to="/viewer" className="ref-quick-btn">
                                <div className="ref-quick-icon">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </div>
                                <span className="ref-quick-label">3D Viewer</span>
                            </Link>

                            <Link to="/style-variations" className="ref-quick-btn">
                                <div className="ref-quick-icon">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                </div>
                                <span className="ref-quick-label">3D Variations</span>
                            </Link>

                            <Link to="/export" className="ref-quick-btn">
                                <div className="ref-quick-icon">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                </div>
                                <span className="ref-quick-label">Export / Share</span>
                            </Link>

                            <Link to="/templates" className="ref-quick-btn">
                                <div className="ref-quick-icon">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
                                </div>
                                <span className="ref-quick-label">Templates</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="ref-col-right">
                    {/* USAGE / EXPORTS CARD (4TH STAT CARD) */}
                    <div className="ref-card">
                        <div className="ref-card-head">
                            <h2 className="ref-card-title">Exports</h2>
                            <select className="ref-usage-select" aria-label="Timeframe selector">
                                <option>This Month</option>
                                <option>Last Month</option>
                                <option>All Time</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div className="ref-usage-big-val">19</div>
                                <div className="ref-stat-trend" style={{ marginTop: 4 }}>
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                    <span>↑ 8% this month</span>
                                </div>
                            </div>
                            <div className="ref-stat-icon-box" style={{ backgroundColor: '#FEF3C7', color: '#D97706', width: 32, height: 32, borderRadius: 8 }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            </div>
                        </div>

                        <div className="ref-divider"></div>

                        <div className="ref-progress-list">
                            <div className="ref-progress-item">
                                <div className="ref-progress-top">
                                    <span>AI Generations</span>
                                    <strong>48 / 100</strong>
                                </div>
                                <div className="ref-progress-track">
                                    <div className="ref-progress-bar ref-bar-purple" style={{ width: '48%' }}></div>
                                </div>
                            </div>

                            <div className="ref-progress-item">
                                <div className="ref-progress-top">
                                    <span>3D Renders</span>
                                    <strong>36 / 100</strong>
                                </div>
                                <div className="ref-progress-track">
                                    <div className="ref-progress-bar ref-bar-blue" style={{ width: '36%' }}></div>
                                </div>
                            </div>

                            <div className="ref-progress-item">
                                <div className="ref-progress-top">
                                    <span>Exports</span>
                                    <strong>19 / 50</strong>
                                </div>
                                <div className="ref-progress-track">
                                    <div className="ref-progress-bar ref-bar-orange" style={{ width: '38%' }}></div>
                                </div>
                            </div>
                        </div>

                        <Link to="/export" className="ref-usage-btn">
                            View Usage Details -&gt;
                        </Link>
                    </div>

                    {/* QUICK TEMPLATES CARD */}
                    <div className="ref-card">
                        <div className="ref-card-head">
                            <h2 className="ref-card-title">Quick Templates</h2>
                            <Link to="/templates" className="ref-card-link">View All</Link>
                        </div>

                        <div className="ref-templates-grid">
                            <div className="ref-template-card" onClick={() => navigate('/templates')}>
                                <img src="/assets/standard.png" className="ref-template-img" alt="30x40 House" />
                                <div className="ref-template-info">
                                    <div className="ref-template-title">30x40 House</div>
                                    <div className="ref-template-sub">2 Floors</div>
                                </div>
                            </div>

                            <div className="ref-template-card" onClick={() => navigate('/templates')}>
                                <img src="/assets/budget.png" className="ref-template-img" alt="20x30 House" />
                                <div className="ref-template-info">
                                    <div className="ref-template-title">20x30 House</div>
                                    <div className="ref-template-sub">1 Floor</div>
                                </div>
                            </div>

                            <div className="ref-template-card" onClick={() => navigate('/templates')}>
                                <img src="/assets/luxury.png" className="ref-template-img" alt="Duplex Villa" />
                                <div className="ref-template-info">
                                    <div className="ref-template-title">Duplex Villa</div>
                                    <div className="ref-template-sub">2 Floors</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RECENT ACTIVITY CARD */}
                    <div className="ref-card">
                        <div className="ref-card-head">
                            <h2 className="ref-card-title">Recent Activity</h2>
                            <Link to="/my-projects?tab=activity" className="ref-card-link">View All</Link>
                        </div>

                        <div className="ref-activity-list">
                            <div className="ref-activity-item">
                                <div className="ref-activity-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                </div>
                                <div className="ref-activity-text">
                                    <div className="ref-activity-title">30x40 East Facing House</div>
                                    <div className="ref-activity-sub">Floor plan updated</div>
                                </div>
                                <span className="ref-activity-time">2 hours ago</span>
                            </div>

                            <div className="ref-activity-item">
                                <div className="ref-activity-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                </div>
                                <div className="ref-activity-text">
                                    <div className="ref-activity-title">Duplex Villa - 40x60</div>
                                    <div className="ref-activity-sub">3D design generated</div>
                                </div>
                                <span className="ref-activity-time">1 day ago</span>
                            </div>

                            <div className="ref-activity-item">
                                <div className="ref-activity-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                </div>
                                <div className="ref-activity-text">
                                    <div className="ref-activity-title">Modern House - 20x30</div>
                                    <div className="ref-activity-sub">Project exported</div>
                                </div>
                                <span className="ref-activity-time">2 days ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Modal Dialogs */}
            <RenameProjectModal
                isOpen={!!renameModalProject}
                onClose={() => setRenameModalProject(null)}
                onSave={(newName) => renameModalProject && renameProject(renameModalProject.id, newName)}
                currentName={renameModalProject?.name || ""}
            />

            <ConfirmationModal
                isOpen={!!deleteModalProject}
                onClose={() => setDeleteModalProject(null)}
                onConfirm={() => deleteModalProject && deleteProject(deleteModalProject.id)}
                title="Delete Project?"
                message="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            <ConfirmationModal
                isOpen={!!archiveModalProject}
                onClose={() => setArchiveModalProject(null)}
                onConfirm={() => archiveModalProject && archiveProject(archiveModalProject.id)}
                title="Archive Project?"
                message="This project will be moved to your archived items."
                confirmText="Archive"
                cancelText="Cancel"
                variant="warning"
            />
        </div>
    );
}
