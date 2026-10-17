/**
 * ArchitecturalIntentParser.js - Multilingual & Deterministic Natural Language Parser
 * 
 * Supports English, Tamil, Tanglish, and mixed-language architectural requirements.
 * Extracts plot dimensions, measurement units, room types/counts, exact dimensions,
 * orientations, setbacks, and modification commands.
 */

import { RoomType } from '../model/schema.js';
import { parseArchitecturalDimension } from '../../engine/cad/UnitEngine.js';

export class ArchitecturalIntentParser {
    /**
     * Parses a full prompt string into structured plan requirements
     */
    static parsePlanPrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') return null;
        const text = prompt.toLowerCase().trim();

        // 1. Extract Plot Dimensions & Units (e.g., "20x30", "30x40 ft", "12x18m", "30x50 plot la")
        let plotWidth = null;
        let plotLength = null;
        let unitSystem = 'feet';

        const metricMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:x|by|×)\s*(\d+(?:\.\d+)?)\s*(?:m|metres|meters|mm)/i);
        if (metricMatch) {
            plotWidth = parseFloat(metricMatch[1]);
            plotLength = parseFloat(metricMatch[2]);
            unitSystem = text.includes('mm') ? 'mm' : 'm';
        } else {
            const plotMatch = text.match(/(\d+)\s*(?:x|by|×)\s*(\d+)/i);
            if (plotMatch) {
                plotWidth = parseInt(plotMatch[1], 10);
                plotLength = parseInt(plotMatch[2], 10);
            }
        }

        // 2. Extract Facing / Orientation (English & Tanglish)
        let facing = 'East';
        if (/north-east|northeast|ishanya/i.test(text)) facing = 'North-East';
        else if (/north-west|northwest|vayavya/i.test(text)) facing = 'North-West';
        else if (/south-east|southeast|agneya/i.test(text)) facing = 'South-East';
        else if (/south-west|southwest|nairutya/i.test(text)) facing = 'South-West';
        else if (/vadakku|north/i.test(text)) facing = 'North';
        else if (/therku|south/i.test(text)) facing = 'South';
        else if (/kizhaktu|east/i.test(text)) facing = 'East';
        else if (/merkku|west/i.test(text)) facing = 'West';

        // 3. Extract Bedroom Count (2BHK, 3BHK, rendu bedroom, 5 bedrooms)
        let bedrooms = 2;
        const bhkMatch = text.match(/(\d+)\s*bhk/i);
        if (bhkMatch) {
            bedrooms = parseInt(bhkMatch[1], 10);
        } else {
            if (/\b(rendu|rendo|two|2)\b.*bed/i.test(text) || /\b2bhk\b/i.test(text)) bedrooms = 2;
            else if (/\b(moonu|three|3)\b.*bed/i.test(text) || /\b3bhk\b/i.test(text)) bedrooms = 3;
            else if (/\b(naangu|four|4)\b.*bed/i.test(text) || /\b4bhk\b/i.test(text)) bedrooms = 4;
            else if (/\b(aindhu|five|5)\b.*bed/i.test(text) || /\b5bhk\b/i.test(text)) bedrooms = 5;
            else if (/\b(oru|one|1)\b.*bed/i.test(text) || /\b1bhk\b/i.test(text)) bedrooms = 1;
        }

        // 4. Extract Bathroom / Toilet Requirements
        let bathroomCount = 1;
        if (/\b(rendu|two|2)\b.*bath/i.test(text) || /two bathrooms|rendu bathroom/i.test(text)) {
            bathroomCount = 2;
        }

        // 5. Extract Room Catalog & Specific Room Dimensions
        const requirements = {
            bedrooms: bedrooms,
            bathroomCount: bathroomCount,
            pooja: /pooja|poojai|swamy room/i.test(text),
            parking: /parking|car parking|portico|vandi/i.test(text),
            office: /office|home office|study room|padipau/i.test(text),
            attachedToilet: /attached|attached toilet|att bath/i.test(text) || bathroomCount >= 1
        };

        // Master Bedroom exact dimensions (e.g., "master bedroom exactly 12x14", "master bed 12x14 irukkanum")
        const mbMatch = text.match(/master\s*(?:bedroom|bed)?\s*(?:exactly|size|of|is|with)?\s*(\d+)\s*(?:x|by|×)\s*(\d+)/i);
        if (mbMatch) {
            requirements.masterBedroom = {
                width: parseInt(mbMatch[1], 10),
                length: parseInt(mbMatch[2], 10)
            };
        }

        // Kitchen exact dimensions (e.g., "kitchen 10x8", "kitchen size 9x10")
        const kitMatch = text.match(/kitchen\s*(?:exactly|size|of|is|with)?\s*(\d+)\s*(?:x|by|×)\s*(\d+)/i);
        if (kitMatch) {
            requirements.kitchen = {
                width: parseInt(kitMatch[1], 10),
                length: parseInt(kitMatch[2], 10)
            };
        }

        return {
            plot: {
                width: plotWidth || 30,
                length: plotLength || 40,
                unitSystem: unitSystem,
                facing: facing
            },
            requirements: requirements,
            rawPrompt: prompt
        };
    }

    /**
     * Parses interactive single modification command (e.g., "Make kitchen 10x12", "Kitchen size mattum 10x12 aakku")
     */
    static parse(instruction) {
        if (!instruction || typeof instruction !== 'string') return null;
        const text = instruction.toLowerCase().trim();

        // 1. Room Resize (English & Tanglish): "kitchen 10x12", "kitchen size mattum 10x12 aakku", "master bedroom 14x16"
        const twoDimMatch = text.match(/([a-z0-9\s]+?)\s+(?:size\s+mattum\s+)?(?:to\s+)?(\d+(?:'-\d+"|\s*ft|\s*feet|\s*inches|\s*")?)\s*(?:x|by|×)\s*(\d+(?:'-\d+"|\s*ft|\s*feet|\s*inches|\s*")?)/i);
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

        // 2. Add Room
        if (/add|sertthu|venum/i.test(text) && /toilet|bedroom|pooja|office/i.test(text)) {
            let roomType = RoomType.BEDROOM;
            let name = 'NEW ROOM';
            let w = 132;
            let l = 120;

            if (/toilet|bath/i.test(text)) {
                roomType = RoomType.ATTACHED_TOILET;
                name = 'ATT. TOILET';
                w = 72;
                l = 60;
            } else if (/pooja/i.test(text)) {
                roomType = RoomType.POOJA;
                name = 'POOJA ROOM';
                w = 60;
                l = 60;
            } else if (/office/i.test(text)) {
                roomType = RoomType.HOME_OFFICE;
                name = 'HOME OFFICE';
                w = 120;
                l = 120;
            }

            return {
                action: 'add_room',
                roomType: roomType,
                name: name,
                widthInches: w,
                lengthInches: l,
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
