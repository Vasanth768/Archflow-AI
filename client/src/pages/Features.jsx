import React from 'react';
import { Link } from 'react-router-dom';

export default function Features() {
    return (
        <section className="features-section" style={{ padding: '120px 0 80px 0' }}>
            <div className="container">
                <div className="section-head text-center">
                    <span className="badge badge-indigo">Platform Features</span>
                    <h3>High-Performance Design Modules</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>ArchFlow AI integrates professional drafting tools with powerful cloud-based render systems.</p>
                </div>

                <div className="card-grid" style={{ marginTop: 48 }}>
                    <div className="card" style={{ padding: 32 }}>
                        <span style={{ fontSize: 32 }}>📐</span>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 20 }}>2D Drafting Canvas</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create Vastu-compliant layouts in real-time. Snap walls to clean dimensions, define door boundaries, window positions, and structural configurations.</p>
                    </div>

                    <div className="card" style={{ padding: 32 }}>
                        <span style={{ fontSize: 32 }}>👁️</span>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 20 }}>Interactive 3D Workspace</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Review designs immediately in a WebGL 3D concept viewer. Change styles (Minimalist, Duplex, Luxury) and materials (concrete, wood, steel) on the fly.</p>
                    </div>

                    <div className="card" style={{ padding: 32 }}>
                        <span style={{ fontSize: 32 }}>🧭</span>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 20 }}>Vastu Compass Analysis</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Get compliant metrics instantly. Ensure your placements for the entrance, master bed, and kitchen correspond correctly with Vastu orientations.</p>
                    </div>

                    <div className="card" style={{ padding: 32 }}>
                        <span style={{ fontSize: 32 }}>💾</span>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 20 }}>Direct Exports</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Export layouts to high-res PDF blueprints, PNG elevation concepts, or detailed project briefs ready to show to clients or engineers.</p>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 56 }}>
                    <Link to="/signup" className="btn btn-primary btn-lg">Unlock All Features Now</Link>
                </div>
            </div>
        </section>
    );
}
