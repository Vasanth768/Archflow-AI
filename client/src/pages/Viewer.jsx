import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';
import { CADRenderer3D } from '../engine/cad/CADRenderer3D.js';
import { CanonicalOption04 } from '../engine/cad/CanonicalOption04.js';

export default function Viewer() {
    const navigate = useNavigate();
    const { getActiveProject, updateProjectMaterials, updateProjectStyleSelection, showToast } = useArchFlow();
    const proj = getActiveProject();

    const canvasContainerRef = useRef(null);
    const renderer3dRef = useRef(null);

    const [timeOfDay, setTimeOfDay] = useState("day");
    const [cameraAngle, setCameraAngle] = useState("isometric");
    const [selectedStyle, setSelectedStyle] = useState("Standard Modern");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [materials, setMaterials] = useState({
        facade: "concrete-plaster",
        railings: "steel-grill",
        lighting: "warm-led",
        roof: "flat"
    });

    const [activeTab, setActiveTab] = useState("materials");
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    const plan = proj?.plan || CanonicalOption04;

    // Initialize 3D Engine
    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container || !plan) return;

        const engine = new CADRenderer3D(container, {});
        renderer3dRef.current = engine;

        engine.buildScene(plan);
        engine.setupLighting(timeOfDay);
        engine.setCameraView(cameraAngle);

        const handleResize = () => {
            if (container && engine) {
                engine.resize(container.clientWidth, container.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            engine.dispose();
        };
    }, [plan]);

    // Update Lighting
    useEffect(() => {
        if (renderer3dRef.current) {
            renderer3dRef.current.setupLighting(timeOfDay);
        }
    }, [timeOfDay]);

    // Update Camera Angle
    useEffect(() => {
        if (renderer3dRef.current) {
            renderer3dRef.current.setCameraView(cameraAngle);
        }
    }, [cameraAngle]);

    const handleCameraChange = (angle) => {
        setCameraAngle(angle);
        showToast(`Switched 3D Camera to ${angle.toUpperCase()} view.`, "info");
    };

    const handleLightingChange = (time) => {
        setTimeOfDay(time);
        showToast(`Rendering ${time.toUpperCase()} lighting environment.`, "info");
    };

    const handleMaterialSelect = (type, val) => {
        const updated = { ...materials, [type]: val };
        setMaterials(updated);
        updateProjectMaterials(proj.id, updated);
        showToast(`Applied ${val} material to 3D model.`, "success");
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                showToast(`Error enabling fullscreen: ${err.message}`, "error");
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: isFullscreen ? 0 : 20 }}>
            {/* Topbar Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: isFullscreen ? 16 : 0, background: isFullscreen ? 'var(--bg-dark)' : 'transparent', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                        {plan.project?.name || '3D WebGL CAD Engine'}
                    </h2>
                    <span className="badge badge-indigo">Synchronized Parametric 3D</span>
                    <span className="badge badge-teal">Authoritative Model</span>
                </div>

                {/* Center Top Nav */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
                    <Link to="/editor" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>2D Floor Plan</Link>
                    <button className={`btn btn-sm ${activeTab === 'materials' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('materials'); setIsPanelOpen(true); }}>Materials</button>
                    <button className={`btn btn-sm ${activeTab === 'lighting' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('lighting'); setIsPanelOpen(true); }}>Lighting</button>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => navigate('/export')} className="btn btn-primary btn-sm">Present to Client</button>
                    <button onClick={toggleFullscreen} className="btn btn-secondary btn-sm">
                        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </button>
                </div>
            </div>

            {/* Main 3D Workspace */}
            <div style={{ display: 'flex', gap: 20, flex: 1, position: 'relative', minHeight: 0 }}>
                {/* 3D WebGL Canvas Frame */}
                <div
                    ref={canvasContainerRef}
                    style={{
                        flex: 1,
                        height: 'calc(100vh - 120px)',
                        borderRadius: 12,
                        overflow: 'hidden',
                        position: 'relative',
                        background: timeOfDay === "night" ? "#02040a" : timeOfDay === "evening" ? "#1e1b4b" : "#0a0f1d",
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}
                >
                    {/* View overlay hint */}
                    <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 5, pointerEvents: 'none' }}>
                        <span className="badge badge-indigo">Drag to Orbit • Wheel to Zoom</span>
                    </div>

                    {/* Environment Controls */}
                    <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', background: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 8, backdropFilter: 'blur(10px)', zIndex: 5 }}>
                        <button onClick={() => handleLightingChange("day")} className={`btn btn-sm ${timeOfDay === 'day' ? 'btn-primary' : 'btn-ghost'}`}>Day</button>
                        <button onClick={() => handleLightingChange("evening")} className={`btn btn-sm ${timeOfDay === 'evening' ? 'btn-primary' : 'btn-ghost'}`}>Evening</button>
                        <button onClick={() => handleLightingChange("night")} className={`btn btn-sm ${timeOfDay === 'night' ? 'btn-primary' : 'btn-ghost'}`}>Night</button>
                    </div>

                    {/* Camera Angle Controls */}
                    <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: 6, zIndex: 5 }}>
                        {["isometric", "front", "side", "top"].map(angle => (
                            <button
                                key={angle}
                                onClick={() => handleCameraChange(angle)}
                                className={cameraAngle === angle ? "angle-control-btn active" : "angle-control-btn"}
                                style={{
                                    background: cameraAngle === angle ? 'var(--accent-indigo)' : 'rgba(0,0,0,0.6)',
                                    color: 'white', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase'
                                }}
                            >
                                {angle}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                {isPanelOpen && (
                    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="glass-card" style={{ padding: 20, borderRadius: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0 }}>
                                    {activeTab === 'materials' ? 'Material Finishes' : 'Lighting & Environment'}
                                </h3>
                                <button onClick={() => setIsPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
                            </div>

                            {activeTab === 'materials' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: 8 }}>Exterior Facade</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            {["concrete-plaster", "stone-veneer", "timber-cladding", "terracotta-brick"].map(val => (
                                                <button key={val} onClick={() => handleMaterialSelect("facade", val)} className={materials.facade === val ? "btn-material active" : "btn-material"} style={{ fontSize: 11, padding: 6 }}>{val.replace('-', ' ')}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: 8 }}>Roof Structure</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            {["flat", "sloped", "clay-tile"].map(val => (
                                                <button key={val} onClick={() => handleMaterialSelect("roof", val)} className={materials.roof === val ? "btn-material active" : "btn-material"} style={{ fontSize: 11, padding: 6 }}>{val}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'lighting' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <p style={{ color: '#94A3B8', fontSize: 12 }}>Configure solar angles, time-of-day shadows, and ambient occlusion levels.</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <button onClick={() => handleLightingChange("day")} className={`btn btn-sm ${timeOfDay === 'day' ? 'btn-primary' : 'btn-ghost'}`}>☀️ Midday Sun (12:00 PM)</button>
                                        <button onClick={() => handleLightingChange("evening")} className={`btn btn-sm ${timeOfDay === 'evening' ? 'btn-primary' : 'btn-ghost'}`}>🌅 Golden Hour (05:30 PM)</button>
                                        <button onClick={() => handleLightingChange("night")} className={`btn btn-sm ${timeOfDay === 'night' ? 'btn-primary' : 'btn-ghost'}`}>🌙 Night Scene (09:00 PM)</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
