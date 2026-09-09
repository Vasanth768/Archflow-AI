export const enforceRoomPriority = (template, area) => {
    // If area is smaller than template minArea, start stripping optional rooms
    let rooms = [...template.rooms];
    if (area < template.minArea) {
        // Strip out lowest priority first (higher number = lower priority)
        rooms = rooms.filter(r => r.priority <= 5);
    }
    return rooms;
};
