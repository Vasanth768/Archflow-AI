/**
 * CADRenderer2D - Professional Architectural 2D Canvas Engine
 * 
 * Replicates the high-precision CAD aesthetic of professional architectural floor plans:
 * - Crisp white canvas with subtle adaptive architectural grid
 * - Solid structural walls with clean joins and parametric openings
 * - Quarter-circle door swing arcs and double-line window frames
 * - Architectural staircase with treads and directional UP arrow
 * - Vector 2D CAD furniture symbols (Beds, Dining, Sofas, Kitchen Counters, Toilets, Cars, Plants)
 * - Collision-free typography formatted in feet and inches
 * - Outer and inner architectural dimension lines
 * - Real-time interactive minimap overview
 */

import { formatFeetInches } from './UnitEngine.js';

export class CADRenderer2D {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = options.scale || 1.0; // pixels per inch
        this.pan = options.pan || { x: 60, y: 60 };
        this.viewportWidth = options.viewportWidth || canvas.clientWidth || (canvas.width ? canvas.width / (window.devicePixelRatio || 1) : 800);
        this.viewportHeight = options.viewportHeight || canvas.clientHeight || (canvas.height ? canvas.height / (window.devicePixelRatio || 1) : 600);
        this.gridSizeInches = options.gridSizeInches || 12; // 1-foot grid
        this.showGrid = options.showGrid !== false;
        this.showDimensions = options.showDimensions !== false;
        this.showFurniture = options.showFurniture !== false;
        this.selectedEntityId = options.selectedEntityId || null;
        this.theme = options.theme || 'light'; // 'light' | 'dark'
    }

    /**
     * Convert world inches coordinates to canvas screen pixels
     */
    worldToScreen(x, y) {
        return {
            x: this.pan.x + x * this.scale,
            y: this.pan.y + y * this.scale
        };
    }

    /**
     * Convert canvas screen pixels to world inches
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.pan.x) / this.scale,
            y: (screenY - this.pan.y) / this.scale
        };
    }

    /**
     * Render full canonical Architectural CAD Plan
     */
    render(plan, options = {}) {
        if (!plan || !this.ctx) return;
        const ctx = this.ctx;
        const width = this.viewportWidth;
        const height = this.viewportHeight;

        this.selectedEntityId = options.selectedEntityId ?? this.selectedEntityId;

        // Clear background with crisp architectural white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 1. Draw Architectural Grid
        if (this.showGrid) {
            this.drawGrid(plan);
        }

        // 2. Draw Site / Setbacks Boundary
        this.drawSite(plan);

        // 3. Draw Room Fills & Selection Highlights
        this.drawRooms(plan);

        // 4. Draw Columns
        this.drawColumns(plan);

        // 5. Draw Stairs
        this.drawStairs(plan);

        // 6. Draw Furniture (2D Vector CAD Symbols)
        if (this.showFurniture) {
            this.drawFurniture(plan);
        }

        // 7. Draw Structural Walls with Openings & Door Arcs
        this.drawWalls(plan);

        // 8. Draw Room Typography & Labels (on top of furniture & walls for crystal clarity)
        this.drawRoomLabels(plan);

        // 9. Draw Architectural Outer Dimensions
        if (this.showDimensions) {
            this.drawDimensions(plan);
        }
    }

    drawGrid(plan) {
        const ctx = this.ctx;
        const step1Ft = 12 * this.scale;
        const step5Ft = 60 * this.scale;

        if (step1Ft < 4) return; // don't draw if too small

        // Minor grid (1 foot)
        ctx.strokeStyle = '#F1F5F9';
        ctx.lineWidth = 1;

        const startX = this.pan.x % step1Ft;
        const startY = this.pan.y % step1Ft;

        ctx.beginPath();
        for (let x = startX; x < this.viewportWidth; x += step1Ft) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.viewportHeight);
        }
        for (let y = startY; y < this.viewportHeight; y += step1Ft) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.viewportWidth, y);
        }
        ctx.stroke();

        // Major grid (5 feet)
        if (step5Ft >= 20) {
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;

            const start5X = this.pan.x % step5Ft;
            const start5Y = this.pan.y % step5Ft;

            ctx.beginPath();
            for (let x = start5X; x < this.viewportWidth; x += step5Ft) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.viewportHeight);
            }
            for (let y = start5Y; y < this.viewportHeight; y += step5Ft) {
                ctx.moveTo(0, y);
                ctx.lineTo(this.viewportWidth, y);
            }
            ctx.stroke();
        }
    }

    drawSite(plan) {
        if (!plan.site) return;
        const ctx = this.ctx;
        const p1 = this.worldToScreen(0, 0);
        const w = plan.site.width * this.scale;
        const h = plan.site.length * this.scale;

        // Plot boundary
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(p1.x, p1.y, w, h);
        ctx.setLineDash([]);

        // Setbacks if present
        if (plan.site.setbacks) {
            const sb = plan.site.setbacks;
            const sbP1 = this.worldToScreen(sb.left || 0, sb.front || 0);
            const sbW = (plan.site.width - (sb.left || 0) - (sb.right || 0)) * this.scale;
            const sbH = (plan.site.length - (sb.front || 0) - (sb.rear || 0)) * this.scale;

            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(sbP1.x, sbP1.y, sbW, sbH);
            ctx.setLineDash([]);
        }
    }

    drawRooms(plan) {
        if (!plan.rooms) return;
        const ctx = this.ctx;

        plan.rooms.forEach(room => {
            const p = this.worldToScreen(room.x, room.y);
            const w = room.w * this.scale;
            const h = room.h * this.scale;
            const isSelected = this.selectedEntityId === room.id;

            // Room Background Tint
            if (isSelected) {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
                ctx.fillRect(p.x, p.y, w, h);
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x, p.y, w, h);
            } else {
                ctx.fillStyle = this.getRoomColor(room.type);
                ctx.fillRect(p.x, p.y, w, h);
            }
        });
    }

    drawRoomLabels(plan) {
        if (!plan.rooms) return;
        const ctx = this.ctx;

        plan.rooms.forEach(room => {
            const p = this.worldToScreen(room.x, room.y);
            const w = room.w * this.scale;
            const h = room.h * this.scale;

            const isSmall = room.w < 70 || room.h < 50;
            const nameFontSize = isSmall ? Math.max(9, Math.min(11, 11 * this.scale)) : Math.max(10, Math.min(13, 13 * this.scale));
            const dimFontSize = isSmall ? Math.max(8, Math.min(9, 9 * this.scale)) : Math.max(9, Math.min(11, 11 * this.scale));

            const centerX = p.x + w / 2;
            // Shift label vertically slightly to leave room for furniture
            const centerY = (room.type === 'living' || room.type === 'bedroom') ? (p.y + h / 2 - 15 * this.scale) : (p.y + h / 2);

            // Room Name Label
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `700 ${nameFontSize}px 'Inter', sans-serif`;
            ctx.fillText(room.name, centerX, centerY - dimFontSize * 0.7);

            // Room Dimensions Subtext
            ctx.fillStyle = '#4B5563';
            ctx.font = `500 ${dimFontSize}px 'Inter', sans-serif`;
            const dimText = room.dimensionLabel || `${formatFeetInches(room.w, false)} × ${formatFeetInches(room.h, false)}`;
            ctx.fillText(dimText, centerX, centerY + dimFontSize * 0.8);
        });
    }

    getRoomColor(type) {
        switch (type) {
            case 'living': return '#FAFAFA';
            case 'dining': return '#FDFDFD';
            case 'kitchen': return '#FFFDFB';
            case 'bedroom': return '#F8FAFC';
            case 'toilet': case 'bathroom': return '#F0F9FF';
            case 'pooja': return '#FFFBEB';
            case 'parking': case 'portico': return '#F8FAFC';
            case 'sitout': return '#F0FDF4';
            case 'store': return '#F8FAFC';
            case 'staircase': return '#F1F5F9';
            default: return '#FAFAFA';
        }
    }

    drawWalls(plan) {
        if (!plan.walls) return;
        const ctx = this.ctx;

        const doorMap = new Map();
        (plan.doors || []).forEach(d => {
            if (!doorMap.has(d.wallId)) doorMap.set(d.wallId, []);
            doorMap.get(d.wallId).push(d);
        });

        const windowMap = new Map();
        (plan.windows || []).forEach(w => {
            if (!windowMap.has(w.wallId)) windowMap.set(w.wallId, []);
            windowMap.get(w.wallId).push(w);
        });

        // Pass 1: Draw Wall Segments (Charcoal Solid Structural Fill)
        plan.walls.forEach(wall => {
            const p1 = this.worldToScreen(wall.start.x, wall.start.y);
            const p2 = this.worldToScreen(wall.end.x, wall.end.y);
            const thickness = (wall.thickness || 9) * this.scale;
            const isSelected = this.selectedEntityId === wall.id;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isSelected ? '#2563EB' : '#334155'; // Dark Charcoal/Slate CAD Wall
            ctx.lineWidth = Math.max(2, thickness);
            ctx.lineCap = 'square';
            ctx.stroke();
        });

        // Pass 2: Draw Clean Wall Openings, Doors & Windows
        plan.walls.forEach(wall => {
            const doors = doorMap.get(wall.id) || [];
            doors.forEach(door => this.drawDoor(wall, door));

            const windows = windowMap.get(wall.id) || [];
            windows.forEach(win => this.drawWindow(wall, win));
        });
    }

    drawDoor(wall, door) {
        const ctx = this.ctx;
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) return;

        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;

        const pos = door.positionAlongWall || 24;
        const w = door.width || 36;

        const startX = wall.start.x + ux * pos;
        const startY = wall.start.y + uy * pos;
        const endX = wall.start.x + ux * (pos + w);
        const endY = wall.start.y + uy * (pos + w);

        const scrStart = this.worldToScreen(startX, startY);
        const scrEnd = this.worldToScreen(endX, endY);
        const doorLenScr = w * this.scale;

        // Clear opening cutout in the wall
        ctx.beginPath();
        ctx.moveTo(scrStart.x, scrStart.y);
        ctx.lineTo(scrEnd.x, scrEnd.y);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = (wall.thickness || 9) * this.scale + 1.5;
        ctx.lineCap = 'butt';
        ctx.stroke();

        // Door frame jambs
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(scrStart.x - nx * 3, scrStart.y - ny * 3);
        ctx.lineTo(scrStart.x + nx * 3, scrStart.y + ny * 3);
        ctx.moveTo(scrEnd.x - nx * 3, scrEnd.y - ny * 3);
        ctx.lineTo(scrEnd.x + nx * 3, scrEnd.y + ny * 3);
        ctx.stroke();

        if (door.type === 'arch_opening' || door.swingDirection === 'none') {
            return; // Clean opening without leaf
        }

        // Draw CAD Door Leaf & Swing Arc
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.5;

        let swingAngleMultiplier = door.swingDirection === 'left' ? -1 : 1;
        const leafTipX = scrStart.x + nx * doorLenScr * swingAngleMultiplier;
        const leafTipY = scrStart.y + ny * doorLenScr * swingAngleMultiplier;

        // Door Leaf
        ctx.beginPath();
        ctx.moveTo(scrStart.x, scrStart.y);
        ctx.lineTo(leafTipX, leafTipY);
        ctx.stroke();

        // Swing Arc (Quarter circle)
        ctx.beginPath();
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1;
        const startAngle = Math.atan2(leafTipY - scrStart.y, leafTipX - scrStart.x);
        const endAngle = Math.atan2(scrEnd.y - scrStart.y, scrEnd.x - scrStart.x);
        const counterClockwise = door.swingDirection === 'left';
        ctx.arc(scrStart.x, scrStart.y, doorLenScr, startAngle, endAngle, counterClockwise);
        ctx.stroke();
    }

    drawWindow(wall, win) {
        const ctx = this.ctx;
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) return;

        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;

        const pos = win.positionAlongWall || 24;
        const w = win.width || 48;
        const wallThick = (wall.thickness || 9) * this.scale;

        const startX = wall.start.x + ux * pos;
        const startY = wall.start.y + uy * pos;
        const endX = wall.start.x + ux * (pos + w);
        const endY = wall.start.y + uy * (pos + w);

        const scrStart = this.worldToScreen(startX, startY);
        const scrEnd = this.worldToScreen(endX, endY);

        // 1. Clear Wall Opening
        ctx.beginPath();
        ctx.moveTo(scrStart.x, scrStart.y);
        ctx.lineTo(scrEnd.x, scrEnd.y);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = wallThick + 1;
        ctx.stroke();

        // 2. Window Outer Frame Lines (Double Lines)
        const halfThick = wallThick / 2;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        // Outer face
        ctx.moveTo(scrStart.x + nx * halfThick, scrStart.y + ny * halfThick);
        ctx.lineTo(scrEnd.x + nx * halfThick, scrEnd.y + ny * halfThick);
        // Inner face
        ctx.moveTo(scrStart.x - nx * halfThick, scrStart.y - ny * halfThick);
        ctx.lineTo(scrEnd.x - nx * halfThick, scrEnd.y - ny * halfThick);
        // Jamb end caps
        ctx.moveTo(scrStart.x - nx * halfThick, scrStart.y - ny * halfThick);
        ctx.lineTo(scrStart.x + nx * halfThick, scrStart.y + ny * halfThick);
        ctx.moveTo(scrEnd.x - nx * halfThick, scrEnd.y - ny * halfThick);
        ctx.lineTo(scrEnd.x + nx * halfThick, scrEnd.y + ny * halfThick);
        ctx.stroke();

        // 3. Center Glass Pane Line
        ctx.strokeStyle = '#0284C7'; // Blue glass indicator
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(scrStart.x, scrStart.y);
        ctx.lineTo(scrEnd.x, scrEnd.y);
        ctx.stroke();
    }

    drawStairs(plan) {
        if (!plan.stairs) return;
        const ctx = this.ctx;

        plan.stairs.forEach(stair => {
            const p = this.worldToScreen(stair.x, stair.y);
            const w = stair.width * this.scale;
            const h = stair.length * this.scale;

            // Stair well background
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(p.x, p.y, w, h);

            // Boundary
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(p.x, p.y, w, h);

            // Dog-legged center dividing line
            const halfW = w / 2;
            ctx.beginPath();
            ctx.moveTo(p.x + halfW, p.y);
            ctx.lineTo(p.x + halfW, p.y + h);
            ctx.stroke();

            // Treads
            const stepsPerFlight = 9;
            const stepH = h / stepsPerFlight;
            ctx.strokeStyle = '#64748B';
            ctx.lineWidth = 1;

            ctx.beginPath();
            for (let i = 1; i < stepsPerFlight; i++) {
                // Left flight treads
                ctx.moveTo(p.x, p.y + i * stepH);
                ctx.lineTo(p.x + halfW - 2, p.y + i * stepH);
                // Right flight treads
                ctx.moveTo(p.x + halfW + 2, p.y + i * stepH);
                ctx.lineTo(p.x + w, p.y + i * stepH);
            }
            ctx.stroke();

            // UP Direction Arrow on Flight 1
            ctx.strokeStyle = '#0F172A';
            ctx.fillStyle = '#0F172A';
            ctx.lineWidth = 1.5;

            const arrowX = p.x + halfW / 2;
            const arrowStartY = p.y + h - 10 * this.scale;
            const arrowEndY = p.y + 15 * this.scale;

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowStartY);
            ctx.lineTo(arrowX, arrowEndY);
            ctx.stroke();

            // Arrow head
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowEndY);
            ctx.lineTo(arrowX - 4, arrowEndY + 8);
            ctx.lineTo(arrowX + 4, arrowEndY + 8);
            ctx.closePath();
            ctx.fill();

            // Label "UP"
            ctx.font = `700 ${Math.max(9, 10 * this.scale)}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('UP', arrowX + 14 * this.scale, (arrowStartY + arrowEndY) / 2);
        });
    }

    drawColumns(plan) {
        if (!plan.columns) return;
        const ctx = this.ctx;

        plan.columns.forEach(col => {
            const p = this.worldToScreen(col.x, col.y);
            const w = (col.width || 9) * this.scale;
            const h = (col.length || 9) * this.scale;

            ctx.fillStyle = '#1E293B';
            ctx.fillRect(p.x, p.y, w, h);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            ctx.strokeRect(p.x, p.y, w, h);
        });
    }

    drawFurniture(plan) {
        if (!plan.furniture) return;
        const ctx = this.ctx;

        plan.furniture.forEach(item => {
            const p = this.worldToScreen(item.x, item.y);
            const w = item.width * this.scale;
            const l = item.length * this.scale;

            ctx.save();
            ctx.translate(p.x + w / 2, p.y + l / 2);
            ctx.rotate((item.rotation || 0) * Math.PI / 180);

            switch (item.type) {
                case 'bed':
                    this.drawBedSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                case 'dining_table':
                    this.drawDiningTableSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                case 'sofa':
                    this.drawSofaSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                case 'table':
                    this.drawCoffeeTableSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                case 'tv_unit':
                    this.drawTvUnitSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                case 'kitchen_counter':
                    this.drawKitchenCounterSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                case 'commode':
                    this.drawCommodeSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                case 'car':
                    this.drawCarSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                case 'plant':
                    this.drawPlantSymbol(ctx, -w / 2, -l / 2, w, l);
                    break;
                default:
                    ctx.strokeStyle = '#94A3B8';
                    ctx.fillStyle = '#F8FAFC';
                    ctx.lineWidth = 1;
                    ctx.fillRect(-w / 2, -l / 2, w, l);
                    ctx.strokeRect(-w / 2, -l / 2, w, l);
                    break;
            }

            ctx.restore();
        });
    }

    drawBedSymbol(ctx, x, y, w, h) {
        // Bed base
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Headboard
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(x, y, w, h * 0.15);
        ctx.strokeRect(x, y, w, h * 0.15);

        // Pillows
        const pillowW = w * 0.38;
        const pillowH = h * 0.2;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + w * 0.08, y + h * 0.18, pillowW, pillowH);
        ctx.strokeRect(x + w * 0.08, y + h * 0.18, pillowW, pillowH);

        ctx.fillRect(x + w * 0.54, y + h * 0.18, pillowW, pillowH);
        ctx.strokeRect(x + w * 0.54, y + h * 0.18, pillowW, pillowH);

        // Blanket fold
        ctx.strokeStyle = '#94A3B8';
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.45);
        ctx.lineTo(x + w, y + h * 0.45);
        ctx.stroke();
    }

    drawDiningTableSymbol(ctx, x, y, w, h) {
        // Table top
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.2;
        ctx.fillRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.7);
        ctx.strokeRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.7);

        // Chairs (6 chairs: 2 top, 2 bottom, 1 left, 1 right)
        const chairW = w * 0.22;
        const chairH = h * 0.12;

        // Top chairs
        ctx.strokeRect(x + w * 0.2, y, chairW, chairH);
        ctx.strokeRect(x + w * 0.58, y, chairW, chairH);

        // Bottom chairs
        ctx.strokeRect(x + w * 0.2, y + h - chairH, chairW, chairH);
        ctx.strokeRect(x + w * 0.58, y + h - chairH, chairW, chairH);

        // Left & Right chairs
        ctx.strokeRect(x, y + h * 0.38, chairH, chairW);
        ctx.strokeRect(x + w - chairH, y + h * 0.38, chairH, chairW);
    }

    drawSofaSymbol(ctx, x, y, w, h) {
        // L-shaped sofa
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.2;

        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Cushions
        ctx.strokeStyle = '#CBD5E1';
        ctx.strokeRect(x + 4, y + 4, w - 8, h * 0.4);
        ctx.strokeRect(x + 4, y + h * 0.4 + 4, w * 0.4, h * 0.5);
    }

    drawCoffeeTableSymbol(ctx, x, y, w, h) {
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    }

    drawTvUnitSymbol(ctx, x, y, w, h) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, w, h);
    }

    drawKitchenCounterSymbol(ctx, x, y, w, h) {
        // Counter top
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Gas Stove (3 burners)
        const stoveX = x + w * 0.2;
        const stoveY = y + h * 0.2;
        const stoveW = w * 0.25;
        const stoveH = h * 0.6;
        ctx.strokeRect(stoveX, stoveY, stoveW, stoveH);
        ctx.beginPath();
        ctx.arc(stoveX + stoveW * 0.3, stoveY + stoveH * 0.5, stoveH * 0.25, 0, Math.PI * 2);
        ctx.arc(stoveX + stoveW * 0.7, stoveY + stoveH * 0.5, stoveH * 0.25, 0, Math.PI * 2);
        ctx.stroke();

        // Sink Basin
        const sinkX = x + w * 0.65;
        const sinkY = y + h * 0.15;
        const sinkW = w * 0.25;
        const sinkH = h * 0.7;
        ctx.strokeRect(sinkX, sinkY, sinkW, sinkH);
        ctx.beginPath();
        ctx.arc(sinkX + sinkW / 2, sinkY + sinkH / 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCommodeSymbol(ctx, x, y, w, h) {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.2;

        // Tank
        ctx.fillRect(x, y, w, h * 0.35);
        ctx.strokeRect(x, y, w, h * 0.35);

        // Oval Bowl
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h * 0.65, w * 0.42, h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawCarSymbol(ctx, x, y, w, h) {
        ctx.fillStyle = '#F1F5F9';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.4;

        // Car Body Outline
        ctx.beginPath();
        const r = 12;
        ctx.roundRect(x, y, w, h, [r, r, r, r]);
        ctx.fill();
        ctx.stroke();

        // Windshield
        ctx.strokeStyle = '#64748B';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.15, y + h * 0.25);
        ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.28, x + w * 0.85, y + h * 0.25);
        ctx.stroke();

        // Roof
        ctx.strokeRect(x + w * 0.18, y + h * 0.3, w * 0.64, h * 0.4);

        // Rear Windshield
        ctx.beginPath();
        ctx.moveTo(x + w * 0.15, y + h * 0.75);
        ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.72, x + w * 0.85, y + h * 0.75);
        ctx.stroke();
    }

    drawPlantSymbol(ctx, x, y, w, h) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = w / 2;

        ctx.strokeStyle = '#16A34A';
        ctx.fillStyle = '#DCFCE7';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Leaves
        ctx.beginPath();
        ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
        ctx.stroke();
    }

    drawDimensions(plan) {
        if (!plan.site) return;
        const ctx = this.ctx;
        const site = plan.site;

        const pTopLeft = this.worldToScreen(0, 0);
        const pTopRight = this.worldToScreen(site.width, 0);
        const pBotLeft = this.worldToScreen(0, site.length);

        ctx.strokeStyle = '#111827';
        ctx.fillStyle = '#111827';
        ctx.lineWidth = 1;
        ctx.font = `600 ${Math.max(10, 12 * this.scale)}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // 1. Horizontal Top Dimension (e.g. 45'-0" or 40'-0")
        const offY = pTopLeft.y - 25;
        ctx.beginPath();
        ctx.moveTo(pTopLeft.x, offY);
        ctx.lineTo(pTopRight.x, offY);
        // Extension lines
        ctx.moveTo(pTopLeft.x, pTopLeft.y); ctx.lineTo(pTopLeft.x, offY - 8);
        ctx.moveTo(pTopRight.x, pTopRight.y); ctx.lineTo(pTopRight.x, offY - 8);
        // Slash ticks
        ctx.moveTo(pTopLeft.x - 4, offY + 4); ctx.lineTo(pTopLeft.x + 4, offY - 4);
        ctx.moveTo(pTopRight.x - 4, offY + 4); ctx.lineTo(pTopRight.x + 4, offY - 4);
        ctx.stroke();
        ctx.fillText(formatFeetInches(site.width, false), (pTopLeft.x + pTopRight.x) / 2, offY - 4);

        // 2. Vertical Left Dimension (e.g. 70'-0" or 30'-0")
        const offX = pTopLeft.x - 28;
        ctx.beginPath();
        ctx.moveTo(offX, pTopLeft.y);
        ctx.lineTo(offX, pBotLeft.y);
        // Extension lines
        ctx.moveTo(pTopLeft.x, pTopLeft.y); ctx.lineTo(offX - 8, pTopLeft.y);
        ctx.moveTo(pBotLeft.x, pBotLeft.y); ctx.lineTo(offX - 8, pBotLeft.y);
        // Slash ticks
        ctx.moveTo(offX - 4, pTopLeft.y + 4); ctx.lineTo(offX + 4, pTopLeft.y - 4);
        ctx.moveTo(offX - 4, pBotLeft.y + 4); ctx.lineTo(offX + 4, pBotLeft.y - 4);
        ctx.stroke();

        ctx.save();
        ctx.translate(offX - 8, (pTopLeft.y + pBotLeft.y) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(formatFeetInches(site.length, false), 0, 0);
        ctx.restore();
    }

    renderMinimap(minimapCanvas, plan) {
        if (!minimapCanvas || !plan || !plan.site) return;
        const mCtx = minimapCanvas.getContext('2d');
        const mW = minimapCanvas.width;
        const mH = minimapCanvas.height;

        mCtx.fillStyle = '#FFFFFF';
        mCtx.fillRect(0, 0, mW, mH);

        const siteW = plan.site.width || 540;
        const siteL = plan.site.length || 840;

        const mScale = Math.min((mW - 16) / siteW, (mH - 16) / siteL);
        const mPanX = (mW - siteW * mScale) / 2;
        const mPanY = (mH - siteL * mScale) / 2;

        // Draw site boundary
        mCtx.strokeStyle = '#CBD5E1';
        mCtx.lineWidth = 1;
        mCtx.setLineDash([2, 2]);
        mCtx.strokeRect(mPanX, mPanY, siteW * mScale, siteL * mScale);
        mCtx.setLineDash([]);

        // Draw rooms
        (plan.rooms || []).forEach(r => {
            mCtx.fillStyle = '#F8FAFC';
            mCtx.fillRect(mPanX + r.x * mScale, mPanY + r.y * mScale, r.w * mScale, r.h * mScale);
            mCtx.strokeStyle = '#E2E8F0';
            mCtx.lineWidth = 0.8;
            mCtx.strokeRect(mPanX + r.x * mScale, mPanY + r.y * mScale, r.w * mScale, r.h * mScale);
        });

        // Draw walls
        (plan.walls || []).forEach(w => {
            mCtx.strokeStyle = '#334155';
            mCtx.lineWidth = Math.max(1, (w.thickness || 9) * mScale);
            mCtx.beginPath();
            mCtx.moveTo(mPanX + w.start.x * mScale, mPanY + w.start.y * mScale);
            mCtx.lineTo(mPanX + w.end.x * mScale, mPanY + w.end.y * mScale);
            mCtx.stroke();
        });

        // Draw Viewport Camera Frustum Frame
        const viewWorldLeft = (0 - this.pan.x) / this.scale;
        const viewWorldTop = (0 - this.pan.y) / this.scale;
        const viewWorldRight = (this.viewportWidth - this.pan.x) / this.scale;
        const viewWorldBottom = (this.viewportHeight - this.pan.y) / this.scale;

        const vfX = mPanX + viewWorldLeft * mScale;
        const vfY = mPanY + viewWorldTop * mScale;
        const vfW = (viewWorldRight - viewWorldLeft) * mScale;
        const vfH = (viewWorldBottom - viewWorldTop) * mScale;

        mCtx.strokeStyle = '#2563EB';
        mCtx.lineWidth = 1.5;
        mCtx.fillStyle = 'rgba(37, 99, 235, 0.08)';
        mCtx.fillRect(vfX, vfY, vfW, vfH);
        mCtx.strokeRect(vfX, vfY, vfW, vfH);
    }
}
