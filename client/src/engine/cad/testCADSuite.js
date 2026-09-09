/**
 * Automated CAD Engine & Geometry Verification Suite
 */

import { createEmptyPlan, RoomType } from './CanonicalSchema.js';
import { parseArchitecturalDimension, formatFeetInches, formatRoomDimensions } from './UnitEngine.js';
import { WallNetwork } from './WallNetwork.js';
import { ConstraintValidator, ValidationStatus } from './ConstraintValidator.js';
import { CanonicalOption04 } from './CanonicalOption04.js';
import { CanonicalVastuEngine, VastuStatus } from './CanonicalVastuEngine.js';
import { ArchitectureAIProvider } from './ArchitectureAIProvider.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

console.log("\n=========================================");
console.log("ARCHFLOW CAD ENGINE - VERIFICATION SUITE");
console.log("=========================================\n");

// 1. Unit Conversion Tests
console.log("[1] Unit Engine Tests:");
assert(parseArchitecturalDimension("15'-3\"") === 183, "Parse 15'-3\" to 183 inches");
assert(parseArchitecturalDimension("9'-8\"") === 116, "Parse 9'-8\" to 116 inches");
assert(parseArchitecturalDimension("45'") === 540, "Parse 45' to 540 inches");
assert(parseArchitecturalDimension("70'-0\"") === 840, "Parse 70'-0\" to 840 inches");
assert(formatFeetInches(183) === `15'-3"`, "Format 183 inches to 15'-3\"");
assert(formatFeetInches(116) === `9'-8"`, "Format 116 inches to 9'-8\"");
assert(formatFeetInches(540) === `45'-0"`, "Format 540 inches to 45'-0\"");

// 2. WallNetwork Topology Tests
console.log("\n[2] WallNetwork Topology Tests:");
const wn = new WallNetwork();
wn.addWall({ id: 'w1', start: { x: 0, y: 0 }, end: { x: 120, y: 0 }, thickness: 9, type: 'exterior' });
wn.addWall({ id: 'w2', start: { x: 120, y: 0 }, end: { x: 120, y: 120 }, thickness: 9, type: 'exterior' });
wn.addWall({ id: 'w3', start: { x: 120, y: 120 }, end: { x: 0, y: 120 }, thickness: 9, type: 'exterior' });
wn.addWall({ id: 'w4', start: { x: 0, y: 120 }, end: { x: 0, y: 0 }, thickness: 9, type: 'exterior' });

assert(wn.walls.length === 4, "WallNetwork registered 4 boundary walls");
assert(wn.getWallLength(wn.getWall('w1')) === 120, "Wall w1 length is 120 inches");

const poly = wn.getWallPolygon(wn.getWall('w1'));
assert(poly.length === 4, "Wall polygon has 4 vertices with thickness offsets");

// 3. Option 04 Ground Truth Verification
console.log("\n[3] Option 04 Canonical Plan Verification:");
const opt04 = CanonicalOption04;
assert(opt04.site.width === 540 && opt04.site.length === 840, "Option 04 site matches 45' x 70' (540\" x 840\")");
assert(opt04.walls.length >= 20, `Option 04 contains ${opt04.walls.length} verified structural walls`);
assert(opt04.rooms.length === 14, `Option 04 contains ${opt04.rooms.length} authoritative rooms`);

const kitch = opt04.rooms.find(r => r.id === 'r_kitchen');
assert(kitch && kitch.clearDimensions.width === 111 && kitch.clearDimensions.length === 116, "Kitchen preserves exact 9'-3\" x 9'-8\" (111\" x 116\")");

const living = opt04.rooms.find(r => r.id === 'r_living');
assert(living && living.clearDimensions.width === 183 && living.clearDimensions.length === 231, "Living Room preserves exact 15'-3\" x 19'-3\" (183\" x 231\")");

// 4. Constraint & Geometry Validation Engine
console.log("\n[4] Constraint Validation Tests:");
const validator = new ConstraintValidator();
const valResult = validator.validatePlan(opt04);
assert(valResult.isValid === true, "Option 04 passes constraint validation cleanly");
assert(valResult.errors.length === 0, "Option 04 has 0 geometry errors");

// 5. Vastu Engine on Canonical Model
console.log("\n[5] Canonical Vastu Engine Tests:");
const vastu = new CanonicalVastuEngine();
const vastuResult = vastu.analyzePlan(opt04);
assert(vastuResult.score >= 80, `Option 04 Vastu score is ${vastuResult.score}/100 (Compliant)`);
assert(vastuResult.status === VastuStatus.PASS, "Option 04 passes Vastu analysis");

// 6. Architecture AI Provider & NLP Modification Tests
console.log("\n[6] Architecture AI Provider & NLP Tests:");
const ai = new ArchitectureAIProvider();

async function testAI() {
    const genPlan = await ai.generatePlanFromText("Design a 30x40 East facing 2BHK house", { width: 30, length: 40, facing: 'East' });
    assert(genPlan.walls.length > 0, "AI successfully generated structured WallNetwork");
    assert(genPlan.rooms.length > 0, "AI successfully generated canonical rooms");

    const modPlan = await ai.modifyPlan(genPlan, "Make bedroom 1 12 feet wide");
    const modBed = modPlan.rooms.find(r => r.name.toLowerCase().includes('bed'));
    assert(modBed && modBed.clearDimensions.width === 144, "NLP modification accurately updated bedroom width to 12'-0\" (144\")");

    console.log("\n=========================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================\n");

    if (failed > 0) process.exit(1);
}

testAI();
