export const EPSILON = 0.001;

const segmentsOverlap = (s1, s2) => {
    // Check if two horizontal segments overlap
    if (Math.abs(s1.y1 - s2.y1) < EPSILON && Math.abs(s1.y2 - s2.y2) < EPSILON) {
        return (s1.x1 <= s2.x2 + EPSILON) && (s1.x2 + EPSILON >= s2.x1);
    }
    // Check if two vertical segments overlap
    if (Math.abs(s1.x1 - s2.x1) < EPSILON && Math.abs(s1.x2 - s2.x2) < EPSILON) {
        return (s1.y1 <= s2.y2 + EPSILON) && (s1.y2 + EPSILON >= s2.y1);
    }
    return false;
};

const mergeSegments = (s1, s2) => {
    if (Math.abs(s1.y1 - s2.y1) < EPSILON) {
        return {
            ...s1,
            x1: Math.min(s1.x1, s2.x1),
            x2: Math.max(s1.x2, s2.x2)
        };
    } else {
        return {
            ...s1,
            y1: Math.min(s1.y1, s2.y1),
            y2: Math.max(s1.y2, s2.y2)
        };
    }
};

export const generateWalls = (rooms, plot) => {
    const walls = [];
    let wallIdCounter = 1;
    
    // External Wall Boundary
    walls.push({ id: `wall_ext_top`, x1: 0, y1: 0, x2: plot.width, y2: 0, isExternal: true });
    walls.push({ id: `wall_ext_bot`, x1: 0, y1: plot.length, x2: plot.width, y2: plot.length, isExternal: true });
    walls.push({ id: `wall_ext_left`, x1: 0, y1: 0, x2: 0, y2: plot.length, isExternal: true });
    walls.push({ id: `wall_ext_right`, x1: plot.width, y1: 0, x2: plot.width, y2: plot.length, isExternal: true });

    // Generate room partition walls
    rooms.forEach(room => {
        // Define the 4 wall segments for this room
        const roomWalls = [
            { x1: room.x, y1: room.y, x2: room.x + room.w, y2: room.y, isExternal: false }, // Top
            { x1: room.x, y1: room.y + room.h, x2: room.x + room.w, y2: room.y + room.h, isExternal: false }, // Bottom
            { x1: room.x, y1: room.y, x2: room.x, y2: room.y + room.h, isExternal: false }, // Left
            { x1: room.x + room.w, y1: room.y, x2: room.x + room.w, y2: room.y + room.h, isExternal: false } // Right
        ];
        
        roomWalls.forEach(rw => {
            let merged = false;
            for (let i = 0; i < walls.length; i++) {
                const ew = walls[i];
                if (ew.isExternal) continue; // Don't merge external walls with internal
                
                if (segmentsOverlap(rw, ew)) {
                    walls[i] = mergeSegments(rw, ew);
                    merged = true;
                    break;
                }
            }
            if (!merged) {
                rw.id = `wall_int_${wallIdCounter++}`;
                walls.push(rw);
            }
        });
    });

    return walls;
};
