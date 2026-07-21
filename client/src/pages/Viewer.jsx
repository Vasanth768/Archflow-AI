import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Viewer() {
    const navigate = useNavigate();
    const { getActiveProject, updateProjectMaterials, updateProjectStyleSelection, showToast, IMAGES } = useArchFlow();
    const proj = getActiveProject();

    const [timeOfDay, setTimeOfDay] = useState("day");
    const [cameraAngle, setCameraAngle] = useState("isometric");
    const [selectedStyle, setSelectedStyle] = useState("Standard Modern");
    const [materials, setMaterials] = useState({
        facade: "concrete-plaster",
        railings: "steel-grill",
        lighting: "warm-led"
    });

    useEffect(() => {
        if (proj) {
            setSelectedStyle(proj.selectedStyle || "Standard Modern");
            setMaterials({
                facade: proj.materials?.facade || "concrete-plaster",
                railings: proj.materials?.railings || "steel-grill",
                lighting: proj.materials?.lighting || "warm-led"
            });
        }
    }, [proj]);

    if (!proj) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <span style={{ fontSize: 40 }}>⚠️</span>
                <h3 style={{ marginTop: 16, color: 'white' }}>No Active Project Selected</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Configure a project dimension wizard before opening the 3D rendering workspace.</p>
                <Link to="/new-project" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>Create Plan</Link>
            </div>
        );
    }

    const toggleTimeOfDay = () => {
        if (timeOfDay === "day") {
            setTimeOfDay("night");
            showToast("Rendering evening LED lighting...", "info");
        } else {
            setTimeOfDay("day");
            showToast("Rendering natural sunlight scene...", "info");
        }
    };

    const handleMaterialSelect = (type, val) => {
        const updated = { ...materials, [type]: val };
        setMaterials(updated);
        updateProjectMaterials(proj.id, updated);
        showToast(`Applied ${getFriendlyName(val)} to building exterior.`, "success");
    };

    const handleStyleSelect = (styleName) => {
        setSelectedStyle(styleName);
        updateProjectStyleSelection(proj.id, styleName);
        showToast(`Switched exterior design to ${styleName}`, "success");
    };

    const getStyleImage = (styleName) => {
        switch (styleName) {
            case "Budget Friendly": return IMAGES.budget;
            case "Premium Luxury": return IMAGES.luxury;
            case "Minimalist White": return IMAGES.minimalist;
            case "Traditional Modern": return IMAGES.traditional;
            default: return IMAGES.standard;
        }
    };

    const getFriendlyName = (slug) => {
        return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    return (
        <div className="fade-in">
            {/* Topbar Tab Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>3D Elevation Swatches</h2>
                    <span className="badge badge-indigo">GPU Cluster Rendering</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={toggleTimeOfDay} className="btn btn-secondary btn-sm" id="toggle-day-night-btn">
                        {timeOfDay === "day" ? "🌙 Switch to Night" : "☀️ Switch to Day"}
                    </button>
                    <Link to="/editor" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>📐 Edit 2D Layout</Link>
                </div>
            </div>

            {/* Dynamic tabs style switcher */}
            <div className="viewer-tabs-bar">
                {["Standard Modern", "Budget Friendly", "Premium Luxury", "Minimalist White", "Traditional Modern"].map(s => (
                    <button 
                        key={s} 
                        onClick={() => handleStyleSelect(s)}
                        className={s === selectedStyle ? "viewer-top-tab active" : "viewer-top-tab"}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Main Viewer Body */}
            <div className="viewer-3d-layout">
                {/* 3D RENDER WINDOW */}
                <div className="viewer-3d-frame" style={{ background: timeOfDay === "night" ? "#02040a" : "#0f172a" }}>
                    <img 
                        id="viewer3DImage"
                        src={getStyleImage(selectedStyle)} 
                        alt="3D Render Concept" 
                        style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            objectFit: 'contain',
                            transition: 'all 0.6s ease',
                            filter: timeOfDay === "night" ? "brightness(0.4) contrast(1.1) saturate(0.85) sepia(0.15) hue-rotate(190deg)" : "none",
                            boxShadow: timeOfDay === "night" ? "inset 0 0 100px rgba(0,0,0,0.8)" : "none"
                        }} 
                    />

                    {/* Camera controls */}
                    <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6 }}>
                        {["front", "side", "isometric"].map(angle => (
                            <button 
                                key={angle}
                                onClick={() => {
                                    setCameraAngle(angle);
                                    showToast(`Switched 3D camera to ${angle.toUpperCase()} view.`, "info");
                                }}
                                className={cameraAngle === angle ? "angle-control-btn active" : "angle-control-btn"}
                                style={{
                                    background: cameraAngle === angle ? 'var(--accent-indigo)' : 'rgba(15,23,42,0.85)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {angle}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MATERIALS CONTROLLER */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Materials Cladding</h3>

                    {/* FACADE */}
                    <div>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Facade Cladding</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { val: "concrete-plaster", name: "Smooth Concrete Render" },
                                { val: "terracotta-brick", name: "Terracotta Brick" },
                                { val: "timber-cladding", name: "Natural Cedar Timber" }
                            ].map(m => (
                                <button 
                                    key={m.val}
                                    onClick={() => handleMaterialSelect("facade", m.val)}
                                    className={materials.facade === m.val ? "btn-material active" : "btn-material"}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RAILINGS */}
                    <div>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Balcony Railing Type</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { val: "steel-grill", name: "Stainless Steel Grill" },
                                { val: "toughened-glass", name: "Frameless Glass panels" }
                            ].map(m => (
                                <button 
                                    key={m.val}
                                    onClick={() => handleMaterialSelect("railings", m.val)}
                                    className={materials.railings === m.val ? "btn-material active" : "btn-material"}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LIGHTING */}
                    <div>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Ambient Spotlighting</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { val: "warm-led", name: "Warm Spotlight Glow (3000K)" },
                                { val: "cool-daylight", name: "Cool Daylight Glow (5500K)" }
                            ].map(m => (
                                <button 
                                    key={m.val}
                                    onClick={() => handleMaterialSelect("lighting", m.val)}
                                    className={materials.lighting === m.val ? "btn-material active" : "btn-material"}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selection Summary */}
                    <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Facade: <strong style={{ color: 'white' }}>{getFriendlyName(materials.facade)}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Railings: <strong style={{ color: 'white' }}>{getFriendlyName(materials.railings)}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Lighting: <strong style={{ color: 'white' }}>{getFriendlyName(materials.lighting)}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
