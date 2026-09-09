export const calculateLayoutScore = (rooms) => {
    let score = 100;

    // Penalty for bad privacy (e.g., Toilet facing Living)
    const hasToiletToLiving = false; // Mock analysis
    if (hasToiletToLiving) score -= 15;

    // Penalty for dead spaces
    const hasDeadSpace = false;
    if (hasDeadSpace) score -= 5;

    // Validate minimum sizes
    const invalidSizes = rooms.filter(r => r.w < 2 || r.h < 2).length;
    score -= (invalidSizes * 10);

    return Math.max(0, score);
};
