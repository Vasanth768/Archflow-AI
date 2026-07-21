import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <>
            {/* HERO SECTION */}
            <section className="hero">
                <div className="container">
                    <div className="hero-grid">
                        <div className="hero-text-content">
                            <span className="badge badge-indigo hero-badge">✨ AI-Powered 2D & 3D House Design Platform</span>
                            <h1 className="hero-title">Design 2D Floor Plans & 3D House Concepts in <span className="gradient-text">Minutes</span> with AI</h1>
                            <p className="hero-desc">ArchFlow AI helps construction professionals, civil engineers, architects, and builders generate client-ready presentations, structural configurations, and 3D architectural elevations instantly.</p>
                            
                            <div className="hero-ctas">
                                <Link to="/signup" className="btn btn-primary btn-lg">Start Designing Free</Link>
                                <Link to="/contact" className="btn btn-secondary btn-lg">Book a Live Demo</Link>
                            </div>
                            
                            <div className="hero-socials">
                                <div className="hero-avatars">
                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Builder avatar" />
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Engineer avatar" />
                                    <img src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80" alt="Architect avatar" />
                                </div>
                                <span>Trusted by <strong>5,000+</strong> builders, civil engineers & designers</span>
                            </div>
                        </div>
                        
                        <div className="hero-visual">
                            <div className="product-mockup-wrapper">
                                <div className="mockup-grid-bg"></div>
                                <div className="mockup-content">
                                    {/* Left sidebar panel */}
                                    <div className="mockup-card-left">
                                        <div style={{ fontSize: 12, color: 'var(--text-white)', fontWeight: 700, marginBottom: 8 }}>AI Plan generator</div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: 10, borderRadius: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
                                            "Design a 30x40 east-facing 2-floor duplex house with 3 bedrooms, parking, and modern elevation."
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid var(--accent-indigo)', padding: 6, borderRadius: 4, fontSize: 10, textAlign: 'center', color: 'white', fontWeight: 600 }}>2D Layout Generated</div>
                                            <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid var(--success)', padding: 6, borderRadius: 4, fontSize: 10, textAlign: 'center', color: 'white', fontWeight: 600 }}>Vastu Compliant 98%</div>
                                        </div>
                                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>Processing completed in 14.2s</div>
                                    </div>
                                    {/* Right visual preview stack */}
                                    <div className="mockup-card-right">
                                        <div className="mockup-image-frame">
                                            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" alt="Premium Modern Exterior" />
                                            <div className="floating-badge">
                                                <span className="project-status-dot" style={{ backgroundColor: 'var(--success)' }}></span> 3D Concept
                                            </div>
                                        </div>
                                        <div className="mockup-image-frame" style={{ backgroundColor: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                                            <svg viewBox="0 0 100 100" style={{ width: 70, height: 70 }} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none">
                                                <rect x="5" y="5" width="90" height="90" strokeDasharray="2 2"/>
                                                <line x1="5" y1="50" x2="95" y2="50" stroke-dasharray="2 2"/>
                                                <rect x="15" y="15" width="30" height="30"/>
                                                <rect x="55" y="15" width="30" height="30"/>
                                                <rect x="15" y="55" width="70" height="30"/>
                                                <text x="30" y="32" fill="white" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Living</text>
                                                <text x="70" y="32" fill="white" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Kitchen</text>
                                                <text x="50" y="72" fill="white" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Master Bed</text>
                                            </svg>
                                            <div className="floating-badge" style={{ right: 'auto', left: 12 }}>
                                                <span className="project-status-dot" style={{ backgroundColor: 'var(--accent-indigo)' }}></span> 2D Vastu Plan
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* KEY FEATURES SECTION */}
            <section className="features-section">
                <div className="container">
                    <div className="section-head text-center">
                        <span className="badge badge-indigo">Core Platform Modules</span>
                        <h3>Complete Workflow for Builders &amp; Designers</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>Generate, configure, and compile architectural submissions for clients in minutes instead of days.</p>
                    </div>
                    
                    <div className="card-grid">
                        {/* feature 1 */}
                        <div className="card" style={{ display: 'flex', gap: 20, padding: 24 }}>
                            <div style={{ fontSize: 24, backgroundColor: 'var(--accent-indigo-light)', color: 'var(--accent-indigo)', width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📐</div>
                            <div>
                                <h4 style={{ marginBottom: 6, fontSize: 18 }}>2D Layout Drafting Canvas</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>Drag-and-drop structural elements such as walls, stairs, rooms, and pooja spaces inside a fully snapped layout interface.</p>
                            </div>
                        </div>
                        {/* feature 2 */}
                        <div className="card" style={{ display: 'flex', gap: 20, padding: 24 }}>
                            <div style={{ fontSize: 24, backgroundColor: 'var(--accent-indigo-light)', color: 'var(--accent-indigo)', width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🏡</div>
                            <div>
                                <h4 style={{ marginBottom: 6, fontSize: 18 }}>3D Elevation Swatches</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>Instantly review the plan in Budget Friendly, Standard Modern, and Premium Luxury structures without redrawing layouts.</p>
                            </div>
                        </div>
                        {/* feature 3 */}
                        <div className="card" style={{ display: 'flex', gap: 20, padding: 24 }}>
                            <div style={{ fontSize: 24, backgroundColor: 'var(--accent-indigo-light)', color: 'var(--accent-indigo)', width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🧭</div>
                            <div>
                                <h4 style={{ marginBottom: 6, fontSize: 18 }}>Live Vastu Analysis</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>Get active compliance feedback on door locations, kitchen points, and master bedrooms according to Vastu guidelines.</p>
                            </div>
                        </div>
                        {/* feature 4 */}
                        <div className="card" style={{ display: 'flex', gap: 20, padding: 24 }}>
                            <div style={{ fontSize: 24, backgroundColor: 'var(--accent-indigo-light)', color: 'var(--accent-indigo)', width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📄</div>
                            <div>
                                <h4 style={{ marginBottom: 6, fontSize: 18 }}>Branded Presentations</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>Compile 2D blueprint pages, exterior renders, and requirements briefs into branded documents with company logos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section style={{ background: 'var(--bg-dark-sidebar)', color: 'var(--text-white)', padding: '80px 0', textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: '1px solid var(--border-color-dark)' }}>
                <div className="mockup-grid-bg" style={{ opacity: 0.3 }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <h2 style={{ color: 'var(--text-white)', fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Ready to Transform Your Client Workflow?</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 600, margin: '0 auto 36px auto' }}>Join thousands of engineers and builders who use ArchFlow AI to win design approvals in hours, not weeks.</p>
                    <Link to="/signup" className="btn btn-primary btn-lg" style={{ boxShadow: 'var(--shadow-indigo)' }}>Get Started For Free</Link>
                </div>
            </section>
        </>
    );
}
