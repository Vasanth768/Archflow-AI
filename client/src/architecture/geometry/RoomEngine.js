/**
 * RoomEngine.js - Room Geometry, Area Calculation and Boundary Solver
 */

import { sqInchesToSqFt, formatFeetInches } from '../../engine/cad/UnitEngine.js';

export class RoomEngine {
    static calculateRoomAreaSqFt(room) {
        const w = room.clearDimensions?.width ?? room.w ?? 0;
        const l = room.clearDimensions?.length ?? room.h ?? 0;
        return sqInchesToSqFt(w * l);
    }

    static formatRoomDimensionLabel(room) {
        const w = room.clearDimensions?.width ?? room.w ?? 0;
        const l = room.clearDimensions?.length ?? room.h ?? 0;
        return `${formatFeetInches(w, false)} × ${formatFeetInches(l, false)}`;
    }

    static checkRoomOverlap(r1, r2, tolerance = 0.1) {
        const x1 = r1.x ?? 0;
        const y1 = r1.y ?? 0;
        const w1 = r1.w ?? (r1.clearDimensions?.width ?? 0);
        const h1 = r1.h ?? (r1.clearDimensions?.length ?? 0);

        const x2 = r2.x ?? 0;
        const y2 = r2.y ?? 0;
        const w2 = r2.w ?? (r2.clearDimensions?.width ?? 0);
        const h2 = r2.h ?? (r2.clearDimensions?.length ?? 0);

        return !(x1 + w1 - tolerance <= x2 ||
                 x2 + w2 - tolerance <= x1 ||
                 y1 + h1 - tolerance <= y2 ||
                 y2 + h2 - tolerance <= y1);
    }
}
