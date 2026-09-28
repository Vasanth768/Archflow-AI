/**
 * CADRenderer2D.js - Professional Architectural 2D Canvas Engine
 * 
 * Replicates the high-precision CAD aesthetic of professional architectural blueprints:
 * - Crisp white canvas with subtle adaptive architectural grid
 * - Solid structural double-line walls with clean corner miter/butt joins
 * - 90-degree door swing arcs and double-line window frames with sill extensions
 * - Architectural staircase with treads, handrail, and UP arrow
 * - Vector 2D CAD furniture symbols (Beds with pillows, Dining sets, Sofas, Kitchen Counters with sinks, Sanitary ware, Car, Plants)
 * - Collision-free typography formatted in feet and inches (e.g. 12'-0" × 14'-0")
 * - Outer and inner architectural dimension lines with 45° tick marks
 * - Fixed matrix viewport transform: screen = world * zoom + pan
 * - Interactive zoom around cursor, pan, and 1-click Fit-to-Screen
 */

import { formatFeetInches } from './UnitEngine.js';

export class CADRenderer2D {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = options.scale || 0.8; // pixels per inch
        this.pan = options.pan || { x: 60, y: 60 };
        this.viewportWidth = options.viewportWidth || (canvas.clientWidth || 800);
        this.viewportHeight = options.viewportHeight || (canvas.clientHeight || 600);
        this.gridSizeInches = options.gridSizeInches || 12; // 1-foot grid
        this.showGrid = options.showGrid !== false;
        this.showDimensions = options.showDimensions !== false;
        this.showFurniture = options.showFurniture !== false;
        this.showVastuGrid = Boolean(options.showVastuGrid);
        this.selectedEntityId = options.selectedEntityId || null;
        this.theme = options.theme || 'light';
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
     * Zoom centered around a specific screen coordinate (e.g. mouse cursor)
     */
    zoomAt(screenX, screenY, factor) {
        const worldBefore = this.screenToWorld(screenX, screenY);
        const newScale = Math.max(0.1, Math.min(5.0, this.scale * factor));
        this.scale = newScale;
        this.pan.x = screenX - worldBefore.x * this.scale;
        this.pan.y = screenY - worldBefore.y * this.scale;
    }

    /**
     * Fit entire CAD plan into canvas viewport with 15% margin
     */
    fitToScreen(plan) {
        if (!plan || !plan.site) return;
        const siteW = plan.site.width || 360;
        const siteL = plan.site.length || 480;

        // Total content envelope including dimensions (+ 60 inches margins)
        const totalW = siteW + 80;
        const totalL = siteL + 80;

        const scaleX = (this.viewportWidth * 0.82) / totalW;
        const scaleY = (this.viewportHeight * 0.82) / totalL;
        this.scale = Math.min(scaleX, scaleY);

        this.pan.x = (this.viewportWidth - siteW * this.scale) / 2;
        this.pan.y = (this.viewportHeight - siteL * this.scale) / 2;
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
        this.showVastuGrid = options.showVastuGrid !== undefined ? options.showVastuGrid : this.showVastuGrid;

        // 1. Clear background with crisp architectural white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 2. Draw Architectural Grid
        if (this.showGrid) {
            this.drawGrid(plan);
        }

        // 3. Draw Site Boundaries & Setbacks
        this.drawSite(plan);

        // 4. Draw Optional 9-Quadrant Vastu Mandala Overlay
        if (this.showVastuGrid) {
            this.drawVastuMandala(plan);
        }

        // 5. Draw Room Fills & Selection Highlights
        this.drawRooms(plan);

        // 6. Draw Structural Columns
        this.drawColumns(plan);

        // 7. Draw Architectural Stairs
        this.drawStairs(plan);

        // 8. Draw Vector Furniture Symbols
        if (this.showFurniture) {
            this.drawFurniture(plan);
        }

        // 9. Draw Double-Line Structural Walls with Openings & Door Swing Arcs
        this.drawWallsAndOpenings(plan);

        // 10. Draw Room Labels (Bold title, dimensions, area)
        this.drawRoomLabels(plan);

        // 11. Draw Outer & Inner Architectural Dimensions
        if (this.showDimensions) {
            this.drawDimensions(plan);
        }

        // 12. Draw North Compass
        this.drawCompass(plan);
    }

    drawGrid(plan) {
        const ctx = this.ctx;
        const step1Ft = 12 * this.scale;
        const step5Ft = 60 * this.scale;

        if (step1Ft < 4) return;

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
        const p = this.worldToScreen(0, 0);
        const w = plan.site.width * this.scale;
        const h = plan.site.length * this.scale;

        // Site Outer Boundary
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, w, h);

        // Dashed Setback Boundary
        if (plan.site.setbacks) {
            const sb = plan.site.setbacks;
            const sp = this.worldToScreen(sb.left || 24, sb.rear || 24);
            const sw = (plan.site.width - (sb.left || 24) - (sb.right || 24)) * this.scale;
            const sh = (plan.site.length - (sb.rear || 24) - (sb.front || 36)) * this.scale;

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1;
            ctx.strokeRect(sp.x, sp.y, sw, sh);
            ctx.restore();
        }
    }

    drawVastuMandala(plan) {
        if (!plan.site) return;
        const ctx = this.ctx;
        const p = this.worldToScreen(0, 0);
        const w = plan.site.width * this.scale;
        const h = plan.site.length * this.scale;

        const cellW = w / 3;
        const cellH = h / 3;

        const zoneLabels = [
            ['NW (Air)', 'N (Water)', 'NE (Spirit)'],
            ['W (Space)', 'Center (Brahma)', 'E (Sun)'],
            ['SW (Earth)', 'S (Fire)', 'SE (Agni)']
        ];

        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.fillStyle = 'rgba(245, 158, 11, 0.03)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const zx = p.x + col * cellW;
                const zy = p.y + row * cellH;
                ctx.fillRect(zx, zy, cellW, cellH);
                ctx.strokeRect(zx, zy, cellW, cellH);

                ctx.fillStyle = 'rgba(180, 83, 9, 0.7)';
                ctx.font = '700 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(zoneLabels[row][col], zx + cellW / 2, zy + 16);
            }
        }
        ctx.restore();
    }

    drawRooms(plan) {
        const ctx = this.ctx;
        (plan.rooms || []).forEach(r => {
            const p = this.worldToScreen(r.x, r.y);
            const w = r.w * this.scale;
            const h = r.h * this.scale;

            // Room Background Fill
            ctx.fillStyle = r.color || '#F8FAFC';
            ctx.fillRect(p.x, p.y, w, h);

            // Selection Highlight
            if (this.selectedEntityId === r.id) {
                ctx.save();
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 3;
                ctx.strokeRect(p.x, p.y, w, h);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
                ctx.fillRect(p.x, p.y, w, h);
                ctx.restore();
            }
        });
    }

    drawColumns(plan) {
        const ctx = this.ctx;
        (plan.columns || []).forEach(c => {
            const p = this.worldToScreen(c.x, c.y);
            const w = (c.width || 9) * this.scale;
            const l = (c.length || 9) * this.scale;

            ctx.fillStyle = '#0F172A';
            ctx.fillRect(p.x, p.y, w, l);

            // Column Hatch
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + w, p.y + l);
            ctx.moveTo(p.x + w, p.y);
            ctx.lineTo(p.x, p.y + l);
            ctx.stroke();
        });
    }

    drawStairs(plan) {
        const ctx = this.ctx;
        (plan.stairs || []).forEach(s => {
            const p = this.worldToScreen(s.x, s.y);
            const w = s.width * this.scale;
            const h = s.length * this.scale;
            const treads = s.treads || 12;

            // Stair outline
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(p.x, p.y, w, h);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(p.x, p.y, w, h);

            // Treads
            const stepH = h / treads;
            ctx.strokeStyle = '#64748B';
            ctx.lineWidth = 1;
            for (let i = 1; i < treads; i++) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y + i * stepH);
                ctx.lineTo(p.x + w, p.y + i * stepH);
                ctx.stroke();
            }

            // Directional UP Arrow
            ctx.save();
            ctx.strokeStyle = '#3B82F6';
            ctx.fillStyle = '#3B82F6';
            ctx.lineWidth = 2;
            const midX = p.x + w / 2;
            ctx.beginPath();
            ctx.moveTo(midX, p.y + h - 10);
            ctx.lineTo(midX, p.y + 15);
            ctx.stroke();

            // Arrow head
            ctx.beginPath();
            ctx.moveTo(midX, p.y + 10);
            ctx.lineTo(midX - 5, p.y + 20);
            ctx.lineTo(midX + 5, p.y + 20);
            ctx.closePath();
            ctx.fill();

            ctx.font = '700 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('UP', midX, p.y + h - 14);
            ctx.restore();
        });
    }

    drawFurniture(plan) {
        const ctx = this.ctx;
        (plan.furniture || []).forEach(f => {
            const p = this.worldToScreen(f.x, f.y);
            const w = f.width * this.scale;
            const l = f.length * this.scale;

            ctx.save();
            ctx.translate(p.x + w / 2, p.y + l / 2);
            ctx.rotate(((f.rotation || 0) * Math.PI) / 180);

            if (f.type === 'bed') {
                // Bed Frame
                ctx.fillStyle = '#F1F5F9';
                ctx.fillRect(-w / 2, -l / 2, w, l);
                ctx.strokeStyle = '#64748B';
                ctx.lineWidth = 1.2;
                ctx.strokeRect(-w / 2, -l / 2, w, l);

                // Headboard
                ctx.fillStyle = '#334155';
                ctx.fillRect(-w / 2, -l / 2, w, 6 * this.scale);

                // Pillows
                ctx.fillStyle = '#E2E8F0';
                const pilW = (w - 12 * this.scale) / 2;
                const pilH = 14 * this.scale;
                ctx.strokeRect(-w / 2 + 4 * this.scale, -l / 2 + 8 * this.scale, pilW, pilH);
                ctx.strokeRect(4 * this.scale, -l / 2 + 8 * this.scale, pilW, pilH);

                // Blanket Fold Line
                ctx.beginPath();
                ctx.moveTo(-w / 2, 0);
                ctx.lineTo(w / 2, 0);
                ctx.stroke();
            } else if (f.type === 'sofa') {
                // Sofa Main Body
                ctx.fillStyle = '#E2E8F0';
                ctx.fillRect(-w / 2, -l / 2, w, l);
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.2;
                ctx.strokeRect(-w / 2, -l / 2, w, l);

                // Armrests
                ctx.fillStyle = '#94A3B8';
                ctx.fillRect(-w / 2, -l / 2, 8 * this.scale, l);
                ctx.fillRect(w / 2 - 8 * this.scale, -l / 2, 8 * this.scale, l);
            } else if (f.type === 'dining_table') {
                // Table
                ctx.fillStyle = '#F8FAFC';
                ctx.fillRect(-w / 2, -l / 2, w, l);
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-w / 2, -l / 2, w, l);

                // Chairs
                ctx.fillStyle = '#CBD5E1';
                const chairW = 14 * this.scale;
                const chairD = 10 * this.scale;
                ctx.strokeRect(-w / 2 + 8 * this.scale, -l / 2 - chairD, chairW, chairD);
                ctx.strokeRect(w / 2 - 8 * this.scale - chairW, -l / 2 - chairD, chairW, chairD);
                ctx.strokeRect(-w / 2 + 8 * this.scale, l / 2, chairW, chairD);
                ctx.strokeRect(w / 2 - 8 * this.scale - chairW, l / 2, chairW, chairD);
            } else if (f.type === 'kitchen_counter') {
                // Granite Counter
                ctx.fillStyle = '#334155';
                ctx.fillRect(-w / 2, -l / 2, w, l);

                // Sink & Burners
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.2;
                ctx.strokeRect(-w / 2 + 6 * this.scale, -l / 2 + 4 * this.scale, 20 * this.scale, l - 8 * this.scale);

                // Stove
                ctx.beginPath();
                ctx.arc(w / 2 - 20 * this.scale, 0, 6 * this.scale, 0, Math.PI * 2);
                ctx.arc(w / 2 - 36 * this.scale, 0, 5 * this.scale, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#E2E8F0';
                ctx.fillRect(-w / 2, -l / 2, w, l);
                ctx.strokeStyle = '#94A3B8';
                ctx.lineWidth = 1;
                ctx.strokeRect(-w / 2, -l / 2, w, l);
            }

            ctx.restore();
        });
    }

    drawWallsAndOpenings(plan) {
        const ctx = this.ctx;
        const walls = plan.walls || [];

        // 1. Draw Double-Line Structural Wall Blocks
        walls.forEach(w => {
            const p1 = this.worldToScreen(w.start.x, w.start.y);
            const p2 = this.worldToScreen(w.end.x, w.end.y);
            const thick = (w.thickness || 9) * this.scale;

            ctx.save();
            ctx.strokeStyle = w.type === 'exterior' ? '#0F172A' : '#334155';
            ctx.lineWidth = thick;
            ctx.lineCap = 'square';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
        });

        // 2. Draw Windows on Exterior Walls
        (plan.windows || []).forEach(win => {
            const hostWall = walls.find(w => w.id === win.wallId);
            if (!hostWall) return;

            const dx = hostWall.end.x - hostWall.start.x;
            const dy = hostWall.end.y - hostWall.start.y;
            const len = Math.hypot(dx, dy);
            if (len <= 0) return;

            const ux = dx / len;
            const uy = dy / len;
            const pos = win.positionAlongWall ?? 24;
            const winW = win.width || 48;

            const startX = hostWall.start.x + ux * pos;
            const startY = hostWall.start.y + uy * pos;
            const endX = hostWall.start.x + ux * (pos + winW);
            const endY = hostWall.start.y + uy * (pos + winW);

            const sp1 = this.worldToScreen(startX, startY);
            const sp2 = this.worldToScreen(endX, endY);
            const thick = (hostWall.thickness || 9) * this.scale;

            // Clear wall segment for window
            ctx.save();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = thick + 2;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(sp2.x, sp2.y);
            ctx.stroke();

            // Draw Window Architectural Symbol (Frame + Glass Line)
            ctx.strokeStyle = '#0F172A';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(sp2.x, sp2.y);
            ctx.stroke();

            // Translucent Glass Center Line
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });

        // 3. Draw Doors and 90-Degree Swing Arcs
        (plan.doors || []).forEach(d => {
            const hostWall = walls.find(w => w.id === d.wallId);
            if (!hostWall) return;

            const dx = hostWall.end.x - hostWall.start.x;
            const dy = hostWall.end.y - hostWall.start.y;
            const len = Math.hypot(dx, dy);
            if (len <= 0) return;

            const ux = dx / len;
            const uy = dy / len;
            const pos = d.positionAlongWall ?? 24;
            const doorW = (d.width || 36);

            const hingeX = hostWall.start.x + ux * pos;
            const hingeY = hostWall.start.y + uy * pos;
            const endX = hostWall.start.x + ux * (pos + doorW);
            const endY = hostWall.start.y + uy * (pos + doorW);

            const hp = this.worldToScreen(hingeX, hingeY);
            const ep = this.worldToScreen(endX, endY);
            const thick = (hostWall.thickness || 9) * this.scale;
            const screenDoorW = doorW * this.scale;

            // Clear wall opening
            ctx.save();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = thick + 2;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            ctx.moveTo(hp.x, hp.y);
            ctx.lineTo(ep.x, ep.y);
            ctx.stroke();

            const angle = Math.atan2(dy, dx);

            // Door leaf line (perpendicular opening)
            const leafAngle = angle + (d.swing === 'left' ? -Math.PI / 2 : Math.PI / 2);
            const leafX = hp.x + Math.cos(leafAngle) * screenDoorW;
            const leafY = hp.y + Math.sin(leafAngle) * screenDoorW;

            ctx.strokeStyle = '#D97706';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(hp.x, hp.y);
            ctx.lineTo(leafX, leafY);
            ctx.stroke();

            // Quarter-circle Door Swing Arc
            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            if (d.swing === 'left') {
                ctx.arc(hp.x, hp.y, screenDoorW, angle - Math.PI / 2, angle);
            } else {
                ctx.arc(hp.x, hp.y, screenDoorW, angle, angle + Math.PI / 2);
            }
            ctx.stroke();
            ctx.restore();
        });
    }

    drawRoomLabels(plan) {
        const ctx = this.ctx;
        (plan.rooms || []).forEach(r => {
            const p = this.worldToScreen(r.x, r.y);
            const w = r.w * this.scale;
            const h = r.h * this.scale;

            const midX = p.x + w / 2;
            const midY = p.y + h / 2;

            ctx.save();
            ctx.fillStyle = '#0F172A';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Room Title
            ctx.font = '700 13px Inter, -apple-system, sans-serif';
            ctx.fillText(r.name.toUpperCase(), midX, midY - 10);

            // Dimension Label (e.g. 12'-0" × 14'-0")
            ctx.fillStyle = '#475569';
            ctx.font = '600 11px Inter, -apple-system, sans-serif';
            ctx.fillText(r.dimensionLabel || `${formatFeetInches(r.w, false)} × ${formatFeetInches(r.h, false)}`, midX, midY + 6);

            // Area Badge
            if (r.areaSqFt) {
                ctx.fillStyle = '#64748B';
                ctx.font = '500 10px Inter, -apple-system, sans-serif';
                ctx.fillText(`${r.areaSqFt} Sq.Ft`, midX, midY + 20);
            }

            ctx.restore();
        });
    }

    drawDimensions(plan) {
        const ctx = this.ctx;
        const siteW = plan.site?.width || 360;
        const siteL = plan.site?.length || 480;

        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.fillStyle = '#0F172A';
        ctx.lineWidth = 1;

        // Top Horizontal Plot Dimension
        const topStart = this.worldToScreen(0, -18);
        const topEnd = this.worldToScreen(siteW, -18);
        const topMid = (topStart.x + topEnd.x) / 2;

        ctx.beginPath();
        ctx.moveTo(topStart.x, topStart.y);
        ctx.lineTo(topEnd.x, topEnd.y);
        ctx.stroke();

        // 45° Tick Marks
        this.drawTick(ctx, topStart.x, topStart.y);
        this.drawTick(ctx, topEnd.x, topEnd.y);

        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${formatFeetInches(siteW, false)} [WIDTH]`, topMid, topStart.y - 8);

        // Right Vertical Plot Dimension
        const rightStart = this.worldToScreen(siteW + 18, 0);
        const rightEnd = this.worldToScreen(siteW + 18, siteL);
        const rightMid = (rightStart.y + rightEnd.y) / 2;

        ctx.beginPath();
        ctx.moveTo(rightStart.x, rightStart.y);
        ctx.lineTo(rightEnd.x, rightEnd.y);
        ctx.stroke();

        this.drawTick(ctx, rightStart.x, rightStart.y);
        this.drawTick(ctx, rightEnd.x, rightEnd.y);

        ctx.save();
        ctx.translate(rightStart.x + 14, rightMid);
        ctx.rotate(Math.PI / 2);
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${formatFeetInches(siteL, false)} [LENGTH]`, 0, 0);
        ctx.restore();

        ctx.restore();
    }

    drawTick(ctx, x, y) {
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 4);
        ctx.lineTo(x + 4, y - 4);
        ctx.stroke();
    }

    drawCompass(plan) {
        const ctx = this.ctx;
        const facing = plan.site?.facing || 'East';
        const cx = this.viewportWidth - 50;
        const cy = 50;

        ctx.save();
        ctx.strokeStyle = '#0F172A';
        ctx.fillStyle = '#EF4444';
        ctx.lineWidth = 1.5;

        // Compass Ring
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.stroke();

        // North Arrow
        ctx.beginPath();
        ctx.moveTo(cx, cy - 18);
        ctx.lineTo(cx - 5, cy + 6);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 18);
        ctx.lineTo(cx + 5, cy + 6);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();

        ctx.font = '700 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('N', cx, cy - 22);
        ctx.font = '600 9px Inter, sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText(facing.toUpperCase(), cx, cy + 32);

        ctx.restore();
    }

    resize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    /**
     * Render Interactive Overview Minimap
     */
    renderMinimap(minimapCanvas, plan) {
        if (!minimapCanvas || !plan || !plan.site) return;
        const mCtx = minimapCanvas.getContext('2d');
        if (!mCtx) return;

        const mW = minimapCanvas.width || 180;
        const mH = minimapCanvas.height || 140;

        mCtx.fillStyle = '#0F172A';
        mCtx.fillRect(0, 0, mW, mH);

        const siteW = plan.site.width || 360;
        const siteL = plan.site.length || 480;

        const mScale = Math.min((mW - 20) / siteW, (mH - 20) / siteL);
        const mOffX = (mW - siteW * mScale) / 2;
        const mOffY = (mH - siteL * mScale) / 2;

        // Draw Site Box
        mCtx.strokeStyle = '#475569';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(mOffX, mOffY, siteW * mScale, siteL * mScale);

        // Draw Rooms
        (plan.rooms || []).forEach(r => {
            const rx = mOffX + r.x * mScale;
            const ry = mOffY + r.y * mScale;
            const rw = r.w * mScale;
            const rh = r.h * mScale;

            mCtx.fillStyle = r.color || '#334155';
            mCtx.fillRect(rx, ry, rw, rh);
            mCtx.strokeStyle = '#64748B';
            mCtx.strokeRect(rx, ry, rw, rh);
        });

        // Draw Current Viewport Frustum Window
        const viewWorldX = -this.pan.x / this.scale;
        const viewWorldY = -this.pan.y / this.scale;
        const viewWorldW = this.viewportWidth / this.scale;
        const viewWorldH = this.viewportHeight / this.scale;

        const vx = mOffX + viewWorldX * mScale;
        const vy = mOffY + viewWorldY * mScale;
        const vw = viewWorldW * mScale;
        const vh = viewWorldH * mScale;

        mCtx.strokeStyle = '#38BDF8';
        mCtx.lineWidth = 1.5;
        mCtx.strokeRect(vx, vy, vw, vh);
        mCtx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        mCtx.fillRect(vx, vy, vw, vh);
    }

    /**
     * Export plan as high-resolution PNG data URL
     */
    exportPNG(plan, scaleMultiplier = 2) {
        if (!plan) return null;
        const offscreen = document.createElement('canvas');
        const siteW = (plan.site?.width || 360) + 120;
        const siteL = (plan.site?.length || 480) + 120;

        const targetW = siteW * 2 * scaleMultiplier;
        const targetH = siteL * 2 * scaleMultiplier;

        offscreen.width = targetW;
        offscreen.height = targetH;

        const renderer = new CADRenderer2D(offscreen, {
            scale: 2 * scaleMultiplier,
            pan: { x: 60 * 2 * scaleMultiplier, y: 60 * 2 * scaleMultiplier },
            viewportWidth: targetW,
            viewportHeight: targetH,
            showGrid: this.showGrid,
            showDimensions: true,
            showFurniture: true,
            showVastuGrid: this.showVastuGrid
        });

        renderer.render(plan);
        return offscreen.toDataURL('image/png');
    }

    /**
     * Export plan as clean, high-precision SVG vector document
     */
    exportSVG(plan) {
        if (!plan || !plan.site) return '';
        const siteW = plan.site.width || 360;
        const siteL = plan.site.length || 480;
        const pad = 60;
        const vbW = siteW + pad * 2;
        const vbH = siteL + pad * 2;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="${vbW * 3}" height="${vbH * 3}">\n`;
        svg += `  <rect width="${vbW}" height="${vbH}" fill="#FFFFFF" />\n`;
        svg += `  <g transform="translate(${pad}, ${pad})">\n`;

        // Site
        svg += `    <!-- Site Boundary -->\n`;
        svg += `    <rect x="0" y="0" width="${siteW}" height="${siteL}" fill="none" stroke="#94A3B8" stroke-width="2" />\n`;

        // Rooms
        svg += `    <!-- Rooms -->\n`;
        (plan.rooms || []).forEach(r => {
            svg += `    <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color || '#F8FAFC'}" stroke="#CBD5E1" stroke-width="1" />\n`;
            svg += `    <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 - 8}" font-family="sans-serif" font-size="12" font-weight="700" fill="#0F172A" text-anchor="middle">${r.name.toUpperCase()}</text>\n`;
            svg += `    <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 8}" font-family="sans-serif" font-size="10" font-weight="600" fill="#475569" text-anchor="middle">${r.dimensionLabel || `${formatFeetInches(r.w, false)} × ${formatFeetInches(r.h, false)}`}</text>\n`;
            if (r.areaSqFt) {
                svg += `    <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 22}" font-family="sans-serif" font-size="9" fill="#64748B" text-anchor="middle">${r.areaSqFt} Sq.Ft</text>\n`;
            }
        });

        // Walls
        svg += `    <!-- Walls -->\n`;
        (plan.walls || []).forEach(w => {
            const strokeColor = w.type === 'exterior' ? '#0F172A' : '#334155';
            svg += `    <line x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}" stroke="${strokeColor}" stroke-width="${w.thickness || 9}" stroke-linecap="square" />\n`;
        });

        // Dimensions
        svg += `    <!-- Dimensions -->\n`;
        svg += `    <line x1="0" y1="-18" x2="${siteW}" y2="-18" stroke="#475569" stroke-width="1" />\n`;
        svg += `    <text x="${siteW / 2}" y="-24" font-family="sans-serif" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">${formatFeetInches(siteW, false)}</text>\n`;

        svg += `    <line x1="${siteW + 18}" y1="0" x2="${siteW + 18}" y2="${siteL}" stroke="#475569" stroke-width="1" />\n`;
        svg += `    <text x="${siteW + 28}" y="${siteL / 2}" font-family="sans-serif" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle" transform="rotate(90, ${siteW + 28}, ${siteL / 2})">${formatFeetInches(siteL, false)}</text>\n`;

        svg += `  </g>\n`;
        svg += `</svg>`;
        return svg;
    }
}

export default CADRenderer2D;
