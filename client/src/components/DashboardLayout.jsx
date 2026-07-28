import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function DashboardLayout() {
    const { logout, user } = useArchFlow();
    const navigate = useNavigate();
    const [userName, setUserName] = useState("Ramesh C");
    const [credits, setCredits] = useState(632);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem("archflow_logged_in");
        if (isLoggedIn !== "true" && !user) {
            navigate('/login');
            return;
        }

        const savedProfile = localStorage.getItem("archflow_profile_name");
        if (savedProfile) {
            setUserName(savedProfile);
        } else if (user && user.name) {
            setUserName(user.name);
        }
        
        const savedCredits = localStorage.getItem("archflow_credits");
        if (savedCredits) {
            setCredits(parseInt(savedCredits, 10));
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getInitials = (name) => {
        if (!name) return 'RC';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="dash-shell">
            {/* NAVY SIDEBAR (LIGHT THEME REFERENCE) */}
            <aside className="ref-sidebar">
                <Link to="/dashboard" className="ref-sidebar-brand">
                    <div className="ref-brand-logo">
                        <div className="ref-brand-logo-icon">
                            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 22V10L16 5L25 10V22L16 27L7 22Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span>ArchFlow AI</span>
                    </div>
                    <div className="ref-brand-collapse" title="Collapse Sidebar">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </div>
                </Link>

                <nav className="ref-sidebar-nav">
                    {/* 1. Dashboard */}
                    <NavLink to="/dashboard" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-dashboard">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"/></svg>
                        Dashboard
                    </NavLink>

                    {/* 2. New Project */}
                    <NavLink to="/new-project" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-new-project">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                        New Project
                        <span className="ref-nav-badge">New</span>
                    </NavLink>

                    {/* 3. My Projects */}
                    <NavLink to="/my-projects" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-my-projects">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"/></svg>
                        My Projects
                    </NavLink>

                    {/* 4. AI Generator */}
                    <NavLink to="/ai-generator" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-ai-generator">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        AI Generator
                    </NavLink>

                    {/* 5. 2D Editor */}
                    <NavLink to="/editor" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-editor-2d">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        2D Editor
                    </NavLink>

                    {/* 6. 3D Viewer */}
                    <NavLink to="/viewer" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-viewer-3d">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        3D Viewer
                    </NavLink>

                    {/* 7. 3D Variations */}
                    <NavLink to="/style-variations" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-variations">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                        3D Variations
                    </NavLink>

                    {/* 8. Templates */}
                    <NavLink to="/templates" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-templates">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
                        Templates
                    </NavLink>

                    {/* 9. Clients & Team */}
                    <NavLink to="/team" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-team">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Clients &amp; Team
                    </NavLink>

                    {/* 10. Exports */}
                    <NavLink to="/export" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-export">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Exports
                    </NavLink>

                    {/* 11. Activity / Logs */}
                    <NavLink to="/my-projects?tab=activity" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-activity">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Activity / Logs
                    </NavLink>

                    {/* 12. Settings */}
                    <NavLink to="/settings" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-settings">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Settings
                    </NavLink>

                    {/* 13. Help & Support */}
                    <NavLink to="/docs" className={({ isActive }) => `ref-nav-item ${isActive ? 'active' : ''}`} id="menu-docs">
                        <svg className="ref-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                        Help &amp; Support
                    </NavLink>
                </nav>

                {/* BOTTOM CARD ("Your Plan") */}
                <div className="ref-sidebar-plan">
                    <div className="ref-plan-header">
                        <svg className="ref-plan-crown" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                        <span>Pro Plan</span>
                    </div>
                    <div className="ref-plan-label">Credits Used</div>
                    <div className="ref-plan-val" id="sidebar-credits-text">{credits} / 1,000</div>
                    <div className="ref-plan-track">
                        <div className="ref-plan-fill" id="sidebar-credits-fill" style={{ width: `${Math.min(100, (credits / 1000) * 100)}%` }}></div>
                    </div>
                    <button type="button" className="ref-plan-btn" onClick={() => navigate('/pricing')}>
                        Upgrade Plan
                    </button>
                </div>
            </aside>

            {/* MAIN PANEL */}
            <div className="ref-main">
                {/* WHITE TOPBAR */}
                <header className="ref-topbar">
                    <div className="ref-search-box">
                        <svg className="ref-search-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        <input type="text" className="ref-search-input" placeholder="Search projects, clients, plans..." />
                    </div>

                    <div className="ref-topbar-actions">
                        {/* Notification Bell */}
                        <button type="button" className="ref-icon-btn" title="Notifications" id="notif-topbar-btn">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                            <span className="ref-notif-dot">6</span>
                        </button>

                        {/* Messages / Chat Icon */}
                        <button type="button" className="ref-icon-btn" title="Messages">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                        </button>

                        {/* Help Circle Icon */}
                        <button type="button" className="ref-icon-btn" title="Help & Support" onClick={() => navigate('/docs')}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </button>

                        {/* User Profile Section */}
                        <div className="ref-profile-wrap" onClick={handleLogout} title="Click to Logout">
                            <div className="ref-avatar" id="topbar-avatar">{getInitials(userName)}</div>
                            <div className="ref-user-meta">
                                <span className="ref-user-name" id="topbar-user-name">{userName}</span>
                                <span className="ref-user-plan">Premium Plan</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENTS */}
                <div className="ref-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
