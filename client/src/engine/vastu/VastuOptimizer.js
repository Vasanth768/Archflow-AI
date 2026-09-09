import { validateFloorPlan } from './VastuValidator.js';
import { VASTU_ROOM_RULES, normalizeRoomType, COMPLIANCE_STATUS } from './VastuRules.js';
import { getRoomZoneOverlaps, VASTU_ZONES } from './VastuGeometry.js';

// Types of rooms that are typically large open areas which may contain stairs/columns
const NESTABLE_ROOM_TYPES = ['living', 'parking', 'entrance'];

const hasCollision = (rect, env, otherRooms, currentlyOverlappingIds = []) => {
    const thickness = rect.wallThickness || 0.75;
    const outerW = rect.w + (thickness * 2);
    const outerH = rect.h + (thickness * 2);
    
    // 1. Must be entirely inside the plot
    const epsilon = 0.001;
    if (rect.x < -epsilon || rect.y < -epsilon || rect.x + outerW > env.width + epsilon || rect.y + outerH > env.length + epsilon) {
        return true;
    }
    
    // 2. Check overlap with other rooms
    for (let r of otherRooms) {
        const rThickness = r.wallThickness || 0.75;
        const rOuterW = r.w + (rThickness * 2);
        const rOuterH = r.h + (rThickness * 2);
        
        // Use strict inequalities allowing boundaries to exactly touch
        if (
            rect.x + epsilon < r.x + rOuterW &&
            rect.x + outerW - epsilon > r.x &&
            rect.y + epsilon < r.y + rOuterH &&
            rect.y + outerH - epsilon > r.y
        ) {
            // Overlapping a room.
            // Allowed ONLY if it currently overlaps this exact room (nested) 
            if (!currentlyOverlappingIds.includes(r.id)) {
                return true;
            }
        }
    }
    return false;
};

const getCandidateCoordinatesForZone = (room, env, targetZone, existingRooms) => {
    const candidates = [];
    const step = 0.5; // Finer resolution
    const otherRooms = existingRooms.filter(r => r.id !== room.id);
    
    // Determine existing overlaps to preserve valid nesting
    const currentlyOverlappingIds = [];
    const roomThickness = room.wallThickness || 0.75;
    const currentOuterW = room.w + (roomThickness * 2);
    const currentOuterH = room.h + (roomThickness * 2);
    const epsilon = 0.001;
    
    for (let r of otherRooms) {
        const rThickness = r.wallThickness || 0.75;
        const rOuterW = r.w + (rThickness * 2);
        const rOuterH = r.h + (rThickness * 2);
        if (
            room.x + epsilon < r.x + rOuterW &&
            room.x + currentOuterW - epsilon > r.x &&
            room.y + epsilon < r.y + rOuterH &&
            room.y + currentOuterH - epsilon > r.y
        ) {
            currentlyOverlappingIds.push(r.id);
        }
    }
    
    // Test both original orientation and rotated (90 deg) orientation
    const orientations = [
        { w: room.w, h: room.h, rotated: false }
    ];
    // Only add rotated option if dimensions are different
    if (room.w !== room.h) {
        orientations.push({ w: room.h, h: room.w, rotated: true });
    }
    
    orientations.forEach(ori => {
        const roomW = ori.w;
        const roomH = ori.h;
        for (let y = 0; y <= env.length - roomH; y += step) {
            for (let x = 0; x <= env.width - roomW; x += step) {
                const rect = { x, y, w: roomW, h: roomH, wallThickness: room.wallThickness };
                
                if (!hasCollision(rect, env, otherRooms, currentlyOverlappingIds)) {
                    const geo = getRoomZoneOverlaps(x, y, roomW, roomH, env);
                    // Must be in the target zone with decent confidence
                    if (geo.dominantZone === targetZone && geo.zoneConfidence > 50) {
                        candidates.push({ 
                            x, 
                            y, 
                            w: roomW,
                            h: roomH,
                            confidence: geo.zoneConfidence,
                            rotated: ori.rotated
                        });
                    }
                }
            }
        }
    });
    return candidates;
};

// Now returns an array of up to 3 best candidates per room
export const simulateVastuImprovementsForRoom = (env, room, currentRooms, currentScoreReport) => {
    const candidatesResult = [];
    if (room.vastuStatus.level >= 2) return candidatesResult; // Acceptable/Preferred
    
    const normType = room.normType;
    const rules = VASTU_ROOM_RULES[normType];
    
    if (!rules || (!rules.preferred && !rules.acceptable)) return candidatesResult;
    
    const allTargetZones = [...(rules.preferred || []), ...(rules.acceptable || [])];
    
    allTargetZones.forEach(targetZone => {
        const candidates = getCandidateCoordinatesForZone(room, env, targetZone, currentRooms);
        const otherRooms = currentRooms.filter(r => r.id !== room.id);
        
        candidates.forEach(coord => {
            const simulatedRooms = [...otherRooms, { ...room, x: coord.x, y: coord.y, w: coord.w, h: coord.h }];
            const simReport = validateFloorPlan(env, simulatedRooms);
            
            // Only consider if the score strictly improves or it clears a critical violation
            const removesCritical = currentScoreReport.criticalViolations.length > simReport.criticalViolations.length;
            const improvesScore = simReport.score > currentScoreReport.score;
            
            if (removesCritical || improvesScore) {
                candidatesResult.push({
                    roomId: room.id,
                    roomName: room.name,
                    currentZone: room.vastuZone,
                    recommendedZone: targetZone,
                    confidence: coord.confidence,
                    x: coord.x,
                    y: coord.y,
                    w: coord.w,
                    h: coord.h,
                    rotated: coord.rotated,
                    newScore: simReport.score,
                    scoreImprovement: simReport.score - currentScoreReport.score,
                    removesCritical,
                    isPreferred: rules.preferred.includes(targetZone),
                    actionText: `Move ${room.name} to ${targetZone}${coord.rotated ? ' (Rotated)' : ''}`
                });
            }
        });
    });
    
    // Deduplicate similar spatial candidates (keep only the best score per zone)
    const uniqueZones = {};
    candidatesResult.forEach(c => {
        const key = c.recommendedZone + (c.rotated ? '_R' : '');
        if (!uniqueZones[key] || uniqueZones[key].newScore < c.newScore) {
            uniqueZones[key] = c;
        }
    });
    
    let sorted = Object.values(uniqueZones).sort((a, b) => {
        if (a.removesCritical && !b.removesCritical) return -1;
        if (!a.removesCritical && b.removesCritical) return 1;
        if (a.isPreferred && !b.isPreferred) return -1;
        if (!a.isPreferred && b.isPreferred) return 1;
        return b.scoreImprovement - a.scoreImprovement;
    });
    
    return sorted.slice(0, 3);
};

// Global optimization: runs room-level optimization and selects the single highest-impact move for each room
export const simulateVastuImprovements = (env, currentRooms, currentScoreReport, targetRoomId = null) => {
    let globalRecommendations = [];
    currentScoreReport.rooms.forEach(room => {
        if (targetRoomId && room.id !== targetRoomId) return;
        
        const topRoomFixes = simulateVastuImprovementsForRoom(env, room, currentRooms, currentScoreReport);
        if (targetRoomId) {
            // If targeted, return all top fixes for this room
            globalRecommendations.push(...topRoomFixes);
        } else if (topRoomFixes.length > 0) {
            globalRecommendations.push(topRoomFixes[0]); // Take best fix for this room
        }
    });
    
    return globalRecommendations.sort((a, b) => {
        if (a.removesCritical && !b.removesCritical) return -1;
        if (!a.removesCritical && b.removesCritical) return 1;
        return b.scoreImprovement - a.scoreImprovement;
    });
};
export const simulateEntirePlanOptimization = (env, currentRooms, currentScoreReport) => {
    let globalRecommendations = [];
    let tempRooms = JSON.parse(JSON.stringify(currentRooms));
    let tempScoreReport = validateFloorPlan(env, tempRooms);
    
    const sortedRooms = [...tempScoreReport.rooms].sort((a, b) => a.vastuStatus.level - b.vastuStatus.level);
    
    for (let room of sortedRooms) {
        if (room.vastuStatus.level >= 2) continue;
        
        const topRoomFixes = simulateVastuImprovementsForRoom(env, room, tempRooms, tempScoreReport);
        if (topRoomFixes.length > 0) {
            const bestFix = topRoomFixes[0];
            
            const testRooms = tempRooms.map(r => r.id === bestFix.roomId ? { ...r, x: bestFix.x, y: bestFix.y, w: bestFix.w, h: bestFix.h } : r);
            const testReport = validateFloorPlan(env, testRooms);
            
            if (testReport.score > tempScoreReport.score || (tempScoreReport.criticalViolations.length > testReport.criticalViolations.length)) {
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
