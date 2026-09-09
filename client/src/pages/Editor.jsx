import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';
import { CADRenderer2D } from '../engine/cad/CADRenderer2D.js';
import { CanonicalOption04 } from '../engine/cad/CanonicalOption04.js';
import { CanonicalVastuEngine } from '../engine/cad/CanonicalVastuEngine.js';
import { formatFeetInches } from '../engine/cad/UnitEngine.js';
import '../css/editor2d.css';

const vastuEngine = new CanonicalVastuEngine();

/**
 * Calculates the full geometric and annotation bounding box of a CAD plan (in inches)
 */
function calculatePlanBoundingBox(plan) {
    const siteW = plan?.site?.width || 540;
    const siteL = plan?.site?.length || 840;

    let minX = 0;
    let minY = 0;
    let maxX = siteW;
    let maxY = siteL;

    // Account for outer dimension line offsets
    minX = Math.min(minX, -45); // Left dimension text/tick offset
    minY = Math.min(minY, -40); // Top dimension text/tick offset
    maxX = Math.max(maxX, siteW + 10);
    maxY = Math.max(maxY, siteL + 10);

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
    };
}

export default function Editor() {
    const navigate = useNavigate();
    const canvasContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const rendererRef = useRef(null);

    const { getActiveProject, updateProjectPlan, showToast, aiProvider, user } = useArchFlow();
    const activeProj = getActiveProject();

    // Authoritative Canonical Plan
    const initialPlan = activeProj?.plan || CanonicalOption04;

    const [plan, setPlan] = useState(initialPlan);
    const [history, setHistory] = useState([initialPlan]);
    const [historyIdx, setHistoryIdx] = useState(0);

    const [activeTool, setActiveTool] = useState("select");
    const [selectedSubtool, setSelectedSubtool] = useState("select");
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [selectedType, setSelectedType] = useState(null); // 'room' | 'wall' | 'door' | 'window' | 'furniture'

    // Camera & Viewport State (Separate from CAD model)
    const [scale, setScale] = useState(0.7);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [gridOn, setGridOn] = useState(true);
    const [snapOn, setSnapOn] = useState(true);
    const [orthoOn, setOrthoOn] = useState(false);
    const [dimsOn, setDimsOn] = useState(true);
    const [scaleRatio, setScaleRatio] = useState("1:50");

    const [selectedFloor, setSelectedFloor] = useState("Ground Floor");
    const [isPropPanelOpen, setIsPropPanelOpen] = useState(true);
    const [isVastuModalOpen, setIsVastuModalOpen] = useState(false);
    const [vastuReport, setVastuReport] = useState(null);

    // Selected Room Editable State
    const [roomNotes, setRoomNotes] = useState("");
    const [roomColor, setRoomColor] = useState("#F5F6FA");
    const [roomOpacity, setRoomOpacity] = useState(100);

    // AI Intent Modification
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAiModifying, setIsAiModifying] = useState(false);

    // Sync project changes when active project switches
    useEffect(() => {
        if (activeProj?.plan) {
            setPlan(activeProj.plan);
            setHistory([activeProj.plan]);
            setHistoryIdx(0);
        }
    }, [activeProj?.id]);

    // Select default room (Living Room or first room) on mount
    useEffect(() => {
        if (plan?.rooms && plan.rooms.length > 0 && !selectedEntity) {
            const living = plan.rooms.find(r => r.type === 'living') || plan.rooms[0];
            setSelectedEntity(living);
            setSelectedType('room');
        }
    }, [plan]);

    // Commit plan history
    const commitPlan = useCallback((newPlan) => {
        const newHist = history.slice(0, historyIdx + 1);
        newHist.push(JSON.parse(JSON.stringify(newPlan)));
        setHistory(newHist);
        setHistoryIdx(newHist.length - 1);
        setPlan(newPlan);
        if (activeProj?.id) {
            updateProjectPlan(activeProj.id, newPlan);
        }
    }, [history, historyIdx, activeProj, updateProjectPlan]);

    const undo = () => {
        if (historyIdx > 0) {
            const prev = history[historyIdx - 1];
            setHistoryIdx(historyIdx - 1);
            setPlan(prev);
            if (activeProj?.id) updateProjectPlan(activeProj.id, prev);
            showToast("Undo applied", "info");
        }
    };

    const redo = () => {
        if (historyIdx < history.length - 1) {
            const next = history[historyIdx + 1];
            setHistoryIdx(historyIdx + 1);
            setPlan(next);
            if (activeProj?.id) updateProjectPlan(activeProj.id, next);
            showToast("Redo applied", "info");
        }
    };

    // Calculate Vastu Report
    useEffect(() => {
        if (plan) {
            const report = vastuEngine.analyzePlan(plan);
            setVastuReport(report);
        }
    }, [plan]);

    /**
     * Mathematical Fit-to-Screen Algorithm
     * Fits the 45'x70' plan (plus dimensions) into 85-90% of the REAL available canvas area, perfectly centered.
     */
    const handleFitToScreen = useCallback(() => {
        const container = canvasContainerRef.current;
        if (!container || !plan) return;

        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const bounds = calculatePlanBoundingBox(plan);

        // 5-7% comfortable margin padding
        const padX = Math.max(24, rect.width * 0.05);
        const padY = Math.max(24, rect.height * 0.05);

        const usableW = rect.width - 2 * padX;
        const usableH = rect.height - 2 * padY;

        const scaleX = usableW / bounds.width;
        const scaleY = usableH / bounds.height;

        // Uniform aspect-ratio preserving scale targeting ~88% of canvas
        const fitScale = Math.min(scaleX, scaleY);

        // Center CAD bounding box directly on canvas center
        const centerPanX = (rect.width / 2) - (bounds.centerX * fitScale);
        const centerPanY = (rect.height / 2) - (bounds.centerY * fitScale);

        setScale(fitScale);
        setPan({ x: centerPanX, y: centerPanY });
    }, [plan]);

    // Auto-fit on initial mount & whenever plan changes
    useEffect(() => {
        handleFitToScreen();
    }, [handleFitToScreen]);

    // Responsive ResizeObserver: Automatically recalculate when canvas area resizes (e.g. Properties panel toggle, window resize)
    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        let resizeTimeout;
        const ro = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                handleFitToScreen();
            }, 50);
        });

        ro.observe(container);
        return () => {
            clearTimeout(resizeTimeout);
            ro.disconnect();
        };
    }, [handleFitToScreen]);

    const MIN_SCALE = 0.15;
    const MAX_SCALE = 5.0;

    // Render Canvas & Minimap
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = canvasContainerRef.current;
        if (!canvas || !container || !plan) return;

        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const renderer = new CADRenderer2D(canvas, {
            scale: scale,
            pan: pan,
            viewportWidth: rect.width,
            viewportHeight: rect.height,
            showGrid: gridOn,
            showDimensions: dimsOn,
            showFurniture: true,
            selectedEntityId: selectedEntity?.id
        });
        rendererRef.current = renderer;

        renderer.render(plan);

        // Render Minimap
        if (minimapRef.current) {
            renderer.renderMinimap(minimapRef.current, plan);
        }
    }, [plan, scale, pan, gridOn, dimsOn, selectedEntity]);

    // Canvas Pointer Handlers
    const handlePointerDown = (e) => {
        const canvas = canvasRef.current;
        if (!canvas || !rendererRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = rendererRef.current.screenToWorld(screenX, screenY);

        const isPanTrigger = e.button === 1 || e.button === 4 || e.spaceKey || activeTool === "pan" || selectedSubtool === "move";

        // Entity Selection
        let found = null;
        let type = null;

        if (!isPanTrigger && e.button === 0) {
            // Check Rooms
            (plan.rooms || []).forEach(r => {
                if (world.x >= r.x && world.x <= r.x + r.w && world.y >= r.y && world.y <= r.y + r.h) {
                    found = r;
                    type = 'room';
                }
            });

            // Check Walls
            if (!found) {
                (plan.walls || []).forEach(w => {
                    const minX = Math.min(w.start.x, w.end.x) - 10;
                    const maxX = Math.max(w.start.x, w.end.x) + 10;
                    const minY = Math.min(w.start.y, w.end.y) - 10;
                    const maxY = Math.max(w.start.y, w.end.y) + 10;

                    if (world.x >= minX && world.x <= maxX && world.y >= minY && world.y <= maxY) {
                        found = w;
                        type = 'wall';
                    }
                });
            }
        }

        if (isPanTrigger || !found) {
            setIsPanning(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }

        if (found) {
            setSelectedEntity(found);
            setSelectedType(type);
            setIsPropPanelOpen(true);
        }
    };

    const handlePointerMove = (e) => {
        if (isPanning) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handlePointerUp = () => {
        setIsPanning(false);
    };

    const panRef = useRef(pan);
    const scaleRef = useRef(scale);

    useEffect(() => {
        panRef.current = pan;
    }, [pan]);

    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    // Cursor-anchored Zoom (zooms smoothly centered at mouse position)
    useEffect(() => {
        const container = canvasContainerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const onWheel = (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const curPan = panRef.current;
            const curScale = scaleRef.current;

            // Current world position under cursor
            const worldX = (mouseX - curPan.x) / curScale;
            const worldY = (mouseY - curPan.y) / curScale;

            const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
            const newScale = Math.max(MIN_SCALE, Math.min(curScale * zoomFactor, MAX_SCALE));

            // Adjust pan to keep world position centered under cursor
            const newPanX = mouseX - worldX * newScale;
            const newPanY = mouseY - worldY * newScale;

            setScale(newScale);
            setPan({ x: newPanX, y: newPanY });
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, []);

    const zoomIn = () => {
        const container = canvasContainerRef.current;
        const rect = container ? container.getBoundingClientRect() : { width: 600, height: 600 };
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const worldX = (centerX - pan.x) / scale;
        const worldY = (centerY - pan.y) / scale;

        const newScale = Math.min(scale * 1.2, MAX_SCALE);
        const newPanX = centerX - worldX * newScale;
        const newPanY = centerY - worldY * newScale;

        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
    };

    const zoomOut = () => {
        const container = canvasContainerRef.current;
        const rect = container ? container.getBoundingClientRect() : { width: 600, height: 600 };
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const worldX = (centerX - pan.x) / scale;
        const worldY = (centerY - pan.y) / scale;

        const newScale = Math.max(scale * 0.8, MIN_SCALE);
        const newPanX = centerX - worldX * newScale;
        const newPanY = centerY - worldY * newScale;

        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
    };

    // AI Natural Language Plan Modification
    const handleApplyAiModification = async () => {
        if (!aiPrompt.trim()) return;
        setIsAiModifying(true);
        showToast("Architecture Engine: Solving constraints and recalculating CAD model...", "info");

        try {
            const modified = await aiProvider.modifyPlan(plan, aiPrompt);
            commitPlan(modified);
            showToast("Plan modified and verified by Geometry Solver!", "success");
            setAiPrompt("");
        } catch (err) {
            showToast(`Modification failed: ${err.message}`, "error");
        } finally {
            setIsAiModifying(false);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
            } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                redo();
            } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (activeProj?.id) updateProjectPlan(activeProj.id, plan);
                showToast("Canonical CAD plan saved successfully!", "success");
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                handleFitToScreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [plan, undo, redo, activeProj, updateProjectPlan, handleFitToScreen, showToast]);

    const activeRoom = selectedEntity && selectedType === 'room' ? selectedEntity : null;
    const activeWall = selectedEntity && selectedType === 'wall' ? selectedEntity : null;

    // Room Area Calculation
    const displayArea = activeRoom ? (activeRoom.areaSqFt || Math.round((activeRoom.w * activeRoom.h) / 144 * 10) / 10) : 0;
    const displayWidth = activeRoom ? formatFeetInches(activeRoom.w, false) : "-";
    const displayLength = activeRoom ? formatFeetInches(activeRoom.h, false) : "-";

    return (
        <div className="ed-wrapper">
            {/* 1. TOP HEADER BAR */}
            <header className="ed-header">
                <div className="ed-header-left">
                    <Link to="/my-projects" className="ed-back-link">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                        Back to Projects
                    </Link>
                    <div className="ed-header-divider" />
                    <h1 className="ed-title">{plan.project?.name || 'GF Scheme Plan - Option 04'}</h1>
                    <span className="ed-status-badge">Saved</span>
                </div>

                <div className="ed-header-center">
                    <div className="ed-floor-select-wrap">
                        <span className="ed-floor-label">Floor</span>
                        <select 
                            className="ed-floor-select" 
                            value={selectedFloor}
                            onChange={(e) => setSelectedFloor(e.target.value)}
                        >
                            <option value="Ground Floor">Ground Floor</option>
                            <option value="First Floor">First Floor</option>
                            <option value="Terrace">Terrace</option>
                        </select>
                    </div>
                </div>

                <div className="ed-header-right">
                    <button className="ed-action-btn" onClick={undo} disabled={historyIdx <= 0} title="Undo (Ctrl+Z)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l6-6M3 10l6 6"/></svg>
                        Undo
                    </button>
                    <button className="ed-action-btn" onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (Ctrl+Y)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 0 0-5 5v2M21 10l-6-6M21 10l-6 6"/></svg>
                        Redo
                    </button>
                    <button className="ed-action-btn" onClick={() => { if (activeProj?.id) updateProjectPlan(activeProj.id, plan); showToast("Plan saved successfully!", "success"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Save
                    </button>
                    <button className="ed-action-btn" onClick={() => navigate('/export')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export
                    </button>

                    <button className="ed-gen3d-btn" onClick={() => navigate('/viewer')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>
                        Generate 3D
                    </button>

                    <div className="ed-user-profile">
                        <div className="ed-avatar">RC</div>
                        <div className="ed-user-meta">
                            <span className="ed-user-name">Ramesh C</span>
                            <span className="ed-user-plan">Premium Plan</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. SECONDARY CAD TOOL RIBBON */}
            <div className="ed-toolbar">
                <button className={`ed-tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => setActiveTool('select')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
                    Select
                </button>
                <button className={`ed-tool-btn ${activeTool === 'wall' ? 'active' : ''}`} onClick={() => { setActiveTool('wall'); showToast("Wall tool activated", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v6M15 9v6M9 15v6"/></svg>
                    Wall
                </button>
                <button className={`ed-tool-btn ${activeTool === 'room' ? 'active' : ''}`} onClick={() => { setActiveTool('room'); showToast("Room tool activated", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    Room
                </button>
                <button className={`ed-tool-btn ${activeTool === 'door' ? 'active' : ''}`} onClick={() => { setActiveTool('door'); showToast("Door tool activated", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M6 21V3h12v18M14 12v.01"/></svg>
                    Door
                </button>
                <button className={`ed-tool-btn ${activeTool === 'window' ? 'active' : ''}`} onClick={() => { setActiveTool('window'); showToast("Window tool activated", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/></svg>
                    Window
                </button>
                <button className={`ed-tool-btn ${activeTool === 'staircase' ? 'active' : ''}`} onClick={() => { setActiveTool('staircase'); showToast("Staircase tool activated", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h4v-4h4v-4h4V6"/></svg>
                    Staircase
                </button>
                <button className={`ed-tool-btn ${activeTool === 'column' ? 'active' : ''}`} onClick={() => { setActiveTool('column'); showToast("Column tool activated", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" fill="currentColor"/></svg>
                    Column
                </button>
                <button className={`ed-tool-btn ${activeTool === 'furniture' ? 'active' : ''}`} onClick={() => { setActiveTool('furniture'); showToast("Furniture tool activated", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 18v3M20 18v3M4 14h16M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H4V9z"/></svg>
                    Furniture
                </button>
                <button className={`ed-tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => { setActiveTool('text'); showToast("Text tool activated", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                    Text
                </button>
                <button className={`ed-tool-btn ${activeTool === 'dimension' ? 'active' : ''}`} onClick={() => { setDimsOn(!dimsOn); showToast(`Dimensions: ${!dimsOn ? 'ON' : 'OFF'}`, "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 8v8M21 8v8"/></svg>
                    Dimension
                </button>
                <button className={`ed-tool-btn ${activeTool === 'area' ? 'active' : ''}`} onClick={() => { setActiveTool('area'); showToast("Area calculation mode", "info"); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM9 9h6v6H9z"/></svg>
                    Area
                </button>
                <button className={`ed-tool-btn ${gridOn ? 'active' : ''}`} onClick={() => setGridOn(!gridOn)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Grid
                </button>
                <button className="ed-tool-btn" onClick={() => setIsVastuModalOpen(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18 4.5 4.5 0 0 1 0-9 4.5 4.5 0 0 0 0-9z"/><circle cx="12" cy="7.5" r="1.5" fill="currentColor"/><circle cx="12" cy="16.5" r="1.5" fill="currentColor"/></svg>
                    Vastu ({vastuReport?.score ?? 100})
                </button>
            </div>

            {/* AI Architectural Intent Bar */}
            <div style={{ display: 'flex', gap: 10, padding: '6px 24px', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6D28D9', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✨ AI Architectural Intent:
                </span>
                <input
                    type="text"
                    placeholder="e.g. 'Make bedroom 1 12 feet wide', 'Move kitchen to north-east', 'Add attached toilet'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyAiModification(); }}
                    style={{ flex: 1, padding: '5px 12px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 6, color: '#111827', fontSize: 12 }}
                />
                <button
                    disabled={isAiModifying || !aiPrompt.trim()}
                    onClick={handleApplyAiModification}
                    className="ed-gen3d-btn"
                    style={{ padding: '5px 14px', fontSize: 12, height: 30 }}
                >
                    {isAiModifying ? 'Solving...' : 'Apply Intent'}
                </button>
            </div>

            {/* 3. MAIN BODY (CANVAS + FLOATING TOOLS + PROPERTIES) */}
            <div className="ed-body">
                {/* Center Canvas Area */}
                <div 
                    ref={canvasContainerRef} 
                    className="ed-canvas-area"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{ cursor: isPanning ? 'grabbing' : activeTool === 'pan' || selectedSubtool === 'move' ? 'grab' : 'crosshair' }}
                >
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

                    {/* Left Floating Tools Palette */}
                    <div className="ed-subtools-panel">
                        <div className="ed-subtools-header">
                            <span>Tools</span>
                            <span style={{ fontSize: 12, color: '#9CA3AF' }}>&laquo;</span>
                        </div>
                        <div className="ed-subtools-list">
                            <button className={`ed-subtool-btn ${selectedSubtool === 'select' ? 'active' : ''}`} onClick={() => setSelectedSubtool('select')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
                                Select
                            </button>
                            <button className={`ed-subtool-btn ${selectedSubtool === 'move' ? 'active' : ''}`} onClick={() => setSelectedSubtool('move')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
                                Move
                            </button>
                            <button className={`ed-subtool-btn ${selectedSubtool === 'rotate' ? 'active' : ''}`} onClick={() => { setSelectedSubtool('rotate'); showToast("Rotate mode", "info"); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                Rotate
                            </button>
                            <button className={`ed-subtool-btn ${selectedSubtool === 'scale' ? 'active' : ''}`} onClick={() => { setSelectedSubtool('scale'); showToast("Scale mode", "info"); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                Scale
                            </button>
                            <button className={`ed-subtool-btn ${selectedSubtool === 'copy' ? 'active' : ''}`} onClick={() => { showToast("Room copied to clipboard", "success"); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                Copy
                            </button>
                            <button className="ed-subtool-btn delete" onClick={() => { if (selectedEntity) { showToast(`Deleted ${selectedEntity.name || selectedEntity.id}`, "info"); setSelectedEntity(null); } }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Bottom Left Floating View Controls */}
                    <div className="ed-view-controls">
                        <div className="ed-view-header">View Controls</div>
                        <div className="ed-view-btns">
                            <button className="ed-view-btn" onClick={zoomIn} title="Zoom In">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button className="ed-view-btn" onClick={zoomOut} title="Zoom Out">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button className="ed-view-btn" onClick={handleFitToScreen} title="Zoom to Selection">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button className="ed-view-btn" onClick={handleFitToScreen} title="Fit to Screen (F)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                        </div>
                        <select 
                            className="ed-scale-select"
                            value={scaleRatio}
                            onChange={(e) => setScaleRatio(e.target.value)}
                        >
                            <option value="1:50">Scale: 1:50</option>
                            <option value="1:100">Scale: 1:100</option>
                            <option value="1:200">Scale: 1:200</option>
                        </select>
                    </div>

                    {/* Bottom Right Floating Minimap */}
                    <div className="ed-minimap-box">
                        <canvas ref={minimapRef} width={160} height={120} style={{ width: '100%', height: '100%', display: 'block' }} />
                    </div>
                </div>

                {/* Right Property Inspector Panel */}
                {isPropPanelOpen && (
                    <aside className="ed-props-panel">
                        <div className="ed-props-header">
                            <h2 className="ed-props-title">Properties</h2>
                            <button className="ed-props-close" onClick={() => setIsPropPanelOpen(false)}>✕</button>
                        </div>

                        <div className="ed-props-content">
                            {/* Room Header & Swatch */}
                            <div className="ed-prop-group">
                                <label className="ed-prop-label">Room</label>
                                <div className="ed-room-swatch-row">
                                    <span className="ed-room-swatch" style={{ background: roomColor }} />
                                    <span className="ed-room-name-text">{activeRoom?.name || 'Living Hall'}</span>
                                </div>
                            </div>

                            {/* Dimensions Grid */}
                            <div className="ed-props-row">
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Width</label>
                                    <input type="text" className="ed-input" value={displayWidth} readOnly />
                                </div>
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Length</label>
                                    <input type="text" className="ed-input" value={displayLength} readOnly />
                                </div>
                            </div>

                            {/* Area & Height */}
                            <div className="ed-props-row">
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Area</label>
                                    <input type="text" className="ed-input" value={`${displayArea} sq ft`} readOnly />
                                </div>
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Height</label>
                                    <input type="text" className="ed-input" value="10'0&quot;" readOnly />
                                </div>
                            </div>

                            {/* Floor & Floor Finish */}
                            <div className="ed-prop-group">
                                <label className="ed-prop-label">Floor</label>
                                <select className="ed-select" value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)}>
                                    <option value="Ground Floor">Ground Floor</option>
                                    <option value="First Floor">First Floor</option>
                                </select>
                            </div>

                            <div className="ed-prop-group">
                                <label className="ed-prop-label">Floor Finish</label>
                                <select className="ed-select" defaultValue={activeRoom?.floorFinish || 'Vitrified Tiles'}>
                                    <option value="Vitrified Tiles">Vitrified Tiles</option>
                                    <option value="Italian Marble">Italian Marble</option>
                                    <option value="Wooden Flooring">Wooden Flooring</option>
                                    <option value="Granite">Granite</option>
                                    <option value="Ceramic Tiles">Ceramic Tiles</option>
                                    <option value="Anti-Skid Ceramic">Anti-Skid Ceramic</option>
                                </select>
                            </div>

                            {/* Wall Section */}
                            <div className="ed-props-divider" />
                            <div className="ed-section-title">
                                <span>Wall</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                            </div>

                            <div className="ed-props-row">
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Wall Thickness</label>
                                    <input type="text" className="ed-input" value={activeWall?.thickness ? `${activeWall.thickness}&quot;` : activeRoom?.wallThickness || '9&quot;'} readOnly />
                                </div>
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Wall Finish</label>
                                    <select className="ed-select" defaultValue={activeRoom?.wallFinish || 'Plaster'}>
                                        <option value="Plaster">Plaster</option>
                                        <option value="Plaster & Paint">Plaster &amp; Paint</option>
                                        <option value="Glazed Tiles">Glazed Tiles</option>
                                        <option value="Weatherproof Paint">Weatherproof Paint</option>
                                    </select>
                                </div>
                            </div>

                            {/* Door / Window Section */}
                            <div className="ed-props-divider" />
                            <div className="ed-section-title">
                                <span>Door / Window</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>

                            {/* Design Section */}
                            <div className="ed-props-divider" />
                            <div className="ed-section-title">
                                <span>Design</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                            </div>

                            <div className="ed-props-row">
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Color</label>
                                    <div className="ed-color-input-wrap">
                                        <input type="color" className="ed-color-picker" value={roomColor} onChange={(e) => setRoomColor(e.target.value)} />
                                        <span className="ed-color-hex">{roomColor.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Opacity</label>
                                    <div className="ed-unit-input-wrap">
                                        <input type="number" className="ed-input" value={roomOpacity} onChange={(e) => setRoomOpacity(Number(e.target.value))} min="0" max="100" />
                                        <span className="ed-unit-suffix">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="ed-props-divider" />
                            <div className="ed-section-title">
                                <span>Notes</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                            </div>

                            <div className="ed-prop-group">
                                <textarea 
                                    className="ed-textarea" 
                                    placeholder="Add notes about this room..."
                                    value={roomNotes}
                                    onChange={(e) => setRoomNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* 4. BOTTOM STATUS BAR */}
            <footer className="ed-statusbar">
                <div className="ed-statusbar-left">
                    <span>Project: <strong style={{ color: '#111827' }}>{plan.project?.name || 'GF Scheme Plan - Option 04'}</strong></span>
                    <span>Floor: <strong style={{ color: '#111827' }}>{selectedFloor}</strong></span>
                    <span>Units: <strong style={{ color: '#111827' }}>Feet &amp; Inches</strong></span>
                </div>
                <div className="ed-statusbar-right">
                    <button className="ed-status-toggle" onClick={() => setGridOn(!gridOn)}>
                        Grid: <strong>{gridOn ? 'ON' : 'OFF'}</strong>
                    </button>
                    <button className="ed-status-toggle" onClick={() => setSnapOn(!snapOn)}>
                        Snap: <strong>{snapOn ? 'ON' : 'OFF'}</strong>
                    </button>
                    <button className="ed-status-toggle" onClick={() => setOrthoOn(!orthoOn)}>
                        Ortho: <strong>{orthoOn ? 'ON' : 'OFF'}</strong>
                    </button>
                </div>
            </footer>

            {/* Vastu Compliance Modal */}
            {isVastuModalOpen && vastuReport && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div style={{ width: 620, maxHeight: '85vh', background: '#FFFFFF', borderRadius: 16, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
                            <div>
                                <h3 style={{ color: '#111827', margin: 0, fontSize: 18, fontWeight: 700 }}>☯ Canonical Vastu Shastra Analysis</h3>
                                <p style={{ color: '#6B7280', fontSize: 12, margin: '4px 0 0' }}>Computed across 9-zone quadrant matrix on exact canonical CAD coordinates.</p>
                            </div>
                            <button onClick={() => setIsVastuModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12 }}>
                            <div style={{ fontSize: 36, fontWeight: 800, color: vastuReport.score >= 80 ? '#16A34A' : '#D97706' }}>
                                {vastuReport.score}/100
                            </div>
                            <div>
                                <div style={{ color: '#111827', fontWeight: 700, fontSize: 15 }}>{vastuReport.summary}</div>
                                <div style={{ color: '#6B7280', fontSize: 12 }}>Orientation: {vastuReport.facing} Facing Plot • Status: {vastuReport.status}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {vastuReport.rules.map((rule, idx) => (
                                <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{rule.name}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: rule.status === 'PASS' ? '#DCFCE7' : '#FEF3C7', color: rule.status === 'PASS' ? '#16A34A' : '#D97706' }}>
                                            {rule.status}
                                        </span>
                                    </div>
                                    <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>{rule.description}</p>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setIsVastuModalOpen(false)} className="ed-gen3d-btn" style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                            Close Analysis
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
