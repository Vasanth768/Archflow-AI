/**
 * Canonical Architectural Plan Schema
 * 
 * Defines the single, normalized, authoritative data model for ArchFlow AI.
 * Internally, all spatial measurements (x, y, width, length, thickness, heights)
 * are stored in deterministic INCHES (1 foot = 12 inches).
 */

export const WallType = {
    EXTERIOR: 'exterior',
    INTERIOR: 'interior',
    BEARING: 'bearing',
    PARTITION: 'partition'
};

export const OpeningType = {
    SINGLE_DOOR: 'single_door',
    DOUBLE_DOOR: 'double_door',
    SLIDING_DOOR: 'sliding_door',
    ARCH_OPENING: 'arch_opening',
    STANDARD_WINDOW: 'standard_window',
    VENTILATOR: 'ventilator',
    FRENCH_WINDOW: 'french_window'
};

export const SwingDirection = {
    LEFT: 'left',
    RIGHT: 'right',
    DOUBLE: 'double',
    SLIDE: 'slide',
    NONE: 'none'
};

export const RoomType = {
    LIVING: 'living',
    DINING: 'dining',
    KITCHEN: 'kitchen',
    BEDROOM: 'bedroom',
    MASTER_BEDROOM: 'master_bedroom',
    BATHROOM: 'bathroom',
    TOILET: 'toilet',
    ATTACHED_TOILET: 'attached_toilet',
    STORE: 'store',
    POOJA: 'pooja',
    PORTICO: 'portico',
    PARKING: 'parking',
    SITOUT: 'sitout',
    BALCONY: 'balcony',
    STAIRCASE: 'staircase',
    CORRIDOR: 'corridor',
    UTILITY: 'utility',
    OTHER: 'other'
};

/**
 * Creates a blank valid ArchitecturalPlan adhering strictly to the canonical schema.
 */
export function createEmptyPlan(options = {}) {
    const siteWidth = (options.width || 45) * 12; // default in inches
    const siteLength = (options.length || 70) * 12;

    return {
        schemaVersion: '1.0.0',
        project: {
            id: options.id || `proj_${Date.now()}`,
            name: options.name || 'GF Scheme Plan',
            client: options.client || 'Client',
            type: options.type || 'Residential',
            facing: options.facing || 'East',
            floors: options.floors || 1,
            unitSystem: options.unitSystem || 'imperial', // 'imperial' | 'metric'
            status: options.status || 'Draft',
            createdAt: options.createdAt || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        },
        site: {
            width: siteWidth,      // in inches
            length: siteLength,    // in inches
            facing: options.facing || 'East',
            setbacks: {
                front: options.setbackFront || 36, // 3'-0"
                rear: options.setbackRear || 24,   // 2'-0"
                left: options.setbackLeft || 24,
                right: options.setbackRight || 24
            }
        },
        floors: [
            {
                id: 'floor_0',
                name: 'Ground Floor',
                elevation: 0,
                height: 120 // 10'-0" ceiling height in inches
            }
        ],
        walls: [],
        rooms: [],
        doors: [],
        windows: [],
        stairs: [],
        columns: [],
        furniture: [],
        fixtures: [],
        dimensions: [],
        annotations: [],
        materials: {
            exteriorWall: 'concrete-plaster',
            interiorWall: 'smooth-plaster',
            flooring: 'vitrified-tiles',
            roof: 'reinforced-concrete',
            facadeStyle: options.style || 'Standard Modern'
        },
        constraints: {
            minRoomWidth: 72,     // 6'-0"
            minCirculationWidth: 36, // 3'-0"
            exteriorWallThickness: 9, // 9"
            interiorWallThickness: 4.5, // 4.5"
            wallHeight: 120        // 10'-0"
        },
        metadata: {
            author: 'ArchFlow CAD Engine',
            generator: options.generator || 'Deterministic CAD Solver',
            versionHistory: []
        }
    };
}
