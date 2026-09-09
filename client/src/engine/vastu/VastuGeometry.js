export const VASTU_ZONES = {
    N: 'North',
    NE: 'North-East',
    E: 'East',
    SE: 'South-East',
    S: 'South',
    SW: 'South-West',
    W: 'West',
    NW: 'North-West',
    CENTER: 'Brahmasthan'
};

const ZONE_MAP = {
    'East': [
        ['SW', 'W', 'NW'],
        ['S', 'CENTER', 'N'],
        ['SE', 'E', 'NE']
    ],
    'West': [
        ['NE', 'E', 'SE'],
        ['N', 'CENTER', 'S'],
        ['NW', 'W', 'SW']
    ],
    'North': [
        ['NE', 'N', 'NW'],
        ['E', 'CENTER', 'W'],
        ['SE', 'S', 'SW']
    ],
    'South': [
        ['NW', 'N', 'NE'],
        ['W', 'CENTER', 'E'],
        ['SW', 'S', 'SE']
    ]
};

// Helper: Get intersection area of two rectangles
const getIntersectionArea = (r1, r2) => {
    const overlapX = Math.max(0, Math.min(r1.x + r1.w, r2.x + r2.w) - Math.max(r1.x, r2.x));
    const overlapY = Math.max(0, Math.min(r1.y + r1.h, r2.y + r2.h) - Math.max(r1.y, r2.y));
    return overlapX * overlapY;
};

export const getRoomZoneOverlaps = (x, y, w, h, env, config = { brahmasthanRatio: 0.33 }) => {
    const colWidth = env.width / 3;
    const rowHeight = env.length / 3;
    const facing = env.facing || 'East';
    const map = ZONE_MAP[facing] || ZONE_MAP['East'];
    
    const roomRect = { x, y, w, h };
    const totalRoomArea = w * h;
    
    let overlaps = {};
    Object.values(VASTU_ZONES).forEach(z => overlaps[z] = 0);
    
    // Calculate overlap with each of the 9 grid cells
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const cellRect = {
                x: col * colWidth,
                y: row * rowHeight,
                w: colWidth,
                h: rowHeight
            };
            const intersection = getIntersectionArea(roomRect, cellRect);
            if (intersection > 0) {
                const zoneCode = map[row][col];
                overlaps[VASTU_ZONES[zoneCode]] += intersection;
            }
        }
    }
    
    // Calculate distinct Brahmasthan overlap based on config ratio
    const centerRatio = config.brahmasthanRatio;
    const marginX = env.width * ((1 - centerRatio) / 2);
    const marginY = env.length * ((1 - centerRatio) / 2);
    const brahmasthanRect = {
        x: marginX,
        y: marginY,
        w: env.width * centerRatio,
        h: env.length * centerRatio
    };
    const centerOverlapArea = getIntersectionArea(roomRect, brahmasthanRect);
    const brahmasthanOverlapPercent = totalRoomArea > 0 ? (centerOverlapArea / totalRoomArea) * 100 : 0;
    
    // Determine the dominant zone (the one with the largest overlap area)
    let dominantZone = VASTU_ZONES.CENTER;
    let maxOverlapArea = 0;
    
    for (const [zone, area] of Object.entries(overlaps)) {
        if (area > maxOverlapArea) {
            maxOverlapArea = area;
            dominantZone = zone;
        }
    }
    
    // Convert areas to percentages
    const overlapPercents = {};
    for (const [zone, area] of Object.entries(overlaps)) {
        overlapPercents[zone] = totalRoomArea > 0 ? Math.round((area / totalRoomArea) * 100) : 0;
    }
    
    const zoneConfidence = totalRoomArea > 0 ? Math.round((maxOverlapArea / totalRoomArea) * 100) : 0;
    
    return {
        dominantZone,
        zoneConfidence,
        overlapPercents,
        isBrahmasthan: brahmasthanOverlapPercent > 20, // Threshold for considering it heavily in the center
        brahmasthanOverlapPercent: Math.round(brahmasthanOverlapPercent)
    };
};
