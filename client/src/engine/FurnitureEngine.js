export const applyFurnitureTemplates = (rooms) => {
    // Spawns default furniture scaled to room size
    return rooms.map(room => {
        return { ...room, furniture: [] }; // Mock for now so the 2D Editor won't break
    });
};
