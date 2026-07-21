import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem("archflow_logged_in") === "true";

    const handleLogout = () => {
        localStorage.removeItem("archflow_logged_in");
        navigate("/login");
    };

    return (
        <header className="marketing-header">
            <div className="container">
                <Link to="/" className="logo">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="8" fill="url(#headerGrad)" />
                        <path d="M7 22V10L16 5L25 10V22L16 27L7 22Z" stroke="white" stroke-width="2" stroke-linejoin="round" />
                        <path d="M16 5V27" stroke="white" stroke-width="1.5" stroke-dasharray="2 2" />
                        <path d="M7 16H25" stroke="white" stroke-width="1.5" stroke-dasharray="2 2" />
                        <defs>
                            <linearGradient id="headerGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#4f46e5" />
                                <stop offset="1" stop-color="#3b82f6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span>ArchFlow <span style={{ fontWeight: 400, color: 'var(--accent-indigo)' }}>AI</span></span>
                </Link>
                <nav className="marketing-nav">
                    <Link to="/features">Features</Link>
                    <Link to="/how-it-works">How It Works</Link>
                    <Link to="/use-cases">Use Cases</Link>
                    <Link to="/pricing">Pricing</Link>
                    <Link to="/demo">Examples</Link>
                    <Link to="/contact">Contact</Link>
                </nav>
                <div className="marketing-header-actions">
                    {isLoggedIn ? (
                        <>
                            <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
                            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/signup" className="btn btn-primary">Start Free</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
