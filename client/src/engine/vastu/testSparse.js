import { validateFloorPlan } from './VastuValidator.js';
import { simulateVastuImprovements } from './VastuOptimizer.js';

const sparseRooms = [
    { id: 'r_9', name: 'Staircase', x: 15, y: 15, w: 7.5, h: 8, type: 'staircase' } // Just the staircase in the center
];

const testSparse = () => {
    const env = { width: 40, length: 30, facing: 'East' };
    const report = validateFloorPlan(env, sparseRooms);
    const recommendations = simulateVastuImprovements(env, sparseRooms, report);
    
    console.log('Sparse Recommendations:');
    recommendations.forEach((rec, idx) => {
        console.log((idx + 1) + '. ' + rec.actionText + ' [+' + rec.scoreImprovement + ' points]');
    });
};

testSparse();
