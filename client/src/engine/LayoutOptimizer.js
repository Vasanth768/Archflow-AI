import { selectTemplate } from './TemplateSelector';
import { enforceRoomPriority } from './RoomPriority';
import { applyFacingRules } from './FacingEngine';
import { generateCorridors } from './CirculationEngine';
import { generateDoorsAndWindows } from './DoorWindowEngine';
import { applyFurnitureTemplates } from './FurnitureEngine';
import { calculateLayoutScore } from './AIScoringEngine';

// Reuse BSP helpers here for the generation step
const splitHorizontal = (rect, ratio) => {
    const splitY = Math.floor(rect.h * ratio);
    return [
        { x: rect.x, y: rect.y, w: rect.w, h: splitY },
        { x: rect.x, y: rect.y + splitY, w: rect.w, h: rect.h - splitY }
    ];
};

const splitVertical = (rect, ratio) => {
    const splitX = Math.floor(rect.w * ratio);
    return [
        { x: rect.x, y: rect.y, w: splitX, h: rect.h },
        { x: rect.x + splitX, y: rect.y, w: rect.w - splitX, h: rect.h }
    ];
};

export const generateOptimizedLayout = (width, length, facing) => {
    let bestRooms = [];
    let bestScore = 0;
    let attempts = 0;
    const maxAttempts = 3;

    // 1. Select Best Architectural Template
    const template = selectTemplate(width, length);
    const area = width * length;

    // 2. Room Priority (Strip optionals if plot too small)
    const requiredRooms = enforceRoomPriority(template, area);

    while (attempts < maxAttempts) {
        attempts++;
        let rooms = [];
        let idCounter = 1;
        
        const env = { x: 0, y: 0, w: width, h: length };

        // 3. Generate Template Skeleton using BSP Engine
        const [rearZone, midFront] = splitHorizontal(env, 0.40);
        const [middleZone, frontZone] = splitHorizontal(midFront, 0.60);

        const [rearLeft, rearRight] = splitVertical(rearZone, 0.50);
        const [bed1, bath] = splitVertical(rearLeft, 0.70);
        const [dining, kitchen] = splitVertical(rearRight, 0.55);

        const [midLeft, midRight] = splitVertical(middleZone, 0.40);
        const [staircase, living] = splitHorizontal(midLeft, 0.35);
        const [bed2, pooja] = splitHorizontal(midRight, 0.75);

        const [parking, sitout] = splitVertical(frontZone, 0.45);

        // Map BSP rects back to required rooms based on template definitions
        const addRoom = (rect, type) => {
            const def = requiredRooms.find(r => r.type === type);
            if (def) {
                const nameMap = {
                    "living": "Living Hall",
                    "kitchen": "Kitchen",
                    "bedroom": "Bedroom",
                    "toilet": "Bathroom",
                    "dining": "Dining Hall",
                    "staircase": "Staircase",
                    "pooja": "Pooja",
                    "parking": "Parking",
                    "sitout": "Sitout"
                };
                rooms.push({ id: `r_${idCounter++}`, name: nameMap[type] || type, type: type, ...rect });
            }
        };

        addRoom(bed1, "bedroom");
        addRoom(bath, "toilet");
        addRoom(dining, "dining");
        addRoom(kitchen, "kitchen");
        addRoom(staircase, "staircase");
        addRoom(living, "living");
        addRoom(bed2, "bedroom");
        addRoom(pooja, "pooja");
        addRoom(parking, "parking");
        addRoom(sitout, "sitout");

        // 4. Apply Vastu / Facing Engine
        rooms = applyFacingRules(rooms, facing, env);

        // 5. Optimize Circulation
        rooms = generateCorridors(rooms);

        // 6. Door & Window Placement
        rooms = generateDoorsAndWindows(rooms);

        // 7. Furniture Placement
        rooms = applyFurnitureTemplates(rooms);

        // 8. AI Scoring Validation
        const currentScore = calculateLayoutScore(rooms);
        if (currentScore > bestScore) {
            bestScore = currentScore;
            bestRooms = rooms;
        }

        if (bestScore >= 85) {
            break; // Valid layout found!
        }
    }

    return bestRooms;
};
