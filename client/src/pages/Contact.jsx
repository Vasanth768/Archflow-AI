import React, { useState } from 'react';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Contact() {
    const { showToast } = useArchFlow();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        showToast("Message sent successfully! Our team will contact you shortly.", "success");
        setName('');
        setEmail('');
        setMessage('');
    };

    return (
        <section className="features-section" style={{ padding: '120px 0 80px 0' }}>
            <div className="container" style={{ maxWidth: 600 }}>
                <div className="section-head text-center">
                    <span className="badge badge-indigo">Contact Us</span>
                    <h3>Book a Live Demo</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Speak with our technical team to see how ArchFlow AI can optimize your builder presentation workflows.</p>
                </div>

                <div className="card" style={{ padding: 32, background: 'var(--bg-dark-card)', border: '1px solid var(--border-color-dark)', borderRadius: 12, marginTop: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-white)' }}>Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-white)' }}>Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-white)' }}>Message / Requirements</label>
                            <textarea rows="4" value={message} onChange={e => setMessage(e.target.value)} required style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', resize: 'vertical' }}></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '12px 0', fontWeight: 600 }}>Send Message</button>
                    </form>
                </div>
            </div>
        </section>
    );
}
