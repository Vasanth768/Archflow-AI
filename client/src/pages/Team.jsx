import React, { useState } from 'react';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Team() {
    const { showToast } = useArchFlow();
    const [email, setEmail] = useState('');

    const handleInvite = (e) => {
        e.preventDefault();
        showToast(`Invite sent successfully to ${email}`, "success");
        setEmail('');
    };

    return (
        <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Clients &amp; Team Workspace</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Invite design collaborators, coordinate drafting approvals, and share client presentation links.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                {/* Active members */}
                <div className="glass-card" style={{ padding: 24, background: 'rgba(10,17,32,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 16 }}>Workspace Members</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-indigo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>RC</div>
                                <div>
                                    <span style={{ fontSize: 13, color: 'white', display: 'block' }}>Ramesh Chandra</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ramesh@apexbuilders.com</span>
                                </div>
                            </div>
                            <span className="badge" style={{ fontSize: 9, background: 'rgba(99,102,241,0.2)', color: 'var(--indigo-light)' }}>Owner</span>
                        </div>
                    </div>
                </div>

                {/* Invite form */}
                <div className="glass-card" style={{ padding: 24, background: 'rgba(10,17,32,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', height: 'fit-content' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 12 }}>Invite Collaborator</h3>
                    <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Collaborator Email Address</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                placeholder="co-designer@company.com" 
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 12 }} 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '10px 0', fontSize: 13, fontWeight: 600 }}>Send Workspace Invite</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
