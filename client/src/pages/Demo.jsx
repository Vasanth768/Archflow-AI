import React from 'react';
import { Link } from 'react-router-dom';

export default function Demo() {
    return (
        <section className="features-section" style={{ padding: '120px 0 80px 0' }}>
            <div className="container">
                <div className="section-head text-center">
                    <span className="badge badge-indigo">Examples Gallery</span>
                    <h3>Architectural Blueprint &amp; Design Gallery</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>Explore layout models and exterior concepts created using ArchFlow AI.</p>
                </div>

                <div className="card-grid" style={{ marginTop: 48 }}>
                    <div className="card">
                        <img src="/assets/budget.png" alt="Budget Concept" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                        <div style={{ padding: 24 }}>
                            <h4 style={{ fontSize: 18, color: 'var(--text-white)' }}>Compact 2BHK Plan</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>30x40 East Facing Vastu-compliant layout designed for cost efficiency and space utilization.</p>
                        </div>
                    </div>

                    <div className="card">
                        <img src="/assets/standard.png" alt="Standard Concept" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                        <div style={{ padding: 24 }}>
                            <h4 style={{ fontSize: 18, color: 'var(--text-white)' }}>Modern Duplex Elevation</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>Standard geometric contours, wood accent facade, double-glazing window placements, and car porch.</p>
                        </div>
                    </div>

                    <div className="card">
                        <img src="/assets/luxury.png" alt="Luxury Concept" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                        <div style={{ padding: 24 }}>
                            <h4 style={{ fontSize: 18, color: 'var(--text-white)' }}>Luxury Villa Swatch</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>Large cantilevered spans, Italian marble facades, floor-to-ceiling glass grids, and premium elevations.</p>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 56 }}>
                    <Link to="/signup" className="btn btn-primary btn-lg">Generate Your First Elevation</Link>
                </div>
            </div>
        </section>
    );
}
