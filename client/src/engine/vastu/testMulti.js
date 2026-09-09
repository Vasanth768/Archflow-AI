import { simulateVastuImprovementsForRoom, simulateEntirePlanOptimization } from './VastuOptimizer.js';
import { validateFloorPlan } from './VastuValidator.js';

const sparseRooms = [
    { id: 'r_9', name: 'Staircase', x: 15, y: 15, w: 7.5, h: 8, type: 'staircase' },
    { id: 'r_4', name: 'Kitchen', x: 0, y: 0, w: 10, h: 10, type: 'kitchen' } // Kitchen in NE (violation)
];

const env = { width: 40, length: 30, facing: 'East' };
const report = validateFloorPlan(env, sparseRooms);

console.log("--- MULTI OPTIMIZER TEST ---");
const globalOpt = simulateEntirePlanOptimization(env, sparseRooms, report);
console.log("Final Score:", globalOpt.finalScore);
console.log("Recommendations:");
globalOpt.recommendations.forEach(r => console.log(r.actionText, '->', r.recommendedZone));
