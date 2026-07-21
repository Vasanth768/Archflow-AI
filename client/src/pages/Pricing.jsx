import React from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
    return (
        <section className="features-section" style={{ padding: '120px 0 80px 0' }}>
            <div className="container">
                <div className="section-head text-center">
                    <span className="badge badge-indigo">Pricing Plans</span>
                    <h3>Choose the Right Fit for Your Workflow</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>Transparent subscription plans for solo designers, civil engineers, and custom home building agencies.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, marginTop: 48 }}>
                    {/* Free */}
                    <div style={{ background: 'var(--bg-dark-card)', padding: 32, borderRadius: 12, border: '1px solid var(--border-color-dark)', display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ fontSize: 20, color: 'var(--text-white)' }}>Starter</h4>
                        <div style={{ fontSize: 36, fontWeight: 800, margin: '16px 0 8px 0', color: 'var(--text-white)' }}>Free</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Perfect for trying out drafting features and rendering basic layout concepts.</p>
                        <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-secondary)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <li>✓ 3 Active Project slots</li>
                            <li>✓ Standard 2D drafting canvas</li>
                            <li>✓ 5 AI render credits per month</li>
                            <li>✓ Standard WebGL 3D concept swatches</li>
                        </ul>
                        <Link to="/signup" className="btn btn-secondary btn-full" style={{ marginTop: 'auto' }}>Get Started Free</Link>
                    </div>

                    {/* Pro */}
                    <div style={{ background: 'rgba(99,102,241,0.05)', padding: 32, borderRadius: 12, border: '2px solid var(--accent-indigo)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: -14, right: 20, background: 'var(--accent-indigo)', color: 'white', padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>MOST POPULAR</div>
                        <h4 style={{ fontSize: 20, color: 'var(--text-white)' }}>Professional</h4>
                        <div style={{ fontSize: 36, fontWeight: 800, margin: '16px 0 8px 0', color: 'var(--text-white)' }}>$49 <span style={{ fontSize: 14, fontWeight: 400 }}>/ mo</span></div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Ideal for solo engineers, consultants, and independent custom residential builders.</p>
                        <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-secondary)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <li>✓ <strong>Unlimited</strong> Project slots</li>
                            <li>✓ Advanced 2D layout canvas</li>
                            <li>✓ <strong>100 AI render credits</strong> per month</li>
                            <li>✓ Premium 3D material Elevation Swatches</li>
                            <li>✓ Direct PDF Blueprint &amp; Presentation Exports</li>
                        </ul>
                        <Link to="/signup" className="btn btn-primary btn-full" style={{ marginTop: 'auto' }}>Go Professional</Link>
                    </div>

                    {/* Enterprise */}
                    <div style={{ background: 'var(--bg-dark-card)', padding: 32, borderRadius: 12, border: '1px solid var(--border-color-dark)', display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ fontSize: 20, color: 'var(--text-white)' }}>Enterprise</h4>
                        <div style={{ fontSize: 36, fontWeight: 800, margin: '16px 0 8px 0', color: 'var(--text-white)' }}>Custom</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>For construction companies, large engineering firms, and design agencies.</p>
                        <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 32px 0', color: 'var(--text-secondary)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <li>✓ Everything in Professional</li>
                            <li>✓ <strong>Shared team workspaces</strong> (up to 10 members)</li>
                            <li>✓ Custom credit limits &amp; priority rendering</li>
                            <li>✓ Dedicated API access &amp; custom integration support</li>
                        </ul>
                        <Link to="/contact" className="btn btn-secondary btn-full" style={{ marginTop: 'auto' }}>Talk to Sales</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
