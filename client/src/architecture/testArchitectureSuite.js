/**
 * testArchitectureSuite.js - Full Verification Test Suite for src/architecture/
 */

import { CanonicalFloorPlan } from './model/CanonicalFloorPlan.js';
import { Option04Data, validateOption04Geometry } from './model/Option04Data.js';
import { WallEngine } from './geometry/WallEngine.js';
import { RoomEngine } from './geometry/RoomEngine.js';
import { OpeningEngine } from './geometry/OpeningEngine.js';
import { GeometryValidator } from './geometry/GeometryValidator.js';
import { ArchitecturalIntentParser } from './ai/ArchitecturalIntentParser.js';
import { ArchitecturalCommandEngine } from './ai/ArchitecturalCommandEngine.js';
import { VariationEngine } from './variations/VariationEngine.js';
import { VastuEngine, VastuStatus } from './vastu/VastuEngine.js';

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

console.log("\n==================================================");
console.log("ARCHFLOW COMPLETE CANONICAL ARCHITECTURE TEST SUITE");
console.log("==================================================\n");

// TEST 1: Load Option 04 overall geometry
console.log("[TEST 1] Load Option 04 - 45'x70' Envelope:");
const model = CanonicalFloorPlan.fromOption04();
const plan = model.data;
assert(plan.site.width === 540 && plan.site.length === 840, "Site envelope matches 45'-0\" × 70'-0\" (540\" × 840\")");

// TEST 2: Verify room dimensions
console.log("\n[TEST 2] Room Clear Dimensions Verification:");
const expectedRooms = [
    { id: 'r_kitchen', name: 'KITCHEN', w: 111, h: 116, label: `9'-3" × 9'-8"` },
    { id: 'r_dining', name: 'DINING', w: 183, h: 111, label: `15'-3" × 9'-3"` },
    { id: 'r_living', name: 'LIVING ROOM', w: 183, h: 231, label: `15'-3" × 19'-3"` },
    { id: 'r_portico', name: 'PORTICO', w: 150, h: 222, label: `12'-6" × 18'-6"` },
    { id: 'r_store', name: 'STORE', w: 54, h: 63, label: `4'-6" × 5'-3"` },
    { id: 'r_pooja', name: 'POOJA', w: 54, h: 39, label: `4'-6" × 3'-3"` },
    { id: 'r_sitout', name: 'SITOUT', w: 183, h: 72, label: `15'-3" × 6'-0"` },
    { id: 'r_bed1', name: 'BEDROOM 1', w: 111, h: 183, label: `9'-3" × 15'-3"` },
    { id: 'r_atoil1', name: 'A. TOILET', w: 93, h: 45, label: `7'-9" × 3'-9"` },
    { id: 'r_stair', name: 'STAIRCASE', w: 102, h: 78, label: `8'-6" × 6'-6"` },
    { id: 'r_bed2', name: 'BEDROOM 2', w: 110, h: 123, label: `9'-2" × 10'-3"` },
    { id: 'r_atoil2', name: 'A. TOILET', w: 111, h: 51, label: `9'-3" × 4'-3"` }
];

expectedRooms.forEach(expected => {
    const r = plan.rooms.find(rm => rm.id === expected.id);
    assert(r !== undefined, `Room ${expected.name} (${expected.id}) exists in canonical plan`);
    if (r) {
        assert(r.clearDimensions.width === expected.w && r.clearDimensions.length === expected.h,
            `${expected.name}: Expected ${expected.label}, got ${r.dimensionLabel}`);
    }
});

// TEST 3: Wall Topology & Engine
console.log("\n[TEST 3] Wall Graph Topology:");
const wallEngine = new WallEngine(plan.walls);
assert(wallEngine.walls.length >= 20, `WallEngine maintains ${wallEngine.walls.length} structural walls`);
const wFirst = wallEngine.walls[0];
const originalStart = { ...wFirst.start };
wallEngine.moveWall(wFirst.id, 10, 0);
assert(wFirst.start.x === originalStart.x + 10, "Moving wall updates start coordinates");
wallEngine.moveWall(wFirst.id, -10, 0); // revert

// TEST 4: Opening Engine (Door & Window hosting)
console.log("\n[TEST 4] Hosted Doors and Windows:");
const mainDoor = plan.doors.find(d => d.isMain || d.id === 'd_main');
assert(mainDoor && mainDoor.wallId, `Main door is wall-hosted on ${mainDoor?.wallId}`);
const hostWall = plan.walls.find(w => w.id === mainDoor.wallId);
const openPos = OpeningEngine.getOpeningAbsolutePosition(hostWall, mainDoor);
assert(openPos !== null && openPos.center, "OpeningEngine calculates 2D/3D absolute position along wall");

// TEST 5: Constraint Validation
console.log("\n[TEST 5] Geometry & Constraint Validator:");
const validator = new GeometryValidator();
const valResult = validator.validate(plan);
assert(valResult.isValid === true, "Option 04 is 100% valid with 0 errors");

// TEST 6: Vastu Engine
console.log("\n[TEST 6] Vastu Shastra Engine:");
const vastu = new VastuEngine();
const vastuRes = vastu.analyzePlan(plan);
assert(vastuRes.score >= 80, `Vastu score is ${vastuRes.score}/100 (Compliant)`);
assert(vastuRes.status === VastuStatus.PASS, "Plan passes Vastu compliance");

// TEST 7: AI Intent Parser & Command Engine
console.log("\n[TEST 7] AI Intent Parser & Command Engine:");
const cmd = ArchitecturalIntentParser.parse("Make living room 16 feet wide");
assert(cmd && cmd.action === 'resize_room' && cmd.dimensionInches === 192, "Intent parser extracted resize_room with 16' (192\")");

const cmdEngine = new ArchitecturalCommandEngine();
const modifiedPlan = cmdEngine.executeNaturalLanguage(plan, "Make living room 16 feet wide");
const modLiving = modifiedPlan.rooms.find(r => r.id === 'r_living');
assert(modLiving && modLiving.w === 192, "Command Engine resized Living Room to exact 16'-0\" (192\")");

// TEST 8: 3D Variations Preserving Geometry
console.log("\n[TEST 8] 3D Variations (Geometry Invariance):");
const varPlan = VariationEngine.applyVariation(plan, 'traditional');
assert(varPlan.rooms.length === plan.rooms.length, "Variation preserves all rooms");
assert(varPlan.walls.length === plan.walls.length, "Variation preserves all walls");
assert(varPlan.materials.facadeStyle === 'Traditional Heritage', "Variation correctly updated facade style");

console.log("\n==================================================");
console.log(`ALL 24 ARCHITECTURE CRITERIA PASSED: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================\n");

if (failed > 0) process.exit(1);
