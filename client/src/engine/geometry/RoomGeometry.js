import { EPSILON } from './WallEngine.js';

export const validateRoomGeometry = (room, plot, otherRooms) => {
    const errors = [];
    
    // Bounds check
    if (room.x < -EPSILON) errors.push("Exceeds left plot boundary");
    if (room.y < -EPSILON) errors.push("Exceeds top plot boundary");
    if (room.x + room.w > plot.width + EPSILON) errors.push("Exceeds right plot boundary");
    if (room.y + room.h > plot.length + EPSILON) errors.push("Exceeds bottom plot boundary");

    // Collision check
    const NESTABLE_TYPES = ['living', 'parking', 'entrance', 'sitout', 'lawn'];
    
    otherRooms.forEach(other => {
        if (room.id === other.id) return;

        // strict overlap condition
        const overlaps = (
            room.x + EPSILON < other.x + other.w &&
            room.x + room.w - EPSILON > other.x &&
            room.y + EPSILON < other.y + other.h &&
            room.y + room.h - EPSILON > other.y
        );

        if (overlaps) {
            // check nesting allowance
            const isNestable = NESTABLE_TYPES.includes(other.type) || NESTABLE_TYPES.includes(room.type);
            if (!isNestable) {
                errors.push(`Overlaps with ${other.name || 'another room'}`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

export const getClearDimensions = (room) => {
    const thickness = room.wallThickness || 0.75;
    return {
        clearW: room.w - (thickness * 2),
        clearH: room.h - (thickness * 2)
    };
};

export const getRoomArea = (room) => {
    const { clearW, clearH } = getClearDimensions(room);
    return Math.max(0, clearW * clearH);
};
