import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
    Folder, Hourglass, CheckCircle2, PauseCircle, Archive, 
    Search, LayoutGrid, List, Plus, Upload, MoreVertical, 
    Home, Building2, Building, Warehouse, ExternalLink, 
    Edit2, Copy, Trash2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import '../css/myProjects.css';

const ARCH_IMAGES = {
    standard: "/assets/standard.png",
    luxury: "/assets/luxury.png",
    budget: "/assets/budget.png",
    plan_thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230f172a'/><line x1='10' y1='10' x2='90' y2='10' stroke='white' stroke-width='1'/><line x1='10' y1='10' x2='10' y2='90' stroke='white' stroke-width='1'/><line x1='90' y1='10' x2='90' y2='90' stroke='white' stroke-width='1'/><line x1='10' y1='90' x2='90' y2='90' stroke='white' stroke-width='1'/><line x1='50' y1='10' x2='50' y2='90' stroke='white' stroke-dasharray='3' stroke-width='1'/><rect x='15' y='15' width='30' height='30' fill='none' stroke='white' stroke-width='1'/><rect x='55' y='15' width='30' height='30' fill='none' stroke='white' stroke-width='1'/><rect x='15' y='55' width='70' height='30' fill='none' stroke='white' stroke-width='1'/></svg>"
};

export default function MyProjects() {
    const navigate = useNavigate();
    const { projects, selectProject, duplicateProject, deleteProject, showToast } = useArchFlow();
    
    // Filtering & View State
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [floorsFilter, setFloorsFilter] = useState('All Floors');
    const [sortBy, setSortBy] = useState('Date Modified');
    const [viewMode, setViewMode] = useState('list'); // Default to List View matching Image 2
    
    // Action Dropdown & Modal State
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [deleteModalProject, setDeleteModalProject] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Close action dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleSelectProject = (id, e) => {
        if (e) e.stopPropagation();
        selectProject(id);
        navigate("/project-details");
    };

    const handleEditProject = (id, e) => {
        if (e) e.stopPropagation();
        selectProject(id);
        navigate("/editor");
    };

    const handleDuplicate = (id, e) => {
        if (e) e.stopPropagation();
        duplicateProject(id);
        setActiveMenuId(null);
    };

    const handleOpenDelete = (project, e) => {
        if (e) e.stopPropagation();
        setDeleteModalProject(project);
        setActiveMenuId(null);
    };

    const handleImportProject = (e) => {
        e.preventDefault();
        showToast("Select a project archive (.archflow / .json) to import", "info");
    };

    // Helper formatting generators matching reference Image 2 exact details
    const getProjectPhone = (clientName, idx) => {
        const phones = [
            "+91 98765 43210", "+91 98422 33511", "+91 97918 22345", 
            "+91 90031 11223", "+91 95678 99011", "+91 88833 44556", "+91 90908 66778"
        ];
        return phones[idx % phones.length];
    };

    const getProjectType = (name = '', idx) => {
        const lower = name.toLowerCase();
        if (lower.includes('duplex')) return { label: 'Duplex', icon: <Building2 size={15} /> };
        if (lower.includes('commercial')) return { label: 'Commercial', icon: <Building size={15} /> };
        if (lower.includes('villa')) return { label: 'Villa', icon: <Warehouse size={15} /> };
        return { label: 'Residential', icon: <Home size={15} /> };
    };

    const getProjectStyle = (idx) => {
        const styles = [
            "Standard Modern", "Premium Luxury", "Budget Friendly", 
            "Minimalist", "Traditional Modern", "Modern Commercial"
        ];
        return styles[idx % styles.length];
    };

    const getStyleColor = (styleName = '') => {
        if (styleName.includes('Luxury')) return '#7C3AED';
        if (styleName.includes('Budget')) return '#10B981';
        if (styleName.includes('Minimalist')) return '#06B6D4';
        if (styleName.includes('Traditional')) return '#F59E0B';
        return '#2563EB';
    };

    const getExactDate = (idx) => {
        const dates = [
            "16 May, 2024", "15 May, 2024", "14 May, 2024", 
            "13 May, 2024", "12 May, 2024", "11 May, 2024", "9 May, 2024"
        ];
        return dates[idx % dates.length];
    };

    // Dynamic Top Metrics calculation
    const totalCount = projects.length || 0;
    const inProgressCount = projects.filter(p => p.status === 'In Progress' || p.status === 'AI Generated' || p.status === 'Draft').length;
    const completedCount = projects.filter(p => p.status === 'Completed' || p.status === 'Finalized').length;
    const onHoldCount = projects.filter(p => p.status === 'On Hold').length;
    const archivedCount = projects.filter(p => p.status === 'Archived').length;

    // Filter projects
    const filteredProjects = projects.filter((p, idx) => {
        const typeObj = getProjectType(p.name, idx);
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                              p.client.toLowerCase().includes(search.toLowerCase()) ||
                              p.facing.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'All Types' || typeObj.label === typeFilter || (typeFilter === 'Villa' && p.name.toLowerCase().includes('villa'));
        const matchesStatus = statusFilter === 'All Status' || 
                              (statusFilter === 'In Progress' && (p.status === 'In Progress' || p.status === 'AI Generated' || p.status === 'Draft')) ||
                              (statusFilter === 'Completed' && (p.status === 'Completed' || p.status === 'Finalized')) ||
                              p.status === statusFilter;
        const matchesFloors = floorsFilter === 'All Floors' || `${p.floors} Floor${p.floors > 1 ? 's' : ''}` === floorsFilter || String(p.floors) === floorsFilter;
        return matchesSearch && matchesType && matchesStatus && matchesFloors;
    });

    // Sort projects
    const sortedProjects = [...filteredProjects].sort((a, b) => {
        if (sortBy === 'Name A-Z') return a.name.localeCompare(b.name);
        if (sortBy === 'Plot Size') return (b.area || b.width * b.length) - (a.area || a.width * a.length);
        return 0; // Default Date Modified
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedProjects.length / itemsPerPage));
    const paginatedProjects = sortedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="mp-wrapper fade-in">
            {/* 1. HEADER SECTION */}
            <div className="mp-header">
                <div>
                    <h1 className="mp-title">My Projects</h1>
                    <p className="mp-subtitle">Manage all your architectural projects in one place</p>
                </div>
                <div className="mp-header-actions">
                    <button type="button" className="mp-btn-import" onClick={handleImportProject}>
                        <Upload size={15} />
                        <span>Import Project</span>
                    </button>
                    <Link to="/new-project" className="mp-btn-new">
                        <Plus size={16} strokeWidth={2.5} />
                        <span>New Project</span>
                    </Link>
                </div>
            </div>

            {/* 2. TOP METRICS CARDS (5 HORIZONTAL CARDS) */}
            <div className="mp-metrics-grid">
                <div className="mp-metric-card">
                    <div className="mp-metric-icon blue">
                        <Folder size={20} />
                    </div>
                    <div className="mp-metric-info">
                        <span className="mp-metric-label">Total Projects</span>
                        <span className="mp-metric-val">{totalCount}</span>
                        <span className="mp-metric-sub">All Time</span>
                    </div>
                </div>

                <div className="mp-metric-card">
                    <div className="mp-metric-icon orange">
                        <Hourglass size={20} />
                    </div>
                    <div className="mp-metric-info">
                        <span className="mp-metric-label">In Progress</span>
                        <span className="mp-metric-val">{inProgressCount}</span>
                        <span className="mp-metric-sub">Active Projects</span>
                    </div>
                </div>

                <div className="mp-metric-card">
                    <div className="mp-metric-icon green">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="mp-metric-info">
                        <span className="mp-metric-label">Completed</span>
                        <span className="mp-metric-val">{completedCount}</span>
                        <span className="mp-metric-sub">Finished Projects</span>
                    </div>
                </div>

                <div className="mp-metric-card">
                    <div className="mp-metric-icon yellow">
                        <PauseCircle size={20} />
                    </div>
                    <div className="mp-metric-info">
                        <span className="mp-metric-label">On Hold</span>
                        <span className="mp-metric-val">{onHoldCount}</span>
                        <span className="mp-metric-sub">Paused Projects</span>
                    </div>
                </div>

                <div className="mp-metric-card">
                    <div className="mp-metric-icon gray">
                        <Archive size={20} />
                    </div>
                    <div className="mp-metric-info">
                        <span className="mp-metric-label">Archived</span>
                        <span className="mp-metric-val">{archivedCount}</span>
                        <span className="mp-metric-sub">Archived Projects</span>
                    </div>
                </div>
            </div>

            {/* 3. TOOLBAR (SEARCH, FILTERS, VIEW TOGGLE) */}
            <div className="mp-toolbar">
                <div className="mp-toolbar-left">
                    <div className="mp-search-box">
                        <Search size={15} className="mp-search-icon" />
                        <input 
                            type="text" 
                            className="mp-search-input"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            placeholder="Search projects..." 
                        />
                    </div>

                    <select className="mp-filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="All Types">All Types</option>
                        <option value="Residential">Residential</option>
                        <option value="Duplex">Duplex</option>
                        <option value="Villa">Villa</option>
                        <option value="Commercial">Commercial</option>
                    </select>

                    <select className="mp-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="All Status">All Status</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Archived">Archived</option>
                    </select>

                    <select className="mp-filter-select" value={floorsFilter} onChange={(e) => { setFloorsFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="All Floors">All Floors</option>
                        <option value="1 Floor">1 Floor</option>
                        <option value="2 Floors">2 Floors</option>
                        <option value="3 Floors">3 Floors</option>
                    </select>

                    <select className="mp-filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="Date Modified">Date Modified</option>
                        <option value="Name A-Z">Name A-Z</option>
                        <option value="Plot Size">Plot Size</option>
                    </select>
                </div>

                <div className="mp-toolbar-right">
                    <button 
                        type="button" 
                        className={`mp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        type="button" 
                        className={`mp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View (Table)"
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* 4. PROJECTS DISPLAY (LIST OR GRID VIEW) */}
            {sortedProjects.length === 0 ? (
                <div className="mp-empty-card">
                    <div className="mp-empty-icon">
                        <Folder size={28} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>No Projects Found</h3>
                    <p style={{ color: '#64748B', fontSize: 13.5, margin: '0 0 20px 0' }}>We couldn't find any architectural projects matching your current filter criteria.</p>
                    <button 
                        type="button" 
                        className="mp-btn-import" 
                        onClick={() => { setSearch(''); setTypeFilter('All Types'); setStatusFilter('All Status'); setFloorsFilter('All Floors'); }}
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : viewMode === 'list' ? (
                /* --- LIST VIEW (ENTERPRISE TABLE - EXACT IMAGE 2 SPEC) --- */
                <div className="mp-table-container">
                    <table className="mp-table">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Client</th>
                                <th>Type</th>
                                <th>Plot Size</th>
                                <th>Floors</th>
                                <th>Style</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProjects.map((p, idx) => {
                                const typeObj = getProjectType(p.name, idx);
                                const styleName = p.style || getProjectStyle(idx);
                                const styleColor = getStyleColor(styleName);
                                const phoneStr = getProjectPhone(p.client, idx);
                                const exactDate = getExactDate(idx);

                                const isDone = p.status === 'Completed' || p.status === 'Finalized';
                                const statusLabel = isDone ? 'Completed' : (p.status || 'In Progress');
                                const badgeClass = isDone ? 'completed' : statusLabel.toLowerCase().replace(/\s+/g, '-');
                                const projIdStr = `PRJ-2024-00${idx + 1}`;

                                return (
                                    <tr key={p.id} onClick={() => handleSelectProject(p.id)}>
                                        <td>
                                            <div className="mp-col-project">
                                                <div className="mp-thumbs-wrap">
                                                    <img src={ARCH_IMAGES.standard} alt="House Concept" className="mp-thumb-img" />
                                                    <img src={ARCH_IMAGES.plan_thumb} alt="Floor Plan Concept" className="mp-thumb-img" />
                                                </div>
                                                <div className="mp-proj-info">
                                                    <span className="mp-proj-name" onClick={(e) => handleSelectProject(p.id, e)}>{p.name}</span>
                                                    <div className="mp-proj-meta">
                                                        <span>{projIdStr}</span>
                                                        <span className="mp-recent-badge">Recent</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="mp-col-client">
                                                <span className="mp-client-name">{p.client || 'Self'}</span>
                                                <span className="mp-client-phone">{phoneStr}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="mp-type-cell">
                                                {typeObj.icon}
                                                <span>{typeObj.label}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div className="mp-size-main">{p.width} x {p.length} ft</div>
                                                <div className="mp-size-sub">{p.area || p.width * p.length} sq.ft</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 500 }}>{p.floors} {p.floors === 1 ? 'Floor' : 'Floors'}</span>
                                        </td>
                                        <td>
                                            <div className="mp-style-cell">
                                                <span className="mp-style-dot" style={{ background: styleColor }}></span>
                                                <span>{styleName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`mp-status-badge ${badgeClass}`}>{statusLabel}</span>
                                        </td>
                                        <td>
                                            <div>
                                                <div className="mp-time-rel">{p.time || '2 hours ago'}</div>
                                                <div className="mp-time-date">{exactDate}</div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <div className="mp-actions-wrap">
                                                <button 
                                                    type="button" 
                                                    className={`mp-btn-action ${activeMenuId === p.id ? 'active' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === p.id ? null : p.id); }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {activeMenuId === p.id && (
                                                    <div className={`mp-action-dropdown ${idx === paginatedProjects.length - 1 && paginatedProjects.length >= 2 ? 'upwards' : ''}`} onClick={(e) => e.stopPropagation()}>
                                                        <button type="button" className="mp-dropdown-item" onClick={(e) => handleSelectProject(p.id, e)}>
                                                            <ExternalLink size={14} />
                                                            <span>Open Details</span>
                                                        </button>
                                                        <button type="button" className="mp-dropdown-item" onClick={(e) => handleEditProject(p.id, e)}>
                                                            <Edit2 size={14} />
                                                            <span>Edit 2D Plan</span>
                                                        </button>
                                                        <button type="button" className="mp-dropdown-item" onClick={(e) => handleDuplicate(p.id, e)}>
                                                            <Copy size={14} />
                                                            <span>Duplicate</span>
                                                        </button>
                                                        <button type="button" className="mp-dropdown-item danger" onClick={(e) => handleOpenDelete(p, e)}>
                                                            <Trash2 size={14} />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* --- GRID VIEW ALTERNATIVE (CLEAN WHITE CARDS) --- */
                <div className="mp-grid-container">
                    {paginatedProjects.map((p, idx) => {
                        const typeObj = getProjectType(p.name, idx);
                        const styleName = p.style || getProjectStyle(idx);
                        const isDone = p.status === 'Completed' || p.status === 'Finalized';
                        const statusLabel = isDone ? 'Completed' : (p.status || 'In Progress');
                        const badgeClass = isDone ? 'completed' : statusLabel.toLowerCase().replace(/\s+/g, '-');

                        return (
                            <div key={p.id} className="mp-grid-card" onClick={() => handleSelectProject(p.id)}>
                                <div className="mp-grid-thumb-bar">
                                    <img src={ARCH_IMAGES.standard} alt="House" className="mp-grid-thumb-left" />
                                    <img src={ARCH_IMAGES.plan_thumb} alt="Plan" className="mp-grid-thumb-right" />
                                    <span className={`mp-status-badge ${badgeClass}`} style={{ position: 'absolute', top: 10, right: 10 }}>{statusLabel}</span>
                                </div>
                                <div className="mp-grid-body">
                                    <div className="mp-grid-title-row">
                                        <h3 className="mp-grid-title" onClick={(e) => handleSelectProject(p.id, e)}>{p.name}</h3>
                                    </div>
                                    <div className="mp-grid-client">Client: <strong>{p.client || 'Self'}</strong></div>
                                    
                                    <div className="mp-grid-specs">
                                        <div>🧭 Facing: <strong>{p.facing}</strong></div>
                                        <div>🏢 Floors: <strong>{p.floors}</strong></div>
                                        <div>📐 Size: <strong>{p.width}x{p.length} ft</strong></div>
                                        <div>🎨 Style: <strong>{styleName}</strong></div>
                                    </div>

                                    <div className="mp-grid-actions" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" className="mp-btn-open" onClick={(e) => handleSelectProject(p.id, e)}>
                                            Open Project
                                        </button>
                                        <button type="button" className="mp-btn-icon" onClick={(e) => handleEditProject(p.id, e)} title="Edit 2D Plan">
                                            <Edit2 size={14} />
                                        </button>
                                        <button type="button" className="mp-btn-icon" onClick={(e) => handleDuplicate(p.id, e)} title="Duplicate">
                                            <Copy size={14} />
                                        </button>
                                        <button type="button" className="mp-btn-icon danger" onClick={(e) => handleOpenDelete(p, e)} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 5. TABLE FOOTER / PAGINATION */}
            {sortedProjects.length > 0 && (
                <div className="mp-footer">
                    <span>
                        Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, sortedProjects.length)}</strong> of <strong>{sortedProjects.length}</strong> projects
                    </span>

                    <div className="mp-pagination">
                        <button 
                            type="button" 
                            className="mp-page-btn" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i + 1} 
                                type="button" 
                                className={`mp-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            type="button" 
                            className="mp-page-btn" 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* DELETION CONFIRMATION MODAL (PRESERVED) */}
            <ConfirmationModal
                isOpen={!!deleteModalProject}
                onClose={() => setDeleteModalProject(null)}
                onConfirm={() => deleteModalProject && deleteProject(deleteModalProject.id)}
                title="Delete Project?"
                message={`Are you sure you want to permanently delete "${deleteModalProject?.name}"? This action cannot be undone.`}
                confirmText="Delete Project"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
