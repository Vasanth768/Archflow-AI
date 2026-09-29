/**
 * ArchitecturalIntentParser.js - Deterministic Natural Language Command Parser
 * 
 * Extracts structured architectural actions and exact dimensions from user commands.
 * Handles English, technical CAD syntax, and transliterated commands.
 * All parsed dimensions are normalized into canonical INCHES.
 */

import { RoomType } from '../model/schema.js';
import { parseArchitecturalDimension } from '../../engine/cad/UnitEngine.js';

export class ArchitecturalIntentParser {
    static parse(instruction) {
        if (!instruction || typeof instruction !== 'string') return null;
        const text = instruction.toLowerCase().trim();

        // 1. Exact 2-Dimension Room Resize: e.g. "Master bedroom 12x14", "Resize kitchen to 10x12", "Make living 16 by 18"
        const twoDimMatch = text.match(/(?:make|resize|set|change)?\s*(?:the\s+)?([a-z0-9\s]+?)\s+(?:to\s+)?(\d+(?:'-\d+"|\s*ft|\s*feet|\s*inches|\s*")?)\s*(?:x|by|×)\s*(\d+(?:'-\d+"|\s*ft|\s*feet|\s*inches|\s*")?)/i);
        if (twoDimMatch && !text.startsWith('add')) {
            const roomQuery = twoDimMatch[1].replace(/^(?:make|resize|set|change|the)\s+/i, '').trim();
            const dim1 = parseArchitecturalDimension(twoDimMatch[2].trim());
            const dim2 = parseArchitecturalDimension(twoDimMatch[3].trim());

            return {
                action: 'resize_room',
                query: roomQuery,
                widthInches: dim1,
                lengthInches: dim2,
                raw: instruction
            };
        }

        // 2. Single Dimension Room Resize: e.g. "make kitchen 12 wide", "set bedroom length 14ft"
        const singleDimMatch = text.match(/(?:make|resize|set)\s+(?:the\s+)?([a-z0-9\s]+?)\s+(\d+(?:'-\d+"|\s*ft|\s*feet|\s*inches|\s*"))(?:\s+(?:wide|width|long|length))?/i);
        if (singleDimMatch) {
            const roomQuery = singleDimMatch[1].trim();
            const inches = parseArchitecturalDimension(singleDimMatch[2].trim());
            const isLength = /long|length/i.test(text);

            return {
                action: 'resize_single_dim',
                query: roomQuery,
                dimensionInches: inches,
                target: isLength ? 'length' : 'width',
                raw: instruction
            };
        }

        // 3. Add Room / Toilet with Optional Dimensions
        if (/add\s+/i.test(text)) {
            if (/toilet|bath/i.test(text)) {
                return {
                    action: 'add_room',
                    roomType: RoomType.ATTACHED_TOILET,
                    name: 'ATTACHED TOILET',
                    widthInches: 72, // 6'-0"
                    lengthInches: 60, // 5'-0"
                    raw: instruction
                };
            }
            if (/bedroom|bed/i.test(text)) {
                // Check if dimensions specified in add command
                const addDimMatch = text.match(/(\d+)\s*(?:x|by|×)\s*(\d+)/i);
                const w = addDimMatch ? parseArchitecturalDimension(addDimMatch[1]) : 132;
                const l = addDimMatch ? parseArchitecturalDimension(addDimMatch[2]) : 120;
                return {
                    action: 'add_room',
                    roomType: RoomType.BEDROOM,
                    name: 'BEDROOM 3',
                    widthInches: w,
                    lengthInches: l,
                    raw: instruction
                };
            }
            if (/pooja/i.test(text)) {
                return {
                    action: 'add_room',
                    roomType: RoomType.POOJA,
                    name: 'POOJA ROOM',
                    widthInches: 60,
                    lengthInches: 60,
                    raw: instruction
                };
            }
        }

        // 4. Relocate / Vastu Orientation
        if (/move|relocate|optimize|place|align/i.test(text) || /kitchen.*(?:se|south-east|southeast|agneya)/i.test(text)) {
            let zone = null;
            if (/south-east|southeast|agneya|\bse\b/i.test(text)) zone = 'SE';
            else if (/north-east|northeast|ishanya|\bne\b/i.test(text)) zone = 'NE';
            else if (/south-west|southwest|nairutya|\bsw\b/i.test(text)) zone = 'SW';
            else if (/north-west|northwest|vayavya|\bnw\b/i.test(text)) zone = 'NW';
            else if (/east|\be\b/i.test(text)) zone = 'E';
            else if (/west|\bw\b/i.test(text)) zone = 'W';
            else if (/north|\bn\b/i.test(text)) zone = 'N';
            else if (/south|\bs\b/i.test(text)) zone = 'S';

            const roomQuery = text.includes('kitchen') ? 'kitchen' : (text.includes('pooja') ? 'pooja' : (text.includes('master') ? 'master' : 'room'));

            return {
                action: 'relocate_room',
                query: roomQuery,
                targetZone: zone,
                raw: instruction
            };
        }

        // 5. Change Style / Material
        if (/modern|traditional|minimalist|luxury|contemporary|budget/i.test(text)) {
            const styleMatch = text.match(/modern|traditional|minimalist|luxury|contemporary|budget/i);
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

export default ArchitecturalIntentParser;
