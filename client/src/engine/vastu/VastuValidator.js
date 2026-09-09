import { getRoomZoneOverlaps, VASTU_ZONES } from './VastuGeometry.js';
import { evaluateRoomZone, normalizeRoomType, COMPLIANCE_STATUS } from './VastuRules.js';

const ENTRANCE_FACING_RULES = {
    'East': [VASTU_ZONES.E, VASTU_ZONES.NE],
    'West': [VASTU_ZONES.W, VASTU_ZONES.NW],
    'North': [VASTU_ZONES.N, VASTU_ZONES.NE],
    'South': [VASTU_ZONES.S, VASTU_ZONES.SE]
};

const getDistance = (r1, r2) => {
    const cx1 = r1.x + r1.w / 2;
    const cy1 = r1.y + r1.h / 2;
    const cx2 = r2.x + r2.w / 2;
    const cy2 = r2.y + r2.h / 2;
    return Math.sqrt(Math.pow(cx1 - cx2, 2) + Math.pow(cy1 - cy2, 2));
};

export const validateFloorPlan = (env, rooms, config = { brahmasthanRatio: 0.33 }) => {
    let hardViolations = 0;
    let warnings = 0;
    let preferred = 0;
    let acceptable = 0;
    let criticalViolations = [];

    const categoryScores = {
        'pooja': { maxWeight: 15, currentScore: 0, active: false, count: 0 },
        'kitchen': { maxWeight: 15, currentScore: 0, active: false, count: 0 },
        'master_bedroom': { maxWeight: 15, currentScore: 0, active: false, count: 0 },
        'bedroom': { maxWeight: 10, currentScore: 0, active: false, count: 0 },
        'toilet': { maxWeight: 10, currentScore: 0, active: false, count: 0 },
        'living': { maxWeight: 8, currentScore: 0, active: false, count: 0 },
        'staircase': { maxWeight: 8, currentScore: 0, active: false, count: 0 },
        'entrance': { maxWeight: 8, currentScore: 0, active: false, count: 0 }
    };

    let brahmasthanScore = 7;
    let adjacencyScore = 4;
    let hasCenterObstruction = false;

    const roomEvaluations = rooms.map(room => {
        const normType = normalizeRoomType(room.name, room.type);
        const geo = getRoomZoneOverlaps(room.x, room.y, room.w, room.h, env, config);
        
        const isDominantBrahmasthan = geo.dominantZone === VASTU_ZONES.CENTER;
        // Check critical Brahmasthan overlap > 20%
        const isCriticalBrahmasthan = geo.brahmasthanOverlapPercent > 20 && 
            ['toilet', 'staircase', 'kitchen', 'column', 'master_bedroom'].includes(normType);

        let evaluation = evaluateRoomZone(normType, geo.dominantZone, geo.isBrahmasthan || isDominantBrahmasthan || isCriticalBrahmasthan);
        
        let status = evaluation.status;
        let recommendation = evaluation.recommendation;

        if (isCriticalBrahmasthan) {
            status = COMPLIANCE_STATUS.HARD_VIOLATION;
            recommendation = `Severe violation: ${geo.brahmasthanOverlapPercent}% of ${normType} occupies the central Brahmasthan.`;
            hasCenterObstruction = true;
            brahmasthanScore = 0;
            criticalViolations.push({
                room: room,
                reason: recommendation,
                type: 'BRAHMASTHAN'
            });
        }

        if (normType === 'entrance' && !isCriticalBrahmasthan) {
            const preferredZones = ENTRANCE_FACING_RULES[env.facing || 'East'];
            if (preferredZones.includes(geo.dominantZone)) {
                status = COMPLIANCE_STATUS.PREFERRED;
                recommendation = 'Entrance perfectly aligned with plot facing.';
            } else if (geo.dominantZone === VASTU_ZONES.SW) {
                status = COMPLIANCE_STATUS.HARD_VIOLATION;
                recommendation = 'Never place main entrance in South-West.';
            } else {
                status = COMPLIANCE_STATUS.WARNING;
                recommendation = 'Entrance is not in the ideal zone for this facing.';
            }
        }

        const thickness = room.wallThickness || 0.75;
        const outerW = room.w + (thickness * 2);
        const outerH = room.h + (thickness * 2);
        const isOutOfBounds = room.x < 0 || room.y < 0 || (room.x + outerW) > env.width || (room.y + outerH) > env.length;

        if (isOutOfBounds) {
            status = COMPLIANCE_STATUS.HARD_VIOLATION;
            recommendation = 'Severe violation: Room geometry exceeds plot boundary limits.';
            criticalViolations.push({
                room: room,
                reason: recommendation,
                type: 'BOUNDARY'
            });
        }

        if (status !== COMPLIANCE_STATUS.UNKNOWN) {
            if (status === COMPLIANCE_STATUS.PREFERRED) preferred++;
            else if (status === COMPLIANCE_STATUS.ACCEPTABLE) acceptable++;
            else if (status === COMPLIANCE_STATUS.WARNING) warnings++;
            else if (status === COMPLIANCE_STATUS.HARD_VIOLATION) hardViolations++;

            if (categoryScores[normType]) {
                categoryScores[normType].active = true;
                categoryScores[normType].count++;
                
                let points = 0;
                if (status === COMPLIANCE_STATUS.PREFERRED) points = 1.0;
                else if (status === COMPLIANCE_STATUS.ACCEPTABLE) points = 0.7;
                else if (status === COMPLIANCE_STATUS.WARNING) points = 0.3;
                else if (status === COMPLIANCE_STATUS.HARD_VIOLATION) points = 0.0;
                
                categoryScores[normType].currentScore += points;
            }
        }

        return {
            ...room,
            normType,
            vastuZone: geo.dominantZone,
            vastuConfidence: geo.zoneConfidence,
            vastuOverlaps: geo.overlapPercents,
            vastuStatus: status,
            vastuRecommendation: recommendation
        };
    });

    Object.keys(categoryScores).forEach(key => {
        if (categoryScores[key].count > 0) {
            categoryScores[key].currentScore = categoryScores[key].currentScore / categoryScores[key].count;
        }
    });

    const poojas = roomEvaluations.filter(r => r.normType === 'pooja');
    const toilets = roomEvaluations.filter(r => r.normType === 'toilet');
    
    let adjacencyPenalty = 0;
    poojas.forEach(p => {
        toilets.forEach(t => {
            const dist = getDistance(p, t);
            if (dist < 10) {
                adjacencyPenalty += 2;
                p.vastuStatus = COMPLIANCE_STATUS.HARD_VIOLATION;
                p.vastuRecommendation = 'Severe Violation: Pooja is adjacent to Toilet.';
                hardViolations++;
                criticalViolations.push({
                    room: p,
                    reason: 'Pooja is adjacent to Toilet.',
                    type: 'ADJACENCY'
                });
            }
        });
    });
    
    adjacencyScore = Math.max(0, adjacencyScore - adjacencyPenalty);

    let earnedPoints = 0;
    let activeWeightTotal = 0;

    Object.keys(categoryScores).forEach(key => {
        if (categoryScores[key].active) {
            activeWeightTotal += categoryScores[key].maxWeight;
            earnedPoints += (categoryScores[key].currentScore * categoryScores[key].maxWeight);
        }
    });

    activeWeightTotal += 11;
    earnedPoints += brahmasthanScore + adjacencyScore;

    const finalScore = activeWeightTotal > 0 ? Math.round((earnedPoints / activeWeightTotal) * 100) : 0;

    let tier = 'Poor';
    if (finalScore >= 90) tier = 'Excellent';
    else if (finalScore >= 80) tier = 'Good';
    else if (finalScore >= 60) tier = 'Moderate';
    
    // Safety check for UI
    if (criticalViolations.length > 0) tier = 'Needs Correction';

    return {
        score: finalScore,
        tier,
        hardViolations,
        warnings,
        preferred,
        acceptable,
        brahmasthanClear: !hasCenterObstruction,
        criticalViolations,
        rooms: roomEvaluations
    };
};
