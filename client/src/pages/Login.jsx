import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Login() {
    const navigate = useNavigate();
    const { showToast } = useArchFlow();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const loggedIn = localStorage.getItem("archflow_logged_in");
        if (loggedIn === "true") {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleLogin = (e) => {
        e.preventDefault();
        
        // Mock authorization checks
        if (email.trim() === '' || password.trim() === '') {
            showToast("Please fill in all details", "error");
            return;
        }

        localStorage.setItem("archflow_logged_in", "true");
        // Save default profile if none exists
        if (!localStorage.getItem("archflow_profile_name")) {
            localStorage.setItem("archflow_profile_name", "Demo User");
        }
        if (!localStorage.getItem("archflow_company_name")) {
            localStorage.setItem("archflow_company_name", "Apex Builders");
        }
        
        showToast("Logged in successfully!", "success");
        navigate("/dashboard");
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark-sidebar)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div className="card" style={{ maxWidth: 420, width: '100%', padding: 40, background: 'var(--bg-dark-card)', border: '1px solid var(--border-color-dark)', borderRadius: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, color: 'white', fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700 }}>
                        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32 }}>
                            <rect width="32" height="32" rx="8" fill="#4f46e5" />
                            <path d="M7 22V10L16 5L25 10V22L16 27L7 22Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                        <span>ArchFlow <span style={{ color: 'var(--accent-indigo)' }}>AI</span></span>
                    </Link>
                    <h3 style={{ marginTop: 24, fontSize: 20, color: 'var(--text-white)' }}>Welcome Back</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Sign in to continue to your design workspace</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            placeholder="architect@company.com"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 0', fontWeight: 600, fontSize: 14 }}>Sign In</button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-indigo)', textDecoration: 'none', fontWeight: 600 }}>Create account</Link>
                </div>
            </div>
        </div>
    );
}
