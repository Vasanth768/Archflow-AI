/**
 * CADRenderer2D.js - Professional Architectural 2D Canvas Engine
 * 
 * Replicates the clean, black-and-white 2D CAD floor plan reference style:
 * - Pure white background (#FFFFFF) with crisp black CAD stroke lines (#000000)
 * - Thick, clearly defined exterior walls and thinner interior partition walls
 * - Clearly separated rooms with centered room titles and readable dimensions
 * - Outer and segment dimension lines with extension lines and tick marks
 * - 90-degree door swing arcs and double-line window openings
 * - Simple 2D vector CAD furniture symbols (Beds, Sofas, Kitchen Counters, Sinks, Toilets, Washbasins)
 * - Automatic canvas fit-to-screen transform
 */

import { formatFeetInches } from './UnitEngine.js';

export class CADRenderer2D {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = options.scale || 0.8;
        this.pan = options.pan || { x: 80, y: 80 };
        this.viewportWidth = options.viewportWidth || (canvas.clientWidth || 800);
        this.viewportHeight = options.viewportHeight || (canvas.clientHeight || 600);
        this.showGrid = Boolean(options.showGrid);
        this.showDimensions = options.showDimensions !== false;
        this.showFurniture = options.showFurniture !== false;
        this.showVastuGrid = Boolean(options.showVastuGrid);
        this.selectedEntityId = options.selectedEntityId || null;
    }

    worldToScreen(x, y) {
        return {
            x: this.pan.x + x * this.scale,
            y: this.pan.y + y * this.scale
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.pan.x) / this.scale,
            y: (screenY - this.pan.y) / this.scale
        };
    }

    zoomAt(screenX, screenY, factor) {
        const worldBefore = this.screenToWorld(screenX, screenY);
        const newScale = Math.max(0.1, Math.min(5.0, this.scale * factor));
        this.scale = newScale;
        this.pan.x = screenX - worldBefore.x * this.scale;
        this.pan.y = screenY - worldBefore.y * this.scale;
    }

    /**
     * Automatically fits the complete floor plan to the available canvas with neat margins
     */
    fitToScreen(plan) {
        if (!plan || !plan.site) return;
        const siteW = plan.site.width || 360;
        const siteL = plan.site.length || 480;

        const totalW = siteW + 140;
        const totalL = siteL + 140;

        const scaleX = (this.viewportWidth * 0.82) / totalW;
        const scaleY = (this.viewportHeight * 0.82) / totalL;
        this.scale = Math.min(scaleX, scaleY);

        this.pan.x = (this.viewportWidth - siteW * this.scale) / 2;
        this.pan.y = (this.viewportHeight - siteL * this.scale) / 2;
    }

    /**
     * Render complete 2D Architectural CAD Floor Plan
     */
    render(plan, options = {}) {
        if (!plan || !this.ctx) return;
        const ctx = this.ctx;
        const width = this.viewportWidth;
        const height = this.viewportHeight;

        this.selectedEntityId = options.selectedEntityId ?? this.selectedEntityId;
        this.showVastuGrid = options.showVastuGrid !== undefined ? options.showVastuGrid : this.showVastuGrid;

        if (options.autoFit || options.fitToScreen) {
            this.fitToScreen(plan);
        }

        // 1. Clear background to crisp pure white (#FFFFFF)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 2. Draw Subtle Architectural Grid (if enabled)
        if (this.showGrid) {
            this.drawGrid();
        }

        // 3. Draw Room Boundaries (Pure White Fills)
        this.drawRooms(plan);

        // 4. Draw Structural Columns
        this.drawColumns(plan);

        // 5. Draw Architectural Stairs
        this.drawStairs(plan);

        // 6. Draw 2D Vector CAD Furniture Symbols (Clean Black Outlines)
        if (this.showFurniture) {
            this.drawFurniture(plan);
        }

        // 7. Draw Double-Line Structural Walls, Openings & Door Arcs
        this.drawWallsAndOpenings(plan);

        // 8. Draw Room Labels (Uppercase Title & Dimensions)
        this.drawRoomLabels(plan);

        // 9. Draw Outer & Segment Dimension Lines with Extension Lines & Ticks
        if (this.showDimensions) {
            this.drawDimensions(plan);
        }

        // 10. Draw North Compass
        this.drawCompass(plan);
    }

    drawGrid() {
        const ctx = this.ctx;
        const step = 60 * this.scale;
        if (step < 15) return;

        ctx.strokeStyle = '#F1F5F9';
        ctx.lineWidth = 1;

        const startX = this.pan.x % step;
        const startY = this.pan.y % step;

        ctx.beginPath();
        for (let x = startX; x < this.viewportWidth; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.viewportHeight);
        }
        for (let y = startY; y < this.viewportHeight; y += step) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.viewportWidth, y);
        }
        ctx.stroke();
    }

    drawRooms(plan) {
        const ctx = this.ctx;
        (plan.rooms || []).forEach(r => {
            const p = this.worldToScreen(r.x, r.y);
            const w = r.w * this.scale;
            const h = r.h * this.scale;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(p.x, p.y, w, h);

            if (this.selectedEntityId === r.id) {
                ctx.save();
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(p.x, p.y, w, h);
                ctx.fillStyle = 'rgba(37, 99, 235, 0.05)';
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

            ctx.fillStyle = '#000000';
            ctx.fillRect(p.x, p.y, w, l);
        });
    }

    drawStairs(plan) {
        const ctx = this.ctx;
        (plan.stairs || []).forEach(s => {
            const p = this.worldToScreen(s.x, s.y);
            const w = s.width * this.scale;
            const h = s.length * this.scale;
            const treads = s.treads || 12;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(p.x, p.y, w, h);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(p.x, p.y, w, h);

            const stepH = h / treads;
            ctx.lineWidth = 1;
            for (let i = 1; i < treads; i++) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y + i * stepH);
                ctx.lineTo(p.x + w, p.y + i * stepH);
                ctx.stroke();
            }

            const midX = p.x + w / 2;
            ctx.save();
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(midX, p.y + h - 10);
            ctx.lineTo(midX, p.y + 15);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(midX, p.y + 10);
            ctx.lineTo(midX - 4, p.y + 18);
            ctx.lineTo(midX + 4, p.y + 18);
            ctx.closePath();
            ctx.fill();

            ctx.font = '700 9px monospace';
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

            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#FFFFFF';
            ctx.lineWidth = 1.2;

            if (f.type === 'bed') {
                ctx.fillRect(-w / 2, -l / 2, w, l);
                ctx.strokeRect(-w / 2, -l / 2, w, l);
                ctx.fillRect(-w / 2, -l / 2, w, 5 * this.scale);

                const pilW = (w - 10 * this.scale) / 2;
                const pilH = 14 * this.scale;
                ctx.strokeRect(-w / 2 + 3 * this.scale, -l / 2 + 7 * this.scale, pilW, pilH);
                ctx.strokeRect(3 * this.scale, -l / 2 + 7 * this.scale, pilW, pilH);

                ctx.beginPath();
                ctx.moveTo(-w / 2, 0);
                ctx.lineTo(w / 2, 0);
                ctx.stroke();

                ctx.strokeRect(-w / 2 - 14 * this.scale, -l / 2, 12 * this.scale, 14 * this.scale);
                ctx.strokeRect(w / 2 + 2 * this.scale, -l / 2, 12 * this.scale, 14 * this.scale);
            } else if (f.type === 'sofa') {
                ctx.fillRect(-w / 2, -l / 2, w, l);
                ctx.strokeRect(-w / 2, -l / 2, w, l);
                ctx.strokeRect(-w / 2, -l / 2, 8 * this.scale, l);
                ctx.strokeRect(w / 2 - 8 * this.scale, -l / 2, 8 * this.scale, l);
                ctx.beginPath();
                ctx.moveTo(-w / 2 + 8 * this.scale, 0);
                ctx.lineTo(w / 2 - 8 * this.scale, 0);
                ctx.stroke();
            } else if (f.type === 'kitchen_counter') {
                ctx.fillRect(-w / 2, -l / 2, w, l);
                ctx.strokeRect(-w / 2, -l / 2, w, l);

                const sinkW = 20 * this.scale;
                const sinkH = 16 * this.scale;
                ctx.strokeRect(-w / 2 + 6 * this.scale, -l / 2 + 4 * this.scale, sinkW, sinkH);
                ctx.beginPath();
                ctx.arc(-w / 2 + 6 * this.scale + sinkW / 2, -l / 2 + 4 * this.scale + sinkH / 2, 3 * this.scale, 0, Math.PI * 2);
                ctx.stroke();

                const cx = w / 2 - 20 * this.scale;
                const cy = 0;
                ctx.strokeRect(cx - 14 * this.scale, cy - 10 * this.scale, 28 * this.scale, 20 * this.scale);
                ctx.beginPath();
                ctx.arc(cx - 7 * this.scale, cy - 5 * this.scale, 3.5 * this.scale, 0, Math.PI * 2);
                ctx.arc(cx + 7 * this.scale, cy - 5 * this.scale, 3.5 * this.scale, 0, Math.PI * 2);
                ctx.arc(cx - 7 * this.scale, cy + 5 * this.scale, 3.5 * this.scale, 0, Math.PI * 2);
                ctx.arc(cx + 7 * this.scale, cy + 5 * this.scale, 3.5 * this.scale, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillRect(-w / 2, -l / 2, w, l);
                ctx.strokeRect(-w / 2, -l / 2, w, l);
            }

            ctx.restore();
        });
    }

    drawWallsAndOpenings(plan) {
        const ctx = this.ctx;
        const walls = plan.walls || [];

        walls.forEach(w => {
            const p1 = this.worldToScreen(w.start.x, w.start.y);
            const p2 = this.worldToScreen(w.end.x, w.end.y);
            const thick = (w.thickness || 9) * this.scale;

            ctx.save();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = thick;
            ctx.lineCap = 'square';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            if (w.type === 'interior' && thick >= 4) {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = Math.max(1, thick - 3);
                ctx.stroke();
            }
            ctx.restore();
        });

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

            ctx.save();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = thick + 2;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(sp2.x, sp2.y);
            ctx.stroke();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sp1.x, sp1.y);
            ctx.lineTo(sp2.x, sp2.y);
            ctx.stroke();
            ctx.restore();
        });

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

            ctx.save();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = thick + 2;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            ctx.moveTo(hp.x, hp.y);
            ctx.lineTo(ep.x, ep.y);
            ctx.stroke();

            const angle = Math.atan2(dy, dx);
            const leafAngle = angle + (d.swing === 'left' ? -Math.PI / 2 : Math.PI / 2);
            const leafX = hp.x + Math.cos(leafAngle) * screenDoorW;
            const leafY = hp.y + Math.sin(leafAngle) * screenDoorW;

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hp.x, hp.y);
            ctx.lineTo(leafX, leafY);
            ctx.stroke();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
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
        const isMetric = plan.project?.unitSystem === 'metric';

        (plan.rooms || []).forEach(r => {
            const p = this.worldToScreen(r.x, r.y);
            const w = r.w * this.scale;
            const h = r.h * this.scale;

            const midX = p.x + w / 2;
            const midY = p.y + h / 2;

            ctx.save();
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = '700 13px Inter, sans-serif';
            ctx.fillText(r.name.toUpperCase(), midX, midY - 8);

            ctx.font = '500 11px Inter, sans-serif';
            let dimText = r.dimensionLabel;
            if (isMetric) {
                const mmW = Math.round(r.w * 25.4);
                const mmH = Math.round(r.h * 25.4);
                dimText = `${mmW} x ${mmH}`;
            } else if (!dimText) {
                dimText = `${formatFeetInches(r.w, false)} × ${formatFeetInches(r.h, false)}`;
            }

            ctx.fillText(dimText, midX, midY + 8);
            ctx.restore();
        });
    }

    drawDimensions(plan) {
        const ctx = this.ctx;
        const siteW = plan.site?.width || 360;
        const siteL = plan.site?.length || 480;
        const isMetric = plan.project?.unitSystem === 'metric';

        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#000000';
        ctx.lineWidth = 1;

        // TOP OUTER DIMENSION LINE
        const pTopLeft = this.worldToScreen(0, 0);
        const pTopRight = this.worldToScreen(siteW, 0);
        const dimYTop = pTopLeft.y - 45;

        ctx.beginPath();
        ctx.moveTo(pTopLeft.x, pTopLeft.y - 5);
        ctx.lineTo(pTopLeft.x, dimYTop - 10);
        ctx.moveTo(pTopRight.x, pTopRight.y - 5);
        ctx.lineTo(pTopRight.x, dimYTop - 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pTopLeft.x, dimYTop);
        ctx.lineTo(pTopRight.x, dimYTop);
        ctx.stroke();

        this.drawTick(ctx, pTopLeft.x, dimYTop);
        this.drawTick(ctx, pTopRight.x, dimYTop);

        const topVal = isMetric ? Math.round(siteW * 25.4) : formatFeetInches(siteW, false);
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${topVal}`, (pTopLeft.x + pTopRight.x) / 2, dimYTop - 6);

        // RIGHT OUTER DIMENSION LINE
        const pRightBottom = this.worldToScreen(siteW, siteL);
        const dimXRight = pTopRight.x + 45;

        ctx.beginPath();
        ctx.moveTo(pTopRight.x + 5, pTopRight.y);
        ctx.lineTo(dimXRight + 10, pTopRight.y);
        ctx.moveTo(pRightBottom.x + 5, pRightBottom.y);
        ctx.lineTo(dimXRight + 10, pRightBottom.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(dimXRight, pTopRight.y);
        ctx.lineTo(dimXRight, pRightBottom.y);
        ctx.stroke();

        this.drawTick(ctx, dimXRight, pTopRight.y);
        this.drawTick(ctx, dimXRight, pRightBottom.y);

        const rightVal = isMetric ? Math.round(siteL * 25.4) : formatFeetInches(siteL, false);
        ctx.save();
        ctx.translate(dimXRight + 16, (pTopRight.y + pRightBottom.y) / 2);
        ctx.rotate(Math.PI / 2);
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${rightVal}`, 0, 0);
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
        const cx = this.viewportWidth - 40;
        const cy = 40;

        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#000000';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy - 14);
        ctx.lineTo(cx - 4, cy + 4);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();

        ctx.font = '700 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('N', cx, cy - 18);
        ctx.restore();
    }

    renderMinimap(minimapCanvas, plan) {
        if (!minimapCanvas || !plan || !plan.site) return;
        const mCtx = minimapCanvas.getContext('2d');
        if (!mCtx) return;

        const mW = minimapCanvas.width || 160;
        const mH = minimapCanvas.height || 120;

        mCtx.fillStyle = '#FFFFFF';
        mCtx.fillRect(0, 0, mW, mH);

        const siteW = plan.site.width || 360;
        const siteL = plan.site.length || 480;

        const mScale = Math.min((mW - 20) / siteW, (mH - 20) / siteL);
        const mOffX = (mW - siteW * mScale) / 2;
        const mOffY = (mH - siteL * mScale) / 2;

        mCtx.strokeStyle = '#000000';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(mOffX, mOffY, siteW * mScale, siteL * mScale);

        (plan.rooms || []).forEach(r => {
            const rx = mOffX + r.x * mScale;
            const ry = mOffY + r.y * mScale;
            const rw = r.w * mScale;
            const rh = r.h * mScale;

            mCtx.strokeStyle = '#000000';
            mCtx.strokeRect(rx, ry, rw, rh);
        });
    }

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

        svg += `    <rect x="0" y="0" width="${siteW}" height="${siteL}" fill="none" stroke="#000000" stroke-width="2" />\n`;

        (plan.rooms || []).forEach(r => {
            svg += `    <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#FFFFFF" stroke="#000000" stroke-width="1" />\n`;
            svg += `    <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 - 8}" font-family="sans-serif" font-size="12" font-weight="700" fill="#000000" text-anchor="middle">${r.name.toUpperCase()}</text>\n`;
            svg += `    <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 8}" font-family="sans-serif" font-size="10" font-weight="500" fill="#000000" text-anchor="middle">${r.dimensionLabel || `${formatFeetInches(r.w, false)} × ${formatFeetInches(r.h, false)}`}</text>\n`;
        });

        (plan.walls || []).forEach(w => {
            svg += `    <line x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}" stroke="#000000" stroke-width="${w.thickness || 9}" stroke-linecap="square" />\n`;
        });

        svg += `    <line x1="0" y1="-18" x2="${siteW}" y2="-18" stroke="#000000" stroke-width="1" />\n`;
        svg += `    <text x="${siteW / 2}" y="-24" font-family="sans-serif" font-size="11" font-weight="700" fill="#000000" text-anchor="middle">${formatFeetInches(siteW, false)}</text>\n`;

        svg += `    <line x1="${siteW + 18}" y1="0" x2="${siteW + 18}" y2="${siteL}" stroke="#000000" stroke-width="1" />\n`;
        svg += `    <text x="${siteW + 28}" y="${siteL / 2}" font-family="sans-serif" font-size="11" font-weight="700" fill="#000000" text-anchor="middle" transform="rotate(90, ${siteW + 28}, ${siteL / 2})">${formatFeetInches(siteL, false)}</text>\n`;

        svg += `  </g>\n</svg>`;
        return svg;
    }

    resize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }
}

export default CADRenderer2D;
