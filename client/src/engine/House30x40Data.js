/**
 * House30x40Data.js - Canonical CAD Model for "30x40 East Facing House"
 * 
 * Vastu-Compliant Architectural CAD Plan for East-Facing 2-Floor Residential Plot:
 * - Orientation: East-Facing (Main entrance and road on East side / bottom)
 * - North-East (Ishan): Pooja Room (5'x5') & Auspicious Entrance
 * - South-East (Agneya): Kitchen (10'x11') with East-facing cooking
 * - South-West (Nairutya): Master Bedroom (12'x12') for optimal stability
 * - North-West (Vayavya): Bedroom 2 (11'x11') for guests/children
 * - West / North-West: Toilet (5'x7') away from North-East
 * - South / West: Staircase (7'6"x8'0") with clockwise ascent
 * - Center / East: Living Hall (16'6"x15'0") & Dining (10'x11') with open Brahmasthan
 * - North-East Driveway: Parking (11'x16') with luxury sedan
 * - East Front: Sitout Porch (10'6"x5'0") with entrance steps & potted plants
 */

export const House30x40CAD = {
    schemaVersion: '2.0.0',
    project: {
        id: 'f1',
        name: '30x40 East Facing House',
        client: 'KS Infra',
        type: 'Residential',
        facing: 'East',
        floors: 2,
        unitSystem: 'imperial',
        status: 'Saved',
        createdAt: '2026-08-20T10:00:00.000Z',
        lastUpdated: new Date().toISOString()
    },
    site: {
        width: 480,  // 40'-0" horizontal in inches
        length: 360, // 30'-0" vertical in inches
        widthFt: 40,
        lengthFt: 30,
        facing: 'East',
        setbacks: { front: 36, rear: 24, left: 24, right: 24 }
    },
    floors: [
        {
            id: 'floor_0',
            name: 'Ground Floor',
            elevation: 0,
            height: 120 // 10'-0"
        },
        {
            id: 'floor_1',
            name: 'First Floor',
            elevation: 120,
            height: 120
        }
    ],

    // Structural Wall Network (9" exterior, 4.5" interior partitions)
    walls: [
        // Exterior Boundary Walls (9" thick)
        { id: 'w_ext_top_1', start: { x: 0, y: 0 }, end: { x: 145.5, y: 0 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_top_2', start: { x: 145.5, y: 0 }, end: { x: 336, y: 0 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_top_3', start: { x: 336, y: 0 }, end: { x: 480, y: 0 }, thickness: 9, height: 120, type: 'exterior' },
        
        { id: 'w_ext_left_bed2', start: { x: 0, y: 0 }, end: { x: 0, y: 145.5 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_left_parking', start: { x: 0, y: 145.5 }, end: { x: 0, y: 360 }, thickness: 9, height: 120, type: 'exterior' },

        { id: 'w_ext_right_master', start: { x: 480, y: 0 }, end: { x: 480, y: 153 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_right_kitchen', start: { x: 480, y: 153 }, end: { x: 480, y: 360 }, thickness: 9, height: 120, type: 'exterior' },

        { id: 'w_ext_bot_parking', start: { x: 0, y: 360 }, end: { x: 145.5, y: 360 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_bot_living_left', start: { x: 145.5, y: 360 }, end: { x: 210, y: 360 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_bot_kitchen', start: { x: 336, y: 360 }, end: { x: 480, y: 360 }, thickness: 9, height: 120, type: 'exterior' },

        // Sitout Porch Walls (9" thick)
        { id: 'w_sitout_left', start: { x: 210, y: 360 }, end: { x: 210, y: 411 }, thickness: 9, height: 48, type: 'exterior' },
        { id: 'w_sitout_bot', start: { x: 210, y: 411 }, end: { x: 336, y: 411 }, thickness: 9, height: 48, type: 'exterior' },
        { id: 'w_sitout_right', start: { x: 336, y: 360 }, end: { x: 336, y: 411 }, thickness: 9, height: 48, type: 'exterior' },

        // Interior Partition Walls (4.5" thick)
        // Bedroom 2 (NW) / Toilet / Dining dividing walls
        { id: 'w_int_bed2_bot', start: { x: 0, y: 145.5 }, end: { x: 145.5, y: 145.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_bed2_right', start: { x: 145.5, y: 0 }, end: { x: 145.5, y: 145.5 }, thickness: 4.5, height: 120, type: 'interior' },
        
        // Toilet Walls (West)
        { id: 'w_int_toilet_bot', start: { x: 145.5, y: 93 }, end: { x: 210, y: 93 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_toilet_right', start: { x: 210, y: 0 }, end: { x: 210, y: 93 }, thickness: 4.5, height: 120, type: 'interior' },

        // Staircase Walls (South/West)
        { id: 'w_int_stair_bot', start: { x: 210, y: 105 }, end: { x: 300, y: 105 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_stair_right', start: { x: 300, y: 0 }, end: { x: 300, y: 105 }, thickness: 4.5, height: 120, type: 'interior' },

        // Master Bedroom (SW) Partition Walls
        { id: 'w_int_master_left', start: { x: 336, y: 0 }, end: { x: 336, y: 153 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_master_bot', start: { x: 336, y: 153 }, end: { x: 480, y: 153 }, thickness: 4.5, height: 120, type: 'interior' },

        // Parking / Living-Dining dividing wall
        { id: 'w_int_parking_right', start: { x: 145.5, y: 145.5 }, end: { x: 145.5, y: 360 }, thickness: 4.5, height: 120, type: 'interior' },

        // Kitchen (SE) Partition Walls
        { id: 'w_int_kitchen_top', start: { x: 351, y: 228 }, end: { x: 480, y: 228 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_kitchen_left', start: { x: 351, y: 228 }, end: { x: 351, y: 360 }, thickness: 4.5, height: 120, type: 'interior' },

        // Pooja Room (NE) Partition Walls
        { id: 'w_int_pooja_top', start: { x: 145.5, y: 295.5 }, end: { x: 210, y: 295.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_pooja_right', start: { x: 210, y: 295.5 }, end: { x: 210, y: 360 }, thickness: 4.5, height: 120, type: 'interior' }
    ],

    // Vastu-Compliant Enclosed Functional Rooms
    rooms: [
        {
            id: 'r_bed2',
            name: 'BEDROOM 2',
            type: 'bedroom',
            vastuZone: 'North-West (Vayavya)',
            x: 9, y: 9, w: 136.5, h: 136.5,
            clearDimensions: { width: 132, length: 132, widthFt: 11, lengthFt: 11 },
            dimensionLabel: `11'0" X 11'0"`,
            areaSqFt: 121.0,
            floorFinish: 'Vitrified Tiles',
            wallFinish: 'Plaster',
            wallThickness: '9"'
        },
        {
            id: 'r_toilet',
            name: 'TOILET',
            type: 'toilet',
            vastuZone: 'West',
            x: 150, y: 9, w: 60, h: 84,
            clearDimensions: { width: 60, length: 84, widthFt: 5, lengthFt: 7 },
            dimensionLabel: `5'0" X 7'0"`,
            areaSqFt: 35.0,
            floorFinish: 'Anti-Skid Ceramic',
            wallFinish: 'Glazed Tiles',
            wallThickness: '4.5"'
        },
        {
            id: 'r_staircase',
            name: 'STAIRCASE',
            type: 'staircase',
            vastuZone: 'South / West',
            x: 214.5, y: 9, w: 85.5, h: 96,
            clearDimensions: { width: 90, length: 96, widthFt: 7.5, lengthFt: 8 },
            dimensionLabel: `7'6" X 8'0"`,
            areaSqFt: 60.0,
            floorFinish: 'Granite',
            wallFinish: 'Plaster',
            wallThickness: '4.5"'
        },
        {
            id: 'r_master_bed',
            name: 'MASTER BEDROOM',
            type: 'bedroom',
            vastuZone: 'South-West (Nairutya)',
            x: 340.5, y: 9, w: 139.5, h: 144,
            clearDimensions: { width: 144, length: 144, widthFt: 12, lengthFt: 12 },
            dimensionLabel: `12'0" X 12'0"`,
            areaSqFt: 144.0,
            floorFinish: 'Wooden Flooring',
            wallFinish: 'Plaster & Paint',
            wallThickness: '9"'
        },
        {
            id: 'r_dining',
            name: 'DINING',
            type: 'dining',
            vastuZone: 'Central',
            x: 150, y: 109.5, w: 150, h: 118.5,
            clearDimensions: { width: 120, length: 132, widthFt: 10, lengthFt: 11 },
            dimensionLabel: `10'0" X 11'0"`,
            areaSqFt: 110.0,
            floorFinish: 'Vitrified Tiles',
            wallFinish: 'Plaster',
            wallThickness: '4.5"'
        },
        {
            id: 'r_parking',
            name: 'PARKING',
            type: 'parking',
            vastuZone: 'North / North-East Driveway',
            x: 9, y: 150, w: 136.5, h: 201,
            clearDimensions: { width: 132, length: 192, widthFt: 11, lengthFt: 16 },
            dimensionLabel: `11'0" X 16'0"`,
            areaSqFt: 176.0,
            floorFinish: 'Heavy Duty Pavers',
            wallFinish: 'Weatherproof Paint',
            wallThickness: '9"'
        },
        {
            id: 'r_pooja',
            name: 'POOJA',
            type: 'pooja',
            vastuZone: 'North-East (Ishan)',
            x: 150, y: 300, w: 60, h: 60,
            clearDimensions: { width: 60, length: 60, widthFt: 5, lengthFt: 5 },
            dimensionLabel: `5'0" X 5'0"`,
            areaSqFt: 25.0,
            floorFinish: 'Italian Marble',
            wallFinish: 'Plaster',
            wallThickness: '4.5"'
        },
        {
            id: 'r_living',
            name: 'LIVING HALL',
            type: 'living',
            vastuZone: 'East / Brahmasthan',
            x: 214.5, y: 153, w: 136.5, h: 198,
            clearDimensions: { width: 198, length: 180, widthFt: 16.5, lengthFt: 15 },
            dimensionLabel: `16'6" X 15'0"`,
            areaSqFt: 247.5,
            floorFinish: 'Vitrified Tiles',
            wallFinish: 'Plaster',
            wallThickness: '9"'
        },
        {
            id: 'r_kitchen',
            name: 'KITCHEN',
            type: 'kitchen',
            vastuZone: 'South-East (Agneya)',
            x: 355.5, y: 232.5, w: 124.5, h: 127.5,
            clearDimensions: { width: 120, length: 132, widthFt: 10, lengthFt: 11 },
            dimensionLabel: `10'0" X 11'0"`,
            areaSqFt: 110.0,
            floorFinish: 'Vitrified Tiles',
            wallFinish: 'Glazed Tiles',
            wallThickness: '9"'
        },
        {
            id: 'r_sitout',
            name: 'SITOUT',
            type: 'sitout',
            vastuZone: 'East Entrance',
            x: 214.5, y: 360, w: 121.5, h: 46.5,
            clearDimensions: { width: 126, length: 60, widthFt: 10.5, lengthFt: 5 },
            dimensionLabel: `10'6" X 5'0"`,
            areaSqFt: 52.5,
            floorFinish: 'Anti-Skid Ceramic',
            wallFinish: 'Weatherproof Paint',
            wallThickness: '9"'
        }
    ],

    // Hosted Doors with Clean Swing Arcs
    doors: [
        { id: 'd_bed2', wallId: 'w_int_bed2_bot', positionAlongWall: 85, width: 36, swingDirection: 'left', type: 'single_swing' },
        { id: 'd_toilet', wallId: 'w_int_toilet_bot', positionAlongWall: 15, width: 30, swingDirection: 'right', type: 'single_swing' },
        { id: 'd_stair_entry', wallId: 'w_int_stair_bot', positionAlongWall: 25, width: 36, swingDirection: 'left', type: 'single_swing' },
        { id: 'd_master_bed', wallId: 'w_int_master_left', positionAlongWall: 95, width: 36, swingDirection: 'right', type: 'single_swing' },
        { id: 'd_kitchen', wallId: 'w_int_kitchen_top', positionAlongWall: 20, width: 36, swingDirection: 'right', type: 'single_swing' },
        { id: 'd_pooja', wallId: 'w_int_pooja_top', positionAlongWall: 15, width: 30, swingDirection: 'left', type: 'single_swing' },
        { id: 'd_main_entry', wallId: 'w_ext_bot_living_left', positionAlongWall: 20, width: 42, swingDirection: 'right', type: 'single_swing' }
    ],

    // Hosted Windows with Blue Glazing Lines
    windows: [
        { id: 'win_bed2_top', wallId: 'w_ext_top_1', positionAlongWall: 48, width: 48, sillHeight: 36, height: 48 },
        { id: 'win_toilet_top', wallId: 'w_ext_top_2', positionAlongWall: 18, width: 24, sillHeight: 60, height: 24 },
        { id: 'win_master_top', wallId: 'w_ext_top_3', positionAlongWall: 45, width: 48, sillHeight: 36, height: 48 },
        { id: 'win_master_right', wallId: 'w_ext_right_master', positionAlongWall: 50, width: 48, sillHeight: 36, height: 48 },
        { id: 'win_kitchen_right', wallId: 'w_ext_right_kitchen', positionAlongWall: 60, width: 48, sillHeight: 36, height: 48 },
        { id: 'win_kitchen_bot', wallId: 'w_ext_bot_kitchen', positionAlongWall: 45, width: 48, sillHeight: 36, height: 48 }
    ],

    // Clockwise Ascending Architectural Staircase (South/West Zone)
    stairs: [
        {
            id: 'stair_main',
            name: 'Staircase Main',
            x: 217,
            y: 12,
            width: 80,
            length: 90,
            flights: 2,
            treadsPerFlight: 8,
            direction: 'UP'
        }
    ],

    // Structural Columns
    columns: [
        { id: 'c1', x: 0, y: 0, width: 9, length: 9 },
        { id: 'c2', x: 145.5, y: 0, width: 9, length: 9 },
        { id: 'c3', x: 336, y: 0, width: 9, length: 9 },
        { id: 'c4', x: 471, y: 0, width: 9, length: 9 },
        { id: 'c5', x: 0, y: 145.5, width: 9, length: 9 },
        { id: 'c6', x: 145.5, y: 145.5, width: 9, length: 9 },
        { id: 'c7', x: 471, y: 145.5, width: 9, length: 9 },
        { id: 'c8', x: 0, y: 351, width: 9, length: 9 },
        { id: 'c9', x: 145.5, y: 351, width: 9, length: 9 },
        { id: 'c10', x: 471, y: 351, width: 9, length: 9 },
        { id: 'c11', x: 210, y: 351, width: 9, length: 9 },
        { id: 'c12', x: 336, y: 351, width: 9, length: 9 }
    ],

    // 2D Vector CAD Furniture Symbols
    furniture: [
        // Bedroom 2 (NW): Bed + Nightstands + Wardrobe
        { id: 'f_bed2', roomId: 'r_bed2', type: 'bed', name: 'Double Bed', x: 20, y: 22, width: 68, length: 76, rotation: 0 },
        { id: 'f_bed2_wardrobe', roomId: 'r_bed2', type: 'wardrobe', name: 'Wardrobe', x: 12, y: 24, width: 14, length: 72, rotation: 0 },

        // Toilet (West): Commode & Basin
        { id: 'f_commode', roomId: 'r_toilet', type: 'commode', name: 'Water Closet', x: 170, y: 18, width: 20, length: 26, rotation: 0 },
        { id: 'f_washbasin', roomId: 'r_toilet', type: 'washbasin', name: 'Wash Basin', x: 194, y: 56, width: 16, length: 22, rotation: 0 },

        // Master Bedroom (SW): King Bed with Head to South + Wardrobe on SW Wall
        { id: 'f_master_bed', roomId: 'r_master_bed', type: 'bed', name: 'Master King Bed', x: 380, y: 25, width: 72, length: 78, rotation: 0 },
        { id: 'f_master_wardrobe', roomId: 'r_master_bed', type: 'wardrobe', name: 'Master Wardrobe', x: 455, y: 35, width: 16, length: 75, rotation: 0 },

        // Dining (Central): 6-Seater Dining Table connecting Living & Kitchen
        { id: 'f_dining_table', roomId: 'r_dining', type: 'dining_table', name: '6-Seater Dining Table', x: 185, y: 135, width: 68, length: 60, rotation: 0 },

        // Parking (NE Driveway): Luxury Tan Sedan
        { id: 'f_car', roomId: 'r_parking', type: 'car', name: 'Car Parking', x: 32, y: 180, width: 78, length: 145, rotation: 0 },

        // Pooja (NE Corner): Sacred Altar with Diya & Auspicious Flame
        { id: 'f_pooja_altar', roomId: 'r_pooja', type: 'pooja_altar', name: 'Pooja Altar', x: 168, y: 318, width: 24, length: 24, rotation: 0 },

        // Living Hall (East Front): Carpet zone, TV unit, 3-Seater Sofa, Armchair, Coffee Table
        { id: 'f_living_carpet', roomId: 'r_living', type: 'carpet_zone', name: 'Seating Area', x: 235, y: 195, width: 105, length: 130, rotation: 0 },
        { id: 'f_living_tv', roomId: 'r_living', type: 'tv_unit', name: 'TV Entertainment Unit', x: 215, y: 210, width: 8, length: 60, rotation: 0 },
        { id: 'f_living_sofa', roomId: 'r_living', type: 'sofa', name: 'Living Sofa Set', x: 310, y: 220, width: 26, length: 72, rotation: 0 },
        { id: 'f_living_chair1', roomId: 'r_living', type: 'armchair', name: 'Armchair Top', x: 260, y: 300, width: 26, length: 26, rotation: 0 },
        { id: 'f_living_table', roomId: 'r_living', type: 'table', name: 'Coffee Table', x: 265, y: 235, width: 30, length: 30, rotation: 0 },

        // Kitchen (SE Corner - Agneya): L-Counter, East-Facing Stove & Sink
        { id: 'f_kitch_counter', roomId: 'r_kitchen', type: 'kitchen_counter', name: 'Kitchen Counter', x: 360, y: 240, width: 110, length: 110, rotation: 0 },

        // Sitout (East Entrance): Potted Green Plants + Entrance Steps
        { id: 'f_plant_left', roomId: 'r_sitout', type: 'plant', name: 'Potted Plant Left', x: 220, y: 375, width: 18, length: 18, rotation: 0 },
        { id: 'f_plant_right', roomId: 'r_sitout', type: 'plant', name: 'Potted Plant Right', x: 315, y: 375, width: 18, length: 18, rotation: 0 },
        { id: 'f_sitout_steps', roomId: 'r_sitout', type: 'steps', name: 'Entry Steps', x: 250, y: 405, width: 48, length: 16, rotation: 0 }
    ]
};

export default House30x40CAD;
