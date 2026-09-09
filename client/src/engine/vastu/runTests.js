import { getRoomZoneOverlaps, VASTU_ZONES } from './VastuGeometry.js';
import { validateFloorPlan } from './VastuValidator.js';
import { simulateVastuImprovements } from './VastuOptimizer.js';
import { normalizeRoomType } from './VastuRules.js';

const REF_30x40_ROOMS = [
    { id: 'r_1', name: 'Master Bedroom', x: 0, y: 0, w: 13, h: 11, type: 'bedroom' },
    { id: 'r_2', name: 'Toilet', x: 13, y: 0, w: 5.5, h: 7, type: 'toilet' },
    { id: 'r_3', name: 'Dining', x: 18.5, y: 0, w: 10.5, h: 11, type: 'dining' },
    { id: 'r_4', name: 'Kitchen', x: 29, y: 0, w: 11, h: 11, type: 'kitchen' },
    { id: 'r_8', name: 'Parking', x: 0, y: 11, w: 11, h: 19, type: 'parking' },
    { id: 'r_6', name: 'Living Hall', x: 11, y: 11, w: 18, h: 15, type: 'living' },
    { id: 'r_9', name: 'Staircase', x: 11, y: 11, w: 7.5, h: 8, type: 'staircase' },
    { id: 'r_5', name: 'Pooja', x: 29, y: 11, w: 5.5, h: 5, type: 'pooja' },
    { id: 'r_7', name: 'Bedroom 2', x: 29, y: 16, w: 11, h: 14, type: 'bedroom' },
    { id: 'r_10', name: 'Sitout', x: 11, y: 26, w: 18, h: 4, type: 'entrance' }
];

const testIntegration = () => {
    console.log('\n--- INTEGRATION TEST (30x40 East Facing House) ---');
    const env = { width: 40, length: 30, facing: 'East' };
    const report = validateFloorPlan(env, REF_30x40_ROOMS);
    
    console.log('Score: ' + report.score + '/100');
    console.log('Tier: ' + report.tier);
    console.log('Critical Violations: ' + report.criticalViolations.length);
    if (report.criticalViolations.length > 0) {
        report.criticalViolations.forEach(cv => console.log('  -> ' + cv.room.name + ': ' + cv.reason));
    }
    
    const recommendations = simulateVastuImprovements(env, REF_30x40_ROOMS, report);
    
    console.log('\n--- TOP IMPROVEMENTS ---');
    if (recommendations.length > 0) {
        recommendations.forEach((rec, idx) => {
            console.log((idx + 1) + '. ' + rec.actionText + ' [+' + rec.scoreImprovement + ' points]');
        });
    } else {
        console.log('No improvements found.');
    }
};

testIntegration();
