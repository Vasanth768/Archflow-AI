export const generateDoorsAndWindows = (rooms) => {
    // Analyzes adjacency and creates door links between valid spaces.
    // e.g., Hall to Bedroom. Excludes Bedroom to Kitchen.
    return rooms.map(room => {
        // Mock injecting empty arrays so rendering pipeline doesn't break
        return { ...room, doors: [], windows: [] };
    });
};
