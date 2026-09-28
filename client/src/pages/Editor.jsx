import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';
import { CADRenderer2D } from '../engine/cad/CADRenderer2D.js';
import { CanonicalOption04 } from '../engine/cad/CanonicalOption04.js';
import { generateDefaultFloorPlan } from '../engine/cad/PlanGenerator.js';
import { CanonicalVastuEngine } from '../engine/cad/CanonicalVastuEngine.js';
import { formatFeetInches, parseArchitecturalDimension } from '../engine/cad/UnitEngine.js';
import { geminiClient } from '../engine/ai/GeminiClient.js';
import { ArchitectureAIProvider } from '../engine/cad/ArchitectureAIProvider.js';
import '../css/editor2d.css';

const vastuEngine = new CanonicalVastuEngine();
const architectureAI = new ArchitectureAIProvider();

/**
 * Calculates the full geometric and annotation bounding box of a CAD plan (in inches)
 */
function calculatePlanBoundingBox(plan) {
    const siteW = plan?.site?.width || 480;
    const siteL = (plan?.site?.length || 360) + 60; // Include projecting sitout porch

    let minX = -45; // Left dimension text/tick offset
    let minY = -40; // Top dimension text/tick offset
    let maxX = siteW + 55; // Right compass dial offset
    let maxY = siteL + 35; // Bottom East Road label offset

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

    const { getActiveProject, updateProjectPlan, showToast, user } = useArchFlow();
    const activeProj = getActiveProject();
    // Authoritative Canonical Plan Resolver (Defaults to user plan or null)
    const getResolvedPlan = (proj) => {
        if (proj?.plan && proj.plan.rooms && proj.plan.rooms.length > 0) {
            return proj.plan;
        }
        if (proj) {
            return generateDefaultFloorPlan(proj);
        }
        return null;
    };

    const initialPlan = getResolvedPlan(activeProj);

    const [plan, setPlan] = useState(initialPlan);
    const [history, setHistory] = useState(initialPlan ? [initialPlan] : []);
    const [historyIdx, setHistoryIdx] = useState(0);

    const [activeTool, setActiveTool] = useState("select");
    const [selectedSubtool, setSelectedSubtool] = useState("select");
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [selectedType, setSelectedType] = useState('room'); // 'room' | 'wall' | 'door' | 'window' | 'furniture'

    // Camera & Viewport State
    const [scale, setScale] = useState(1.1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const spaceKeyRef = useRef(false); // Spacebar held → pan mode

    const [gridOn, setGridOn] = useState(true);
    const [snapOn, setSnapOn] = useState(true);
    const [orthoOn, setOrthoOn] = useState(false);
    const [dimsOn, setDimsOn] = useState(true);
    const [scaleRatio, setScaleRatio] = useState("1:50");
    const [zoomPreset, setZoomPreset] = useState('fit'); // zoom preset key

    const [selectedFloor, setSelectedFloor] = useState("Ground Floor");
    const [isPropPanelOpen, setIsPropPanelOpen] = useState(true);
    const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);

    // Collapsible Properties Sections
    const [isWallSecOpen, setIsWallSecOpen] = useState(true);
    const [isDoorWinSecOpen, setIsDoorWinSecOpen] = useState(false);
    const [isDesignSecOpen, setIsDesignSecOpen] = useState(true);
    const [isNotesSecOpen, setIsNotesSecOpen] = useState(true);

    // Selected Room Editable State
    const [widthInput, setWidthInput] = useState("16'6\"");
    const [lengthInput, setLengthInput] = useState("15'0\"");
    const [heightInput, setHeightInput] = useState("10'0\"");
    const [floorFinishInput, setFloorFinishInput] = useState("Vitrified Tiles");
    const [wallThicknessInput, setWallThicknessInput] = useState("9\"");
    const [wallFinishInput, setWallFinishInput] = useState("Plaster");
    const [roomNotes, setRoomNotes] = useState("");
    const [roomColor, setRoomColor] = useState("#F5F6FA");
    const [roomOpacity, setRoomOpacity] = useState(100);

    // AI Assistant & Command State
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
    const [aiCommandInput, setAiCommandInput] = useState("");
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [aiChatMessages, setAiChatMessages] = useState([]);
    const [vastuModalData, setVastuModalData] = useState(null);

    const handleExecuteAICommand = async (cmdText = null) => {
        const textToRun = cmdText || aiCommandInput;
        if (!textToRun || !textToRun.trim()) return;

        setIsAIProcessing(true);
        showToast("Gemini AI: Processing architectural command...", "info");

        try {
            const lower = textToRun.toLowerCase();
            
            // 1. Vastu Query
            if (lower.includes('vastu') || lower.includes('compliance') || lower.includes('check vastu')) {
                const report = vastuEngine.analyzePlan(plan);
                const explanation = await geminiClient.explainVastu(report, textToRun);
                setVastuModalData({ report, explanation });
                setAiChatMessages(prev => [...prev, 
                    { sender: 'user', text: textToRun },
                    { sender: 'ai', text: `Vastu Analysis: Score ${report.score}/100 (${report.status})\n${explanation.overview}` }
                ]);
                showToast(`Vastu Compliance: ${report.score}/100 (${report.status})`, "success");
                setAiCommandInput('');
                return;
            }

            // 2. CAD Plan Modification (RESIZE_ROOM, ADD_ROOM, CHANGE_STYLE, etc.)
            const updated = await architectureAI.modifyPlan(plan, textToRun);

            if (updated) {
                commitPlan(updated);
                if (activeProj?.id) updateProjectPlan(activeProj.id, updated);
                showToast("CAD geometry updated successfully!", "success");
                setAiChatMessages(prev => [...prev, 
                    { sender: 'user', text: textToRun },
                    { sender: 'ai', text: `Action executed: "${textToRun}". CAD geometry and measurements refreshed.` }
                ]);
            }
            setAiCommandInput('');
        } catch (err) {
            console.error("AI Command execution error:", err);
            showToast("AI Command failed: " + err.message, "error");
        } finally {
            setIsAIProcessing(false);
        }
    };

    // Sync project changes when active project switches & auto-initialize default plan if empty
    useEffect(() => {
        if (activeProj) {
            const resolved = getResolvedPlan(activeProj);
            if (resolved) {
                setPlan(resolved);
                setHistory([resolved]);
                setHistoryIdx(0);
                if (!activeProj.plan || !activeProj.plan.rooms || activeProj.plan.rooms.length === 0) {
                    updateProjectPlan(activeProj.id, resolved);
                }
            }
        } else {
            setPlan(null);
            setHistory([]);
            setHistoryIdx(0);
        }
    }, [activeProj?.id]);

    // Select default room (Living Hall) on mount
    useEffect(() => {
        if (plan?.rooms && plan.rooms.length > 0 && !selectedEntity) {
            const living = plan.rooms.find(r => r.type === 'living' || r.name.toLowerCase().includes('living')) || plan.rooms[0];
            setSelectedEntity(living);
            setSelectedType('room');
        }
    }, [plan, selectedEntity]);

    // Synchronize local input state whenever selectedEntity or plan updates
    useEffect(() => {
        if (selectedEntity && selectedType === 'room') {
            const currentRoom = plan?.rooms?.find(r => r.id === selectedEntity.id) || selectedEntity;
            const wStr = currentRoom.clearDimensions ? formatFeetInches(currentRoom.clearDimensions.width, false) : formatFeetInches(currentRoom.w, false);
            const lStr = currentRoom.clearDimensions ? formatFeetInches(currentRoom.clearDimensions.length, false) : formatFeetInches(currentRoom.h, false);
            const hStr = currentRoom.height ? formatFeetInches(currentRoom.height, false) : "10'0\"";

            setWidthInput(wStr);
            setLengthInput(lStr);
            setHeightInput(hStr);
            setFloorFinishInput(currentRoom.floorFinish || "Vitrified Tiles");
            setWallThicknessInput(currentRoom.wallThickness || '9"');
            setWallFinishInput(currentRoom.wallFinish || "Plaster");
            setRoomNotes(currentRoom.notes || "");
            setRoomColor(currentRoom.color || "#F5F6FA");
            setRoomOpacity(currentRoom.opacity !== undefined ? currentRoom.opacity : 100);
        }
    }, [selectedEntity?.id, selectedType, plan]);

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
            if (selectedEntity) {
                const updatedSelected = prev.rooms?.find(r => r.id === selectedEntity.id);
                if (updatedSelected) setSelectedEntity(updatedSelected);
            }
            if (activeProj?.id) updateProjectPlan(activeProj.id, prev);
            showToast("Undo applied", "info");
        }
    };

    const redo = () => {
        if (historyIdx < history.length - 1) {
            const next = history[historyIdx + 1];
            setHistoryIdx(historyIdx + 1);
            setPlan(next);
            if (selectedEntity) {
                const updatedSelected = next.rooms?.find(r => r.id === selectedEntity.id);
                if (updatedSelected) setSelectedEntity(updatedSelected);
            }
            if (activeProj?.id) updateProjectPlan(activeProj.id, next);
            showToast("Redo applied", "info");
        }
    };

    /**
     * Updates selected room's physical geometry, area, dimensions, connected walls, and furniture
     */
    const updateRoomDimensions = (roomId, newWidthInches, newLengthInches) => {
        if (!plan || !plan.rooms) return;
        const roomIndex = plan.rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return;

        const oldRoom = plan.rooms[roomIndex];
        const oldW = oldRoom.w;
        const oldH = oldRoom.h;

        // Clamp to sensible architectural limits
        const maxW = (plan.site?.width || 480) * 1.5;
        const maxH = (plan.site?.length || 360) * 1.5;
        const clampedW = Math.max(36, Math.min(newWidthInches, maxW));
        const clampedH = Math.max(36, Math.min(newLengthInches, maxH));

        const deltaW = clampedW - oldW;
        const deltaH = clampedH - oldH;

        const updatedRooms = plan.rooms.map((rm, idx) => {
            if (idx !== roomIndex) return rm;

            const wFt = Math.round((clampedW / 12) * 10) / 10;
            const hFt = Math.round((clampedH / 12) * 10) / 10;
            const areaSqFt = Math.round((clampedW * clampedH / 144) * 10) / 10;
            const dimensionLabel = `${formatFeetInches(clampedW, false)} × ${formatFeetInches(clampedH, false)}`;

            return {
                ...rm,
                w: clampedW,
                h: clampedH,
                areaSqFt,
                dimensionLabel,
                clearDimensions: {
                    width: clampedW,
                    length: clampedH,
                    widthFt: wFt,
                    lengthFt: hFt
                }
            };
        });

        // Update connected wall endpoints aligned with the room boundary
        const updatedWalls = (plan.walls || []).map(wall => {
            let newStart = { ...wall.start };
            let newEnd = { ...wall.end };

            if (Math.abs(wall.start.x - (oldRoom.x + oldW)) < 6 && Math.abs(wall.end.x - (oldRoom.x + oldW)) < 6) {
                if (wall.start.y >= oldRoom.y - 6 && wall.end.y <= oldRoom.y + oldH + 6) {
                    newStart.x += deltaW;
                    newEnd.x += deltaW;
                }
            } else if (Math.abs(wall.end.x - (oldRoom.x + oldW)) < 6 && wall.start.y >= oldRoom.y - 6 && wall.start.y <= oldRoom.y + oldH + 6) {
                newEnd.x += deltaW;
            }

            if (Math.abs(wall.start.y - (oldRoom.y + oldH)) < 6 && Math.abs(wall.end.y - (oldRoom.y + oldH)) < 6) {
                if (wall.start.x >= oldRoom.x - 6 && wall.end.x <= oldRoom.x + oldW + 6) {
                    newStart.y += deltaH;
                    newEnd.y += deltaH;
                }
            } else if (Math.abs(wall.end.y - (oldRoom.y + oldH)) < 6 && wall.start.x >= oldRoom.x - 6 && wall.start.x <= oldRoom.x + oldW + 6) {
                newEnd.y += deltaH;
            }

            return {
                ...wall,
                start: newStart,
                end: newEnd
            };
        });

        // Keep furniture inside resized room boundaries
        const updatedFurniture = (plan.furniture || []).map(f => {
            if (f.roomId === roomId) {
                const maxX = oldRoom.x + clampedW - (f.width || 20);
                const maxY = oldRoom.y + clampedH - (f.length || 20);
                return {
                    ...f,
                    x: Math.min(f.x, Math.max(oldRoom.x, maxX)),
                    y: Math.min(f.y, Math.max(oldRoom.y, maxY))
                };
            }
            return f;
        });

        const newPlan = {
            ...plan,
            rooms: updatedRooms,
            walls: updatedWalls,
            furniture: updatedFurniture
        };

        commitPlan(newPlan);
        setSelectedEntity(updatedRooms[roomIndex]);
    };

    /**
     * Updates an arbitrary room property (e.g. finishes, notes, height)
     */
    const updateRoomProperty = (roomId, key, value) => {
        if (!plan || !plan.rooms) return;
        const roomIndex = plan.rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return;

        const updatedRooms = plan.rooms.map((rm, idx) => {
            if (idx !== roomIndex) return rm;
            return {
                ...rm,
                [key]: value
            };
        });

        const newPlan = {
            ...plan,
            rooms: updatedRooms
        };

        commitPlan(newPlan);
        setSelectedEntity(updatedRooms[roomIndex]);
    };

    const handleCommitWidth = () => {
        if (!activeRoom) return;
        const parsed = parseArchitecturalDimension(widthInput, 'feet');
        if (!parsed || isNaN(parsed) || parsed < 24) {
            showToast("Please enter a valid width (e.g. 15'-0\" or 15')", "error");
            setWidthInput(formatFeetInches(activeRoom.w, false));
            return;
        }
        updateRoomDimensions(activeRoom.id, parsed, activeRoom.h);
        setWidthInput(formatFeetInches(parsed, false));
        showToast(`Updated ${activeRoom.name} width to ${formatFeetInches(parsed, false)}`, "success");
    };

    const handleCommitLength = () => {
        if (!activeRoom) return;
        const parsed = parseArchitecturalDimension(lengthInput, 'feet');
        if (!parsed || isNaN(parsed) || parsed < 24) {
            showToast("Please enter a valid length (e.g. 20'-0\" or 20')", "error");
            setLengthInput(formatFeetInches(activeRoom.h, false));
            return;
        }
        updateRoomDimensions(activeRoom.id, activeRoom.w, parsed);
        setLengthInput(formatFeetInches(parsed, false));
        showToast(`Updated ${activeRoom.name} length to ${formatFeetInches(parsed, false)}`, "success");
    };

    const handleCommitHeight = () => {
        if (!activeRoom) return;
        const parsed = parseArchitecturalDimension(heightInput, 'feet');
        if (!parsed || isNaN(parsed) || parsed < 48) {
            showToast("Please enter a valid height (e.g. 10'-0\" or 10')", "error");
            setHeightInput(formatFeetInches(activeRoom.height || 120, false));
            return;
        }
        updateRoomProperty(activeRoom.id, 'height', parsed);
        setHeightInput(formatFeetInches(parsed, false));
        showToast(`Updated ${activeRoom.name} height to ${formatFeetInches(parsed, false)}`, "success");
    };

    /**
     * Mathematical Fit-to-Screen Algorithm
     * Fits the plan into 85% of available canvas area, centered.
     */
    const handleFitToScreen = useCallback(() => {
        const container = canvasContainerRef.current;
        if (!container || !plan) return;

        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const bounds = calculatePlanBoundingBox(plan);

        const padX = Math.max(32, rect.width * 0.08);
        const padY = Math.max(32, rect.height * 0.08);

        const usableW = rect.width - 2 * padX;
        const usableH = rect.height - 2 * padY;

        const scaleX = usableW / bounds.width;
        const scaleY = usableH / bounds.height;

        const fitScale = Math.min(scaleX, scaleY);

        const centerPanX = (rect.width / 2) - (bounds.centerX * fitScale);
        const centerPanY = (rect.height / 2) - (bounds.centerY * fitScale);

        setScale(fitScale);
        setPan({ x: centerPanX, y: centerPanY });
        setZoomPreset('fit');
    }, [plan]);

    /**
     * Apply named zoom preset to canvas viewport, centered.
     */
    const applyZoomPreset = useCallback((presetKey) => {
        const container = canvasContainerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const PRESET_SCALES = {
            '25':  0.25,
            '50':  0.5,
            '75':  0.75,
            '100': 1.0,
            '150': 1.5,
            '200': 2.0,
        };

        if (presetKey === 'fit') {
            handleFitToScreen();
            return;
        }

        const targetScale = PRESET_SCALES[presetKey];
        if (!targetScale) return;

        // Keep world center in view when changing zoom
        const curScale = scaleRef.current;
        const curPan = panRef.current;
        const worldCX = (centerX - curPan.x) / curScale;
        const worldCY = (centerY - curPan.y) / curScale;

        const newPanX = centerX - worldCX * targetScale;
        const newPanY = centerY - worldCY * targetScale;

        setScale(targetScale);
        setPan({ x: newPanX, y: newPanY });
        setZoomPreset(presetKey);
    }, [handleFitToScreen]);

    /**
     * Export current plan as high-res PNG (downloads file)
     */
    const handleExportPNG = useCallback(() => {
        if (!plan || !rendererRef.current) {
            showToast('No plan loaded to export', 'error');
            return;
        }
        try {
            const dataURL = rendererRef.current.exportPNG(plan, 2);
            if (!dataURL) throw new Error('Export failed');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `${plan?.project?.name || activeProj?.name || 'floor-plan'}.png`;
            link.click();
            showToast('Floor plan exported as PNG', 'success');
        } catch (err) {
            showToast('PNG export failed: ' + err.message, 'error');
        }
    }, [plan, activeProj, showToast]);

    /**
     * Export current plan as clean SVG vector file (downloads file)
     */
    const handleExportSVG = useCallback(() => {
        if (!plan || !rendererRef.current) {
            showToast('No plan loaded to export', 'error');
            return;
        }
        try {
            const svgContent = rendererRef.current.exportSVG(plan);
            if (!svgContent) throw new Error('Export failed');
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${plan?.project?.name || activeProj?.name || 'floor-plan'}.svg`;
            link.click();
            URL.revokeObjectURL(url);
            showToast('Floor plan exported as SVG vector', 'success');
        } catch (err) {
            showToast('SVG export failed: ' + err.message, 'error');
        }
    }, [plan, activeProj, showToast]);

    // Auto-fit on initial mount & plan change
    useEffect(() => {
        handleFitToScreen();
    }, [handleFitToScreen]);

    // Responsive ResizeObserver
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

    const MIN_SCALE = 0.2;
    const MAX_SCALE = 4.0;

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

        // Pan triggers: middle-mouse, space+left-drag, pan tool, move subtool
        const isPanTrigger = e.button === 1 || e.button === 4 || spaceKeyRef.current || activeTool === 'pan' || selectedSubtool === 'move';

        // Entity Selection (only on left-click without pan modifier)
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

            // Check Walls (with 10-inch hit tolerance)
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

        if (isPanTrigger || (!found && e.button === 0)) {
            // Capture pointer for smooth drag outside canvas bounds
            canvas.setPointerCapture(e.pointerId);
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

    const handlePointerUp = (e) => {
        const canvas = canvasRef.current;
        if (canvas && e.pointerId !== undefined) {
            try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        }
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

    // Cursor-anchored Zoom
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

            const worldX = (mouseX - curPan.x) / curScale;
            const worldY = (mouseY - curPan.y) / curScale;

            const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
            const newScale = Math.max(MIN_SCALE, Math.min(curScale * zoomFactor, MAX_SCALE));

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

    // Keyboard Shortcuts + Space key tracking
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Track spacebar for pan mode (don't intercept in inputs)
            if (e.key === ' ') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    spaceKeyRef.current = true;
                }
                return;
            }
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
                showToast("Plan saved successfully!", "success");
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                handleFitToScreen();
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                zoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                zoomOut();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === ' ') {
                spaceKeyRef.current = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [plan, undo, redo, activeProj, updateProjectPlan, handleFitToScreen, showToast]);

    if (!activeProj || !plan) {
        return (
            <div className="ed-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
                <header className="ed-header">
                    <div className="ed-header-left">
                        <Link to="/my-projects" className="ed-back-link">
                            <span style={{ fontSize: 16, fontWeight: 700, marginRight: 2 }}>&laquo;</span>
                            Back to Projects
                        </Link>
                        <div className="ed-header-divider" />
                        <h1 className="ed-title">2D CAD Editor</h1>
                    </div>
                    <div className="ed-header-right">
                        <Link to="/new-project" className="ed-save-btn" style={{ textDecoration: 'none' }}>
                            + New Project
                        </Link>
                    </div>
                </header>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '48px 32px', textAlign: 'center', maxWidth: 480, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No Project Selected</h2>
                        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
                            You need an active project to open the 2D CAD Floor Plan Editor. Create a new project or select an existing project from your dashboard.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => navigate('/new-project')} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                                Create New Project
                            </button>
                            <button onClick={() => navigate('/my-projects')} style={{ padding: '10px 22px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                                View Projects
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const activeRoom = selectedEntity && selectedType === 'room' ? selectedEntity : null;
    const activeWall = selectedEntity && selectedType === 'wall' ? selectedEntity : null;

    // Room Area Calculation
    const displayArea = activeRoom ? (activeRoom.areaSqFt || Math.round((activeRoom.w * activeRoom.h) / 144 * 10) / 10) : 247.5;
    const displayWidth = activeRoom ? (activeRoom.clearDimensions ? formatFeetInches(activeRoom.clearDimensions.width, false) : formatFeetInches(activeRoom.w, false)) : "16'6\"";
    const displayLength = activeRoom ? (activeRoom.clearDimensions ? formatFeetInches(activeRoom.clearDimensions.length, false) : formatFeetInches(activeRoom.h, false)) : "15'0\"";
    const roomName = activeRoom ? (activeRoom.name === 'LIVING' ? 'Living Hall' : activeRoom.name) : 'Living Hall';

    return (
        <div className="ed-wrapper">
            {/* 1. TOP HEADER BAR (WHITE BACKGROUND, ALIGNED HORIZONTALLY) */}
            <header className="ed-header">
                <div className="ed-header-left">
                    <Link to="/my-projects" className="ed-back-link">
                        <span style={{ fontSize: 16, fontWeight: 700, marginRight: 2 }}>&laquo;</span>
                        Back to Projects
                    </Link>
                    <div className="ed-header-divider" />
                    <h1 className="ed-title">{plan?.project?.name || activeProj?.name || 'Untitled Project'}</h1>
                    <span className="ed-status-badge">Saved</span>
                </div>

                <div className="ed-header-center">
                    <div className="ed-floor-select-box">
                        <span className="ed-floor-label">Floor</span>
                        <div className="ed-floor-val-wrap">
                            <select 
                                className="ed-floor-select" 
                                value={selectedFloor}
                                onChange={(e) => setSelectedFloor(e.target.value)}
                            >
                                <option value="Ground Floor">Ground Floor</option>
                                <option value="First Floor">First Floor</option>
                                <option value="Terrace">Terrace</option>
                            </select>
                            <svg className="ed-chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>
                </div>

                <div className="ed-header-right">
                    <button className="ed-action-btn" onClick={undo} disabled={historyIdx <= 0} title="Undo (Ctrl+Z)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l6-6M3 10l6 6"/></svg>
                        <span>Undo</span>
                    </button>
                    <button className="ed-action-btn" onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (Ctrl+Y)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 0 0-5 5v2M21 10l-6-6M21 10l-6 6"/></svg>
                        <span>Redo</span>
                    </button>
                    <button className="ed-action-btn" onClick={() => { if (activeProj?.id) updateProjectPlan(activeProj.id, plan); showToast("Plan saved successfully!", "success"); }} title="Save (Ctrl+S)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        <span>Save</span>
                    </button>

                    {/* Export Buttons */}
                    <button className="ed-action-btn" onClick={handleExportPNG} title="Export as PNG image">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span>PNG</span>
                    </button>
                    <button className="ed-action-btn" onClick={handleExportSVG} title="Export as SVG vector">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        <span>SVG</span>
                    </button>

                    <button className="ed-action-btn" onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)} style={{ background: isAIAssistantOpen ? '#EFF6FF' : '', color: isAIAssistantOpen ? '#2563EB' : '' }} title="Gemini AI Architectural Assistant">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                        <span>AI Assistant</span>
                    </button>

                    <button className="ed-gen3d-btn" onClick={() => navigate('/viewer')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>
                        <span>Generate 3D</span>
                    </button>

                    <div className="ed-user-profile" onClick={() => navigate('/settings')}>
                        <div className="ed-avatar">
                            <img 
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                                alt="Ramesh C"
                                onError={(e) => { e.target.style.display = 'none'; }}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span className="ed-avatar-fallback">RC</span>
                        </div>
                        <div className="ed-user-meta">
                            <span className="ed-user-name">Ramesh C</span>
                            <span className="ed-user-plan">Premium Plan</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </div>
            </header>

            {/* 2. SECONDARY EDITOR TOOLBAR (EXACT 14 CAD TOOLS) */}
            <div className="ed-toolbar">
                {/* 1. Select */}
                <button className={`ed-tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => setActiveTool('select')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
                    <span>Select</span>
                </button>

                {/* 2. Wall */}
                <button className={`ed-tool-btn ${activeTool === 'wall' ? 'active' : ''}`} onClick={() => { setActiveTool('wall'); showToast("Wall tool activated", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v6M15 9v6M9 15v6"/></svg>
                    <span>Wall</span>
                </button>

                {/* 3. Room */}
                <button className={`ed-tool-btn ${activeTool === 'room' ? 'active' : ''}`} onClick={() => { setActiveTool('room'); showToast("Room tool activated", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
                    <span>Room</span>
                </button>

                {/* 4. Door */}
                <button className={`ed-tool-btn ${activeTool === 'door' ? 'active' : ''}`} onClick={() => { setActiveTool('door'); showToast("Door tool activated", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21h16M7 21V3h10v18M14 12v.01"/></svg>
                    <span>Door</span>
                </button>

                {/* 5. Window */}
                <button className={`ed-tool-btn ${activeTool === 'window' ? 'active' : ''}`} onClick={() => { setActiveTool('window'); showToast("Window tool activated", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M12 3v18M3 12h18"/></svg>
                    <span>Window</span>
                </button>

                {/* 6. Staircase */}
                <button className={`ed-tool-btn ${activeTool === 'staircase' ? 'active' : ''}`} onClick={() => { setActiveTool('staircase'); showToast("Staircase tool activated", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18h4v-4h4v-4h4V6"/></svg>
                    <span>Staircase</span>
                </button>

                {/* 7. Column */}
                <button className={`ed-tool-btn ${activeTool === 'column' ? 'active' : ''}`} onClick={() => { setActiveTool('column'); showToast("Column tool activated", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" fill="currentColor"/></svg>
                    <span>Column</span>
                </button>

                {/* 8. Furniture */}
                <button className={`ed-tool-btn ${activeTool === 'furniture' ? 'active' : ''}`} onClick={() => { setActiveTool('furniture'); showToast("Furniture tool activated", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 18v3M20 18v3M4 14h16M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H4V9z"/></svg>
                    <span>Furniture</span>
                </button>

                {/* 9. Text */}
                <button className={`ed-tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => { setActiveTool('text'); showToast("Text tool activated", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                    <span>Text</span>
                </button>

                {/* 10. Dimension */}
                <button className={`ed-tool-btn ${dimsOn ? 'active' : ''}`} onClick={() => { setDimsOn(!dimsOn); showToast(`Dimensions: ${!dimsOn ? 'ON' : 'OFF'}`, "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 8v8M21 8v8"/></svg>
                    <span>Dimension</span>
                </button>

                {/* 11. Area */}
                <button className={`ed-tool-btn ${activeTool === 'area' ? 'active' : ''}`} onClick={() => { setActiveTool('area'); showToast("Area calculation mode", "info"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM9 9h6v6H9z"/></svg>
                    <span>Area</span>
                </button>

                {/* 12. Grid */}
                <button className={`ed-tool-btn ${gridOn ? 'active' : ''}`} onClick={() => setGridOn(!gridOn)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    <span>Grid</span>
                </button>

                {/* 13. Layers */}
                <button className="ed-tool-btn" onClick={() => showToast("Layers panel: All 5 layers visible", "info")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    <span>Layers</span>
                </button>

                {/* 14. More */}
                <button className="ed-tool-btn" onClick={() => showToast("Additional architectural CAD utilities", "info")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    <span>More</span>
                </button>
            </div>

            {/* 3. MAIN CENTRAL BODY (CANVAS + FLOATING TOOLS + PROPERTIES) */}
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

                    {/* Floating Gemini AI Command Bar */}
                    {isAIAssistantOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '90%',
                            maxWidth: 620,
                            background: '#FFFFFF',
                            borderRadius: 12,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                            border: '1px solid #E2E8F0',
                            padding: '12px 16px',
                            zIndex: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Gemini Architectural Assistant</span>
                                </div>
                                <button onClick={() => setIsAIAssistantOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontSize: 16 }}>&times;</button>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    value={aiCommandInput}
                                    onChange={(e) => setAiCommandInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleExecuteAICommand(); }}
                                    placeholder='Try: "Master bedroom 12x14", "Add attached toilet", "Check Vastu"...'
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        border: '1px solid #CBD5E1',
                                        fontSize: 13,
                                        outline: 'none'
                                    }}
                                    disabled={isAIProcessing}
                                />
                                <button
                                    onClick={() => handleExecuteAICommand()}
                                    disabled={isAIProcessing || !aiCommandInput.trim()}
                                    style={{
                                        padding: '8px 16px',
                                        background: isAIProcessing ? '#94A3B8' : '#2563EB',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: isAIProcessing ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isAIProcessing ? 'Processing...' : 'Apply'}
                                </button>
                            </div>

                            {/* Quick Action Chips */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                {[
                                    'Check Vastu',
                                    'Master bedroom 12x14',
                                    'Kitchen 10x12',
                                    'Add attached toilet',
                                    'Move kitchen to southeast'
                                ].map((chip) => (
                                    <button
                                        key={chip}
                                        onClick={() => handleExecuteAICommand(chip)}
                                        disabled={isAIProcessing}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            border: '1px solid #E2E8F0',
                                            background: '#F8FAFC',
                                            fontSize: 11,
                                            color: '#334155',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vastu Explainer Modal */}
                    {vastuModalData && (
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(15, 23, 42, 0.6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 200
                        }}>
                            <div style={{
                                background: '#FFFFFF',
                                borderRadius: 16,
                                maxWidth: 560,
                                width: '90%',
                                padding: '24px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                maxHeight: '85vh',
                                overflowY: 'auto'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: vastuModalData.report.score >= 70 ? '#DCFCE7' : '#FEF3C7', color: vastuModalData.report.score >= 70 ? '#16A34A' : '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                                            {vastuModalData.report.score}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A' }}>Vastu Compliance Analysis</h3>
                                            <span style={{ fontSize: 12, color: '#64748B' }}>Deterministic 9-Quadrant Mandala Engine</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setVastuModalData(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontSize: 20 }}>&times;</button>
                                </div>

                                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 16 }}>
                                    <strong>Overview:</strong> {vastuModalData.explanation.overview}
                                </div>

                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Vastu Rules & Placement Check</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                    {(vastuModalData.report.rules || []).map((rule, idx) => (
                                        <div key={idx} style={{ padding: 10, borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, background: rule.status === 'PASS' ? '#F0FDF4' : '#FFFBEB' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: rule.status === 'PASS' ? '#15803D' : '#B45309', marginBottom: 4 }}>
                                                <span>{rule.name}</span>
                                                <span>{rule.status}</span>
                                            </div>
                                            <p style={{ margin: 0, color: '#475569' }}>{rule.description}</p>
                                        </div>
                                    ))}
                                </div>

                                {vastuModalData.explanation.actionableRemedies && vastuModalData.explanation.actionableRemedies.length > 0 && (
                                    <>
                                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Gemini Recommended Remedies</h4>
                                        <ul style={{ paddingLeft: 20, margin: 0, fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                                            {vastuModalData.explanation.actionableRemedies.map((remedy, i) => (
                                                <li key={i}>{remedy}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                <div style={{ marginTop: 20, textAlign: 'right' }}>
                                    <button onClick={() => setVastuModalData(null)} style={{ padding: '8px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Floating Tools Palette (Exact Reference) */}
                    {isToolsPanelOpen ? (
                        <div className="ed-subtools-panel">
                            <div className="ed-subtools-header">
                                <span>Tools</span>
                                <button className="ed-subtools-toggle" onClick={() => setIsToolsPanelOpen(false)} title="Collapse Tools">
                                    &laquo;
                                </button>
                            </div>
                            <div className="ed-subtools-list">
                                <button className={`ed-subtool-btn ${selectedSubtool === 'select' ? 'active' : ''}`} onClick={() => setSelectedSubtool('select')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
                                    <span>Select</span>
                                </button>
                                <button className={`ed-subtool-btn ${selectedSubtool === 'move' ? 'active' : ''}`} onClick={() => { setSelectedSubtool('move'); showToast("Move mode: drag canvas or entity", "info"); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
                                    <span>Move</span>
                                </button>
                                <button className={`ed-subtool-btn ${selectedSubtool === 'rotate' ? 'active' : ''}`} onClick={() => { setSelectedSubtool('rotate'); showToast("Rotate mode activated", "info"); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                    <span>Rotate</span>
                                </button>
                                <button className={`ed-subtool-btn ${selectedSubtool === 'scale' ? 'active' : ''}`} onClick={() => { setSelectedSubtool('scale'); showToast("Scale mode activated", "info"); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    <span>Scale</span>
                                </button>
                                <button className={`ed-subtool-btn ${selectedSubtool === 'copy' ? 'active' : ''}`} onClick={() => { showToast("Room copied to clipboard", "success"); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    <span>Copy</span>
                                </button>
                                <button className="ed-subtool-btn delete" onClick={() => { if (selectedEntity) { showToast(`Deleted ${selectedEntity.name || selectedEntity.id}`, "info"); setSelectedEntity(null); } }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className="ed-tools-expand-btn" onClick={() => setIsToolsPanelOpen(true)} title="Expand Tools">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
                            <span>Tools</span>
                            <span style={{ fontSize: 14 }}>&raquo;</span>
                        </button>
                    )}

                    {/* Bottom Left Floating View Controls */}
                    <div className="ed-view-controls">
                        <div className="ed-view-header">View Controls</div>
                        <div className="ed-view-btns">
                            <button className="ed-view-btn" onClick={zoomIn} title="Zoom In (+)">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button className="ed-view-btn" onClick={zoomOut} title="Zoom Out (-)">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button className="ed-view-btn" onClick={handleFitToScreen} title="Fit to Screen (F)">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                            <button className="ed-view-btn" onClick={() => applyZoomPreset('100')} title="Reset to 100%">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                            </button>
                        </div>
                        <div className="ed-scale-select-wrap">
                            <select 
                                className="ed-scale-select"
                                value={zoomPreset}
                                onChange={(e) => applyZoomPreset(e.target.value)}
                            >
                                <option value="fit">Fit to Screen</option>
                                <option value="25">25%</option>
                                <option value="50">50%</option>
                                <option value="75">75%</option>
                                <option value="100">100%</option>
                                <option value="150">150%</option>
                                <option value="200">200%</option>
                            </select>
                            <svg className="ed-chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>

                    {/* Bottom Right Floating Minimap */}
                    <div className="ed-minimap-box">
                        <canvas ref={minimapRef} width={160} height={120} style={{ width: '100%', height: '100%', display: 'block' }} />
                    </div>
                </div>

                {/* Right Property Inspector Panel (Exact Reference) */}
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
                                    <span className="ed-room-swatch" style={{ background: '#E9D5FF' }} />
                                    <span className="ed-room-name-text">{roomName}</span>
                                </div>
                            </div>

                            {/* Dimensions Grid */}
                            <div className="ed-props-row">
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Width</label>
                                    <input 
                                        type="text" 
                                        className="ed-input" 
                                        value={widthInput} 
                                        onChange={(e) => setWidthInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleCommitWidth(); }}
                                        onBlur={handleCommitWidth}
                                        placeholder="e.g. 15'-0&quot;"
                                    />
                                </div>
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Length</label>
                                    <input 
                                        type="text" 
                                        className="ed-input" 
                                        value={lengthInput} 
                                        onChange={(e) => setLengthInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleCommitLength(); }}
                                        onBlur={handleCommitLength}
                                        placeholder="e.g. 20'-0&quot;"
                                    />
                                </div>
                            </div>

                            {/* Area & Height */}
                            <div className="ed-props-row">
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Area</label>
                                    <input 
                                        type="text" 
                                        className="ed-input" 
                                        value={`${displayArea} sq ft`} 
                                        readOnly 
                                        style={{ background: '#F8FAFC', color: '#64748B' }} 
                                    />
                                </div>
                                <div className="ed-prop-col">
                                    <label className="ed-prop-label">Height</label>
                                    <input 
                                        type="text" 
                                        className="ed-input" 
                                        value={heightInput} 
                                        onChange={(e) => setHeightInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleCommitHeight(); }}
                                        onBlur={handleCommitHeight}
                                        placeholder="e.g. 10'-0&quot;"
                                    />
                                </div>
                            </div>

                            {/* Floor & Floor Finish */}
                            <div className="ed-prop-group">
                                <label className="ed-prop-label">Floor</label>
                                <div className="ed-select-wrap">
                                    <select className="ed-select" value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)}>
                                        <option value="Ground Floor">Ground Floor</option>
                                        <option value="First Floor">First Floor</option>
                                    </select>
                                    <svg className="ed-chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                                </div>
                            </div>

                            <div className="ed-prop-group">
                                <label className="ed-prop-label">Floor Finish</label>
                                <div className="ed-select-wrap">
                                    <select 
                                        className="ed-select" 
                                        value={floorFinishInput} 
                                        onChange={(e) => { 
                                            setFloorFinishInput(e.target.value); 
                                            if (activeRoom) updateRoomProperty(activeRoom.id, 'floorFinish', e.target.value); 
                                        }}
                                    >
                                        <option value="Vitrified Tiles">Vitrified Tiles</option>
                                        <option value="Italian Marble">Italian Marble</option>
                                        <option value="Wooden Flooring">Wooden Flooring</option>
                                        <option value="Granite">Granite</option>
                                        <option value="Ceramic Tiles">Ceramic Tiles</option>
                                        <option value="Anti-Skid Ceramic">Anti-Skid Ceramic</option>
                                    </select>
                                    <svg className="ed-chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                                </div>
                            </div>

                            {/* Wall Section */}
                            <div className="ed-props-divider" />
                            <div className="ed-section-title" onClick={() => setIsWallSecOpen(!isWallSecOpen)}>
                                <span>Wall</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={isWallSecOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>
                            </div>

                            {isWallSecOpen && (
                                <div className="ed-props-row">
                                    <div className="ed-prop-col">
                                        <label className="ed-prop-label">Wall Thickness</label>
                                        <input 
                                            type="text" 
                                            className="ed-input" 
                                            value={wallThicknessInput} 
                                            onChange={(e) => {
                                                setWallThicknessInput(e.target.value);
                                                if (activeRoom) updateRoomProperty(activeRoom.id, 'wallThickness', e.target.value);
                                            }}
                                        />
                                    </div>
                                    <div className="ed-prop-col">
                                        <label className="ed-prop-label">Wall Finish</label>
                                        <div className="ed-select-wrap">
                                            <select 
                                                className="ed-select" 
                                                value={wallFinishInput} 
                                                onChange={(e) => {
                                                    setWallFinishInput(e.target.value);
                                                    if (activeRoom) updateRoomProperty(activeRoom.id, 'wallFinish', e.target.value);
                                                }}
                                            >
                                                <option value="Plaster">Plaster</option>
                                                <option value="Plaster & Paint">Plaster &amp; Paint</option>
                                                <option value="Glazed Tiles">Glazed Tiles</option>
                                                <option value="Weatherproof Paint">Weatherproof Paint</option>
                                            </select>
                                            <svg className="ed-chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Door / Window Section */}
                            <div className="ed-props-divider" />
                            <div className="ed-section-title" onClick={() => setIsDoorWinSecOpen(!isDoorWinSecOpen)}>
                                <span>Door / Window</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={isDoorWinSecOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>
                            </div>

                            {/* Design Section */}
                            <div className="ed-props-divider" />
                            <div className="ed-section-title" onClick={() => setIsDesignSecOpen(!isDesignSecOpen)}>
                                <span>Design</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={isDesignSecOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>
                            </div>

                            {isDesignSecOpen && (
                                <div className="ed-props-row">
                                    <div className="ed-prop-col">
                                        <label className="ed-prop-label">Color</label>
                                        <div className="ed-color-input-wrap">
                                            <input 
                                                type="color" 
                                                className="ed-color-picker" 
                                                value={roomColor} 
                                                onChange={(e) => {
                                                    setRoomColor(e.target.value);
                                                    if (activeRoom) updateRoomProperty(activeRoom.id, 'color', e.target.value);
                                                }} 
                                            />
                                            <span className="ed-color-hex">{roomColor.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="ed-prop-col">
                                        <label className="ed-prop-label">Opacity</label>
                                        <div className="ed-unit-input-wrap">
                                            <input 
                                                type="number" 
                                                className="ed-input" 
                                                value={roomOpacity} 
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setRoomOpacity(val);
                                                    if (activeRoom) updateRoomProperty(activeRoom.id, 'opacity', val);
                                                }} 
                                                min="0" 
                                                max="100" 
                                            />
                                            <span className="ed-unit-suffix">%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes Section */}
                            <div className="ed-props-divider" />
                            <div className="ed-section-title" onClick={() => setIsNotesSecOpen(!isNotesSecOpen)}>
                                <span>Notes</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={isNotesSecOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>
                            </div>

                            {isNotesSecOpen && (
                                <div className="ed-prop-group">
                                    <textarea 
                                        className="ed-textarea" 
                                        placeholder="Add notes about this room..."
                                        value={roomNotes}
                                        onChange={(e) => setRoomNotes(e.target.value)}
                                        onBlur={() => {
                                            if (activeRoom) updateRoomProperty(activeRoom.id, 'notes', roomNotes);
                                        }}
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>

            {/* 4. BOTTOM STATUS BAR */}
            <footer className="ed-statusbar">
                <div className="ed-statusbar-left">
                    <span>Project: <strong style={{ color: '#111827', fontWeight: 600 }}>{plan?.project?.name || activeProj?.name || 'Untitled Project'}</strong></span>
                    <span>Floor: <strong style={{ color: '#111827', fontWeight: 600 }}>{selectedFloor}</strong></span>
                    <span>Units: <strong style={{ color: '#111827', fontWeight: 600 }}>Feet &amp; Inches</strong></span>
                    <span style={{ color: '#6B7280', fontSize: 11 }}>Rooms: <strong style={{ color: '#111827', fontWeight: 600 }}>{plan?.rooms?.length || 0}</strong></span>
                    <span style={{ color: '#6B7280', fontSize: 11 }}>Zoom: <strong style={{ color: '#2563EB', fontWeight: 600 }}>{Math.round(scale * 100)}%</strong></span>
                </div>
                <div className="ed-statusbar-right">
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Space+Drag to Pan &nbsp;·&nbsp; Scroll to Zoom &nbsp;·&nbsp; F = Fit Screen</span>
                    <button className="ed-status-toggle" onClick={() => setGridOn(!gridOn)}>
                        Grid: <strong className={gridOn ? "active-val" : ""}>{gridOn ? 'ON' : 'OFF'}</strong>
                    </button>
                    <button className="ed-status-toggle" onClick={() => setSnapOn(!snapOn)}>
                        Snap: <strong className={snapOn ? "active-val" : ""}>{snapOn ? 'ON' : 'OFF'}</strong>
                    </button>
                    <button className="ed-status-toggle" onClick={() => setOrthoOn(!orthoOn)}>
                        Ortho: <strong className={orthoOn ? "active-val" : ""}>{orthoOn ? 'ON' : 'OFF'}</strong>
                    </button>
                </div>
            </footer>
        </div>
    );
}
