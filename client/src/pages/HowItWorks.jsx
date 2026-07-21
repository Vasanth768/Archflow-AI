import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
    return (
        <section className="features-section" style={{ padding: '120px 0 80px 0' }}>
            <div className="container">
                <div className="section-head text-center">
                    <span className="badge badge-indigo">Workflow Step-By-Step</span>
                    <h3>How ArchFlow AI Operates</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>Generate complex 2D and 3D architectural floor plans in three simple phases.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, marginTop: 48 }}>
                    <div style={{ background: 'var(--bg-dark-card)', padding: 32, borderRadius: 12, border: '1px solid var(--border-color-dark)' }}>
                        <div style={{ fontSize: 36, color: 'var(--accent-indigo)', fontWeight: 800 }}>01</div>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 18, color: 'var(--text-white)' }}>Input Dimensions &amp; Vastu Facing</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>Enter site length/width, corner roads, select Vastu facing direction, and choose the number of floors or bedrooms required.</p>
                    </div>

                    <div style={{ background: 'var(--bg-dark-card)', padding: 32, borderRadius: 12, border: '1px solid var(--border-color-dark)' }}>
                        <div style={{ fontSize: 36, color: 'var(--accent-indigo)', fontWeight: 800 }}>02</div>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 18, color: 'var(--text-white)' }}>Generate &amp; Edit Layout in 2D</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>Let the AI draft the layout or draw manually. Add, resize, and move rooms on the canvas with real-time Vastu compliance scores.</p>
                    </div>

                    <div style={{ background: 'var(--bg-dark-card)', padding: 32, borderRadius: 12, border: '1px solid var(--border-color-dark)' }}>
                        <div style={{ fontSize: 36, color: 'var(--accent-indigo)', fontWeight: 800 }}>03</div>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: 18, color: 'var(--text-white)' }}>Render 3D Elevations &amp; Export</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>Switch to the 3D viewer. Cycle through Modern, Luxury, and Traditional swatches, assign materials, and export high-res PDFs.</p>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 56 }}>
                    <Link to="/signup" className="btn btn-primary btn-lg">Start Designing Now</Link>
                </div>
            </div>
        </section>
    );
}
