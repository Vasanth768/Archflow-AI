import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function NewProject() {
    const navigate = useNavigate();
    const { createProject, showToast } = useArchFlow();

    const [name, setName] = useState('');
    const [client, setClient] = useState('');
    const [width, setWidth] = useState(30);
    const [length, setLength] = useState(40);
    const [facing, setFacing] = useState('East');
    const [corner, setCorner] = useState(false);
    const [road, setRoad] = useState('30ft Main Road');
    const [floors, setFloors] = useState(1);
    const [bedrooms, setBedrooms] = useState(2);
    const [bathrooms, setBathrooms] = useState(2);
    const [pooja, setPooja] = useState(true);
    const [parking, setParking] = useState(true);
    const [balcony, setBalcony] = useState(false);
    const [style, setStyle] = useState('Standard Modern');
    const [budget, setBudget] = useState('Mid Range');
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (width < 10 || length < 10) {
            showToast("Dimensions must be at least 10x10 ft", "error");
            return;
        }

        const project = createProject({
            name,
            client,
            width,
            length,
            facing,
            corner,
            road,
            floors,
            bedrooms,
            bathrooms,
            pooja,
            parking,
            balcony,
            style,
            budget,
            prompt
        });

        showToast("Project layout created successfully!", "success");
        navigate("/editor");
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }} className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Generate AI Floor Plan &amp; Elevation</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Configure your site dimensions, roads, and requirements to generate a Vastu-compliant layout.</p>
            </div>

            <div className="glass-card" style={{ padding: 32, background: 'rgba(10,17,32,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* SECTION 1: BASIC DETAILS */}
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 16 }}>1. Basic Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Project Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Luxury Villa - Gupta Residence" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Client Name</label>
                                <input type="text" value={client} onChange={e => setClient(e.target.value)} required placeholder="Dr. Suresh Gupta" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: DIMENSIONS & VASTU */}
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 16 }}>2. Site Configuration &amp; Orientation</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Width (ft)</label>
                                <input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value) || 0)} required style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Length (ft)</label>
                                <input type="number" value={length} onChange={e => setLength(parseInt(e.target.value) || 0)} required style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Facing Direction</label>
                                <select value={facing} onChange={e => setFacing(e.target.value)} style={{ background: 'rgba(10,17,32,0.9)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }}>
                                    <option value="East">East (Vastu Recommended)</option>
                                    <option value="North">North (Vastu Recommended)</option>
                                    <option value="West">West</option>
                                    <option value="South">South</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Road Facing</label>
                                <input type="text" value={road} onChange={e => setRoad(e.target.value)} placeholder="30ft Main Access Road" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={corner} onChange={e => setCorner(e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                                Corner Plot (Multiple Roads)
                            </label>
                        </div>
                    </div>

                    {/* SECTION 3: STRUCTURAL OPTIONS */}
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 16 }}>3. Structural &amp; Room Requirements</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Number of Floors</label>
                                <input type="number" value={floors} onChange={e => setFloors(parseInt(e.target.value) || 1)} min="1" max="4" required style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Bedrooms</label>
                                <input type="number" value={bedrooms} onChange={e => setBedrooms(parseInt(e.target.value) || 1)} min="1" max="6" required style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Bathrooms</label>
                                <input type="number" value={bathrooms} onChange={e => setBathrooms(parseInt(e.target.value) || 1)} min="1" max="6" required style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={pooja} onChange={e => setPooja(e.target.checked)} style={{ width: 14, height: 14 }} />
                                Include Pooja Room (North-East corner)
                            </label>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={parking} onChange={e => setParking(e.target.checked)} style={{ width: 14, height: 14 }} />
                                Include Car Parking Portico
                            </label>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={balcony} onChange={e => setBalcony(e.target.checked)} style={{ width: 14, height: 14 }} />
                                Include Balcony
                            </label>
                        </div>
                    </div>

                    {/* SECTION 4: DESIGN THEME */}
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 16 }}>4. Elevation Theme &amp; Budget</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Exterior Elevation Style</label>
                                <select value={style} onChange={e => setStyle(e.target.value)} style={{ background: 'rgba(10,17,32,0.9)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }}>
                                    <option value="Standard Modern">Standard Modern (Clean Lines &amp; Wood Renders)</option>
                                    <option value="Budget Friendly">Budget Friendly (Concrete Frame Structures)</option>
                                    <option value="Premium Luxury">Premium Luxury (Glass Cantilever &amp; Double height)</option>
                                    <option value="Minimalist White">Minimalist White</option>
                                    <option value="Traditional Modern">Traditional Modern</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Budget Bracket</label>
                                <select value={budget} onChange={e => setBudget(e.target.value)} style={{ background: 'rgba(10,17,32,0.9)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13 }}>
                                    <option value="Low Cost">Low Cost (Basic R.C.C Frame)</option>
                                    <option value="Mid Range">Mid Range (Premium Standard Materials)</option>
                                    <option value="Premium">Premium Luxury (Cantilever Spans, Wood, Steel &amp; Glass)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: CUSTOM AI PROMPT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 8 }}>5. Custom AI Design Prompt</h3>
                        <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Add custom specifications, styling prompts, or materials requests:</label>
                        <textarea 
                            rows="3" 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)} 
                            placeholder="e.g. Design a duplex with open kitchen, Vastu layout, large living room, marble front facade, wooden louvers, and warm spotlight illumination."
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '10px 14px', borderRadius: 6, color: 'white', fontSize: 13, resize: 'vertical' }}
                        ></textarea>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                        <button type="button" onClick={() => navigate("/dashboard")} className="btn btn-secondary" style={{ padding: '10px 20px', fontWeight: 600 }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 600 }}>Generate Design Workspace</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
