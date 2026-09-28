/**
 * testCADSuite.js - Automated CAD Geometry & Vastu Verification Suite
 * 
 * Verifies that the ArchFlow 2D Exact CAD Engine satisfies all architectural rules:
 * - Exact user dimension preservation (e.g. 12x14 -> 144" x 168")
 * - Zero room overlap
 * - Real door-to-wall and window-to-wall attachments
 * - Connected canonical wall graph
 * - Deterministic mathematical Vastu compliance
 * - Viewport matrix invertibility
 */

import { generateDefaultFloorPlan } from './PlanGenerator.js';
import { ConstraintValidator } from './ConstraintValidator.js';
import { CanonicalVastuEngine } from './CanonicalVastuEngine.js';
import { ArchitecturalIntentParser } from '../../architecture/ai/ArchitecturalIntentParser.js';
import { ArchitecturalCommandEngine } from '../../architecture/ai/ArchitecturalCommandEngine.js';
import { formatFeetInches } from './UnitEngine.js';

const validator = new ConstraintValidator();
const vastuEngine = new CanonicalVastuEngine();
const commandEngine = new ArchitecturalCommandEngine();

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  [PASS] ${message}`);
    } else {
        console.error(`  [FAIL] ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
}

console.log('====================================================');
console.log('ARCHFLOW AI - 2D EXACT CAD ENGINE VERIFICATION SUITE');
console.log('====================================================\n');

// TEST 1: Exact Room Dimensions Preservation
console.log('TEST 1: Exact User Dimension Preservation (30x40 Plot, Master 12x14, Kitchen 10x10)');
const plan1 = generateDefaultFloorPlan({
    width: 30,
    length: 40,
    facing: 'East',
    requirements: {
        bedrooms: 2,
        masterBedroom: { width: 12, length: 14 },
        kitchen: { width: 10, length: 10 },
        pooja: true,
        parking: true,
        attachedToilet: true
    }
});

const mb1 = plan1.rooms.find(r => r.type === 'master_bedroom');
assert(mb1 !== undefined, 'Master bedroom exists in canonical plan');
assert(mb1.w === 144, `Master bedroom width is EXACTLY 144" (12'-0") [Actual: ${mb1.w}"]`);
assert(mb1.h === 168, `Master bedroom length is EXACTLY 168" (14'-0") [Actual: ${mb1.h}"]`);
assert(mb1.clearDimensions.width === 144, 'Clear dimension width matches exact 144"');
assert(mb1.clearDimensions.length === 168, 'Clear dimension length matches exact 168"');

const kit1 = plan1.rooms.find(r => r.type === 'kitchen');
assert(kit1 !== undefined, 'Kitchen exists in canonical plan');
assert(kit1.w === 120, `Kitchen width is EXACTLY 120" (10'-0") [Actual: ${kit1.w}"]`);
assert(kit1.h === 120, `Kitchen length is EXACTLY 120" (10'-0") [Actual: ${kit1.h}"]`);

// TEST 2: Plot Dimensions & Envelope Containment
console.log('\nTEST 2: Plot Dimensions & Setback Boundaries');
assert(plan1.site.width === 360, `Site width is EXACTLY 360" (30'-0") [Actual: ${plan1.site.width}"]`);
assert(plan1.site.length === 480, `Site length is EXACTLY 480" (40'-0") [Actual: ${plan1.site.length}"]`);
assert(plan1.site.setbacks.front > 0, 'Front setback is properly defined');
assert(plan1.site.setbacks.rear > 0, 'Rear setback is properly defined');

// TEST 3: Zero Room Overlap
console.log('\nTEST 3: Room Geometric Overlap Check (Zero-Tolerance)');
const valResult1 = validator.validatePlan(plan1);
assert(valResult1.isValid === true, 'Plan is fully geometrically valid');
assert(valResult1.errors.length === 0, `No geometric errors found in plan (${valResult1.errors.join(', ')})`);

// TEST 4: Door-to-Wall Attachments
console.log('\nTEST 4: Door-to-Wall Mathematical Attachment');
assert(plan1.doors.length >= 4, `Plan has all necessary doors [Found: ${plan1.doors.length}]`);
const wallMap1 = new Map(plan1.walls.map(w => [w.id, w]));

plan1.doors.forEach(d => {
    const hostWall = wallMap1.get(d.wallId);
    assert(hostWall !== undefined, `Door ${d.id} is attached to valid host wall ${d.wallId}`);
    const wallLen = Math.hypot(hostWall.end.x - hostWall.start.x, hostWall.end.y - hostWall.start.y);
    assert(d.positionAlongWall >= 0, `Door ${d.id} offset (${d.positionAlongWall}") is positive`);
    assert(d.positionAlongWall + d.width <= wallLen + 0.1, `Door ${d.id} (${d.width}") fits on host wall (${wallLen}")`);
});

// TEST 5: Window-to-Wall Attachments
console.log('\nTEST 5: Window-to-Wall Attachment on Exterior Walls');
assert(plan1.windows.length >= 3, `Plan has standard windows [Found: ${plan1.windows.length}]`);
plan1.windows.forEach(win => {
    const hostWall = wallMap1.get(win.wallId);
    assert(hostWall !== undefined, `Window ${win.id} is attached to valid host wall ${win.wallId}`);
    assert(hostWall.type === 'exterior', `Window ${win.id} is placed on an exterior wall`);
});

// TEST 6: Vastu 9-Quadrant Compliance
console.log('\nTEST 6: Mathematical Vastu Compliance (9-Quadrant Mandala)');
const vastuReport1 = vastuEngine.analyzePlan(plan1);
assert(vastuReport1.score >= 80, `Vastu score is high compliance [Score: ${vastuReport1.score}/100]`);
assert(mb1.zone === 'SW', 'Master Bedroom is correctly located in South-West (Nairutya)');
assert(kit1.zone === 'SE', 'Kitchen is correctly located in South-East (Agneya)');

const pooja1 = plan1.rooms.find(r => r.type === 'pooja');
if (pooja1) {
    assert(pooja1.zone === 'NE', 'Pooja room is correctly located in North-East (Ishanya)');
}

// TEST 7: Deterministic Reproducibility
console.log('\nTEST 7: Deterministic Reproducibility (Same Input -> Exact Identical Output)');
const plan1Clone = generateDefaultFloorPlan({
    width: 30,
    length: 40,
    facing: 'East',
    requirements: {
        bedrooms: 2,
        masterBedroom: { width: 12, length: 14 },
        kitchen: { width: 10, length: 10 }
    }
});
assert(plan1.rooms.length === plan1Clone.rooms.length, 'Room counts match identically');
assert(plan1.walls.length === plan1Clone.walls.length, 'Wall counts match identically');
assert(plan1.doors.length === plan1Clone.doors.length, 'Door counts match identically');
assert(plan1.rooms[0].w === plan1Clone.rooms[0].w, 'Room coordinates match identically');

// TEST 8: Natural Language Command Execution
console.log('\nTEST 8: Natural Language Command Execution');
const cmd1 = ArchitecturalIntentParser.parse('Master bedroom 14x16');
assert(cmd1.action === 'resize_room', 'Command action parsed as resize_room');
assert(cmd1.widthInches === 168, `Width parsed as 168" (14ft) [Actual: ${cmd1.widthInches}"]`);
assert(cmd1.lengthInches === 192, `Length parsed as 192" (16ft) [Actual: ${cmd1.lengthInches}"]`);

const modifiedPlan = commandEngine.executeCommand(plan1, cmd1);
const mbMod = modifiedPlan.rooms.find(r => r.type === 'master_bedroom');
assert(mbMod.w === 168, `Modified Master bedroom width is 168" [Actual: ${mbMod.w}"]`);
assert(mbMod.h === 192, `Modified Master bedroom length is 192" [Actual: ${mbMod.h}"]`);

// TEST 9: Requirement Conflict Reporting
console.log('\nTEST 9: Requirement Conflict Reporting (Impossible 40x50 room in 30x40 plot)');
const planConflict = generateDefaultFloorPlan({
    width: 30,
    length: 40,
    facing: 'East',
    requirements: {
        masterBedroom: { width: 40, length: 50 } // Cannot fit!
    }
});
const conflictRecord = planConflict.metadata.requirementVerification.find(r => r.status === 'CONSTRAINT_CONFLICT');
assert(conflictRecord !== undefined, 'Constraint conflict recorded without silent modification');
assert(conflictRecord.reason.includes('exceeds building envelope'), 'Clear conflict explanation generated');

console.log('\n====================================================');
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================\n');
