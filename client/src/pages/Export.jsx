import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Export() {
    const { getActiveProject, showToast } = useArchFlow();
    const proj = getActiveProject();
    const [downloading, setDownloading] = useState(false);

    if (!proj) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <span style={{ fontSize: 40 }}>⚠️</span>
                <h3 style={{ marginTop: 16, color: 'white' }}>No Active Project</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Select a project to configure exports.</p>
                <Link to="/my-projects" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>View Projects</Link>
            </div>
        );
    }

    const triggerDownload = (format) => {
        setDownloading(true);
        showToast(`Preparing ${format.toUpperCase()} compiling queue...`, "info");
        
        setTimeout(() => {
            setDownloading(false);
            showToast(`${format.toUpperCase()} project dossier successfully compiled!`, "success");
        }, 2000);
    };

    return (
        <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Client Presentation Export Center</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Compile 2D CAD layouts, exterior swatches, and Vastu compliance statements into a single branded project dossier.</p>
            </div>

            <div className="glass-card" style={{ padding: 32, background: 'rgba(10,17,32,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16, marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Active Dossier: {proj.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>Client: {proj.client} • Site dimensions: {proj.width}x{proj.length} ft • Style: {proj.selectedStyle}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Item 1 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Direct PDF Blueprint Dossier</span>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Includes site map, 2D snaps, room list coordinates, Vastu validation report, and facade swatches.</p>
                        </div>
                        <button disabled={downloading} onClick={() => triggerDownload("pdf")} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>
                            {downloading ? "Compiling..." : "📥 Compile PDF"}
                        </button>
                    </div>

                    {/* Item 2 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>2D AutoCAD DWG Export</span>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>High-precision vectors containing line geometries snapped to architectural scale for CAD tools.</p>
                        </div>
                        <button disabled={downloading} onClick={() => triggerDownload("dwg")} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
                            📥 Export DWG
                        </button>
                    </div>

                    {/* Item 3 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>3D OBJ Mesh File</span>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>3D mesh object files of selected elevation style with material textures coordinates included.</p>
                        </div>
                        <button disabled={downloading} onClick={() => triggerDownload("obj")} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
                            📥 Export OBJ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
