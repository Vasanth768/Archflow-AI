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

export const DimensionMode = {
    EXACT: 'exact',
    PREFERRED: 'preferred',
    MINIMUM: 'minimum',
    AUTO: 'auto'
};

export const RoomType = {
    LIVING: 'living',
    FAMILY_ROOM: 'family_room',
    DINING: 'dining',
    KITCHEN: 'kitchen',
    BEDROOM: 'bedroom',
    MASTER_BEDROOM: 'master_bedroom',
    GUEST_ROOM: 'guest_room',
    BATHROOM: 'bathroom',
    TOILET: 'toilet',
    ATTACHED_TOILET: 'attached_toilet',
    COMMON_BATHROOM: 'common_bathroom',
    STORE: 'store',
    POOJA: 'pooja',
    STUDY: 'study',
    HOME_OFFICE: 'home_office',
    HOME_THEATRE: 'home_theatre',
    WALK_IN_WARDROBE: 'walk_in_wardrobe',
    UTILITY: 'utility',
    LAUNDRY: 'laundry',
    BALCONY: 'balcony',
    FOYER: 'foyer',
    STAIRCASE: 'staircase',
    PARKING: 'parking',
    PORTICO: 'portico',
    SITOUT: 'sitout',
    ACCESSIBILITY: 'accessibility',
    CORRIDOR: 'corridor',
    OTHER: 'other'
};

/**
 * Creates a blank valid ArchitecturalPlan adhering strictly to the canonical schema.
 */
export function createEmptyPlan(options = {}) {
    const siteWidth = (options.width || 30) * 12; // default in inches
    const siteLength = (options.length || 40) * 12;

    const setbackFront = options.setbackFront !== undefined ? options.setbackFront : Math.min(48, Math.max(24, Math.round(siteLength * 0.08)));
    const setbackRear = options.setbackRear !== undefined ? options.setbackRear : Math.min(36, Math.max(18, Math.round(siteLength * 0.05)));
    const setbackLeft = options.setbackLeft !== undefined ? options.setbackLeft : Math.min(24, Math.max(12, Math.round(siteWidth * 0.05)));
    const setbackRight = options.setbackRight !== undefined ? options.setbackRight : Math.min(24, Math.max(12, Math.round(siteWidth * 0.05)));

    return {
        schemaVersion: '1.0.0',
        project: {
            id: options.id || `proj_${Date.now()}`,
            name: options.name || `${options.width || 30}×${options.length || 40} Residence`,
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
                front: setbackFront,
                rear: setbackRear,
                left: setbackLeft,
                right: setbackRight
            },
            buildableEnvelope: {
                x: setbackLeft,
                y: setbackRear,
                width: Math.max(0, siteWidth - setbackLeft - setbackRight),
                length: Math.max(0, siteLength - setbackFront - setbackRear)
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
            minRoomWidth: 48,     // 4'-0"
            minCirculationWidth: 36, // 3'-0"
            exteriorWallThickness: 9, // 9"
            interiorWallThickness: 4.5, // 4.5"
            wallHeight: 120        // 10'-0"
        },
        metadata: {
            author: 'ArchFlow AI Engine',
            generator: options.generator || 'Dynamic Layout Solver',
            versionHistory: []
        }
    };
}

