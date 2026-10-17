/**
 * PlanGenerator.js - Deterministic Architectural CAD Floor Plan Generator
 * 
 * Generates exact, professional-quality CAD floor plans for ARBITRARY plot sizes
 * and dynamic room requirements using the DynamicLayoutSolver.
 */

import { RoomType, WallType, OpeningType, SwingDirection, createEmptyPlan } from './CanonicalSchema.js';
import { parseArchitecturalDimension, formatFeetInches, sqInchesToSqFt, formatRoomDimensions } from './UnitEngine.js';
import { CanonicalVastuEngine } from './CanonicalVastuEngine.js';
import { DynamicLayoutSolver } from './DynamicLayoutSolver.js';

const vastuEngine = new CanonicalVastuEngine();
const layoutSolver = new DynamicLayoutSolver();

export function generateDefaultFloorPlan(options = {}) {
    // 1. Plot Dimensions in Canonical INCHES (Supports feet, inches, m, mm)
    const rawWidth = options.width || options.plotWidth || 30;
    const rawLength = options.length || options.plotLength || 40;
    const unitSys = options.unitSystem || options.unit || options.units || 'feet';

    const siteWidth = parseArchitecturalDimension(rawWidth, unitSys);
    const siteLength = parseArchitecturalDimension(rawLength, unitSys);

    const widthFt = Math.round((siteWidth / 12) * 10) / 10;
    const lengthFt = Math.round((siteLength / 12) * 10) / 10;

    const facing = (options.facing || 'East').trim();
    const floors = Number(options.floors) || 1;
    const style = options.style || 'Standard Modern';
    const buildingType = options.type || options.buildingType || 'Residential';
    const projName = options.name || `${widthFt}×${lengthFt} ${facing} Residence`;
    const projId = options.id || `proj_${Date.now()}`;
    const client = options.client || 'Client';

    // 2. Initialize Canonical Plan Data Structure
    const plan = createEmptyPlan({
        id: projId,
        name: projName,
        client: client,
        type: buildingType,
        facing: facing,
        floors: floors,
        width: widthFt,
        length: lengthFt,
        style: style
    });

    plan.site.width = siteWidth;
    plan.site.length = siteLength;
    plan.site.facing = facing;

    const extWallThick = 9;  // 9" exterior wall
    const intWallThick = 4.5; // 4.5" interior partition wall

    // 3. Extract Room Requirements Catalog from options
    const userReqs = options.requirements || {};
    const roomCatalog = prepareRoomCatalog(options, userReqs, siteWidth, siteLength);
    plan.roomRequirements = roomCatalog;

    // 4. Run Dynamic Layout Solver to find optimal spatial arrangement
    const solverResult = layoutSolver.solveLayout(plan.site.buildableEnvelope, roomCatalog);

    // 5. Check Requirement Feasibility & Conflicts
    const reqVerification = [];
    roomCatalog.forEach(req => {
        if (req.width && req.length) {
            const exceedsEnvelope = (req.width > siteWidth - 36 || req.length > siteLength - 36) &&
                                    (req.length > siteWidth - 36 || req.width > siteLength - 36);
            if (exceedsEnvelope) {
                reqVerification.push({
                    requirement: `${req.name} ${Math.round(req.width/12)}' × ${Math.round(req.length/12)}'`,
                    status: 'CONSTRAINT_CONFLICT',
                    reason: `Requested ${req.name} (${Math.round(req.width/12)}'×${Math.round(req.length/12)}') exceeds building envelope`
                });
            }
        }
    });

    if (solverResult.conflict || !solverResult.success) {
        const conflictObj = typeof solverResult.conflict === 'object' && solverResult.conflict !== null
            ? solverResult.conflict
            : {
                status: 'INFEASIBLE',
                message: (solverResult.issues || []).join(' ') || 'Layout could not be solved within plot constraints while preserving exact dimensions.',
                requiredAreaSqFt: Math.round(roomCatalog.reduce((acc, r) => acc + ((r.width || 0) * (r.length || 0)), 0) / 144),
                usableAreaSqFt: Math.round(((plan.site?.buildableEnvelope?.width || 0) * (plan.site?.buildableEnvelope?.length || 0)) / 144),
                issues: solverResult.issues || []
            };

        plan.conflict = conflictObj;
        plan.feasibilityConflict = {
            isFeasible: false,
            status: 'INFEASIBLE',
            message: conflictObj.message,
            requiredAreaSqFt: conflictObj.requiredAreaSqFt,
            usableAreaSqFt: conflictObj.usableAreaSqFt,
            issues: solverResult.issues || ['Layout could not be solved within plot constraints.'],
            alternatives: solverResult.alternatives || [
                'Increase plot width or length',
                'Reduce the number of rooms or remove optional rooms',
                'Adjust individual room dimensions'
            ]
        };
        plan.metadata = plan.metadata || {};
        plan.metadata.feasibility = plan.feasibilityConflict;
        plan.metadata.requirementVerification = reqVerification;
        plan.metadata.solverStrategy = solverResult.strategy || 'Constraint Conflict';
        plan.metadata.solverScore = 0;
        plan.metadata.generator = 'ArchFlow Dynamic Geometry Engine v2.0';
        plan.metadata.generatedAt = new Date().toISOString();
        return plan;
    }

    const rooms = (solverResult.rooms || []).map(r => ({
        ...r,
        id: r.id || r.reqId || `r_${r.type}`,
        zone: getZoneForCoordinates(r.x, r.y, r.w, r.h, siteWidth, siteLength),
        clearDimensions: r.clearDimensions || {
            width: r.w,
            length: r.h,
            widthFt: Math.round((r.w / 12) * 10) / 10,
            lengthFt: Math.round((r.h / 12) * 10) / 10
        },
        dimensionLabel: formatRoomDimensions(r.w, r.h),
        areaSqFt: sqInchesToSqFt(r.w * r.h)
    }));
    plan.rooms = rooms;

    // 6. Build Canonical Wall Network around Placed Rooms
    const walls = generateWallNetwork(rooms, plan.site.buildableEnvelope, extWallThick, intWallThick);
    plan.walls = walls;

    // 7. Generate Doors Attached to Valid Walls
    const doors = generateDoors(rooms, walls, facing);
    plan.doors = doors;

    // 8. Generate Windows Attached to Exterior Walls
    const windows = generateWindows(rooms, walls, plan.site.buildableEnvelope);
    plan.windows = windows;

    // 9. Generate Vector CAD Furniture for Placed Rooms
    const furniture = generateFurniture(rooms);
    plan.furniture = furniture;

    // 10. Generate Staircase & Column Grid
    plan.stairs = generateStaircase(rooms, plan.site.buildableEnvelope);
    plan.columns = generateColumns(plan.site.buildableEnvelope, extWallThick);

    // 11. Generate Dimension Annotations
    plan.dimensions = [
        {
            id: 'dim_site_width',
            type: 'outer_horizontal',
            start: { x: 0, y: siteLength + 24 },
            end: { x: siteWidth, y: siteLength + 24 },
            label: `${formatFeetInches(siteWidth, false)} [PLOT WIDTH]`,
            valueInches: siteWidth
        },
        {
            id: 'dim_site_length',
            type: 'outer_vertical',
            start: { x: siteWidth + 24, y: 0 },
            end: { x: siteWidth + 24, y: siteLength },
            label: `${formatFeetInches(siteLength, false)} [PLOT LENGTH]`,
            valueInches: siteLength
        }
    ];

    // 12. Architectural Vastu Analysis on Final Spatial Geometry
    const vastuResult = vastuEngine.analyzePlan(plan);
    plan.vastu = vastuResult;

    // 13. Metadata and Diagnostics
    plan.conflict = false;
    plan.diagnostics = solverResult.diagnostics || {
        envelopeAreaSqFt: sqInchesToSqFt(plan.site.buildableEnvelope.width * plan.site.buildableEnvelope.length),
        totalBuiltUpAreaSqFt: sqInchesToSqFt(rooms.reduce((acc, r) => acc + (r.w * r.h), 0)),
        circulationAreaSqFt: Math.max(0, sqInchesToSqFt(plan.site.buildableEnvelope.width * plan.site.buildableEnvelope.length) - sqInchesToSqFt(rooms.reduce((acc, r) => acc + (r.w * r.h), 0))),
        explanation: 'Circulation area accommodates interior hallways, entry foyers, and functional clearances.'
    };

    plan.metadata = plan.metadata || {};
    plan.metadata.feasibility = { isFeasible: true, issues: [] };
    plan.metadata.requirementVerification = reqVerification;
    plan.metadata.solverStrategy = solverResult.strategy || 'Dynamic Layout Solver';
    plan.metadata.solverScore = solverResult.score || 100;
    plan.metadata.generator = 'ArchFlow Dynamic Geometry Engine v2.0';
    plan.metadata.generatedAt = new Date().toISOString();

    return plan;
}

function getZoneForCoordinates(x, y, w, h, maxW, maxL) {
    const cx = x + (w / 2);
    const cy = y + (h / 2);

    const isEast = cx >= maxW / 2;
    const isNorth = cy >= maxL / 2;

    if (!isEast && !isNorth) return 'SW'; // Nairutya
    if (isEast && !isNorth) return 'SE';  // Agneya
    if (isEast && isNorth) return 'NE';   // Ishanya
    return 'NW';                          // Vayavya
}

function prepareRoomCatalog(options, userReqs, siteWidth, siteLength) {
    // If canonical roomRequirements array is provided directly, prioritize it
    const explicitRooms = options.roomRequirements || userReqs.roomRequirements;
    if (Array.isArray(explicitRooms) && explicitRooms.length > 0) {
        return explicitRooms.map((r, idx) => {
            const wInches = r.widthInches || (r.widthFt ? r.widthFt * 12 : (r.width ? parseArchitecturalDimension(r.width, r.unit || options.units || 'feet') : null));
            const lInches = r.lengthInches || (r.lengthFt ? r.lengthFt * 12 : (r.length ? parseArchitecturalDimension(r.length, r.unit || options.units || 'feet') : null));
            const isExact = Boolean(r.isExact !== false && (wInches && lInches));

            return {
                id: r.id || `r_${r.type || 'room'}_${idx + 1}`,
                name: r.name || r.label || String(r.type || 'ROOM').toUpperCase(),
                type: r.type || RoomType.BEDROOM,
                width: wInches,
                length: lInches,
                exactDimensions: isExact,
                isExact: isExact,
                floor: r.floor || 1,
                attachedTo: r.attachedTo || null,
                isAttached: Boolean(r.isAttached || r.attachedTo || r.type === RoomType.ATTACHED_TOILET),
                preferredZone: r.preferredZone || null
            };
        });
    }

    const reqs = [];
    const bedroomsCount = Number(options.bedrooms || userReqs.bedrooms || 2);

    // Master Bedroom
    const mbW = userReqs.masterBedroom?.width ? parseArchitecturalDimension(userReqs.masterBedroom.width) : (userReqs.masterWidth ? parseArchitecturalDimension(userReqs.masterWidth) : null);
    const mbL = userReqs.masterBedroom?.length ? parseArchitecturalDimension(userReqs.masterBedroom.length) : (userReqs.masterLength ? parseArchitecturalDimension(userReqs.masterLength) : null);

    reqs.push({
        id: 'r_master_bedroom',
        name: 'MASTER BEDROOM',
        type: RoomType.MASTER_BEDROOM,
        width: mbW,
        length: mbL,
        exactDimensions: Boolean(mbW && mbL),
        isExact: Boolean(mbW && mbL),
        preferredZone: 'SW'
    });

    // Kitchen
    const kitW = userReqs.kitchen?.width ? parseArchitecturalDimension(userReqs.kitchen.width) : null;
    const kitL = userReqs.kitchen?.length ? parseArchitecturalDimension(userReqs.kitchen.length) : null;

    reqs.push({
        id: 'r_kitchen',
        name: 'KITCHEN',
        type: RoomType.KITCHEN,
        width: kitW,
        length: kitL,
        exactDimensions: Boolean(kitW && kitL),
        isExact: Boolean(kitW && kitL),
        preferredZone: 'SE'
    });

    // Living / Dining Hall
    reqs.push({
        id: 'r_living',
        name: 'LIVING & DINING',
        type: RoomType.LIVING,
        preferredZone: 'NE'
    });

    // Attached Toilet (to Master Bedroom)
    if (userReqs.attachedToilet !== false && options.attachedToilet !== false) {
        reqs.push({
            id: 'r_attached_toilet',
            name: 'ATT. TOILET',
            type: RoomType.ATTACHED_TOILET,
            width: 72,
            length: 60,
            attachedTo: 'r_master_bedroom',
            isAttached: true,
            preferredZone: 'W'
        });
    }

    // Additional Bedrooms
    for (let i = 2; i <= bedroomsCount; i++) {
        reqs.push({
            id: `r_bedroom_${i}`,
            name: `BEDROOM ${i}`,
            type: RoomType.BEDROOM,
            preferredZone: i % 2 === 0 ? 'NW' : 'E'
        });
    }

    // Common Bathroom (if bathrooms > 1)
    const totalBaths = Number(options.bathrooms || userReqs.bathrooms || 1);
    if (totalBaths > 1) {
        for (let b = 1; b < totalBaths; b++) {
            reqs.push({
                id: `r_common_bathroom_${b}`,
                name: totalBaths === 2 ? 'COMMON TOILET' : `COMMON TOILET ${b}`,
                type: RoomType.COMMON_BATHROOM,
                width: 72,
                length: 60,
                isAttached: false,
                preferredZone: 'W'
            });
        }
    }

    // Dining Room (if explicitly specified)
    if (options.dining > 0 || userReqs.dining > 0) {
        reqs.push({
            id: 'r_dining',
            name: 'DINING ROOM',
            type: RoomType.DINING,
            width: 144,
            length: 144,
            preferredZone: 'SE'
        });
    }

    // Pooja Room
    if (userReqs.pooja !== false && options.pooja !== false) {
        reqs.push({
            id: 'r_pooja',
            name: 'POOJA ROOM',
            type: RoomType.POOJA,
            width: 60,
            length: 60,
            preferredZone: 'NE'
        });
    }

    // Study Room / Office
    if (options.study > 0 || userReqs.study > 0) {
        reqs.push({
            id: 'r_study',
            name: 'STUDY ROOM',
            type: RoomType.STUDY,
            width: 120,
            length: 120,
            preferredZone: 'NW'
        });
    }

    // Store Room
    if (options.storeRoom > 0 || userReqs.storeRoom > 0) {
        reqs.push({
            id: 'r_store',
            name: 'STORE ROOM',
            type: RoomType.STORE,
            width: 84,
            length: 72,
            preferredZone: 'SW'
        });
    }

    // Utility / Wash Area
    if (options.utility > 0 || userReqs.utility > 0) {
        reqs.push({
            id: 'r_utility',
            name: 'UTILITY AREA',
            type: RoomType.UTILITY,
            width: 84,
            length: 60,
            preferredZone: 'SE'
        });
    }

    return reqs;
}

function generateWallNetwork(rooms, envelope, extThick, intThick) {
    const walls = [];
    const bLeft = envelope.x;
    const bBottom = envelope.y;
    const bRight = envelope.x + envelope.width;
    const bTop = envelope.y + envelope.length;

    walls.push({ id: 'w_ext_south', start: { x: bLeft, y: bBottom }, end: { x: bRight, y: bBottom }, thickness: extThick, height: 120, type: WallType.EXTERIOR, layer: 'WALLS_EXTERIOR' });
    walls.push({ id: 'w_ext_east',  start: { x: bRight, y: bBottom }, end: { x: bRight, y: bTop },    thickness: extThick, height: 120, type: WallType.EXTERIOR, layer: 'WALLS_EXTERIOR' });
    walls.push({ id: 'w_ext_north', start: { x: bRight, y: bTop },    end: { x: bLeft, y: bTop },     thickness: extThick, height: 120, type: WallType.EXTERIOR, layer: 'WALLS_EXTERIOR' });
    walls.push({ id: 'w_ext_west',  start: { x: bLeft, y: bTop },     end: { x: bLeft, y: bBottom },  thickness: extThick, height: 120, type: WallType.EXTERIOR, layer: 'WALLS_EXTERIOR' });

    rooms.forEach(r => {
        const rRight = r.x + r.w;
        const rTop = r.y + r.h;

        if (rTop < bTop - extThick) {
            walls.push({
                id: `w_int_${r.id}_n`,
                start: { x: r.x, y: rTop },
                end: { x: rRight, y: rTop },
                thickness: intThick,
                height: 120,
                type: WallType.INTERIOR,
                layer: 'WALLS_INTERIOR'
            });
        }

        if (rRight < bRight - extThick) {
            walls.push({
                id: `w_int_${r.id}_e`,
                start: { x: rRight, y: r.y },
                end: { x: rRight, y: rTop },
                thickness: intThick,
                height: 120,
                type: WallType.INTERIOR,
                layer: 'WALLS_INTERIOR'
            });
        }
    });

    return walls;
}

function generateDoors(rooms, walls, facing) {
    const doors = [];
    const mainDoorWall = facing.toLowerCase().includes('north') ? 'w_ext_north' : 'w_ext_east';

    doors.push({
        id: 'd_main_entrance',
        name: 'MAIN ENTRANCE (D1)',
        type: OpeningType.DOUBLE_DOOR,
        isMain: true,
        wallId: mainDoorWall,
        positionAlongWall: 72,
        width: 39,
        height: 84,
        swing: SwingDirection.RIGHT,
        tag: 'D1'
    });

    rooms.forEach(r => {
        const intWall = walls.find(w => w.type === WallType.INTERIOR && (w.id.includes(r.id) || w.start.y === r.y + r.h || w.start.x === r.x + r.w));
        if (intWall) {
            doors.push({
                id: `d_${r.id}`,
                name: `${r.name} DOOR`,
                type: r.type === RoomType.KITCHEN ? OpeningType.ARCH_OPENING : OpeningType.SINGLE_DOOR,
                wallId: intWall.id,
                positionAlongWall: 18,
                width: r.type === RoomType.ATTACHED_TOILET ? 30 : 36,
                height: 84,
                swing: SwingDirection.RIGHT,
                tag: r.type === RoomType.ATTACHED_TOILET ? 'D3' : 'D2'
            });
        }
    });

    return doors;
}

function generateWindows(rooms, walls, envelope) {
    const windows = [];

    rooms.forEach(r => {
        if (r.x <= envelope.x + 12) {
            windows.push({
                id: `win_${r.id}_west`,
                name: `${r.name} WINDOW`,
                type: OpeningType.STANDARD_WINDOW,
                wallId: 'w_ext_west',
                positionAlongWall: Math.max(12, r.y - envelope.y + 18),
                width: 48,
                height: 48,
                sillHeight: 36,
                tag: 'W1'
            });
        } else if (r.x + r.w >= envelope.x + envelope.width - 12) {
            windows.push({
                id: `win_${r.id}_east`,
                name: `${r.name} WINDOW`,
                type: OpeningType.STANDARD_WINDOW,
                wallId: 'w_ext_east',
                positionAlongWall: Math.max(12, r.y - envelope.y + 18),
                width: 48,
                height: 48,
                sillHeight: 36,
                tag: 'W1'
            });
        }
    });

    return windows;
}

function generateFurniture(rooms) {
    const furniture = [];

    rooms.forEach(r => {
        if (r.type === RoomType.MASTER_BEDROOM || r.type === RoomType.BEDROOM) {
            furniture.push({
                id: `furn_bed_${r.id}`,
                name: 'BED',
                type: 'bed',
                roomId: r.id,
                x: r.x + 18,
                y: r.y + 18,
                width: Math.min(72, r.w - 36),
                length: Math.min(78, r.h - 36),
                rotation: 0
            });
        } else if (r.type === RoomType.KITCHEN) {
            furniture.push({
                id: `furn_counter_${r.id}`,
                name: 'GRANITE COUNTER',
                type: 'kitchen_counter',
                roomId: r.id,
                x: r.x + 6,
                y: r.y + 6,
                width: Math.max(48, r.w - 12),
                length: 24,
                rotation: 0
            });
        }
    });

    return furniture;
}

function generateStaircase(rooms, envelope) {
    return [
        {
            id: 'stair_main',
            name: 'RCC STAIRCASE',
            x: envelope.x + 24,
            y: envelope.y + Math.round(envelope.length * 0.45),
            width: 36,
            length: 84,
            treads: 12,
            direction: 'UP',
            layer: 'STAIRS'
        }
    ];
}

function generateColumns(envelope, wallThick) {
    const bLeft = envelope.x;
    const bBottom = envelope.y;
    const bRight = envelope.x + envelope.width;
    const bTop = envelope.y + envelope.length;

    return [
        { id: 'col_sw', x: bLeft, y: bBottom, width: wallThick, length: wallThick },
        { id: 'col_se', x: bRight - wallThick, y: bBottom, width: wallThick, length: wallThick },
        { id: 'col_ne', x: bRight - wallThick, y: bTop - wallThick, width: wallThick, length: wallThick },
        { id: 'col_nw', x: bLeft, y: bTop - wallThick, width: wallThick, length: wallThick }
    ];
}

export default generateDefaultFloorPlan;
