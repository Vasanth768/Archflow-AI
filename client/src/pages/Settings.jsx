import React, { useState, useEffect } from 'react';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Settings() {
    const { showToast } = useArchFlow();
    const [profileName, setProfileName] = useState("Demo User");
    const [companyName, setCompanyName] = useState("Apex Builders");
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const savedProfile = localStorage.getItem("archflow_profile_name");
        const savedCompany = localStorage.getItem("archflow_company_name");
        if (savedProfile) setProfileName(savedProfile);
        if (savedCompany) setCompanyName(savedCompany);
    }, []);

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem("archflow_profile_name", profileName);
        localStorage.setItem("archflow_company_name", companyName);
        showToast("Profile settings updated successfully!", "success");
        // Force refresh layout variables
        window.location.reload();
    };

    return (
        <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Workspace Settings</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Configure your company logo, drafting profile name, and render cluster subscriptions.</p>
            </div>

            <div className="glass-card" style={{ padding: 32, background: 'rgba(10,17,32,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Architect Profile Name</label>
                        <input 
                            type="text" 
                            value={profileName} 
                            onChange={e => setProfileName(e.target.value)} 
                            required 
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} 
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Company / Builder Studio Name</label>
                        <input 
                            type="text" 
                            value={companyName} 
                            onChange={e => setCompanyName(e.target.value)} 
                            required 
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} 
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Workspace theme</label>
                        <select value={theme} onChange={e => setTheme(e.target.value)} style={{ background: 'rgba(10,17,32,0.9)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }}>
                            <option value="dark">Dark Slate Glow (Recommended)</option>
                            <option value="light">Light Slate Glassmorphism</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
