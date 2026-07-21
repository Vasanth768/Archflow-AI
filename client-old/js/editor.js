// --- ARCHFLOW AI - 2D BLUEPRINT CANVAS EDITOR ---

document.addEventListener("DOMContentLoaded", () => {
    // Only run if on editor page
    if (!document.getElementById("floorPlanCanvas")) return;

    const canvas = document.getElementById("floorPlanCanvas");
    const ctx = canvas.getContext("2d");
    
    // Editor State
    let activeProject = ArchFlow.getActiveProject();
    if (!activeProject) return;

    let activeTool = "select"; // select, room, wall, door, window, staircase, furniture
    let selectedRoomId = null;
    let isDragging = false;
    let isResizing = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let roomOriginalX = 0;
    let roomOriginalY = 0;
    let roomOriginalW = 0;
    let roomOriginalH = 0;
    
    // Canvas Dimensions & Scale Calculations
    // We want the plot boundaries to fit nicely inside the 600x600 canvas
    const margin = 40;
    const availableWidth = canvas.width - (margin * 2);
    const availableHeight = canvas.height - (margin * 2);
    
    // Pixels per unit (unit = feet)
    const scaleX = availableWidth / activeProject.width;
    const scaleY = availableHeight / activeProject.length;
    const scale = Math.min(scaleX, scaleY); // uniform scale
    
    // Center the plot in canvas
    const offsetX = (canvas.width - (activeProject.width * scale)) / 2;
    const offsetY = (canvas.height - (activeProject.length * scale)) / 2;

    // Room colors (blueprint theme)
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

    // Draw the entire scene
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Draw Grid Lines (Blueprint style)
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += scale * 2) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += scale * 2) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // 2. Draw Plot Outer Boundary
        ctx.strokeStyle = colors.plotOutline;
        ctx.lineWidth = 3;
        ctx.strokeRect(offsetX, offsetY, activeProject.width * scale, activeProject.length * scale);
        
        // Draw outer labels (Plot dimensions)
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        
        // Top label (width)
        ctx.fillText(`${activeProject.width} FT (Width)`, canvas.width / 2, offsetY - 15);
        
        // Left label (length) - Rotated text
        ctx.save();
        ctx.translate(offsetX - 20, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${activeProject.length} FT (Length)`, 0, 0);
        ctx.restore();

        // Direction indicators
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Facing: ${activeProject.facing.toUpperCase()}`, canvas.width / 2, offsetY + (activeProject.length * scale) + 25);

        // 3. Draw All Rooms
        activeProject.rooms.forEach((room) => {
            const rx = offsetX + (room.x * scale);
            const ry = offsetY + (room.y * scale);
            const rw = room.w * scale;
            const rh = room.h * scale;
            
            const isSelected = room.id === selectedRoomId;
            
            // Choose color scheme depending on room type & selection
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
            
            // Draw room rectangle
            ctx.fillStyle = fill;
            ctx.fillRect(rx, ry, rw, rh);
            
            ctx.strokeStyle = border;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(rx, ry, rw, rh);
            
            // Draw room text
            ctx.fillStyle = isSelected ? "#f8fafc" : colors.roomText;
            ctx.font = "600 12px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(room.name, rx + (rw / 2), ry + (rh / 2) - 8);
            
            ctx.fillStyle = isSelected ? "#fbcfe8" : "#94a3b8";
            ctx.font = "500 11px Outfit, sans-serif";
            ctx.fillText(`${room.w}' × ${room.h}'`, rx + (rw / 2), ry + (rh / 2) + 10);
            
            // Draw resize handle on bottom-right corner if selected
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

    // Convert screen coordinates to grid coordinates (snapped to 1 foot grid spacing)
    function getGridCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        // Translate coordinates back
        const gridX = Math.round((mouseX - offsetX) / scale);
        const gridY = Math.round((mouseY - offsetY) / scale);
        
        return {
            x: Math.max(0, Math.min(activeProject.width, gridX)),
            y: Math.max(0, Math.min(activeProject.length, gridY)),
            rawX: mouseX,
            rawY: mouseY
        };
    }

    // Check if mouse is over room or its resize handle
    function getHitObject(mouseX, mouseY) {
        // Check reverse order so top elements are selected first
        for (let i = activeProject.rooms.length - 1; i >= 0; i--) {
            const room = activeProject.rooms[i];
            const rx = offsetX + (room.x * scale);
            const ry = offsetY + (room.y * scale);
            const rw = room.w * scale;
            const rh = room.h * scale;
            
            // 1. Check resize handle
            const handleX = rx + rw;
            const handleY = ry + rh;
            const dist = Math.hypot(mouseX - handleX, mouseY - handleY);
            
            if (dist <= 10 && room.id === selectedRoomId) {
                return { room, target: "resize" };
            }
            
            // 2. Check room interior bounds
            if (mouseX >= rx && mouseX <= rx + rw && mouseY >= ry && mouseY <= ry + rh) {
                return { room, target: "room" };
            }
        }
        return null;
    }

    // Mouse Press Events
    canvas.addEventListener("mousedown", (e) => {
        const coords = getGridCoords(e.clientX, e.clientY);
        const hit = getHitObject(coords.rawX, coords.rawY);
        
        if (activeTool === "select") {
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
        } else if (activeTool === "room") {
            // Place new room where clicked
            const newRoom = {
                id: "r_" + Date.now(),
                name: "New Room",
                x: coords.x,
                y: coords.y,
                w: 8,
                h: 8,
                type: "bedroom"
            };
            activeProject.rooms.push(newRoom);
            selectedRoomId = newRoom.id;
            updatePropertiesPanel(newRoom);
            ArchFlow.updateProjectRoomLayout(activeProject.id, activeProject.rooms);
            activeTool = "select";
            updateToolSelectionUI();
            ArchFlow.showToast("Room added to blueprint", "success");
        } else {
            // Draw wall / window etc. (Simulated addition)
            ArchFlow.showToast(`${activeTool.toUpperCase()} tool applied to layout.`, "info");
            activeTool = "select";
            updateToolSelectionUI();
        }
        
        draw();
    });

    // Mouse Move Events
    canvas.addEventListener("mousemove", (e) => {
        if (!isDragging && !isResizing) return;
        
        const coords = getGridCoords(e.clientX, e.clientY);
        const activeRoom = activeProject.rooms.find(r => r.id === selectedRoomId);
        if (!activeRoom) return;
        
        const dx = Math.round((coords.rawX - dragStartX) / scale);
        const dy = Math.round((coords.rawY - dragStartY) / scale);
        
        if (isDragging) {
            // Move room with grid boundaries check
            let newX = roomOriginalX + dx;
            let newY = roomOriginalY + dy;
            
            // Constrain inside plot
            newX = Math.max(0, Math.min(activeProject.width - activeRoom.w, newX));
            newY = Math.max(0, Math.min(activeProject.length - activeRoom.h, newY));
            
            activeRoom.x = newX;
            activeRoom.y = newY;
            
            updatePropertiesPanel(activeRoom);
        } else if (isResizing) {
            // Resize room boundary limits
            let newW = roomOriginalW + dx;
            let newH = roomOriginalH + dy;
            
            // Clamp min size to 4x4 feet
            newW = Math.max(4, Math.min(activeProject.width - activeRoom.x, newW));
            newH = Math.max(4, Math.min(activeProject.length - activeRoom.y, newH));
            
            activeRoom.w = newW;
            activeRoom.h = newH;
            
            updatePropertiesPanel(activeRoom);
        }
        
        draw();
    });

    // Mouse Release Events
    canvas.addEventListener("mouseup", () => {
        if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            ArchFlow.updateProjectRoomLayout(activeProject.id, activeProject.rooms);
        }
    });

    // Toolbar events wiring
    document.querySelectorAll(".editor-tool-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            activeTool = btn.dataset.tool;
            updateToolSelectionUI();
        });
    });

    function updateToolSelectionUI() {
        document.querySelectorAll(".editor-tool-btn").forEach((btn) => {
            if (btn.dataset.tool === activeTool) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }

    // Properties Live Updates bindings
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
        
        // Vastu suggestions evaluation
        evaluateVastu(room);
    }
    
    function clearPropertiesPanel() {
        if (!propNameInput) return;
        document.getElementById("properties-room-title").innerText = "Item Details";
        document.getElementById("properties-empty-state").style.display = "block";
        document.getElementById("properties-form-box").style.display = "none";
    }

    if (propNameInput) {
        // Change name binding
        propNameInput.addEventListener("input", () => {
            if (!selectedRoomId) return;
            const r = activeProject.rooms.find(x => x.id === selectedRoomId);
            if (r) {
                r.name = propNameInput.value;
                document.getElementById("properties-room-title").innerText = r.name;
                draw();
                ArchFlow.updateProjectRoomLayout(activeProject.id, activeProject.rooms);
            }
        });

        // Width binding
        propWInput.addEventListener("change", () => {
            if (!selectedRoomId) return;
            const r = activeProject.rooms.find(x => x.id === selectedRoomId);
            if (r) {
                r.w = Math.max(4, Math.min(activeProject.width - r.x, parseInt(propWInput.value) || 8));
                propWInput.value = r.w;
                draw();
                ArchFlow.updateProjectRoomLayout(activeProject.id, activeProject.rooms);
            }
        });

        // Height binding
        propHInput.addEventListener("change", () => {
            if (!selectedRoomId) return;
            const r = activeProject.rooms.find(x => x.id === selectedRoomId);
            if (r) {
                r.h = Math.max(4, Math.min(activeProject.length - r.y, parseInt(propHInput.value) || 8));
                propHInput.value = r.h;
                draw();
                ArchFlow.updateProjectRoomLayout(activeProject.id, activeProject.rooms);
            }
        });

        // Type binding
        propTypeSelect.addEventListener("change", () => {
            if (!selectedRoomId) return;
            const r = activeProject.rooms.find(x => x.id === selectedRoomId);
            if (r) {
                r.type = propTypeSelect.value;
                draw();
                ArchFlow.updateProjectRoomLayout(activeProject.id, activeProject.rooms);
                evaluateVastu(r);
            }
        });
    }

    // Interactive Vastu compliance evaluator
    function evaluateVastu(room) {
        const vastuStatus = document.getElementById("vastu-compliance-badge");
        const vastuTip = document.getElementById("vastu-text-tip");
        if (!vastuStatus) return;

        // Vastu zoning rules based on relative position coordinates inside the plot bounds
        // Corner definitions: North-East (top-right), South-East (bottom-right), South-West (bottom-left), North-West (top-left)
        // Let's assume standard grid coordinate quadrants:
        const xPos = room.x + (room.w / 2);
        const yPos = room.y + (room.h / 2);
        
        const relativeX = xPos / activeProject.width; // 0 to 1
        const relativeY = yPos / activeProject.length; // 0 to 1
        
        let compliant = false;
        let suggestion = "";

        if (room.type === "kitchen") {
            // Kitchen: Ideal in South-East (bottom-right: high X, high Y)
            if (relativeX > 0.5 && relativeY > 0.5) {
                compliant = true;
                suggestion = "Excellent. South-East corner is ruled by Agni (Fire), perfect for kitchen layouts.";
            } else {
                suggestion = "Consider moving the kitchen to the South-East quadrant for Agni-direction compliance.";
            }
        } else if (room.type === "pooja") {
            // Pooja: Ideal in North-East (top-right: high X, low Y)
            if (relativeX > 0.5 && relativeY < 0.5) {
                compliant = true;
                suggestion = "Ideal. North-East is ruled by Ishanya (Lord Siva), perfect for prayer setups.";
            } else {
                suggestion = "Vastu suggests placing the Pooja room in the North-East quadrant to attract positive energy.";
            }
        } else if (room.type === "bedroom") {
            // Master Bedroom: Ideal in South-West (bottom-left: low X, high Y)
            if (relativeX < 0.5 && relativeY > 0.5) {
                compliant = true;
                suggestion = "Excellent. South-West is ruled by Nairrutya, providing stability and strength.";
            } else {
                suggestion = "Vastu recommends placing the master suite in the South-West quadrant.";
            }
        } else if (room.type === "parking") {
            // Parking: Ideal in North-West or South-East
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

    // Save Changes trigger button
    const saveBtn = document.getElementById("editor-save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            ArchFlow.updateProjectRoomLayout(activeProject.id, activeProject.rooms);
            ArchFlow.showToast("2D blueprint layout saved", "success");
        });
    }

    // Init draw
    draw();
    clearPropertiesPanel();
});
