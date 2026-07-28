import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';
import { 
    Sparkles, Wand2, PlayCircle, ChevronDown, ChevronUp, 
    CheckCircle2, MoreVertical, Plus, Minus, ArrowRight 
} from 'lucide-react';
import '../css/aiGenerator.css';

const STYLE_OPTIONS = [
    { id: 'budget', name: 'Budget Friendly', sub: 'Low Cost', imgKey: 'budget' },
    { id: 'standard', name: 'Standard Modern', sub: 'Mid Range', imgKey: 'standard' },
    { id: 'luxury', name: 'Premium Luxury', sub: 'High End', imgKey: 'luxury' },
    { id: 'minimalist', name: 'Minimalist', sub: 'Clean & Simple', imgKey: 'minimalist' },
    { id: 'traditional', name: 'Traditional Modern', sub: 'Classic Look', imgKey: 'traditional' }
];

const PRIORITY_CHIPS = [
    'More Ventilation', 'More Natural Light', 'Bigger Hall', 
    'Bigger Kitchen', 'More Parking', 'Vastu Focus', 'More Storage'
];

const EXAMPLE_PROMPTS = [
    {
        title: '30x40 East Facing 2BHK House',
        sub: '2 Floors • 2 Bedrooms • Standard Modern',
        prompt: 'Design a 30x40 east facing 2-floor residential house with 2 bedrooms, living hall, kitchen, dining, pooja room, 2 bathrooms, staircase inside, parking for 1 car and balcony. Style: Standard modern. Budget: Mid range.',
        width: 30, length: 40, facing: 'East', floors: '2 Floors', bedrooms: 2, bathrooms: 2, style: 'Standard Modern', imgKey: 'standard'
    },
    {
        title: '40x60 Duplex Villa',
        sub: '2 Floors • 4 Bedrooms • Premium Luxury',
        prompt: 'Design a spacious 40x60 north facing duplex villa with 4 master bedrooms, double-height living hall, open modular kitchen, formal dining, home theater room, 4 attached luxury bathrooms, and 2-car covered parking. Style: Premium luxury.',
        width: 40, length: 60, facing: 'North', floors: '2 Floors', bedrooms: 4, bathrooms: 4, style: 'Premium Luxury', imgKey: 'luxury'
    },
    {
        title: '20x30 Budget House',
        sub: '1 Floor • 2 Bedrooms • Budget Friendly',
        prompt: 'Design a highly efficient 20x30 west facing compact residential house with 2 bedrooms, open living room, utility kitchen, 2 bathrooms, and external staircase for future rooftop access. Style: Budget friendly.',
        width: 20, length: 30, facing: 'West', floors: '1 Floor', bedrooms: 2, bathrooms: 2, style: 'Budget Friendly', imgKey: 'budget'
    },
    {
        title: '30x50 West Facing House',
        sub: '2 Floors • 3 Bedrooms • Minimalist',
        prompt: 'Design a clean 30x50 west facing contemporary minimalist home with 3 bedrooms, glass courtyard in living hall, dry kitchen, zen garden, 3 bathrooms, and covered porch for 1 car. Style: Minimalist.',
        width: 30, length: 50, facing: 'West', floors: '2 Floors', bedrooms: 3, bathrooms: 3, style: 'Minimalist', imgKey: 'minimalist'
    }
];

const RECENT_GENERATIONS = [
    { id: 'gen-1', title: '30x40 East Facing House', sub: '2 Floors • 3BHK • Standard Modern', time: 'Generated 2 mins ago', status: 'Completed', imgKey: 'standard' },
    { id: 'gen-2', title: 'Duplex Villa - 40x60', sub: '2 Floors • 4BHK • Premium Luxury', time: 'Generated 1 hour ago', status: 'Completed', imgKey: 'luxury' },
    { id: 'gen-3', title: 'Modern House - 20x30', sub: '1 Floor • 2BHK • Budget Friendly', time: 'Generated 3 hours ago', status: 'Completed', imgKey: 'budget' },
    { id: 'gen-4', title: 'Villa - 45x70', sub: '2 Floors • 4BHK • Traditional Modern', time: 'Generated 5 hours ago', status: 'Completed', imgKey: 'traditional' }
];

export default function AiGenerator() {
    const navigate = useNavigate();
    const { showToast, IMAGES, createProject } = useArchFlow();

    // Form State
    const [prompt, setPrompt] = useState(
        'Design a 30x40 east facing 2-floor residential house with 3 bedrooms, living hall, kitchen, dining, pooja room, 3 bathrooms, staircase inside, parking for 1 car and balcony.\nStyle: Standard modern. Budget: Mid range.'
    );
    const [projectType, setProjectType] = useState('Residential');
    const [plotWidth, setPlotWidth] = useState(30);
    const [plotLength, setPlotLength] = useState(40);
    const [facing, setFacing] = useState('East');
    const [floors, setFloors] = useState('2 Floors');
    const [bedrooms, setBedrooms] = useState(3);
    const [bathrooms, setBathrooms] = useState(3);
    const [parking, setParking] = useState('1 Car');
    const [staircase, setStaircase] = useState('Inside');
    const [selectedStyle, setSelectedStyle] = useState('Standard Modern');
    const [priorities, setPriorities] = useState([
        'More Ventilation', 'More Natural Light', 'Bigger Hall', 'Bigger Kitchen', 'Vastu Focus'
    ]);
    const [isAdvOpen, setIsAdvOpen] = useState(false);

    // Prompt Actions
    const handleEnhancePrompt = () => {
        const enhanced = `Design a premium architectural ${plotWidth}x${plotLength} ft ${facing.toLowerCase()} facing residential structure featuring ${floors.toLowerCase()} with ${bedrooms} spacious bedrooms, double-height living hall, open dining area, dedicated pooja room, ${bathrooms} attached bathrooms, ${staircase.toLowerCase()} staircase access, and covered parking for ${parking.toLowerCase()}.\nArchitectural Style: ${selectedStyle}. Priority focus on ${priorities.slice(0, 3).join(', ')} with sustainable energy efficiency and natural daylight optimization.`;
        setPrompt(enhanced);
        showToast("Prompt enhanced with professional architectural terms!", "success");
    };

    const handleSuggestImprovements = () => {
        const note = `\n[AI Optimization Suggestion: Integrate a central skylight atrium over the dining area for natural cross-ventilation and Vastu alignment.]`;
        if (!prompt.includes('AI Optimization Suggestion')) {
            setPrompt(prev => prev.trim() + note);
            showToast("Added architectural improvement suggestions!", "info");
        } else {
            showToast("Suggestions already included in prompt.", "info");
        }
    };

    const handleClearPrompt = () => {
        setPrompt('');
        showToast("Prompt cleared.", "info");
    };

    const handleUsePrompt = (item) => {
        setPrompt(item.prompt);
        setPlotWidth(item.width);
        setPlotLength(item.length);
        setFacing(item.facing);
        setFloors(item.floors);
        setBedrooms(item.bedrooms);
        setBathrooms(item.bathrooms);
        setSelectedStyle(item.style);
        showToast(`Loaded "${item.title}" configuration!`, "success");
    };

    const togglePriority = (chip) => {
        if (priorities.includes(chip)) {
            setPriorities(priorities.filter(c => c !== chip));
        } else {
            setPriorities([...priorities, chip]);
        }
    };

    const handleGenerate = () => {
        if (!prompt.trim()) {
            showToast("Please enter a project description prompt first.", "error");
            return;
        }

        showToast("AI Architecture Engine: Generating 2D Floor Plans & 3D Renderings...", "success");

        setTimeout(() => {
            const newProj = createProject({
                name: `${plotWidth}×${plotLength} ${facing} Facing AI House`,
                client: 'AI Client Deliverable',
                type: projectType,
                width: Number(plotWidth) || 30,
                length: Number(plotLength) || 40,
                facing: facing,
                floors: Number(floors.replace(/\D/g, '')) || 2,
                bedrooms: bedrooms,
                bathrooms: bathrooms,
                parking: parking,
                staircase: staircase,
                style: selectedStyle,
                description: prompt,
                status: 'Completed'
            });
            navigate(`/project-details`);
        }, 1200);
    };

    return (
        <div className="aig-wrapper">
            {/* TOP BREADCRUMB */}
            <div className="aig-breadcrumb">
                <Link to="/dashboard">Dashboard</Link>
                <span className="aig-breadcrumb-sep">&gt;</span>
                <span style={{ color: '#0F172A', fontWeight: 500 }}>AI Generator</span>
            </div>

            {/* HEADER */}
            <div className="aig-header">
                <div className="aig-title-area">
                    <h1 className="aig-title">
                        <Sparkles size={26} color="#3B82F6" fill="#3B82F6" style={{ opacity: 0.9 }} />
                        <span>AI Generator</span>
                    </h1>
                    <p className="aig-subtitle">
                        Describe your project and let AI generate 2D floor plans and 3D designs for you.
                    </p>
                </div>
                <button type="button" className="aig-how-btn" onClick={() => showToast("AI Engine processes your prompt and dimensions into standard BIM floor plans in seconds!", "info")}>
                    <PlayCircle size={16} color="#475569" />
                    <span>How it works?</span>
                </button>
            </div>

            {/* MAIN 2-COLUMN DESKTOP GRID */}
            <div className="aig-grid">
                {/* LEFT PANEL: CONFIGURATION FORM */}
                <div className="aig-left-panel">
                    {/* SECTION 1: DESCRIBE YOUR PROJECT */}
                    <div className="aig-section-header">
                        <div className="aig-section-title-wrap">
                            <span className="aig-num-circle">1</span>
                            <h2 className="aig-section-title">Describe Your Project</h2>
                        </div>
                    </div>

                    <label className="aig-label" style={{ marginTop: '12px' }}>
                        AI Prompt (Describe your project in detail)
                    </label>

                    <div className="aig-textarea-wrap">
                        <textarea
                            className="aig-textarea"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            maxLength={1000}
                            placeholder="Describe layout requirements, room placements, orientation goals, architectural style, and budget expectations..."
                        />
                        <div className="aig-textarea-footer">
                            <span className="aig-char-count">{prompt.length} / 1000</span>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                                <Sparkles size={12} fill="#2563EB" />
                            </div>
                        </div>
                    </div>

                    {/* PROMPT ACTIONS TOOLBAR */}
                    <div className="aig-prompt-actions">
                        <button type="button" className="aig-btn-enhance" onClick={handleEnhancePrompt}>
                            <Sparkles size={14} fill="#2563EB" />
                            <span>Enhance Prompt</span>
                        </button>
                        <button type="button" className="aig-btn-suggest" onClick={handleSuggestImprovements}>
                            <Wand2 size={14} />
                            <span>Suggest Improvements</span>
                        </button>
                        <button type="button" className="aig-btn-clear" onClick={handleClearPrompt}>
                            <span>Clear</span>
                        </button>
                    </div>

                    <div className="aig-divider" />

                    {/* SECTION 2: SELECT PREFERENCES */}
                    <div className="aig-section-header">
                        <div className="aig-section-title-wrap">
                            <span className="aig-num-circle">2</span>
                            <h2 className="aig-section-title">Select Preferences</h2>
                        </div>
                    </div>

                    {/* ROW 1 */}
                    <div className="aig-form-row" style={{ marginTop: '16px' }}>
                        <div className="aig-field-col">
                            <label className="aig-label">Project Type</label>
                            <select 
                                className="aig-select"
                                value={projectType}
                                onChange={(e) => setProjectType(e.target.value)}
                            >
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Duplex">Duplex</option>
                                <option value="Villa">Villa</option>
                            </select>
                        </div>

                        <div className="aig-field-col">
                            <label className="aig-label">Plot Size</label>
                            <div className="aig-dimensions-wrap">
                                <input 
                                    type="number" 
                                    className="aig-dim-input" 
                                    value={plotWidth} 
                                    onChange={(e) => setPlotWidth(Math.max(10, Number(e.target.value)))} 
                                    title="Width (ft)"
                                />
                                <span className="aig-dim-sep">×</span>
                                <input 
                                    type="number" 
                                    className="aig-dim-input" 
                                    value={plotLength} 
                                    onChange={(e) => setPlotLength(Math.max(10, Number(e.target.value)))} 
                                    title="Length (ft)"
                                />
                                <span className="aig-dim-sep">ft</span>
                            </div>
                        </div>

                        <div className="aig-field-col">
                            <label className="aig-label">Facing Direction</label>
                            <select 
                                className="aig-select"
                                value={facing}
                                onChange={(e) => setFacing(e.target.value)}
                            >
                                <option value="East">East</option>
                                <option value="West">West</option>
                                <option value="North">North</option>
                                <option value="South">South</option>
                                <option value="North-East">North-East</option>
                            </select>
                        </div>

                        <div className="aig-field-col">
                            <label className="aig-label">Floors</label>
                            <select 
                                className="aig-select"
                                value={floors}
                                onChange={(e) => setFloors(e.target.value)}
                            >
                                <option value="1 Floor">1 Floor</option>
                                <option value="2 Floors">2 Floors</option>
                                <option value="3 Floors">3 Floors</option>
                                <option value="4 Floors">4 Floors</option>
                            </select>
                        </div>
                    </div>

                    {/* ROW 2 */}
                    <div className="aig-form-row">
                        <div className="aig-field-col">
                            <label className="aig-label">Bedrooms</label>
                            <div className="aig-counter-box">
                                <button type="button" className="aig-counter-btn" onClick={() => setBedrooms(Math.max(1, bedrooms - 1))} disabled={bedrooms <= 1}>
                                    <Minus size={14} />
                                </button>
                                <span className="aig-counter-val">{bedrooms}</span>
                                <button type="button" className="aig-counter-btn" onClick={() => setBedrooms(Math.min(10, bedrooms + 1))} disabled={bedrooms >= 10}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="aig-field-col">
                            <label className="aig-label">Bathrooms</label>
                            <div className="aig-counter-box">
                                <button type="button" className="aig-counter-btn" onClick={() => setBathrooms(Math.max(1, bathrooms - 1))} disabled={bathrooms <= 1}>
                                    <Minus size={14} />
                                </button>
                                <span className="aig-counter-val">{bathrooms}</span>
                                <button type="button" className="aig-counter-btn" onClick={() => setBathrooms(Math.min(10, bathrooms + 1))} disabled={bathrooms >= 10}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="aig-field-col">
                            <label className="aig-label">Parking</label>
                            <select 
                                className="aig-select"
                                value={parking}
                                onChange={(e) => setParking(e.target.value)}
                            >
                                <option value="1 Car">1 Car</option>
                                <option value="2 Cars">2 Cars</option>
                                <option value="3 Cars">3 Cars</option>
                                <option value="None">None</option>
                            </select>
                        </div>

                        <div className="aig-field-col">
                            <label className="aig-label">Staircase</label>
                            <select 
                                className="aig-select"
                                value={staircase}
                                onChange={(e) => setStaircase(e.target.value)}
                            >
                                <option value="Inside">Inside</option>
                                <option value="Outside">Outside</option>
                                <option value="None">None</option>
                            </select>
                        </div>
                    </div>

                    {/* STYLE PREFERENCE */}
                    <label className="aig-label" style={{ marginTop: '20px', marginBottom: '10px' }}>
                        Style Preference
                    </label>
                    <div className="aig-styles-grid">
                        {STYLE_OPTIONS.map((st) => {
                            const isSelected = selectedStyle === st.name;
                            const imgSrc = IMAGES ? IMAGES[st.imgKey] : `/assets/${st.imgKey}.png`;
                            return (
                                <div 
                                    key={st.id}
                                    className={`aig-style-card ${isSelected ? 'active' : ''}`}
                                    onClick={() => setSelectedStyle(st.name)}
                                >
                                    {isSelected && (
                                        <div className="aig-style-check">
                                            <CheckCircle2 size={12} fill="#2563EB" color="#FFFFFF" />
                                        </div>
                                    )}
                                    <img src={imgSrc} alt={st.name} className="aig-style-img" />
                                    <h4 className="aig-style-title">{st.name}</h4>
                                    <p className="aig-style-sub">{st.sub}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* ADDITIONAL PRIORITIES CHIPS */}
                    <label className="aig-label" style={{ marginTop: '20px', marginBottom: '10px' }}>
                        Additional Priorities (Select all that apply)
                    </label>
                    <div className="aig-chips-wrap">
                        {PRIORITY_CHIPS.map((chip) => {
                            const active = priorities.includes(chip);
                            return (
                                <button
                                    key={chip}
                                    type="button"
                                    className={`aig-chip ${active ? 'active' : ''}`}
                                    onClick={() => togglePriority(chip)}
                                >
                                    <span style={{ fontWeight: 700 }}>✓</span>
                                    <span>{chip}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="aig-divider" style={{ marginBottom: '16px' }} />

                    {/* SECTION 3: ADVANCED OPTIONS */}
                    <div className="aig-adv-header" onClick={() => setIsAdvOpen(!isAdvOpen)}>
                        <div className="aig-section-title-wrap">
                            <span className="aig-num-circle">3</span>
                            <h2 className="aig-section-title">Advanced Options (Optional)</h2>
                        </div>
                        {isAdvOpen ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                    </div>

                    {isAdvOpen && (
                        <div className="aig-adv-content">
                            <div className="aig-form-row">
                                <div className="aig-field-col">
                                    <label className="aig-label">Ceiling Height</label>
                                    <select className="aig-select" defaultValue="10ft (Standard)">
                                        <option>10ft (Standard)</option>
                                        <option>11ft (Spacious)</option>
                                        <option>12ft (Luxury High)</option>
                                    </select>
                                </div>
                                <div className="aig-field-col">
                                    <label className="aig-label">Structural System</label>
                                    <select className="aig-select" defaultValue="RCC Frame">
                                        <option>RCC Frame</option>
                                        <option>Load Bearing Wall</option>
                                        <option>Steel Structure</option>
                                    </select>
                                </div>
                                <div className="aig-field-col">
                                    <label className="aig-label">Zoning Compliance</label>
                                    <select className="aig-select" defaultValue="Standard Municipal">
                                        <option>Standard Municipal</option>
                                        <option>Strict Setback Rules</option>
                                        <option>Eco-Green Building</option>
                                    </select>
                                </div>
                                <div className="aig-field-col">
                                    <label className="aig-label">Vastu Grid Alignment</label>
                                    <select className="aig-select" defaultValue="Strict (8 Directions)">
                                        <option>Strict (8 Directions)</option>
                                        <option>Moderate / Flexible</option>
                                        <option>Not Required</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GENERATION FOOTER */}
                    <div className="aig-footer">
                        <div className="aig-credits-est">
                            Estimated Credits: <strong>10</strong>
                        </div>
                        <div className="aig-footer-right">
                            <button type="button" className="aig-generate-btn" onClick={handleGenerate}>
                                <Sparkles size={16} fill="#FFFFFF" />
                                <span>Generate Now</span>
                            </button>
                            <span className="aig-credits-note">This will use 10 AI credits</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: EXAMPLE PROMPTS & RECENT GENERATIONS */}
                <div className="aig-sidebar">
                    {/* CARD 1: EXAMPLE PROMPTS */}
                    <div className="aig-sidebar-card">
                        <div className="aig-card-header">
                            <h3 className="aig-card-title">Example Prompts</h3>
                            <button type="button" className="aig-view-all" onClick={() => showToast("Showing all curated architectural AI prompts", "info")}>
                                View All
                            </button>
                        </div>

                        <div className="aig-prompts-list">
                            {EXAMPLE_PROMPTS.map((ex, idx) => {
                                const imgSrc = IMAGES ? IMAGES[ex.imgKey] : `/assets/${ex.imgKey}.png`;
                                return (
                                    <div key={idx} className="aig-prompt-item">
                                        <div className="aig-item-left">
                                            <img src={imgSrc} alt={ex.title} className="aig-item-thumb" />
                                            <div className="aig-item-info">
                                                <span className="aig-item-title" title={ex.title}>{ex.title}</span>
                                                <span className="aig-item-sub" title={ex.sub}>{ex.sub}</span>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="aig-use-btn"
                                            onClick={() => handleUsePrompt(ex)}
                                        >
                                            Use Prompt
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CARD 2: RECENT GENERATIONS */}
                    <div className="aig-sidebar-card">
                        <div className="aig-card-header">
                            <h3 className="aig-card-title">Recent Generations</h3>
                            <button type="button" className="aig-view-all" onClick={() => navigate('/my-projects')}>
                                View All
                            </button>
                        </div>

                        <div className="aig-prompts-list">
                            {RECENT_GENERATIONS.map((gen) => {
                                const imgSrc = IMAGES ? IMAGES[gen.imgKey] : `/assets/${gen.imgKey}.png`;
                                return (
                                    <div key={gen.id} className="aig-recent-item">
                                        <div className="aig-item-left">
                                            <img src={imgSrc} alt={gen.title} className="aig-item-thumb" />
                                            <div className="aig-item-info">
                                                <span className="aig-item-title" title={gen.title}>{gen.title}</span>
                                                <span className="aig-item-sub" title={gen.sub}>{gen.sub}</span>
                                                <span style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '1px' }}>{gen.time}</span>
                                            </div>
                                        </div>
                                        <div className="aig-recent-right">
                                            <span className="aig-badge-completed">{gen.status}</span>
                                            <button type="button" className="aig-more-btn" title="More actions" onClick={() => showToast(`Actions for ${gen.title}`, "info")}>
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button type="button" className="aig-history-btn" onClick={() => navigate('/my-projects')}>
                            <span>View All History</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
