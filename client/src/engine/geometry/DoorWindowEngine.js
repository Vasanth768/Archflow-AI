const EPSILON = 0.001;

const rectanglesIntersect = (r1, r2) => {
    return !(r1.x + r1.w - EPSILON <= r2.x ||
             r2.x + r2.w - EPSILON <= r1.x ||
             r1.y + r1.h - EPSILON <= r2.y ||
             r2.y + r2.h - EPSILON <= r1.y);
};

export const generateDoorsAndWindows = (rooms, plot) => {
    // Basic circulation rooms where doors typically open into
    const circulation = rooms.filter(r => r.name.toLowerCase().includes('living') || r.name.toLowerCase().includes('hall') || r.name.toLowerCase().includes('corridor'));
    const defaultCirculation = circulation.length > 0 ? circulation : rooms; // Fallback to all if no living

    return rooms.map(room => {
        const result = { ...room };
        if (!result.doors) result.doors = [];
        if (!result.windows) result.windows = [];
        
        // Skip auto-generation if the room already has them explicitly defined
        if (room.doors && room.doors.length > 0 && room.windows && room.windows.length > 0) {
            return result;
        }

        const lowerName = room.name.toLowerCase();
        
        // Don't add doors to living hall itself usually, unless it's the main entrance
        // For simplicity, let's add one door per private room opening to the circulation
        if (!lowerName.includes('living') && !lowerName.includes('hall') && !lowerName.includes('parking') && !lowerName.includes('sitout')) {
            // Find a shared boundary with circulation
            for (let circ of defaultCirculation) {
                if (circ.id === room.id) continue;
                if (rectanglesIntersect(room, circ)) {
                    // Find the shared edge
                    const doorSize = 3; // 3 feet wide
                    
                    if (Math.abs(room.y + room.h - circ.y) < EPSILON) {
                        // Room is above circ
                        result.doors.push({ x: 1, y: room.h, orientation: 'bottom', swing: 'left' });
                        break;
                    } else if (Math.abs(room.y - (circ.y + circ.h)) < EPSILON) {
                        // Room is below circ
                        result.doors.push({ x: 1, y: 0, orientation: 'top', swing: 'right' });
                        break;
                    } else if (Math.abs(room.x + room.w - circ.x) < EPSILON) {
                        // Room is left of circ
                        result.doors.push({ x: room.w, y: 1, orientation: 'right', swing: 'top' });
                        break;
                    } else if (Math.abs(room.x - (circ.x + circ.w)) < EPSILON) {
                        // Room is right of circ
                        result.doors.push({ x: 0, y: 1, orientation: 'left', swing: 'bottom' });
                        break;
                    }
                }
            }
        }

        // Add main entrance door to Living Hall if there is a parking or sitout
        if (lowerName.includes('living') || lowerName.includes('hall')) {
            const externalZones = rooms.filter(r => r.name.toLowerCase().includes('parking') || r.name.toLowerCase().includes('sitout'));
            for (let ext of externalZones) {
                if (rectanglesIntersect(room, ext)) {
                    if (Math.abs(room.y + room.h - ext.y) < EPSILON) {
                        result.doors.push({ x: room.w/2 - 1.5, y: room.h, orientation: 'bottom', swing: 'left', isMain: true });
                        break;
                    } else if (Math.abs(room.x - (ext.x + ext.w)) < EPSILON) {
                        result.doors.push({ x: 0, y: room.h/2 - 1.5, orientation: 'left', swing: 'bottom', isMain: true });
                        break;
                    } else if (Math.abs(room.y - (ext.y + ext.h)) < EPSILON) {
                        result.doors.push({ x: room.w/2 - 1.5, y: 0, orientation: 'top', swing: 'right', isMain: true });
                        break;
                    } else if (Math.abs(room.x + room.w - ext.x) < EPSILON) {
                        result.doors.push({ x: room.w, y: room.h/2 - 1.5, orientation: 'right', swing: 'top', isMain: true });
                        break;
                    }
                }
            }
        }

        // Add Windows to exterior walls
        if (lowerName.includes('bed') || lowerName.includes('kitchen') || lowerName.includes('living') || lowerName.includes('dining')) {
            // Check exterior boundaries
            const windowSize = 4;
            if (Math.abs(room.y) < EPSILON) { // Top external
                result.windows.push({ x: room.w / 2 - windowSize / 2, y: 0, w: windowSize, orientation: 'horizontal' });
            }
            if (Math.abs(room.x) < EPSILON) { // Left external
                result.windows.push({ x: 0, y: room.h / 2 - windowSize / 2, w: windowSize, orientation: 'vertical' });
            }
            if (Math.abs(room.y + room.h - plot.length) < EPSILON) { // Bottom external
                result.windows.push({ x: room.w / 2 - windowSize / 2, y: room.h, w: windowSize, orientation: 'horizontal' });
            }
            if (Math.abs(room.x + room.w - plot.width) < EPSILON) { // Right external
                result.windows.push({ x: room.w, y: room.h / 2 - windowSize / 2, w: windowSize, orientation: 'vertical' });
            }
        }

        return result;
    });
};
