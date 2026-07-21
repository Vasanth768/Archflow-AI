import React from 'react';
import { Link } from 'react-router-dom';

export default function UseCases() {
    return (
        <section className="features-section" style={{ padding: '120px 0 80px 0' }}>
            <div className="container">
                <div className="section-head text-center">
                    <span className="badge badge-indigo">Use Cases</span>
                    <h3>Tailored For Construction Professionals</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>Explore how different industries utilize ArchFlow AI to win contracts and speed up planning.</p>
                </div>

                <div className="card-grid" style={{ marginTop: 48 }}>
                    <div className="card" style={{ padding: 32 }}>
                        <span style={{ fontSize: 32 }}>👷‍♂️</span>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 18 }}>Civil Engineers &amp; Builders</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Draft fast, client-ready duplex plans, verify room limits, and present detailed structural blueprints on the spot during client calls.</p>
                    </div>

                    <div className="card" style={{ padding: 32 }}>
                        <span style={{ fontSize: 32 }}>🏛️</span>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 18 }}>Architectural Designers</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Quickly generate design variations and material concepts. Export files directly to CAD or finalize high-quality exterior concepts.</p>
                    </div>

                    <div className="card" style={{ padding: 32 }}>
                        <span style={{ fontSize: 32 }}>📊</span>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 18 }}>Project Managers &amp; Teams</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Collaborate in shared team workspaces, manage project statuses, log billings, and track render credit budgets dynamically.</p>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 56 }}>
                    <Link to="/signup" className="btn btn-primary btn-lg">Explore Pricing Options</Link>
                </div>
            </div>
        </section>
    );
}
