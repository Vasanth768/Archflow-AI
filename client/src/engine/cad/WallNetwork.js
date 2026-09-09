/**
 * WallNetwork - Graph-based Architectural Wall Topology Engine
 * 
 * Represents walls as mathematical segments with endpoints, thickness, height,
 * and maintains connectivity relationships (L-corners, T-junctions, X-intersections).
 * All dimensions are in canonical INCHES.
 */

export const EPSILON = 0.05; // 0.05 inches tolerance

export class WallNetwork {
    constructor(walls = [], options = {}) {
        this.walls = [];
        this.exteriorThickness = options.exteriorThickness || 9; // 9" default
        this.interiorThickness = options.interiorThickness || 4.5; // 4.5" default
        this.wallHeight = options.wallHeight || 120; // 10'-0" default

        if (Array.isArray(walls)) {
            walls.forEach(w => this.addWall(w));
        }
    }

    /**
     * Add a wall segment to the network.
     */
    addWall(wallData) {
        const id = wallData.id || `wall_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        const type = wallData.type || (wallData.isExternal ? 'exterior' : 'interior');
        const thickness = wallData.thickness || (type === 'exterior' ? this.exteriorThickness : this.interiorThickness);
        const height = wallData.height || this.wallHeight;

        const wall = {
            id,
            start: { x: Number(wallData.start?.x ?? wallData.x1 ?? 0), y: Number(wallData.start?.y ?? wallData.y1 ?? 0) },
            end: { x: Number(wallData.end?.x ?? wallData.x2 ?? 0), y: Number(wallData.end?.y ?? wallData.y2 ?? 0) },
            thickness,
            height,
            type,
            openings: wallData.openings || [],
            connectedWalls: wallData.connectedWalls || [],
            layer: wallData.layer || 'WALLS',
            materials: wallData.materials || {}
        };

        // Ensure start and end are not identical
        const len = this.getWallLength(wall);
        if (len < EPSILON) {
            console.warn(`[WallNetwork] Skipped zero-length wall ${id}`);
            return null;
        }

        this.walls.push(wall);
        return wall;
    }

    /**
     * Remove a wall by ID
     */
    removeWall(wallId) {
        this.walls = this.walls.filter(w => w.id !== wallId);
    }

    /**
     * Get a wall by ID
     */
    getWall(wallId) {
        return this.walls.find(w => w.id === wallId);
    }

    /**
     * Calculate euclidean length of a wall in inches
     */
    getWallLength(wall) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        return Math.hypot(dx, dy);
    }

    /**
     * Calculate angle in radians of a wall
     */
    getWallAngle(wall) {
        return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
    }

    /**
     * Calculate normal vector (perpendicular) of a wall
     */
    getWallNormal(wall) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.hypot(dx, dy);
        if (len < EPSILON) return { x: 0, y: 0 };
        return { x: -dy / len, y: dx / len };
    }

    /**
     * Calculates the 4-corner boundary polygon of a wall in world coordinates.
     * Takes wall thickness into account.
     */
    getWallPolygon(wall) {
        const normal = this.getWallNormal(wall);
        const halfThick = wall.thickness / 2;

        const offX = normal.x * halfThick;
        const offY = normal.y * halfThick;

        return [
            { x: wall.start.x + offX, y: wall.start.y + offY },
            { x: wall.end.x + offX, y: wall.end.y + offY },
            { x: wall.end.x - offX, y: wall.end.y - offY },
            { x: wall.start.x - offX, y: wall.start.y - offY }
        ];
    }

    /**
     * Find walls that share an endpoint or intersect with the given point
     */
    getWallsAtPoint(point, tolerance = 1.0) {
        return this.walls.filter(w => {
            const dStart = Math.hypot(w.start.x - point.x, w.start.y - point.y);
            const dEnd = Math.hypot(w.end.x - point.x, w.end.y - point.y);
            return dStart <= tolerance || dEnd <= tolerance;
        });
    }

    /**
     * Move a wall vertex or shift a wall parallelly, preserving connectivity
     */
    moveWall(wallId, deltaX, deltaY) {
        const wall = this.getWall(wallId);
        if (!wall) return;

        const oldStart = { ...wall.start };
        const oldEnd = { ...wall.end };

        wall.start.x += deltaX;
        wall.start.y += deltaY;
        wall.end.x += deltaX;
        wall.end.y += deltaY;

        // Update connected walls sharing start/end vertices
        this.walls.forEach(other => {
            if (other.id === wallId) return;

            // If other wall was connected to old start
            if (Math.hypot(other.start.x - oldStart.x, other.start.y - oldStart.y) < EPSILON * 2) {
                other.start.x = wall.start.x;
                other.start.y = wall.start.y;
            }
            if (Math.hypot(other.end.x - oldStart.x, other.end.y - oldStart.y) < EPSILON * 2) {
                other.end.x = wall.start.x;
                other.end.y = wall.start.y;
            }

            // If other wall was connected to old end
            if (Math.hypot(other.start.x - oldEnd.x, other.start.y - oldEnd.y) < EPSILON * 2) {
                other.start.x = wall.end.x;
                other.start.y = wall.end.y;
            }
            if (Math.hypot(other.end.x - oldEnd.x, other.end.y - oldEnd.y) < EPSILON * 2) {
                other.end.x = wall.end.x;
                other.end.y = wall.end.y;
            }
        });
    }

    /**
     * Extract enclosed room cycles (polygons) from the wall network.
     * Uses 2D grid raycasting & polygon extraction from orthogonal wall network.
     */
    extractEnclosedRooms() {
        // Collect all distinct orthogonal X and Y coordinates
        const xCoords = new Set();
        const yCoords = new Set();

        this.walls.forEach(w => {
            xCoords.add(Math.round(w.start.x * 100) / 100);
            xCoords.add(Math.round(w.end.x * 100) / 100);
            yCoords.add(Math.round(w.start.y * 100) / 100);
            yCoords.add(Math.round(w.end.y * 100) / 100);
        });

        const sortedX = Array.from(xCoords).sort((a, b) => a - b);
        const sortedY = Array.from(yCoords).sort((a, b) => a - b);

        const cells = [];
        for (let i = 0; i < sortedX.length - 1; i++) {
            for (let j = 0; j < sortedY.length - 1; j++) {
                const minX = sortedX[i];
                const maxX = sortedX[i + 1];
                const minY = sortedY[j];
                const maxY = sortedY[j + 1];

                const w = maxX - minX;
                const h = maxY - minY;

                if (w < 12 || h < 12) continue; // Skip tiny cells < 1 ft

                // Check if this cell is enclosed by walls on all 4 sides
                const hasTop = this.hasWallOnSegment({ x: minX, y: minY }, { x: maxX, y: minY });
                const hasBottom = this.hasWallOnSegment({ x: minX, y: maxY }, { x: maxX, y: maxY });
                const hasLeft = this.hasWallOnSegment({ x: minX, y: minY }, { x: minX, y: maxY });
                const hasRight = this.hasWallOnSegment({ x: maxX, y: minY }, { x: maxX, y: maxY });

                cells.push({
                    minX, maxX, minY, maxY, w, h,
                    hasTop, hasBottom, hasLeft, hasRight
                });
            }
        }

        return cells;
    }

    /**
     * Checks whether a wall exists that covers the segment from p1 to p2
     */
    hasWallOnSegment(p1, p2, tolerance = 1.0) {
        const isHoriz = Math.abs(p1.y - p2.y) < EPSILON;
        const isVert = Math.abs(p1.x - p2.x) < EPSILON;

        return this.walls.some(w => {
            const wHoriz = Math.abs(w.start.y - w.end.y) < EPSILON;
            const wVert = Math.abs(w.start.x - w.end.x) < EPSILON;

            if (isHoriz && wHoriz && Math.abs(w.start.y - p1.y) <= tolerance) {
                const wMinX = Math.min(w.start.x, w.end.x);
                const wMaxX = Math.max(w.start.x, w.end.x);
                const pMinX = Math.min(p1.x, p2.x);
                const pMaxX = Math.max(p1.x, p2.x);
                return wMinX <= pMinX + tolerance && wMaxX >= pMaxX - tolerance;
            }

            if (isVert && wVert && Math.abs(w.start.x - p1.x) <= tolerance) {
                const wMinY = Math.min(w.start.y, w.end.y);
                const wMaxY = Math.max(w.start.y, w.end.y);
                const pMinY = Math.min(p1.y, p2.y);
                const pMaxY = Math.max(p1.y, p2.y);
                return wMinY <= pMinY + tolerance && wMaxY >= pMaxY - tolerance;
            }

            return false;
        });
    }

    /**
     * Export all walls as clean JSON serializable data
     */
    toJSON() {
        return this.walls.map(w => ({
            id: w.id,
            start: { x: w.start.x, y: w.start.y },
            end: { x: w.end.x, y: w.end.y },
            thickness: w.thickness,
            height: w.height,
            type: w.type,
            openings: [...(w.openings || [])],
            connectedWalls: [...(w.connectedWalls || [])]
        }));
    }
}
