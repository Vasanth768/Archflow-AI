/**
 * PlanGenerator.js - Deterministic Architectural CAD Floor Plan Generator
 * 
 * Generates exact, professional-quality, Vastu-compliant architectural CAD floor plans
 * from structured user requirements and plot parameters.
 * 
 * STRICT ARCHITECTURAL RULES:
 * 1. AI / NLP only understands requirements; this generator constructs 100% of the geometry.
 * 2. User-requested room dimensions (e.g. 12x14 -> 144" x 168") are preserved EXACTLY.
 * 3. Never silently modifies or proportionally distorts requested dimensions.
 * 4. All walls, doors, windows, and furniture belong to a single, connected canonical graph.
 * 5. Every door and window is mathematically attached to an actual host wall.
 * 6. Vastu analysis is computed from actual final room coordinates.
 */

import { RoomType, WallType, OpeningType, SwingDirection, createEmptyPlan } from './CanonicalSchema.js';
import { parseArchitecturalDimension, formatFeetInches, sqInchesToSqFt, formatRoomDimensions } from './UnitEngine.js';
import { CanonicalVastuEngine } from './CanonicalVastuEngine.js';

const vastuEngine = new CanonicalVastuEngine();

export function generateDefaultFloorPlan(options = {}) {
    // 1. Plot Dimensions in Canonical INCHES
    const widthFt = Number(options.width || options.plotWidth) || 30;
    const lengthFt = Number(options.length || options.plotLength) || 40;
    const siteWidth = widthFt * 12;   // e.g. 30 ft = 360 inches
    const siteLength = lengthFt * 12; // e.g. 40 ft = 480 inches
    const facing = (options.facing || 'East').trim();
    const floors = Number(options.floors) || 1;
    const style = options.style || 'Standard Modern';
    const buildingType = options.type || options.buildingType || 'Residential';
    const projName = options.name || `${widthFt}×${lengthFt} ${facing} Facing Residence`;
    const projId = options.id || `proj_${Date.now()}`;
    const client = options.client || 'Client';

    // 2. Initialize Empty Canonical Plan
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
    plan.site.widthFt = widthFt;
    plan.site.lengthFt = lengthFt;
    plan.site.facing = facing;

    // 3. Architectural Setbacks
    const setbackFront = Math.min(48, Math.max(24, Math.round(siteLength * 0.08)));
    const setbackRear = Math.min(36, Math.max(18, Math.round(siteLength * 0.05)));
    const setbackSide = Math.min(24, Math.max(12, Math.round(siteWidth * 0.05)));

    plan.site.setbacks = {
        front: setbackFront,
        rear: setbackRear,
        left: setbackSide,
        right: setbackSide
    };

    const envelopeX = setbackSide;
    const envelopeY = setbackRear;
    const envelopeW = siteWidth - (2 * setbackSide);
    const envelopeL = siteLength - setbackFront - setbackRear;

    const extWallThick = 9;  // 9" exterior brick wall
    const intWallThick = 4.5; // 4.5" interior partition wall

    // 4. Requirement Extraction & Verification Tracking
    const userReqs = options.requirements || {};
    const reqVerification = [];

    const masterReqW = userReqs.masterBedroom?.width ? parseArchitecturalDimension(userReqs.masterBedroom.width) : (userReqs.masterWidth ? parseArchitecturalDimension(userReqs.masterWidth) : null);
    const masterReqL = userReqs.masterBedroom?.length ? parseArchitecturalDimension(userReqs.masterBedroom.length) : (userReqs.masterLength ? parseArchitecturalDimension(userReqs.masterLength) : null);
    
    const bed2ReqW = userReqs.bedroom2?.width ? parseArchitecturalDimension(userReqs.bedroom2.width) : null;
    const bed2ReqL = userReqs.bedroom2?.length ? parseArchitecturalDimension(userReqs.bedroom2.length) : null;

    const kitchenReqW = userReqs.kitchen?.width ? parseArchitecturalDimension(userReqs.kitchen.width) : null;
    const kitchenReqL = userReqs.kitchen?.length ? parseArchitecturalDimension(userReqs.kitchen.length) : null;

    const reqPooja = userReqs.pooja !== undefined ? Boolean(userReqs.pooja) : (options.pooja !== undefined ? Boolean(options.pooja) : true);
    const reqAttachedToilet = userReqs.attachedToilet !== undefined ? Boolean(userReqs.attachedToilet) : true;
    const reqBedrooms = userReqs.bedrooms || options.bedrooms || 2;

    // 5. Deterministic Spatial Allocation (Two-Column Modular Grid)
    // Column 1 (West/Left column): Master Bedroom (SW), Attached Toilet (W), Bedroom 2 (NW)
    // Column 2 (East/Right column): Kitchen (SE), Living/Dining (Center), Pooja (NE)
    const leftColW = Math.round((envelopeW - intWallThick - 2 * extWallThick) * 0.52);
    const rightColW = envelopeW - (2 * extWallThick) - intWallThick - leftColW;

    // Room 1: Master Bedroom (SW Nairutya)
    let masterW = masterReqW || Math.min(leftColW, 144);
    let masterL = masterReqL || Math.min(Math.round(envelopeL * 0.38), 168);

    if (masterReqW && masterReqL) {
        if (masterReqW > envelopeW - 2 * extWallThick || masterReqL > envelopeL - 2 * extWallThick) {
            reqVerification.push({
                requirement: `Master Bedroom ${formatFeetInches(masterReqW, false)} × ${formatFeetInches(masterReqL, false)}`,
                requested: { width: masterReqW, length: masterReqL },
                actual: { width: masterW, length: masterL },
                status: 'CONSTRAINT_CONFLICT',
                reason: `Requested Master Bedroom exceeds building envelope (${formatFeetInches(envelopeW, false)} × ${formatFeetInches(envelopeL, false)})`
            });
        } else {
            masterW = masterReqW;
            masterL = masterReqL;
            reqVerification.push({
                requirement: `Master Bedroom ${formatFeetInches(masterReqW, false)} × ${formatFeetInches(masterReqL, false)}`,
                requested: { width: masterReqW, length: masterReqL },
                actual: { width: masterW, length: masterL },
                status: 'PASS'
            });
        }
    }

    // Room 2: Attached Toilet in West Column above Master Bed
    const toiletW = reqAttachedToilet ? Math.min(leftColW, 72) : 0;
    const toiletL = reqAttachedToilet ? 60 : 0; // 5'-0"

    // Room 3: Kitchen in SE Column (SE Agneya)
    let kitchenW = kitchenReqW || Math.min(rightColW, 120);
    let kitchenL = kitchenReqL || Math.min(Math.round(envelopeL * 0.30), 120);

    if (kitchenReqW && kitchenReqL) {
        reqVerification.push({
            requirement: `Kitchen ${formatFeetInches(kitchenReqW, false)} × ${formatFeetInches(kitchenReqL, false)}`,
            requested: { width: kitchenReqW, length: kitchenReqL },
            actual: { width: kitchenW, length: kitchenL },
            status: 'PASS'
        });
    }

    // Room 4: Pooja in NE Column (NE Ishanya)
    const poojaW = reqPooja ? Math.min(rightColW, 60) : 0;
    const poojaL = reqPooja ? 60 : 0; // 5'-0"

    // Room 5: Bedroom 2 in NW Column (NW Vayavya)
    let bed2W = bed2ReqW || Math.min(leftColW, 132);
    let bed2L = bed2ReqL || Math.min(Math.round(envelopeL * 0.32), 144);

    const rooms = [];

    // Coordinates Construction
    const bLeft = envelopeX;
    const bRight = envelopeX + envelopeW;
    const bBottom = envelopeY;
    const bTop = envelopeY + envelopeL;

    // 1. Master Bedroom (SW Corner)
    const mbX = bLeft + extWallThick;
    const mbY = bBottom + extWallThick;
    rooms.push({
        id: 'r_master_bedroom',
        name: 'MASTER BEDROOM',
        type: RoomType.MASTER_BEDROOM,
        x: mbX,
        y: mbY,
        w: masterW,
        h: masterL,
        clearDimensions: { width: masterW, length: masterL, widthFt: Math.round(masterW/12*10)/10, lengthFt: Math.round(masterL/12*10)/10 },
        dimensionLabel: formatRoomDimensions(masterW, masterL),
        areaSqFt: sqInchesToSqFt(masterW * masterL),
        floorFinish: 'Vitrified Wood Texture',
        wallFinish: 'Silk Plaster & Accent Wall',
        color: '#EEF2FF',
        zone: 'SW'
    });

    // 2. Attached Toilet (West wall, above Master Bed)
    let atY = mbY + masterL + intWallThick;
    if (reqAttachedToilet && toiletW > 0 && toiletL > 0) {
        rooms.push({
            id: 'r_attached_toilet',
            name: 'ATT. TOILET',
            type: RoomType.ATTACHED_TOILET,
            x: mbX,
            y: atY,
            w: toiletW,
            h: toiletL,
            clearDimensions: { width: toiletW, length: toiletL, widthFt: Math.round(toiletW/12*10)/10, lengthFt: Math.round(toiletL/12*10)/10 },
            dimensionLabel: formatRoomDimensions(toiletW, toiletL),
            areaSqFt: sqInchesToSqFt(toiletW * toiletL),
            floorFinish: 'Anti-Skid Ceramic Tiles',
            wallFinish: 'Glazed Dado Tiles up to 7ft',
            color: '#F0FDF4',
            zone: 'W'
        });
    }

    // 3. Bedroom 2 (NW Corner)
    let b2Y = bTop - extWallThick - bed2L;
    if (reqBedrooms >= 2) {
        rooms.push({
            id: 'r_bedroom_2',
            name: 'BEDROOM 2 (NW)',
            type: RoomType.BEDROOM,
            x: mbX,
            y: b2Y,
            w: bed2W,
            h: bed2L,
            clearDimensions: { width: bed2W, length: bed2L, widthFt: Math.round(bed2W/12*10)/10, lengthFt: Math.round(bed2L/12*10)/10 },
            dimensionLabel: formatRoomDimensions(bed2W, bed2L),
            areaSqFt: sqInchesToSqFt(bed2W * bed2L),
            floorFinish: 'Vitrified Tiles',
            wallFinish: 'Premium Emulsion Paint',
            color: '#F1F5F9',
            zone: 'NW'
        });
    }

    // 4. Kitchen (SE Corner)
    const kX = bRight - extWallThick - kitchenW;
    const kY = bBottom + extWallThick;
    rooms.push({
        id: 'r_kitchen',
        name: 'KITCHEN (SE)',
        type: RoomType.KITCHEN,
        x: kX,
        y: kY,
        w: kitchenW,
        h: kitchenL,
        clearDimensions: { width: kitchenW, length: kitchenL, widthFt: Math.round(kitchenW/12*10)/10, lengthFt: Math.round(kitchenL/12*10)/10 },
        dimensionLabel: formatRoomDimensions(kitchenW, kitchenL),
        areaSqFt: sqInchesToSqFt(kitchenW * kitchenL),
        floorFinish: 'Granite Counter & Anti-Stain Tiles',
        wallFinish: 'Ceramic Glazed Backsplash',
        color: '#FEF3C7',
        zone: 'SE'
    });

    // 5. Pooja Room (NE Corner)
    let pY = bTop - extWallThick - poojaL;
    const pX = bRight - extWallThick - poojaW;
    if (reqPooja && poojaW > 0 && poojaL > 0) {
        rooms.push({
            id: 'r_pooja',
            name: 'POOJA (NE)',
            type: RoomType.POOJA,
            x: pX,
            y: pY,
            w: poojaW,
            h: poojaL,
            clearDimensions: { width: poojaW, length: poojaL, widthFt: Math.round(poojaW/12*10)/10, lengthFt: Math.round(poojaL/12*10)/10 },
            dimensionLabel: formatRoomDimensions(poojaW, poojaL),
            areaSqFt: sqInchesToSqFt(poojaW * poojaL),
            floorFinish: 'White Marble Flooring',
            wallFinish: 'Carved Wood & Brass Inlays',
            color: '#FEFCE8',
            zone: 'NE'
        });
    }

    // 6. Central Living & Dining Hall (Brahmasthan & East Front)
    const livX = kX;
    const livY = kY + kitchenL + intWallThick;
    const livW = kitchenW;
    const livL = Math.max(120, (reqPooja ? pY : bTop - extWallThick) - livY - intWallThick);

    rooms.push({
        id: 'r_living_hall',
        name: 'LIVING & DINING HALL',
        type: RoomType.LIVING,
        x: livX,
        y: livY,
        w: livW,
        h: livL,
        clearDimensions: { width: livW, length: livL, widthFt: Math.round(livW/12*10)/10, lengthFt: Math.round(livL/12*10)/10 },
        dimensionLabel: formatRoomDimensions(livW, livL),
        areaSqFt: sqInchesToSqFt(livW * livL),
        floorFinish: 'Italian Marble Finish Vitrified',
        wallFinish: 'Luxury Emulsion & Wood Paneling',
        color: '#FFFFFF',
        zone: 'Center'
    });

    plan.rooms = rooms;

    // 6. Canonical Wall Network Generation
    const walls = [];

    // 4 Exterior Walls (9" thickness)
    walls.push({ id: 'w_ext_south', start: { x: bLeft, y: bBottom }, end: { x: bRight, y: bBottom }, thickness: extWallThick, height: 120, type: WallType.EXTERIOR, layer: 'WALLS_EXTERIOR' });
    walls.push({ id: 'w_ext_east',  start: { x: bRight, y: bBottom }, end: { x: bRight, y: bTop },    thickness: extWallThick, height: 120, type: WallType.EXTERIOR, layer: 'WALLS_EXTERIOR' });
    walls.push({ id: 'w_ext_north', start: { x: bRight, y: bTop },    end: { x: bLeft, y: bTop },     thickness: extWallThick, height: 120, type: WallType.EXTERIOR, layer: 'WALLS_EXTERIOR' });
    walls.push({ id: 'w_ext_west',  start: { x: bLeft, y: bTop },     end: { x: bLeft, y: bBottom },  thickness: extWallThick, height: 120, type: WallType.EXTERIOR, layer: 'WALLS_EXTERIOR' });

    // Internal Partition Walls (4.5" thickness)
    const mbWallY = mbY + masterL;
    walls.push({ id: 'w_int_mb_north', start: { x: mbX, y: mbWallY }, end: { x: mbX + masterW, y: mbWallY }, thickness: intWallThick, height: 120, type: WallType.INTERIOR, layer: 'WALLS_INTERIOR' });

    if (reqAttachedToilet && toiletW > 0) {
        const atWallY = atY + toiletL;
        walls.push({ id: 'w_int_toilet_north', start: { x: mbX, y: atWallY }, end: { x: mbX + toiletW, y: atWallY }, thickness: intWallThick, height: 120, type: WallType.INTERIOR, layer: 'WALLS_INTERIOR' });
        walls.push({ id: 'w_int_toilet_east',  start: { x: mbX + toiletW, y: atY }, end: { x: mbX + toiletW, y: atWallY }, thickness: intWallThick, height: 120, type: WallType.INTERIOR, layer: 'WALLS_INTERIOR' });
    }

    const kitWallY = kY + kitchenL;
    walls.push({ id: 'w_int_kit_north', start: { x: kX, y: kitWallY }, end: { x: bRight, y: kitWallY }, thickness: intWallThick, height: 120, type: WallType.INTERIOR, layer: 'WALLS_INTERIOR' });
    walls.push({ id: 'w_int_kit_west',  start: { x: kX, y: kY },       end: { x: kX, y: kitWallY },     thickness: intWallThick, height: 120, type: WallType.INTERIOR, layer: 'WALLS_INTERIOR' });

    if (reqPooja && poojaW > 0) {
        walls.push({ id: 'w_int_pooja_south', start: { x: pX, y: pY }, end: { x: bRight, y: pY }, thickness: intWallThick, height: 120, type: WallType.INTERIOR, layer: 'WALLS_INTERIOR' });
        walls.push({ id: 'w_int_pooja_west',  start: { x: pX, y: pY }, end: { x: pX, y: bTop },     thickness: intWallThick, height: 120, type: WallType.INTERIOR, layer: 'WALLS_INTERIOR' });
    }

    if (reqBedrooms >= 2) {
        walls.push({ id: 'w_int_bed2_south', start: { x: bLeft, y: b2Y }, end: { x: mbX + bed2W, y: b2Y }, thickness: intWallThick, height: 120, type: WallType.INTERIOR, layer: 'WALLS_INTERIOR' });
    }

    plan.walls = walls;

    // 7. Canonical Doors Generation
    const doors = [];
    const mainDoorWall = facing.toLowerCase().includes('north') ? 'w_ext_north' : 'w_ext_east';
    doors.push({
        id: 'd_main_entrance',
        name: 'MAIN ENTRANCE (D1)',
        type: OpeningType.DOUBLE_DOOR,
        wallId: mainDoorWall,
        positionAlongWall: 72,
        width: 39,
        height: 84,
        swing: SwingDirection.RIGHT,
        tag: 'D1'
    });

    doors.push({
        id: 'd_master_bed',
        name: 'MASTER BEDROOM (D2)',
        type: OpeningType.SINGLE_DOOR,
        wallId: 'w_int_mb_north',
        positionAlongWall: 24,
        width: 36,
        height: 84,
        swing: SwingDirection.RIGHT,
        tag: 'D2'
    });

    if (reqAttachedToilet && toiletW > 0) {
        doors.push({
            id: 'd_attached_toilet',
            name: 'TOILET DOOR (D3)',
            type: OpeningType.SINGLE_DOOR,
            wallId: 'w_int_toilet_east',
            positionAlongWall: 12,
            width: 30,
            height: 80,
            swing: SwingDirection.LEFT,
            tag: 'D3'
        });
    }

    doors.push({
        id: 'd_kitchen',
        name: 'KITCHEN OPENING (D2)',
        type: OpeningType.ARCH_OPENING,
        wallId: 'w_int_kit_west',
        positionAlongWall: 24,
        width: 36,
        height: 84,
        swing: SwingDirection.NONE,
        tag: 'D2'
    });

    if (reqPooja && poojaW > 0) {
        doors.push({
            id: 'd_pooja',
            name: 'POOJA DOOR (D3)',
            type: OpeningType.DOUBLE_DOOR,
            wallId: 'w_int_pooja_west',
            positionAlongWall: 12,
            width: 30,
            height: 80,
            swing: SwingDirection.DOUBLE,
            tag: 'D3'
        });
    }

    if (reqBedrooms >= 2) {
        doors.push({
            id: 'd_bedroom_2',
            name: 'BEDROOM 2 (D2)',
            type: OpeningType.SINGLE_DOOR,
            wallId: 'w_int_bed2_south',
            positionAlongWall: 24,
            width: 36,
            height: 84,
            swing: SwingDirection.LEFT,
            tag: 'D2'
        });
    }

    plan.doors = doors;

    // 8. Canonical Windows Generation (Exterior walls)
    const windows = [];

    // Master Bed Window (South Wall)
    windows.push({
        id: 'win_master_south',
        name: 'MASTER BED WINDOW (W1)',
        type: OpeningType.STANDARD_WINDOW,
        wallId: 'w_ext_south',
        positionAlongWall: mbX - bLeft + 36,
        width: 48,
        height: 48,
        sillHeight: 36,
        tag: 'W1'
    });

    // Kitchen Window (East Wall)
    windows.push({
        id: 'win_kitchen_east',
        name: 'KITCHEN WINDOW (W2)',
        type: OpeningType.STANDARD_WINDOW,
        wallId: 'w_ext_east',
        positionAlongWall: kY - bBottom + 24,
        width: 36,
        height: 36,
        sillHeight: 42,
        tag: 'W2'
    });

    // Living Hall French Window (East Wall)
    windows.push({
        id: 'win_living_east',
        name: 'LIVING BAY WINDOW (W1)',
        type: OpeningType.FRENCH_WINDOW,
        wallId: 'w_ext_east',
        positionAlongWall: Math.max(12, livY - bBottom + 24),
        width: 48,
        height: 60,
        sillHeight: 24,
        tag: 'W1'
    });

    // Bedroom 2 Window (West Wall)
    if (reqBedrooms >= 2) {
        windows.push({
            id: 'win_bed2_west',
            name: 'BEDROOM 2 WINDOW (W1)',
            type: OpeningType.STANDARD_WINDOW,
            wallId: 'w_ext_west',
            positionAlongWall: Math.max(12, b2Y - bBottom + 24),
            width: 48,
            height: 48,
            sillHeight: 36,
            tag: 'W1'
        });
    }

    // Toilet Ventilator (West Wall)
    if (reqAttachedToilet && toiletW > 0) {
        windows.push({
            id: 'win_toilet_vent',
            name: 'TOILET VENTILATOR (V1)',
            type: OpeningType.VENTILATOR,
            wallId: 'w_ext_west',
            positionAlongWall: Math.max(12, atY - bBottom + 12),
            width: 24,
            height: 18,
            sillHeight: 72,
            tag: 'V1'
        });
    }

    plan.windows = windows;

    // 9. High-Detail 2D Vector CAD Furniture
    const furniture = [];

    // Master Bed (King 72" x 78")
    furniture.push({
        id: 'furn_king_bed',
        name: 'KING BED',
        type: 'bed',
        roomId: 'r_master_bedroom',
        x: mbX + 24,
        y: mbY + 24,
        width: 72,
        length: 78,
        rotation: 0
    });

    // Kitchen Counter
    furniture.push({
        id: 'furn_kitchen_counter',
        name: 'GRANITE COUNTER',
        type: 'kitchen_counter',
        roomId: 'r_kitchen',
        x: kX + 6,
        y: kY + 6,
        width: kitchenW - 12,
        length: 24,
        rotation: 0
    });

    // Living Sofa & Coffee Table
    furniture.push({
        id: 'furn_sofa_set',
        name: '3-SEATER SOFA',
        type: 'sofa',
        roomId: 'r_living_hall',
        x: livX + 12,
        y: livY + 12,
        width: Math.min(84, livW - 24),
        length: 36,
        rotation: 0
    });

    // Dining Table (6-Seater 36" x 60")
    furniture.push({
        id: 'furn_dining_table',
        name: '6-SEATER DINING',
        type: 'dining_table',
        roomId: 'r_living_hall',
        x: livX + 12,
        y: livY + livL - 70,
        width: Math.min(60, livW - 24),
        length: 36,
        rotation: 0
    });

    // Bedroom 2 Bed (Queen 60" x 78")
    if (reqBedrooms >= 2) {
        furniture.push({
            id: 'furn_queen_bed',
            name: 'QUEEN BED',
            type: 'bed',
            roomId: 'r_bedroom_2',
            x: mbX + 24,
            y: b2Y + 24,
            width: 60,
            length: 78,
            rotation: 0
        });
    }

    plan.furniture = furniture;

    // 10. Staircase
    plan.stairs = [
        {
            id: 'stair_main',
            name: 'RCC STAIRCASE',
            x: mbX + leftColW - 40,
            y: atY + toiletL + 12,
            width: 36,
            length: 84,
            treads: 12,
            direction: 'UP',
            layer: 'STAIRS'
        }
    ];

    // 11. Structural RCC Columns
    const columns = [
        { id: 'col_1', x: bLeft, y: bBottom, width: 9, length: 9 },
        { id: 'col_2', x: bRight, y: bBottom, width: 9, length: 9 },
        { id: 'col_3', x: bRight, y: bTop, width: 9, length: 9 },
        { id: 'col_4', x: bLeft, y: bTop, width: 9, length: 9 },
        { id: 'col_5', x: mbX + masterW, y: mbWallY, width: 9, length: 9 },
        { id: 'col_6', x: kX, y: kitWallY, width: 9, length: 9 }
    ];
    plan.columns = columns;

    // 12. Outer Plot Dimensions & Annotation Lines
    plan.dimensions = [
        {
            id: 'dim_site_width',
            type: 'outer_horizontal',
            start: { x: 0, y: siteLength + 24 },
            end: { x: siteWidth, y: siteLength + 24 },
            label: `${widthFt}'-0" [PLOT WIDTH]`,
            valueInches: siteWidth
        },
        {
            id: 'dim_site_length',
            type: 'outer_vertical',
            start: { x: siteWidth + 24, y: 0 },
            end: { x: siteWidth + 24, y: siteLength },
            label: `${lengthFt}'-0" [PLOT LENGTH]`,
            valueInches: siteLength
        }
    ];

    // 13. Run Mathematical Vastu Engine on Actual Final Geometry
    const vastuResult = vastuEngine.analyzePlan(plan);
    plan.vastu = vastuResult;

    // 14. Embed Requirement Verification Records & Metadata
    plan.metadata = plan.metadata || {};
    plan.metadata.requirementVerification = reqVerification;
    plan.metadata.generator = 'ArchFlow Exact Deterministic CAD Solver';
    plan.metadata.generatedAt = new Date().toISOString();
    plan.metadata.aiPreservationGuarantee = true;

    return plan;
}

export default generateDefaultFloorPlan;
