import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Editor() {
    const canvasRef = useRef(null);
    const navigate = useNavigate();
    const { getActiveProject, updateProjectRoomLayout, showToast } = useArchFlow();
    const proj = getActiveProject();

    // Active tool state inside React to synchronize styles if needed
    const [activeTool, setActiveTool] = useState("select");

    useEffect(() => {
        if (!proj) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // Copy state references locally for legacy functions
        let localActiveTool = activeTool;
        let selectedRoomId = null;
        let isDragging = false;
        let isResizing = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let roomOriginalX = 0;
        let roomOriginalY = 0;
        let roomOriginalW = 0;
        let roomOriginalH = 0;

        const margin = 40;
        const availableWidth = canvas.width - (margin * 2);
        const availableHeight = canvas.height - (margin * 2);

        const scaleX = availableWidth / proj.width;
        const scaleY = availableHeight / proj.length;
        const scale = Math.min(scaleX, scaleY);

        const offsetX = (canvas.width - (proj.width * scale)) / 2;
        const offsetY = (canvas.height - (proj.length * scale)) / 2;

        const colors = {
            grid: "#1e293b",
            border: "#475569",
            plotOutline: "#e2e8f0",
            roomFill: "rgba(37, 99, 235, 0.12)",
            roomBorder: "#2563eb",
            roomText: "#cbd5e1",
            selectedFill: "rgba(245, 158, 11, 0.18)",
            selectedBorder: "#f59e0b",
            parkingFill: "rgba(16, 185, 129, 0.12)",
            parkingBorder: "#10b981",
            poojaFill: "rgba(139, 92, 246, 0.12)",
            poojaBorder: "#8b5cf6"
        };

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Grid
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 1;
            for (let x = 0; x <= canvas.width; x += scale * 2) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y <= canvas.height; y += scale * 2) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // 2. Plot Outline
            ctx.strokeStyle = colors.plotOutline;
            ctx.lineWidth = 3;
            ctx.strokeRect(offsetX, offsetY, proj.width * scale, proj.length * scale);

            // Labels
            ctx.fillStyle = "#94a3b8";
            ctx.font = "bold 11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${proj.width} FT (Width)`, canvas.width / 2, offsetY - 15);

            ctx.save();
            ctx.translate(offsetX - 20, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`${proj.length} FT (Length)`, 0, 0);
            ctx.restore();

            ctx.fillStyle = "#64748b";
            ctx.font = "bold 12px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`Facing: ${proj.facing.toUpperCase()}`, canvas.width / 2, offsetY + (proj.length * scale) + 25);

            // 3. Rooms
            proj.rooms.forEach((room) => {
                const rx = offsetX + (room.x * scale);
                const ry = offsetY + (room.y * scale);
                const rw = room.w * scale;
                const rh = room.h * scale;

                const isSelected = room.id === selectedRoomId;
                let fill = colors.roomFill;
                let border = colors.roomBorder;

                if (isSelected) {
                    fill = colors.selectedFill;
                    border = colors.selectedBorder;
                } else if (room.type === "parking") {
                    fill = colors.parkingFill;
                    border = colors.parkingBorder;
                } else if (room.type === "pooja") {
                    fill = colors.poojaFill;
                    border = colors.poojaBorder;
                }

                ctx.fillStyle = fill;
                ctx.fillRect(rx, ry, rw, rh);

                ctx.strokeStyle = border;
                ctx.lineWidth = 2.5;
                ctx.strokeRect(rx, ry, rw, rh);

                ctx.fillStyle = isSelected ? "#f8fafc" : colors.roomText;
                ctx.font = "600 12px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(room.name, rx + (rw / 2), ry + (rh / 2) - 8);

                ctx.fillStyle = isSelected ? "#fbcfe8" : "#94a3b8";
                ctx.font = "500 11px Outfit, sans-serif";
                ctx.fillText(`${room.w}' × ${room.h}'`, rx + (rw / 2), ry + (rh / 2) + 10);

                if (isSelected) {
                    ctx.fillStyle = colors.selectedBorder;
                    ctx.beginPath();
                    ctx.arc(rx + rw, ry + rh, 6, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });
        }

        function getGridCoords(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = clientX - rect.left;
            const mouseY = clientY - rect.top;

            const gridX = Math.round((mouseX - offsetX) / scale);
            const gridY = Math.round((mouseY - offsetY) / scale);

            return {
                x: Math.max(0, Math.min(proj.width, gridX)),
                y: Math.max(0, Math.min(proj.length, gridY)),
                rawX: mouseX,
                rawY: mouseY
            };
        }

        function getHitObject(mouseX, mouseY) {
            for (let i = proj.rooms.length - 1; i >= 0; i--) {
                const room = proj.rooms[i];
                const rx = offsetX + (room.x * scale);
                const ry = offsetY + (room.y * scale);
                const rw = room.w * scale;
                const rh = room.h * scale;

                const handleX = rx + rw;
                const handleY = ry + rh;
                const dist = Math.hypot(mouseX - handleX, mouseY - handleY);

                if (dist <= 10 && room.id === selectedRoomId) {
                    return { room, target: "resize" };
                }

                if (mouseX >= rx && mouseX <= rx + rw && mouseY >= ry && mouseY <= ry + rh) {
                    return { room, target: "room" };
                }
            }
            return null;
        }

        const handleMouseDown = (e) => {
            const coords = getGridCoords(e.clientX, e.clientY);
            const hit = getHitObject(coords.rawX, coords.rawY);

            if (localActiveTool === "select") {
                if (hit) {
                    selectedRoomId = hit.room.id;
                    updatePropertiesPanel(hit.room);

                    if (hit.target === "resize") {
                        isResizing = true;
                        dragStartX = coords.rawX;
                        dragStartY = coords.rawY;
                        roomOriginalW = hit.room.w;
                        roomOriginalH = hit.room.h;
                    } else {
                        isDragging = true;
                        dragStartX = coords.rawX;
                        dragStartY = coords.rawY;
                        roomOriginalX = hit.room.x;
                        roomOriginalY = hit.room.y;
                    }
                } else {
                    selectedRoomId = null;
                    clearPropertiesPanel();
                }
            } else if (localActiveTool === "room") {
                const newRoom = {
                    id: "r_" + Date.now(),
                    name: "New Room",
                    x: coords.x,
                    y: coords.y,
                    w: 8,
                    h: 8,
                    type: "bedroom"
                };
                proj.rooms.push(newRoom);
                selectedRoomId = newRoom.id;
                updatePropertiesPanel(newRoom);
                updateProjectRoomLayout(proj.id, proj.rooms);
                localActiveTool = "select";
                setActiveTool("select");
                showToast("Room added to blueprint", "success");
            } else {
                showToast(`${localActiveTool.toUpperCase()} tool applied to layout.`, "info");
                localActiveTool = "select";
                setActiveTool("select");
            }

            draw();
        };

        const handleMouseMove = (e) => {
            if (!isDragging && !isResizing) return;

            const coords = getGridCoords(e.clientX, e.clientY);
            const activeRoom = proj.rooms.find(r => r.id === selectedRoomId);
            if (!activeRoom) return;

            const dx = Math.round((coords.rawX - dragStartX) / scale);
            const dy = Math.round((coords.rawY - dragStartY) / scale);

            if (isDragging) {
                let newX = roomOriginalX + dx;
                let newY = roomOriginalY + dy;
                newX = Math.max(0, Math.min(proj.width - activeRoom.w, newX));
                newY = Math.max(0, Math.min(proj.length - activeRoom.h, newY));

                activeRoom.x = newX;
                activeRoom.y = newY;
                updatePropertiesPanel(activeRoom);
            } else if (isResizing) {
                let newW = roomOriginalW + dx;
                let newH = roomOriginalH + dy;
                newW = Math.max(4, Math.min(proj.width - activeRoom.x, newW));
                newH = Math.max(4, Math.min(proj.length - activeRoom.y, newH));

                activeRoom.w = newW;
                activeRoom.h = newH;
                updatePropertiesPanel(activeRoom);
            }

            draw();
        };

        const handleMouseUp = () => {
            if (isDragging || isResizing) {
                isDragging = false;
                isResizing = false;
                updateProjectRoomLayout(proj.id, proj.rooms);
            }
        };

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);

        // Properties setup helpers
        const propNameInput = document.getElementById("prop-room-name");
        const propWInput = document.getElementById("prop-room-width");
        const propHInput = document.getElementById("prop-room-height");
        const propTypeSelect = document.getElementById("prop-room-type");

        function updatePropertiesPanel(room) {
            if (!propNameInput) return;
            propNameInput.value = room.name;
            propWInput.value = room.w;
            propHInput.value = room.h;
            propTypeSelect.value = room.type;

            document.getElementById("properties-room-title").innerText = room.name;
            document.getElementById("properties-empty-state").style.display = "none";
            document.getElementById("properties-form-box").style.display = "block";

            evaluateVastu(room);
        }

        function clearPropertiesPanel() {
            if (!propNameInput) return;
            document.getElementById("properties-room-title").innerText = "Item Details";
            document.getElementById("properties-empty-state").style.display = "block";
            document.getElementById("properties-form-box").style.display = "none";
        }

        // Live input binders
        const onNameInput = () => {
            if (!selectedRoomId) return;
            const r = proj.rooms.find(x => x.id === selectedRoomId);
            if (r) {
                r.name = propNameInput.value;
                document.getElementById("properties-room-title").innerText = r.name;
                draw();
                updateProjectRoomLayout(proj.id, proj.rooms);
            }
        };
        const onWChange = () => {
            if (!selectedRoomId) return;
            const r = proj.rooms.find(x => x.id === selectedRoomId);
            if (r) {
                r.w = Math.max(4, Math.min(proj.width - r.x, parseInt(propWInput.value) || 8));
                propWInput.value = r.w;
                draw();
                updateProjectRoomLayout(proj.id, proj.rooms);
            }
        };
        const onHChange = () => {
            if (!selectedRoomId) return;
            const r = proj.rooms.find(x => x.id === selectedRoomId);
            if (r) {
                r.h = Math.max(4, Math.min(proj.length - r.y, parseInt(propHInput.value) || 8));
                propHInput.value = r.h;
                draw();
                updateProjectRoomLayout(proj.id, proj.rooms);
            }
        };
        const onTypeChange = () => {
            if (!selectedRoomId) return;
            const r = proj.rooms.find(x => x.id === selectedRoomId);
            if (r) {
                r.type = propTypeSelect.value;
                draw();
                updateProjectRoomLayout(proj.id, proj.rooms);
                evaluateVastu(r);
            }
        };

        if (propNameInput) {
            propNameInput.addEventListener("input", onNameInput);
            propWInput.addEventListener("change", onWChange);
            propHInput.addEventListener("change", onHChange);
            propTypeSelect.addEventListener("change", onTypeChange);
        }

        function evaluateVastu(room) {
            const vastuStatus = document.getElementById("vastu-compliance-badge");
            const vastuTip = document.getElementById("vastu-text-tip");
            if (!vastuStatus) return;

            const xPos = room.x + (room.w / 2);
            const yPos = room.y + (room.h / 2);
            const relativeX = xPos / proj.width;
            const relativeY = yPos / proj.length;

            let compliant = false;
            let suggestion = "";

            if (room.type === "kitchen") {
                if (relativeX > 0.5 && relativeY > 0.5) {
                    compliant = true;
                    suggestion = "Excellent. South-East corner is ruled by Agni (Fire), perfect for kitchen layouts.";
                } else {
                    suggestion = "Consider moving the kitchen to the South-East quadrant for Agni-direction compliance.";
                }
            } else if (room.type === "pooja") {
                if (relativeX > 0.5 && relativeY < 0.5) {
                    compliant = true;
                    suggestion = "Ideal. North-East is ruled by Ishanya (Lord Siva), perfect for prayer setups.";
                } else {
                    suggestion = "Vastu suggests placing the Pooja room in the North-East quadrant to attract positive energy.";
                }
            } else if (room.type === "bedroom") {
                if (relativeX < 0.5 && relativeY > 0.5) {
                    compliant = true;
                    suggestion = "Excellent. South-West is ruled by Nairrutya, providing stability and strength.";
                } else {
                    suggestion = "Vastu recommends placing the master suite in the South-West quadrant.";
                }
            } else if (room.type === "parking") {
                if ((relativeX < 0.5 && relativeY < 0.5) || (relativeX > 0.5 && relativeY > 0.5)) {
                    compliant = true;
                    suggestion = "Compliant. North-West parking supports smooth movements.";
                } else {
                    suggestion = "North-West corner is suggested for vehicle parking or outdoor sitouts.";
                }
            } else {
                compliant = true;
                suggestion = "Layout is balanced and allows healthy ventilation.";
            }

            if (compliant) {
                vastuStatus.className = "badge badge-success";
                vastuStatus.innerText = "Vastu Compliant";
                vastuTip.innerHTML = `<strong>Vastu Recommendation:</strong> ${suggestion}`;
            } else {
                vastuStatus.className = "badge badge-warning";
                vastuStatus.innerText = "Optimization Suggested";
                vastuTip.innerHTML = `<strong>Vastu Recommendation:</strong> ${suggestion}`;
            }
        }

        // Trigger initial draw & clear
        draw();
        clearPropertiesPanel();

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseup", handleMouseUp);
            if (propNameInput) {
                propNameInput.removeEventListener("input", onNameInput);
                propWInput.removeEventListener("change", onWChange);
                propHInput.removeEventListener("change", onHChange);
                propTypeSelect.removeEventListener("change", onTypeChange);
            }
        };
    }, [proj, activeTool]);

    if (!proj) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <span style={{ fontSize: 40 }}>⚠️</span>
                <h3 style={{ marginTop: 16, color: 'white' }}>No Active Project Selected</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Configure a project dimension wizard before opening the layout editor.</p>
                <Link to="/new-project" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>Create Plan</Link>
            </div>
        );
    }

    const handleSave = () => {
        updateProjectRoomLayout(proj.id, proj.rooms);
        showToast("Blueprint draft saved", "success");
    };

    return (
        <div className="fade-in">
            {/* Top workspace bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }} id="editor-project-title-name">{proj.name}</h2>
                    <span className="badge badge-indigo">Vastu Evaluator Active</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleSave} className="btn btn-secondary btn-sm" id="editor-save-btn">💾 Save Draft</button>
                    <Link to="/viewer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>🏡 View 3D Workspace</Link>
                </div>
            </div>

            <div className="editor-layout-container">
                {/* LEFT SIDEBAR: TOOLS */}
                <div className="glass-card editor-sidebar">
                    <div className="editor-tools-group">
                        <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>Selection Tools</h4>
                        <div className="editor-tools-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                            <button className={`editor-tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => setActiveTool("select")} title="Move &amp; Resize items">
                                Pointer Mode
                            </button>
                            <button className={`editor-tool-btn ${activeTool === 'room' ? 'active' : ''}`} onClick={() => setActiveTool("room")} title="Add room stamper">
                                ➕ Add Room Box
                            </button>
                        </div>
                    </div>

                    <div className="editor-tools-group">
                        <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>Structural Entities</h4>
                        <div className="editor-tools-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                            <button className={`editor-tool-btn ${activeTool === 'wall' ? 'active' : ''}`} onClick={() => setActiveTool("wall")} title="Draw Wall segment">
                                Draw Wall
                            </button>
                            <button className={`editor-tool-btn ${activeTool === 'door' ? 'active' : ''}`} onClick={() => setActiveTool("door")}>
                                🚪 Add Door
                            </button>
                            <button className={`editor-tool-btn ${activeTool === 'window' ? 'active' : ''}`} onClick={() => setActiveTool("window")}>
                                🪟 Add Window
                            </button>
                            <button className={`editor-tool-btn ${activeTool === 'staircase' ? 'active' : ''}`} onClick={() => setActiveTool("staircase")}>
                                📶 Add Stairs
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn btn-secondary btn-full btn-sm" onClick={() => showToast("Reverted changes to last saved state.", "info")}>↩ Undo Changes</button>
                        <button className="btn btn-primary btn-full btn-sm" onClick={handleSave}>💾 Save Blueprint</button>
                    </div>
                </div>

                {/* CENTER CANVAS CONTAINER */}
                <div className="editor-canvas-workspace">
                    <div className="editor-canvas-container" style={{ background: '#04060b', border: '1px solid rgba(255,255,255,0.05)', padding: 10, borderRadius: 8 }}>
                        <canvas ref={canvasRef} id="floorPlanCanvas" width="600" height="600" style={{ display: 'block', maxWidth: '100%', height: 'auto', cursor: activeTool === 'select' ? 'default' : 'crosshair' }}></canvas>
                    </div>
                    <div style={{ position: 'absolute', bottom: 16, left: 16, color: 'rgba(255,255,255,0.6)', fontSize: 11, pointerEvents: 'none', background: 'rgba(15,23,42,0.85)', padding: '6px 12px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
                        💡 Pointer Mode: Drag rooms to move them. Drag the bottom-right corner to resize.
                    </div>
                </div>

                {/* RIGHT SIDEBAR: PROPERTIES */}
                <div className="glass-card editor-properties-panel">
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }} id="properties-room-title">Item Details</h3>

                    {/* Empty State */}
                    <div id="properties-empty-state" style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '24px 12px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                        Click on any room rectangle inside the blueprint workspace to edit properties and labels.
                    </div>

                    {/* Properties Form Controls */}
                    <div id="properties-form-box" style={{ display: 'none', flex: 1 }}>
                        <div className="editor-prop-section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Room Tag / Label</label>
                                <input type="text" className="form-control" id="prop-room-name" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '8px 12px', borderRadius: 6, color: 'white', fontSize: 12 }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Width (ft)</label>
                                    <input type="number" className="form-control" id="prop-room-width" min="4" max="60" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '8px 12px', borderRadius: 6, color: 'white', fontSize: 12 }} />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Length (ft)</label>
                                    <input type="number" className="form-control" id="prop-room-height" min="4" max="60" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color-dark)', padding: '8px 12px', borderRadius: 6, color: 'white', fontSize: 12 }} />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Room Category Type</label>
                                <select className="form-control" id="prop-room-type" style={{ background: 'rgba(10,17,32,0.9)', border: '1px solid var(--border-color-dark)', padding: '8px 12px', borderRadius: 6, color: 'white', fontSize: 12 }}>
                                    <option value="living">Living / Foyer</option>
                                    <option value="bedroom">Bedroom Suite</option>
                                    <option value="kitchen">Kitchen Space</option>
                                    <option value="dining">Dining Area</option>
                                    <option value="toilet">Bathroom / Toilet</option>
                                    <option value="pooja">Pooja Mandir</option>
                                    <option value="parking">Car Garage / Portico</option>
                                </select>
                            </div>
                        </div>

                        {/* Vastu compliance tip box */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, marginTop: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <strong style={{ fontSize: 12, color: 'white' }}>Vastu Compliance</strong>
                                <span className="badge" id="vastu-compliance-badge">Evaluating</span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }} id="vastu-text-tip">
                                Vastu analysis requires quadrant validation checks.
                            </p>
                        </div>
                    </div>

                    {/* Metadata footer */}
                    <div style={{ marginTop: 'auto', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: 12, fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: 'var(--indigo-light)', display: 'block', marginBottom: 4 }}>Site Parameters:</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Plot size: <strong id="sidebar-plot-dim">{proj.width}x{proj.length} ft</strong></span>
                            <span>Facing: <strong id="sidebar-plot-facing">{proj.facing}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
