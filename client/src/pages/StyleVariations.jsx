import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

const safeUpper = (value, fallback = "") => String(value ?? fallback).toUpperCase();
const safeLabel = (value, fallback = "N/A") => String(value ?? fallback);

const FALLBACK_CITY_IMAGE = "/assets/standard.png"; // Or a specific urban fallback
const FALLBACK_VILLAGE_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"; // Using unsplash or local

export default function StyleVariations() {
    const navigate = useNavigate();
    const { getActiveProject, executeDesignGeneration, executeSingleRegeneration, toggleFavoriteDesign, updateProjectStyleSelection, showToast } = useArchFlow();
    const proj = getActiveProject();

    // Generation Form State
    const [context, setContext] = useState("City");
    const [buildingType, setBuildingType] = useState("single_floor");
    const [styleDirection, setStyleDirection] = useState("AI Explore");
    const [roofStyle, setRoofStyle] = useState("Auto");
    const [budget, setBudget] = useState("Standard");
    const [designCount, setDesignCount] = useState(6);
    
    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingText, setGeneratingText] = useState("");
    const [compareList, setCompareList] = useState([]);
    const [showCompare, setShowCompare] = useState(false);
    const [filter, setFilter] = useState("All");
    const [configError, setConfigError] = useState(false);

    // Refinement State
    const [activeRefinementId, setActiveRefinementId] = useState(null);
    const [refinementText, setRefinementText] = useState("");

    if (!proj) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <span style={{ fontSize: 40 }}>⚠️</span>
                <h3 style={{ marginTop: 16, color: 'white' }}>No Active Project</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Select a project to generate 3D variations.</p>
                <Link to="/my-projects" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>View Projects</Link>
            </div>
        );
    }

    const buildingTypes = [
        { value: "single_floor", label: "Single Floor" },
        { value: "double_floor_duplex", label: "Double Floor / Duplex" },
        { value: "villa", label: "Villa" },
        { value: "apartment", label: "Apartment" },
        { value: "farmhouse", label: "Farmhouse" }
    ];
    const styleDirections = ["AI Explore", "Modern", "Traditional", "Minimalist", "Luxury", "Budget", "Custom"];
    const roofStyles = ["Auto", "Flat", "Sloped", "Tile", "Mixed"];
    const budgets = ["Budget", "Standard", "Premium", "Luxury"];

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratingText(`Generating ${designCount} ${context} ${buildingType} designs...`);
        try {
            const safeContext = context || "City";
            const safeBuildingType = buildingType || "single_floor";
            const safeStyleDirection = styleDirection || "AI Explore";
            const safeRoofStyle = roofStyle || "Auto";
            const safeBudget = budget || "Standard";

            await executeDesignGeneration(proj.id, {
                context: safeContext,
                buildingType: safeBuildingType,
                styleDirection: safeStyleDirection,
                roofStyle: safeRoofStyle,
                budget: safeBudget,
                count: designCount
            });
            setConfigError(false);
            showToast(`Successfully generated ${designCount} 3D design concepts!`, "success");
        } catch (error) {
            if (error.message === "AI_PROVIDER_NOT_CONFIGURED") {
                setConfigError(true);
            } else {
                showToast("AI generation failed. Please try again.", "error");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateSingle = async (designId, prompt = null) => {
        setIsGenerating(true);
        setGeneratingText(prompt ? "Applying AI refinements..." : "Regenerating specific design concept...");
        try {
            await executeSingleRegeneration(proj.id, designId, prompt);
            showToast("Design successfully regenerated.", "success");
            setActiveRefinementId(null);
            setRefinementText("");
        } catch (error) {
            showToast("Failed to regenerate design.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleCompare = (design) => {
        if (compareList.find(d => d.id === design.id)) {
            setCompareList(compareList.filter(d => d.id !== design.id));
        } else {
            if (compareList.length >= 4) {
                showToast("You can compare up to 4 designs at a time.", "warning");
                return;
            }
            setCompareList([...compareList, design]);
        }
    };

    const applyDesign = (design) => {
        updateProjectStyleSelection(proj.id, design.architecturalStyle);
        showToast(`Selected ${design.title} as the primary concept.`, "success");
        // Update facade if needed based on the generated design...
    };

    const openViewer = (design) => {
        applyDesign(design);
        navigate("/viewer");
    };

    const renderGeneratorForm = () => (
        <div className="card" style={{ padding: 24, background: 'var(--bg-dark-card)', border: '1px solid var(--border-color-dark)', borderRadius: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 20 }}>Design Parameters</h3>
            
            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', fontWeight: 600 }}>Design Context</label>
                <div style={{ display: 'flex', gap: 16 }}>
                    {["City", "Village"].map(c => (
                        <button
                            key={c}
                            onClick={() => setContext(c)}
                            style={{
                                flex: 1, padding: 20, borderRadius: 8, fontSize: 16, fontWeight: 600,
                                background: context === c ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)',
                                border: context === c ? '2px solid #818cf8' : '2px solid transparent',
                                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                            }}
                        >
                            {c === "City" ? "🏙️ City / Urban" : "🌾 Village / Rural"}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', fontWeight: 600 }}>Building Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    {buildingTypes.map(bt => (
                        <button
                            key={bt.value}
                            onClick={() => setBuildingType(bt.value)}
                            style={{
                                padding: '14px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                                background: buildingType === bt.value ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                                border: buildingType === bt.value ? '1px solid var(--accent-indigo)' : '1px solid rgba(255,255,255,0.1)',
                                color: buildingType === bt.value ? 'white' : 'var(--text-secondary)', cursor: 'pointer'
                            }}
                        >
                            {bt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Style Direction</label>
                    <select value={styleDirection} onChange={(e) => setStyleDirection(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6 }}>
                        {styleDirections.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Roof Style</label>
                    <select value={roofStyle} onChange={(e) => setRoofStyle(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6 }}>
                        {roofStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Budget Level</label>
                    <select value={budget} onChange={(e) => setBudget(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6 }}>
                        {budgets.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Number of Designs</label>
                    <select value={designCount} onChange={(e) => setDesignCount(Number(e.target.value))} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6 }}>
                        {[6, 12, 18, 24].map(n => <option key={n} value={n}>{n} Designs</option>)}
                    </select>
                </div>
            </div>

            <button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: 16, fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}
            >
                {isGenerating ? (
                    <span>⏳ {generatingText}</span>
                ) : (
                    <span>✨ GENERATE {designCount} 3D DESIGNS</span>
                )}
            </button>
        </div>
    );

    const renderGallery = () => {
        const designs = proj.generatedDesigns || [];
        
        const hasAuthError = designs.some(d => d.code === "PROVIDER_AUTH_ERROR" || (d.error && d.error.includes("authentication failed")));

        if (configError || hasAuthError) {
            return (
                <div style={{ textAlign: 'center', padding: 60, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <span style={{ fontSize: 40, marginBottom: 16, display: 'inline-block' }}>⚙️</span>
                    <h3 style={{ color: '#ef4444', fontWeight: 700, marginBottom: 8 }}>API Configuration Required</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, maxWidth: 500, margin: '0 auto 24px auto' }}>
                        The Qwen Image Generation API key is invalid or not configured correctly in your environment.
                    </p>
                    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: 8, textAlign: 'left', display: 'inline-block', maxWidth: '100%' }}>
                        <code style={{ color: 'white', fontFamily: 'monospace', fontSize: 13 }}>
                            # Add to your .env file:<br/>
                            QWEN_IMAGE_API_KEY=your_actual_api_key_here
                        </code>
                    </div>
                </div>
            );
        }


        if (designs.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: 40, opacity: 0.5 }}>🏗️</span>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Configure parameters above and click Generate to see AI variations.</p>
                </div>
            );
        }

        const filteredDesigns = designs.filter(d => {
            if (filter === "All") return true;
            if (filter === "Favorite") return d.isFavorite;
            if (filter === "Traditional") return d.architecturalStyle?.includes("Traditional") || d.title?.includes("Traditional");
            if (filter === "Modern") return d.architecturalStyle?.includes("Modern") || d.title?.includes("Modern") || d.title?.includes("Contemporary");
            if (filter === "Premium") return d.budget === "Premium" || d.budget === "Luxury";
            if (filter === "Budget") return d.budget === "Budget" || d.budget === "Standard";
            return true;
        });

        return (
            <div>
                <div style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color-dark)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>3D Design Variations</span>
                            <h3 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                                {proj.name}
                                <span style={{ background: 'rgba(255,255,255,0.1)', fontSize: 12, padding: '4px 8px', borderRadius: 6, fontWeight: 600, color: 'var(--text-muted)' }}>{safeUpper(designs[0]?.context, "City")}</span>
                                <span style={{ background: 'rgba(255,255,255,0.1)', fontSize: 12, padding: '4px 8px', borderRadius: 6, fontWeight: 600, color: 'var(--text-muted)' }}>{safeUpper(designs[0]?.buildingType?.replace(/_/g, ' '), "SINGLE FLOOR")}</span>
                            </h3>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
                                {designs.length} Design Concepts
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={handleGenerate} className="btn btn-ghost btn-sm">Regenerate All</button>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn btn-secondary btn-sm">Change Parameters</button>
                            {compareList.length > 0 && (
                                <button onClick={() => setShowCompare(true)} className="btn btn-primary btn-sm">
                                    Compare Selected ({compareList.length})
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
                        {["All", "Traditional", "Modern", "Premium", "Budget", "Favorite"].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f)}
                                style={{ 
                                    background: filter === f ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)', 
                                    color: filter === f ? 'white' : 'var(--text-muted)', 
                                    border: 'none', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer' 
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
                    {filteredDesigns.map((design, index) => {
                        if (design.status === "Failed") {
                            const isAuthError = design.code === "PROVIDER_AUTH_ERROR" || (design.error && design.error.includes("authentication failed"));
                            const displayError = isAuthError 
                                ? "Image generation failed. Check image provider configuration." 
                                : (design.error || "Generation failed");

                            return (
                                <div key={design.id} className="card" style={{ background: 'var(--bg-dark-card)', border: '1px dashed #ef4444', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 460 }}>
                                    <span style={{ fontSize: 40, marginBottom: 16 }}>⚠️</span>
                                    <h4 style={{ color: '#ef4444', fontWeight: 700, marginBottom: 8 }}>AI generation unavailable</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{displayError}</p>
                                    <button onClick={() => handleRegenerateSingle(design.id)} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>Retry Generation</button>
                                </div>
                            );
                        }

                        return (
                        <div key={design.id} className="card" style={{ background: 'var(--bg-dark-card)', border: proj.selectedStyle === design.architecturalStyle ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color-dark)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                                <img 
                                    src={design.imageUrl} 
                                    alt={design.title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                                    <button 
                                        onClick={() => toggleFavoriteDesign(proj.id, design.id)}
                                        style={{ background: 'rgba(0,0,0,0.7)', border: 'none', color: design.isFavorite ? '#ef4444' : 'white', cursor: 'pointer', borderRadius: 4, padding: '6px 10px', backdropFilter: 'blur(4px)' }}
                                    >
                                        {design.isFavorite ? '❤️' : '🤍'}
                                    </button>
                                </div>
                                <span style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: 11, padding: '4px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: 1, backdropFilter: 'blur(4px)' }}>
                                    DESIGN {String(design.designNumber || index + 1).padStart(2, '0')}
                                </span>
                            </div>
                            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>{design.title}</h4>
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                                    <span>{design.architecturalStyle}</span>
                                    <span>•</span>
                                    <span>{design.budget} Budget</span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, flex: 1 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Primary Colour</span>
                                            <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{design.primaryColor || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Accent Colour</span>
                                            <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{design.accentColor || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Roof Style</span>
                                            <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{design.roofStyle}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Materials</span>
                                            <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{design.facadeMaterials?.join(' • ') || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Features</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                            {[design.facadeDetails, design.entranceDesign, design.balconyDesign, design.gateDesign].filter(Boolean).filter(x => x !== 'None' && x !== 'no balcony').join(' • ')}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: activeRefinementId === design.id ? 16 : 0 }}>
                                    <button onClick={() => openViewer(design)} className="btn btn-primary" style={{ padding: '10px 0', fontSize: 12 }}>Preview</button>
                                    <button onClick={() => applyDesign(design)} className="btn btn-secondary" style={{ padding: '10px 0', fontSize: 12 }}>Select</button>
                                    <button 
                                        onClick={() => toggleCompare(design)} 
                                        className="btn btn-ghost" 
                                        style={{ padding: '10px 0', fontSize: 12, background: compareList.find(d => d.id === design.id) ? 'rgba(255,255,255,0.1)' : 'transparent', color: compareList.find(d => d.id === design.id) ? 'white' : 'var(--text-muted)' }}
                                    >
                                        Compare
                                    </button>
                                    <button onClick={() => setActiveRefinementId(activeRefinementId === design.id ? null : design.id)} className="btn btn-ghost" style={{ padding: '10px 0', fontSize: 12, color: activeRefinementId === design.id ? 'white' : 'var(--text-muted)', background: activeRefinementId === design.id ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                                        Regen
                                    </button>
                                </div>
                                
                                {activeRefinementId === design.id && (
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <label style={{ fontSize: 12, color: 'white', fontWeight: 600, display: 'block', marginBottom: 8 }}>AI Refinement</label>
                                        <input 
                                            type="text" 
                                            value={refinementText}
                                            onChange={(e) => setRefinementText(e.target.value)}
                                            placeholder="Describe what you want to change..." 
                                            style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6, fontSize: 13, marginBottom: 12 }}
                                        />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                            {["More Modern", "Traditional", "Add Balcony", "Change Colours", "Add Stone", "Add Wood"].map(chip => (
                                                <button 
                                                    key={chip}
                                                    onClick={() => setRefinementText(chip)}
                                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer' }}
                                                >
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleRegenerateSingle(design.id, refinementText)} className="btn btn-primary" style={{ flex: 1, padding: '8px 0', fontSize: 12 }}>Apply Refinement</button>
                                            <button onClick={() => handleRegenerateSingle(design.id)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>Random Regen</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (showCompare) {
        return (
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Compare Designs</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Comparing {compareList.length} selected concepts.</p>
                    </div>
                    <button onClick={() => setShowCompare(false)} className="btn btn-secondary">Back to Gallery</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareList.length}, 1fr)`, gap: 16 }}>
                    {compareList.map(design => (
                        <div key={design.id} className="card" style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color-dark)', borderRadius: 12, overflow: 'hidden' }}>
                            <img 
                                src={design.imageUrl} 
                                alt={design.architecturalStyle} 
                                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} 
                            />
                            <div style={{ padding: 16 }}>
                                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{design.architecturalStyle}</h4>
                                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Budget</span><span style={{ color: 'white' }}>{design.budget}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Roof</span><span style={{ color: 'white' }}>{design.roofStyle}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Context</span><span style={{ color: 'white' }}>{design.context}</span></div>
                                </div>
                                <button onClick={() => openViewer(design)} className="btn btn-primary" style={{ width: '100%', marginTop: 16, fontSize: 12 }}>Select This Design</button>
                                <button onClick={() => toggleCompare(design)} className="btn btn-ghost" style={{ width: '100%', marginTop: 8, fontSize: 12, color: '#ef4444' }}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)' }}>3D Design Studio</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Explore multiple architectural possibilities from the same floor plan.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                {renderGeneratorForm()}
                {isGenerating && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <div className="spinner" style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-indigo)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <h3 style={{ color: 'white', marginTop: 20 }}>{generatingText}</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Applying architectural intelligence...</p>
                </div>}
                {renderGallery()}
            </div>
        </div>
    );
}

