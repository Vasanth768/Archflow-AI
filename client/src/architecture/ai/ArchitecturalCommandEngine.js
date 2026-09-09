/**
 * ArchitecturalCommandEngine.js - Executes Structured Commands Safely on the Canonical Model
 */

import { ArchitecturalIntentParser } from './ArchitecturalIntentParser.js';
import { GeometryValidator } from '../geometry/GeometryValidator.js';
import { formatFeetInches } from '../geometry/DimensionEngine.js';

export class ArchitecturalCommandEngine {
    constructor() {
        this.validator = new GeometryValidator();
    }

    executeCommand(plan, command) {
        if (!plan || !command) return plan;
        const modified = JSON.parse(JSON.stringify(plan));

        switch (command.action) {
            case 'resize_room': {
                const targetRoom = (modified.rooms || []).find(r => 
                    r.name.toLowerCase().includes(command.query.toLowerCase()) ||
                    r.type.toLowerCase().includes(command.query.toLowerCase())
                );
                if (targetRoom) {
                    if (command.target === 'length') {
                        targetRoom.h = command.dimensionInches;
                        if (targetRoom.clearDimensions) targetRoom.clearDimensions.length = command.dimensionInches;
                    } else {
                        targetRoom.w = command.dimensionInches;
                        if (targetRoom.clearDimensions) targetRoom.clearDimensions.width = command.dimensionInches;
                    }
                    targetRoom.dimensionLabel = `${formatFeetInches(targetRoom.w, false)} × ${formatFeetInches(targetRoom.h, false)}`;
                    targetRoom.areaSqFt = Math.round((targetRoom.w * targetRoom.h) / 144 * 10) / 10;
                }
                break;
            }
            case 'add_room': {
                modified.rooms.push({
                    id: `r_${Date.now()}`,
                    name: command.name || 'NEW ROOM',
                    type: command.roomType,
                    x: 180,
                    y: 180,
                    w: command.widthInches || 72,
                    h: command.lengthInches || 48,
                    clearDimensions: { width: command.widthInches || 72, length: command.lengthInches || 48 },
                    dimensionLabel: `${formatFeetInches(command.widthInches || 72, false)} × ${formatFeetInches(command.lengthInches || 48, false)}`,
                    areaSqFt: Math.round(((command.widthInches || 72) * (command.lengthInches || 48)) / 144 * 10) / 10
                });
                break;
            }
            case 'change_style': {
                if (modified.materials) {
                    modified.materials.facadeStyle = command.style;
                }
                break;
            }
            default:
                break;
        }

        const validation = this.validator.validate(modified);
        modified.metadata = modified.metadata || {};
        modified.metadata.validation = validation;

        return modified;
    }

    executeNaturalLanguage(plan, naturalLanguageText) {
        const cmd = ArchitecturalIntentParser.parse(naturalLanguageText);
        return this.executeCommand(plan, cmd);
    }
}
