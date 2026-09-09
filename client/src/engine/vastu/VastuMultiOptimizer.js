import { validateFloorPlan } from './VastuValidator.js';
import { simulateVastuImprovementsForRoom } from './VastuOptimizer.js';

export const simulateEntirePlanOptimization = (env, currentRooms, currentScoreReport) => {
    let globalRecommendations = [];
    let tempRooms = JSON.parse(JSON.stringify(currentRooms));
    let tempScoreReport = validateFloorPlan(env, tempRooms);
    
    // Sort rooms by severity (Critical first, then Hard violations, etc)
    const sortedRooms = [...tempScoreReport.rooms].sort((a, b) => a.vastuStatus.level - b.vastuStatus.level);
    
    for (let room of sortedRooms) {
        if (room.vastuStatus.level >= 2) continue; // Skip acceptable/preferred
        
        const topRoomFixes = simulateVastuImprovementsForRoom(env, room, tempRooms, tempScoreReport);
        if (topRoomFixes.length > 0) {
            const bestFix = topRoomFixes[0];
            
            // Validate this fix doesn't degrade the overall score when applied
            const testRooms = tempRooms.map(r => r.id === bestFix.roomId ? { ...r, x: bestFix.x, y: bestFix.y } : r);
            const testReport = validateFloorPlan(env, testRooms);
            
            if (testReport.score > tempScoreReport.score || (tempScoreReport.criticalViolations.length > testReport.criticalViolations.length)) {
                // Accept the fix
                globalRecommendations.push({
                    ...bestFix,
                    stepScore: testReport.score
                });
                tempRooms = testRooms;
                tempScoreReport = testReport;
            }
        }
    }
    
    return {
        recommendations: globalRecommendations,
        finalScore: tempScoreReport.score
    };
};
