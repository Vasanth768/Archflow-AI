/**
 * ArchitecturalIntentParser.js - Converts Natural Language into Structured Architectural Commands
 */

import { RoomType } from '../model/schema.js';
import { parseArchitecturalDimension } from '../geometry/DimensionEngine.js';

export class ArchitecturalIntentParser {
    static parse(instruction) {
        if (!instruction || typeof instruction !== 'string') return null;
        const text = instruction.toLowerCase().trim();

        // 1. Resize Room
        const resizeMatch = text.match(/(?:make|resize|set)\s+(?:the\s+)?([a-z0-9\s]+?)\s+(\d+(?:'-\d+"|\s*ft|\s*feet|\s*inches|\s*"))(?:\s+(?:wide|width|long|length))?/i);
        if (resizeMatch) {
            const roomQuery = resizeMatch[1].trim();
            const dimStr = resizeMatch[2].trim();
            const inches = parseArchitecturalDimension(dimStr);
            const isLength = /long|length/i.test(text);

            return {
                action: 'resize_room',
                query: roomQuery,
                dimensionInches: inches,
                target: isLength ? 'length' : 'width',
                raw: instruction
            };
        }

        // 2. Add Room / Toilet
        if (/add\s+(?:attached\s+)?toilet/i.test(text)) {
            return {
                action: 'add_room',
                roomType: RoomType.ATTACHED_TOILET,
                name: 'ATTACHED TOILET',
                widthInches: 72, // 6'-0"
                lengthInches: 48, // 4'-0"
                raw: instruction
            };
        }

        // 3. Relocate / Optimize
        if (/move|relocate|optimize/i.test(text)) {
            if (/kitchen/i.test(text) && /north-east|northeast/i.test(text)) {
                return {
                    action: 'relocate_room',
                    query: 'kitchen',
                    targetZone: 'North-East',
                    raw: instruction
                };
            }
        }

        // 4. Change Style / Material
        if (/modern|traditional|minimalist|luxury|contemporary/i.test(text)) {
            const styleMatch = text.match(/modern|traditional|minimalist|luxury|contemporary/i);
            return {
                action: 'change_style',
                style: styleMatch[0].charAt(0).toUpperCase() + styleMatch[0].slice(1),
                raw: instruction
            };
        }

        return {
            action: 'custom_intent',
            raw: instruction
        };
    }
}
