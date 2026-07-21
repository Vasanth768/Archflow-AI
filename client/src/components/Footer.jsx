import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="marketing-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-info">
                        <Link to="/" className="logo" style={{ color: 'var(--text-white)' }}>
                            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
                                <rect width="32" height="32" rx="8" fill="#4f46e5" />
                                <path d="M7 22V10L16 5L25 10V22L16 27L7 22Z" stroke="white" stroke-width="2" stroke-linejoin="round" />
                            </svg>
                            <span>ArchFlow <span style={{ fontWeight: 400, color: 'var(--accent-indigo)' }}>AI</span></span>
                        </Link>
                        <p>AI-Powered Floor Plans, 3D House Renders & Builder Workflows. Helping developers and designers generate Indian house layouts and elevations in minutes.</p>
                    </div>
                    <div className="footer-links">
                        <h4>Product</h4>
                        <ul>
                            <li><Link to="/features">Features</Link></li>
                            <li><Link to="/how-it-works">How It Works</Link></li>
                            <li><Link to="/pricing">Pricing Plans</Link></li>
                            <li><Link to="/demo">Sample Projects</Link></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>Resources</h4>
                        <ul>
                            <li><Link to="/use-cases">Use Cases</Link></li>
                            <li><Link to="/contact">Book Demo</Link></li>
                            <li><Link to="/login">Sign In</Link></li>
                            <li><Link to="/signup">Register</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 ArchFlow AI. All rights reserved. Built for professional builders and design teams.</p>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <a href="#" style={{ color: 'var(--text-muted)' }}>Privacy Policy</a>
                        <a href="#" style={{ color: 'var(--text-muted)' }}>Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
