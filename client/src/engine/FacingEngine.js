export const applyFacingRules = (rooms, facing, env) => {
    // Vastu/Architecture Facing Engine
    if (facing === "West" || facing === "South") {
        // Mirror X
        rooms.forEach(r => {
            r.x = env.w - r.x - r.w;
        });
    }
    if (facing === "North") {
        // Mirror Y
        rooms.forEach(r => {
            r.y = env.h - r.y - r.h;
        });
    }
    return rooms;
};
