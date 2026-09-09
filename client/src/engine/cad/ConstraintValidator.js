/**
 * Constraint & Geometry Validation Engine
 * 
 * Deterministically checks all geometric rules, architectural constraints,
 * opening attachments, and plot containment.
 * All units are in canonical INCHES.
 */

import { sqInchesToSqFt } from './UnitEngine.js';

export const ValidationStatus = {
    VALID: 'VALID',
    WARNING: 'WARNING',
    INVALID: 'INVALID'
};

export class ConstraintValidator {
    constructor(options = {}) {
        this.minRoomWidth = options.minRoomWidth || 72; // 6'-0" (72 inches)
        this.minRoomArea = options.minRoomArea || 36;   // 36 sq ft
        this.minDoorWidth = options.minDoorWidth || 30; // 2'-6"
        this.minWindowWidth = options.minWindowWidth || 24; // 2'-0"
        this.tolerance = options.tolerance || 0.1;
    }

    /**
     * Comprehensive validation of an entire ArchitecturalPlan
     */
    validatePlan(plan) {
        const issues = [];

        if (!plan) {
            return {
                status: ValidationStatus.INVALID,
                isValid: false,
                errors: ['Plan object is null or undefined.'],
                warnings: [],
                stats: {}
            };
        }

        // 1. Validate Site Dimensions
        const site = plan.site || {};
        if (!site.width || site.width <= 0 || !site.length || site.length <= 0) {
            issues.push({ level: 'ERROR', code: 'INVALID_SITE_BOUNDS', message: 'Site width and length must be positive dimensions.' });
        }

        // 2. Validate Walls
        const walls = plan.walls || [];
        if (walls.length === 0) {
            issues.push({ level: 'ERROR', code: 'NO_WALLS', message: 'The plan contains no walls.' });
        }

        const wallMap = new Map();
        walls.forEach(w => {
            wallMap.set(w.id, w);

            const dx = w.end.x - w.start.x;
            const dy = w.end.y - w.start.y;
            const len = Math.hypot(dx, dy);

            if (len < 6) { // < 6 inches is invalid
                issues.push({
                    level: 'ERROR',
                    code: 'WALL_TOO_SHORT',
                    entityId: w.id,
                    message: `Wall ${w.id} has invalid length (${Math.round(len)}" < 6").`
                });
            }

            // Check if outside site boundary
            const minX = Math.min(w.start.x, w.end.x);
            const maxX = Math.max(w.start.x, w.end.x);
            const minY = Math.min(w.start.y, w.end.y);
            const maxY = Math.max(w.start.y, w.end.y);

            if (minX < -this.tolerance || minY < -this.tolerance ||
                maxX > (site.width || 10000) + this.tolerance ||
                maxY > (site.length || 10000) + this.tolerance) {
                issues.push({
                    level: 'WARNING',
                    code: 'WALL_OUTSIDE_SITE',
                    entityId: w.id,
                    message: `Wall ${w.id} extends outside the designated plot boundary.`
                });
            }
        });

        // 3. Validate Doors Attachment
        const doors = plan.doors || [];
        doors.forEach(d => {
            const hostWall = wallMap.get(d.wallId);
            if (!hostWall) {
                issues.push({
                    level: 'ERROR',
                    code: 'DOOR_ORPHANED',
                    entityId: d.id,
                    message: `Door ${d.id} references non-existent wall "${d.wallId}".`
                });
            } else {
                const wallLen = Math.hypot(hostWall.end.x - hostWall.start.x, hostWall.end.y - hostWall.start.y);
                const doorWidth = d.width || 36;
                const pos = d.positionAlongWall ?? d.offset ?? 0;

                if (pos < 0 || pos + doorWidth > wallLen + this.tolerance) {
                    issues.push({
                        level: 'ERROR',
                        code: 'DOOR_EXCEEDS_WALL',
                        entityId: d.id,
                        message: `Door ${d.id} (${doorWidth}") exceeds host wall length (${Math.round(wallLen)}").`
                    });
                }
            }
        });

        // 4. Validate Windows Attachment
        const windows = plan.windows || [];
        windows.forEach(w => {
            const hostWall = wallMap.get(w.wallId);
            if (!hostWall) {
                issues.push({
                    level: 'ERROR',
                    code: 'WINDOW_ORPHANED',
                    entityId: w.id,
                    message: `Window ${w.id} references non-existent wall "${w.wallId}".`
                });
            } else {
                const wallLen = Math.hypot(hostWall.end.x - hostWall.start.x, hostWall.end.y - hostWall.start.y);
                const winWidth = w.width || 48;
                const pos = w.positionAlongWall ?? w.offset ?? 0;

                if (pos < 0 || pos + winWidth > wallLen + this.tolerance) {
                    issues.push({
                        level: 'ERROR',
                        code: 'WINDOW_EXCEEDS_WALL',
                        entityId: w.id,
                        message: `Window ${w.id} (${winWidth}") exceeds host wall length (${Math.round(wallLen)}").`
                    });
                }
            }
        });

        // 5. Validate Rooms
        const rooms = plan.rooms || [];
        let totalPlottedAreaSqInches = 0;

        rooms.forEach((r, idx) => {
            const clearW = r.clearDimensions?.width ?? r.w ?? 0;
            const clearL = r.clearDimensions?.length ?? r.h ?? 0;
            const areaSqInches = clearW * clearL;
            const areaSqFt = sqInchesToSqFt(areaSqInches);
            totalPlottedAreaSqInches += areaSqInches;

            if (clearW < this.minRoomWidth && clearL < this.minRoomWidth && !['toilet', 'bathroom', 'store', 'pooja'].includes(r.type)) {
                issues.push({
                    level: 'WARNING',
                    code: 'ROOM_TOO_NARROW',
                    entityId: r.id,
                    message: `Room "${r.name}" dimension (${Math.round(clearW/12)}' x ${Math.round(clearL/12)}') is narrower than standard minimum (6'-0").`
                });
            }

            // Check overlap with other rooms
            for (let j = idx + 1; j < rooms.length; j++) {
                const r2 = rooms[j];
                if (this.roomsOverlap(r, r2)) {
                    issues.push({
                        level: 'WARNING',
                        code: 'ROOM_OVERLAP',
                        entityId: r.id,
                        message: `Room "${r.name}" overlaps with "${r2.name}".`
                    });
                }
            }
        });

        const errors = issues.filter(i => i.level === 'ERROR').map(i => i.message);
        const warnings = issues.filter(i => i.level === 'WARNING').map(i => i.message);

        let status = ValidationStatus.VALID;
        if (errors.length > 0) {
            status = ValidationStatus.INVALID;
        } else if (warnings.length > 0) {
            status = ValidationStatus.WARNING;
        }

        return {
            status,
            isValid: errors.length === 0,
            errors,
            warnings,
            stats: {
                totalRooms: rooms.length,
                totalWalls: walls.length,
                totalDoors: doors.length,
                totalWindows: windows.length,
                totalBuiltUpAreaSqFt: sqInchesToSqFt(totalPlottedAreaSqInches),
                siteAreaSqFt: sqInchesToSqFt((site.width || 0) * (site.length || 0))
            }
        };
    }

    /**
     * Check if two rectangular rooms strictly overlap
     */
    roomsOverlap(r1, r2) {
        const x1 = r1.x ?? 0;
        const y1 = r1.y ?? 0;
        const w1 = r1.w ?? (r1.clearDimensions?.width ?? 0);
        const h1 = r1.h ?? (r1.clearDimensions?.length ?? 0);

        const x2 = r2.x ?? 0;
        const y2 = r2.y ?? 0;
        const w2 = r2.w ?? (r2.clearDimensions?.width ?? 0);
        const h2 = r2.h ?? (r2.clearDimensions?.length ?? 0);

        return !(x1 + w1 - this.tolerance <= x2 ||
                 x2 + w2 - this.tolerance <= x1 ||
                 y1 + h1 - this.tolerance <= y2 ||
                 y2 + h2 - this.tolerance <= y1);
    }
}
