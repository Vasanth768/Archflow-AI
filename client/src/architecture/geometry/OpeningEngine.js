/**
 * OpeningEngine.js - Wall-Hosted Doors and Windows Engine
 */

export class OpeningEngine {
    static getOpeningAbsolutePosition(wall, opening) {
        if (!wall || !opening) return null;

        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = Math.hypot(dx, dy);
        if (len < 0.001) return null;

        const ux = dx / len;
        const uy = dy / len;
        const pos = opening.positionAlongWall ?? opening.offset ?? 0;
        const w = opening.width || 36;

        return {
            start: { x: wall.start.x + ux * pos, y: wall.start.y + uy * pos },
            center: { x: wall.start.x + ux * (pos + w / 2), y: wall.start.y + uy * (pos + w / 2) },
            end: { x: wall.start.x + ux * (pos + w), y: wall.start.y + uy * (pos + w) },
            angle: Math.atan2(dy, dx),
            normal: { x: -uy, y: ux }
        };
    }

    static validateOpening(wall, opening) {
        if (!wall) return { isValid: false, error: 'Host wall not found' };
        const wallLen = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
        const pos = opening.positionAlongWall ?? opening.offset ?? 0;
        const w = opening.width || 36;

        if (pos < 0 || pos + w > wallLen + 0.1) {
            return { isValid: false, error: `Opening exceeds wall length (${pos + w} > ${wallLen})` };
        }
        return { isValid: true };
    }
}
