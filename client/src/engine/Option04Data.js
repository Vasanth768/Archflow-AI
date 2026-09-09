/**
 * Option04Data.js - Canonical CAD Model for "GF Scheme Plan - Option 04"
 * 
 * Single Source of Truth for Architectural CAD Geometry:
 * - Envelope: 45'-0" x 70'-0" (540" x 840")
 * - Exterior walls: 9" thickness
 * - Interior walls: 4.5" thickness
 * - Real architectural coordinates (in inches & feet)
 * - Parametric hosted doors, windows, stairs, furniture, and dimensions
 */

export const Option04CAD = {
    schemaVersion: '2.0.0',
    project: {
        id: 'f1',
        name: 'GF Scheme Plan - Option 04',
        client: 'KS Infra',
        type: 'Residential',
        facing: 'East',
        floors: 1,
        unitSystem: 'imperial',
        status: 'Completed',
        createdAt: '2026-08-20T10:00:00.000Z',
        lastUpdated: new Date().toISOString()
    },
    site: {
        width: 540,  // 45'-0" in inches
        length: 840, // 70'-0" in inches
        widthFt: 45,
        lengthFt: 70,
        facing: 'East',
        setbacks: { front: 36, rear: 24, left: 24, right: 24 }
    },
    floors: [
        {
            id: 'floor_0',
            name: 'Ground Floor',
            elevation: 0,
            height: 120 // 10'-0"
        }
    ],
    // Structural Wall Network
    walls: [
        // Exterior Boundary Walls (9" thick)
        { id: 'w_ext_top_1', start: { x: 9, y: 9 }, end: { x: 120, y: 9 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_top_store', start: { x: 120, y: 9 }, end: { x: 178.5, y: 9 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_top_bed1', start: { x: 178.5, y: 9 }, end: { x: 294, y: 9 }, thickness: 9, height: 120, type: 'exterior' },
        
        { id: 'w_ext_left_kitchen', start: { x: 9, y: 9 }, end: { x: 9, y: 125 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_left_dining', start: { x: 9, y: 125 }, end: { x: 9, y: 240.5 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_left_living', start: { x: 9, y: 240.5 }, end: { x: 9, y: 476 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_left_portico', start: { x: 9, y: 552.5 }, end: { x: 9, y: 774.5 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_bot_portico', start: { x: 9, y: 774.5 }, end: { x: 159, y: 774.5 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_right_portico', start: { x: 159, y: 552.5 }, end: { x: 159, y: 774.5 }, thickness: 9, height: 120, type: 'exterior' },

        { id: 'w_ext_right_bed1', start: { x: 294, y: 9 }, end: { x: 294, y: 192 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_right_atoil1', start: { x: 276, y: 192 }, end: { x: 276, y: 241.5 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_right_bed2', start: { x: 413, y: 327.5 }, end: { x: 413, y: 450.5 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_right_atoil2', start: { x: 414, y: 450.5 }, end: { x: 414, y: 506 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_right_toilet', start: { x: 447, y: 552.5 }, end: { x: 447, y: 591.5 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_right_bath', start: { x: 447, y: 591.5 }, end: { x: 447, y: 665 }, thickness: 9, height: 120, type: 'exterior' },
        { id: 'w_ext_bot_bath', start: { x: 384, y: 665 }, end: { x: 447, y: 665 }, thickness: 9, height: 120, type: 'exterior' },

        // Interior Partition Walls (4.5" thick)
        { id: 'w_int_kitch_bot', start: { x: 9, y: 125 }, end: { x: 120, y: 125 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_kitch_right', start: { x: 120, y: 9 }, end: { x: 120, y: 125 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_store_pooja', start: { x: 120, y: 72 }, end: { x: 178.5, y: 72 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_pooja_bot', start: { x: 120, y: 115.5 }, end: { x: 178.5, y: 115.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_store_right', start: { x: 178.5, y: 9 }, end: { x: 178.5, y: 115.5 }, thickness: 4.5, height: 120, type: 'interior' },
        
        { id: 'w_int_dining_living', start: { x: 9, y: 240.5 }, end: { x: 192, y: 240.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_dining_right', start: { x: 192, y: 125 }, end: { x: 192, y: 240.5 }, thickness: 4.5, height: 120, type: 'interior' },

        { id: 'w_int_living_right', start: { x: 192, y: 240.5 }, end: { x: 192, y: 476 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_living_bot', start: { x: 9, y: 476 }, end: { x: 192, y: 476 }, thickness: 4.5, height: 120, type: 'interior' },

        { id: 'w_int_bed1_bot', start: { x: 178.5, y: 192 }, end: { x: 294, y: 192 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_atoil1_bot', start: { x: 178.5, y: 241.5 }, end: { x: 276, y: 241.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_atoil1_left', start: { x: 178.5, y: 192 }, end: { x: 178.5, y: 241.5 }, thickness: 4.5, height: 120, type: 'interior' },

        { id: 'w_int_stair_top', start: { x: 196.5, y: 245 }, end: { x: 298.5, y: 245 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_stair_bot', start: { x: 196.5, y: 323 }, end: { x: 298.5, y: 323 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_stair_right', start: { x: 298.5, y: 245 }, end: { x: 298.5, y: 323 }, thickness: 4.5, height: 120, type: 'interior' },

        { id: 'w_int_bed2_top', start: { x: 303, y: 327.5 }, end: { x: 413, y: 327.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_bed2_left', start: { x: 303, y: 327.5 }, end: { x: 303, y: 450.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_bed2_bot', start: { x: 303, y: 450.5 }, end: { x: 413, y: 450.5 }, thickness: 4.5, height: 120, type: 'interior' },

        { id: 'w_int_atoil2_bot', start: { x: 303, y: 506 }, end: { x: 414, y: 506 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_atoil2_left', start: { x: 303, y: 450.5 }, end: { x: 303, y: 506 }, thickness: 4.5, height: 120, type: 'interior' },

        { id: 'w_int_sitout_top', start: { x: 196.5, y: 552.5 }, end: { x: 379.5, y: 552.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_sitout_bot', start: { x: 196.5, y: 624.5 }, end: { x: 379.5, y: 624.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_sitout_left', start: { x: 196.5, y: 552.5 }, end: { x: 196.5, y: 624.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_sitout_right', start: { x: 379.5, y: 552.5 }, end: { x: 379.5, y: 624.5 }, thickness: 4.5, height: 120, type: 'interior' },

        { id: 'w_int_toilet_left', start: { x: 384, y: 552.5 }, end: { x: 384, y: 665 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_toilet_top', start: { x: 384, y: 552.5 }, end: { x: 447, y: 552.5 }, thickness: 4.5, height: 120, type: 'interior' },
        { id: 'w_int_toilet_bath', start: { x: 384, y: 591.5 }, end: { x: 447, y: 591.5 }, thickness: 4.5, height: 120, type: 'interior' }
    ],

    // Derived Enclosed Rooms with exact architectural clear dimensions
    rooms: [
        {
            id: 'r_kitchen',
            name: 'KITCHEN',
            type: 'kitchen',
            x: 9, y: 9, w: 111, h: 116,
            clearDimensions: { width: 111, length: 116, widthFt: 9.25, lengthFt: 9.667 },
            dimensionLabel: `9'-3" × 9'-8"`,
            areaSqFt: 89.4,
            floorFinish: 'Vitrified Tiles',
            wallFinish: 'Plaster',
            wallThickness: '9"'
        },
        {
            id: 'r_store',
            name: 'STORE',
            type: 'store',
            x: 124.5, y: 9, w: 54, h: 63,
            clearDimensions: { width: 54, length: 63, widthFt: 4.5, lengthFt: 5.25 },
            dimensionLabel: `4'-6" × 5'-3"`,
            areaSqFt: 23.6,
            floorFinish: 'Ceramic Tiles',
            wallFinish: 'Plaster',
            wallThickness: '4.5"'
        },
        {
            id: 'r_pooja',
            name: 'POOJA',
            type: 'pooja',
            x: 124.5, y: 76.5, w: 54, h: 39,
            clearDimensions: { width: 54, length: 39, widthFt: 4.5, lengthFt: 3.25 },
            dimensionLabel: `4'-6" × 3'-3"`,
            areaSqFt: 14.6,
            floorFinish: 'Marble Tiles',
            wallFinish: 'Plaster',
            wallThickness: '4.5"'
        },
        {
            id: 'r_dining',
            name: 'DINING',
            type: 'dining',
            x: 9, y: 129.5, w: 183, h: 111,
            clearDimensions: { width: 183, length: 111, widthFt: 15.25, lengthFt: 9.25 },
            dimensionLabel: `15'-3" × 9'-3"`,
            areaSqFt: 141.0,
            floorFinish: 'Vitrified Tiles',
            wallFinish: 'Plaster',
            wallThickness: '9"'
        },
        {
            id: 'r_living',
            name: 'LIVING ROOM',
            type: 'living',
            x: 9, y: 245, w: 183, h: 231,
            clearDimensions: { width: 183, length: 231, widthFt: 15.25, lengthFt: 19.25 },
            dimensionLabel: `15'-3" × 19'-3"`,
            areaSqFt: 293.6,
            floorFinish: 'Italian Marble',
            wallFinish: 'Plaster & Paint',
            wallThickness: '9"'
        },
        {
            id: 'r_portico',
            name: 'PORTICO',
            type: 'parking',
            x: 9, y: 552.5, w: 150, h: 222,
            clearDimensions: { width: 150, length: 222, widthFt: 12.5, lengthFt: 18.5 },
            dimensionLabel: `12'-6" × 18'-6"`,
            areaSqFt: 231.2,
            floorFinish: 'Paver Blocks',
            wallFinish: 'Weatherproof Paint',
            wallThickness: '9"'
        },
        {
            id: 'r_bed1',
            name: 'BEDROOM 1',
            type: 'bedroom',
            x: 183, y: 9, w: 111, h: 183,
            clearDimensions: { width: 111, length: 183, widthFt: 9.25, lengthFt: 15.25 },
            dimensionLabel: `9'-3" × 15'-3"`,
            areaSqFt: 141.0,
            floorFinish: 'Wooden Flooring',
            wallFinish: 'Plaster',
            wallThickness: '9"'
        },
        {
            id: 'r_atoil1',
            name: 'A. TOILET',
            type: 'toilet',
            x: 183, y: 196.5, w: 93, h: 45,
            clearDimensions: { width: 93, length: 45, widthFt: 7.75, lengthFt: 3.75 },
            dimensionLabel: `7'-9" × 3'-9"`,
            areaSqFt: 29.1,
            floorFinish: 'Anti-Skid Ceramic',
            wallFinish: 'Glazed Tiles',
            wallThickness: '4.5"'
        },
        {
            id: 'r_stair',
            name: 'STAIRCASE',
            type: 'staircase',
            x: 196.5, y: 245, w: 102, h: 78,
            clearDimensions: { width: 102, length: 78, widthFt: 8.5, lengthFt: 6.5 },
            dimensionLabel: `8'-6" × 6'-6"`,
            areaSqFt: 55.2,
            floorFinish: 'Granite',
            wallFinish: 'Plaster',
            wallThickness: '4.5"'
        },
        {
            id: 'r_bed2',
            name: 'BEDROOM 2',
            type: 'bedroom',
            x: 303, y: 327.5, w: 110, h: 123,
            clearDimensions: { width: 110, length: 123, widthFt: 9.167, lengthFt: 10.25 },
            dimensionLabel: `9'-2" × 10'-3"`,
            areaSqFt: 93.9,
            floorFinish: 'Vitrified Tiles',
            wallFinish: 'Plaster',
            wallThickness: '9"'
        },
        {
            id: 'r_atoil2',
            name: 'A. TOILET',
            type: 'toilet',
            x: 303, y: 455, w: 111, h: 51,
            clearDimensions: { width: 111, length: 51, widthFt: 9.25, lengthFt: 4.25 },
            dimensionLabel: `9'-3" × 4'-3"`,
            areaSqFt: 39.3,
            floorFinish: 'Anti-Skid Ceramic',
            wallFinish: 'Glazed Tiles',
            wallThickness: '4.5"'
        },
        {
            id: 'r_sitout',
            name: 'SITOUT',
            type: 'sitout',
            x: 196.5, y: 552.5, w: 183, h: 72,
            clearDimensions: { width: 183, length: 72, widthFt: 15.25, lengthFt: 6.0 },
            dimensionLabel: `15'-3" × 6'-0"`,
            areaSqFt: 91.5,
            floorFinish: 'Terracotta Tiles',
            wallFinish: 'Weatherproof Paint',
            wallThickness: '9"'
        },
        {
            id: 'r_toilet',
            name: 'TOILET',
            type: 'toilet',
            x: 384, y: 552.5, w: 63, h: 39,
            clearDimensions: { width: 63, length: 39, widthFt: 5.25, lengthFt: 3.25 },
            dimensionLabel: `5'-3" × 3'-3"`,
            areaSqFt: 17.1,
            floorFinish: 'Anti-Skid Ceramic',
            wallFinish: 'Glazed Tiles',
            wallThickness: '4.5"'
        },
        {
            id: 'r_bath',
            name: 'BATH',
            type: 'toilet',
            x: 384, y: 596, w: 63, h: 69,
            clearDimensions: { width: 63, length: 69, widthFt: 5.25, lengthFt: 5.75 },
            dimensionLabel: `5'-3" × 5'-9"`,
            areaSqFt: 30.2,
            floorFinish: 'Anti-Skid Ceramic',
            wallFinish: 'Glazed Tiles',
            wallThickness: '4.5"'
        }
    ],

    // Parametric Doors Hosted on Walls
    doors: [
        { id: 'd_main', wallId: 'w_ext_left_living', positionAlongWall: 60, width: 42, height: 84, type: 'single_door', swingDirection: 'right', isMain: true },
        { id: 'd_kitch', wallId: 'w_int_kitch_bot', positionAlongWall: 40, width: 36, height: 84, type: 'arch_opening', swingDirection: 'none' },
        { id: 'd_store', wallId: 'w_int_store_pooja', positionAlongWall: 10, width: 30, height: 84, type: 'single_door', swingDirection: 'left' },
        { id: 'd_pooja', wallId: 'w_int_pooja_bot', positionAlongWall: 12, width: 30, height: 84, type: 'double_door', swingDirection: 'double' },
        { id: 'd_bed1', wallId: 'w_int_bed1_bot', positionAlongWall: 36, width: 36, height: 84, type: 'single_door', swingDirection: 'left' },
        { id: 'd_atoil1', wallId: 'w_int_atoil1_bot', positionAlongWall: 24, width: 30, height: 84, type: 'single_door', swingDirection: 'left' },
        { id: 'd_bed2', wallId: 'w_int_bed2_top', positionAlongWall: 36, width: 36, height: 84, type: 'single_door', swingDirection: 'right' },
        { id: 'd_atoil2', wallId: 'w_int_atoil2_bot', positionAlongWall: 24, width: 30, height: 84, type: 'single_door', swingDirection: 'right' },
        { id: 'd_sitout', wallId: 'w_int_sitout_top', positionAlongWall: 70, width: 48, height: 84, type: 'double_door', swingDirection: 'double' },
        { id: 'd_toilet', wallId: 'w_int_toilet_left', positionAlongWall: 10, width: 28, height: 84, type: 'single_door', swingDirection: 'right' },
        { id: 'd_bath', wallId: 'w_int_toilet_left', positionAlongWall: 55, width: 28, height: 84, type: 'single_door', swingDirection: 'right' }
    ],

    // Parametric Windows Hosted on Walls
    windows: [
        { id: 'w_kitch_ext', wallId: 'w_ext_top_1', positionAlongWall: 36, width: 48, height: 48, sillHeight: 36, type: 'standard_window' },
        { id: 'w_bed1_ext_top', wallId: 'w_ext_top_bed1', positionAlongWall: 40, width: 48, height: 48, sillHeight: 36, type: 'standard_window' },
        { id: 'w_bed1_ext_right', wallId: 'w_ext_right_bed1', positionAlongWall: 60, width: 48, height: 48, sillHeight: 36, type: 'standard_window' },
        { id: 'w_dining_ext', wallId: 'w_ext_left_dining', positionAlongWall: 36, width: 48, height: 48, sillHeight: 36, type: 'standard_window' },
        { id: 'w_living_ext_1', wallId: 'w_ext_left_living', positionAlongWall: 130, width: 60, height: 60, sillHeight: 24, type: 'french_window' },
        { id: 'w_bed2_ext', wallId: 'w_ext_right_bed2', positionAlongWall: 40, width: 48, height: 48, sillHeight: 36, type: 'standard_window' },
        { id: 'w_toilet_vent', wallId: 'w_ext_right_toilet', positionAlongWall: 12, width: 24, height: 24, sillHeight: 72, type: 'ventilator' },
        { id: 'w_bath_vent', wallId: 'w_ext_right_bath', positionAlongWall: 20, width: 24, height: 24, sillHeight: 72, type: 'ventilator' }
    ],

    // Architectural Dog-legged Staircase
    stairs: [
        {
            id: 'stair_main',
            roomId: 'r_stair',
            x: 196.5,
            y: 245,
            width: 102,
            length: 78,
            flight: 'dog-legged',
            steps: 18,
            direction: 'UP ↑'
        }
    ],

    // Room-Anchored Vector 2D Architectural Furniture
    furniture: [
        // Bed 1 (King Bed + Side Tables)
        { id: 'f_bed1', name: 'Master Bed', type: 'bed', roomId: 'r_bed1', x: 200, y: 30, width: 76, length: 82, rotation: 0 },
        // Bed 2 (Queen Bed)
        { id: 'f_bed2', name: 'Queen Bed', type: 'bed', roomId: 'r_bed2', x: 320, y: 345, width: 66, length: 78, rotation: 0 },
        // Living Hall (Sofa + Coffee Table + TV)
        { id: 'f_sofa', name: 'L-Sofa Suite', type: 'sofa', roomId: 'r_living', x: 30, y: 275, width: 90, length: 84, rotation: 0 },
        { id: 'f_coffeetable', name: 'Center Table', type: 'table', roomId: 'r_living', x: 60, y: 375, width: 36, length: 36, rotation: 0 },
        { id: 'f_tvunit', name: 'TV Console', type: 'tv_unit', roomId: 'r_living', x: 180, y: 330, width: 8, length: 60, rotation: 0 },
        // Dining Table (6 Chairs)
        { id: 'f_dining', name: '6-Seater Dining', type: 'dining_table', roomId: 'r_dining', x: 50, y: 145, width: 50, length: 74, rotation: 0 },
        // Kitchen Counter (Stove & Sink)
        { id: 'f_kitch_counter', name: 'Kitchen Counter', type: 'kitchen_counter', roomId: 'r_kitchen', x: 15, y: 15, width: 98, length: 24, rotation: 0 },
        // Toilets
        { id: 'f_commode1', name: 'Commode', type: 'commode', roomId: 'r_atoil1', x: 235, y: 205, width: 20, length: 28, rotation: 0 },
        { id: 'f_commode2', name: 'Commode', type: 'commode', roomId: 'r_atoil2', x: 370, y: 465, width: 20, length: 28, rotation: 0 },
        // Portico Car
        { id: 'f_car', name: 'Sedan Car', type: 'car', roomId: 'r_portico', x: 35, y: 575, width: 76, length: 180, rotation: 0 },
        // Sitout Plants
        { id: 'f_plant1', name: 'Potted Plant', type: 'plant', roomId: 'r_sitout', x: 205, y: 600, width: 16, length: 16, rotation: 0 },
        { id: 'f_plant2', name: 'Potted Plant', type: 'plant', roomId: 'r_sitout', x: 355, y: 600, width: 16, length: 16, rotation: 0 }
    ],

    // Structural Columns
    columns: [
        { id: 'c1', x: 9, y: 9, width: 9, length: 9 },
        { id: 'c2', x: 120, y: 9, width: 9, length: 9 },
        { id: 'c3', x: 294, y: 9, width: 9, length: 9 },
        { id: 'c4', x: 9, y: 240.5, width: 9, length: 9 },
        { id: 'c5', x: 192, y: 240.5, width: 9, length: 9 },
        { id: 'c6', x: 9, y: 476, width: 9, length: 9 },
        { id: 'c7', x: 9, y: 552.5, width: 9, length: 9 },
        { id: 'c8', x: 159, y: 774.5, width: 9, length: 9 },
        { id: 'c9', x: 379.5, y: 624.5, width: 9, length: 9 },
        { id: 'c10', x: 447, y: 665, width: 9, length: 9 }
    ],

    // Canonical Dimension Annotations
    dimensions: [
        { id: 'dim_site_top', type: 'linear', p1: { x: 0, y: 0 }, p2: { x: 540, y: 0 }, label: `45'-0"`, offset: -30 },
        { id: 'dim_site_left', type: 'linear', p1: { x: 0, y: 0 }, p2: { x: 0, y: 840 }, label: `70'-0"`, offset: -35 }
    ],

    // Annotations
    annotations: [
        { id: 'ann_title', text: 'GROUND FLOOR PLAN', x: 270, y: 810, fontSize: 16, fontWeight: '700' },
        { id: 'ann_scale', text: 'SCALE - 1 : 50', x: 270, y: 830, fontSize: 12, fontWeight: '500' }
    ]
};

// Automated validation helper for Option 04
export function validateOption04Geometry(cad = Option04CAD) {
    const errors = [];
    if (!cad || !cad.site) {
        errors.push("Missing site configuration.");
        return { isValid: false, errors };
    }
    if (cad.site.width !== 540 || cad.site.length !== 840) {
        errors.push(`Site dimensions ${cad.site.width}x${cad.site.length} do not match 45'x70' (540"x840").`);
    }
    if (!Array.isArray(cad.walls) || cad.walls.length < 15) {
        errors.push("Insufficient structural wall segments.");
    }
    if (!Array.isArray(cad.rooms) || cad.rooms.length < 10) {
        errors.push("Incomplete room network.");
    }

    // Verify room area calculations
    (cad.rooms || []).forEach(r => {
        const expectedArea = Math.round((r.w * r.h) / 144 * 10) / 10;
        if (Math.abs(expectedArea - r.areaSqFt) > 1.5) {
            console.warn(`[Option04CAD] Room ${r.name} area mismatch: reported ${r.areaSqFt} sq.ft, computed ${expectedArea} sq.ft`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}
