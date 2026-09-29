/**
 * ArchitecturalCommandEngine.js - Executes Structured Commands Safely on the Canonical Model
 * 
 * Modifies canonical CAD plan data deterministically based on structured commands.
 * Runs geometric validation and requirement verification after every action.
 */

import { ArchitecturalIntentParser } from './ArchitecturalIntentParser.js';
import { ConstraintValidator } from '../../engine/cad/ConstraintValidator.js';
import { formatFeetInches, formatRoomDimensions, sqInchesToSqFt } from '../../engine/cad/UnitEngine.js';

export class ArchitecturalCommandEngine {
    constructor() {
        this.validator = new ConstraintValidator();
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
                    if (command.widthInches) {
                        targetRoom.w = command.widthInches;
                        if (targetRoom.clearDimensions) targetRoom.clearDimensions.width = command.widthInches;
                    }
                    if (command.lengthInches) {
                        targetRoom.h = command.lengthInches;
                        if (targetRoom.clearDimensions) targetRoom.clearDimensions.length = command.lengthInches;
                    }
                    targetRoom.dimensionLabel = formatRoomDimensions(targetRoom.w, targetRoom.h);
                    targetRoom.areaSqFt = sqInchesToSqFt(targetRoom.w * targetRoom.h);
                    modified.project.name = `${modified.project.name} (${targetRoom.name} Resized)`;
                }
                break;
            }
            case 'resize_single_dim': {
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
                    targetRoom.dimensionLabel = formatRoomDimensions(targetRoom.w, targetRoom.h);
                    targetRoom.areaSqFt = sqInchesToSqFt(targetRoom.w * targetRoom.h);
                }
                break;
            }
            case 'add_room': {
                const w = command.widthInches || 120;
                const h = command.lengthInches || 120;
                modified.rooms.push({
                    id: `r_${Date.now()}`,
                    name: command.name || 'NEW ROOM',
                    type: command.roomType,
                    x: 60,
                    y: 60,
                    w: w,
                    h: h,
                    clearDimensions: { width: w, length: h },
                    dimensionLabel: formatRoomDimensions(w, h),
                    areaSqFt: sqInchesToSqFt(w * h),
                    floorFinish: 'Vitrified Tiles',
                    wallFinish: 'Emulsion Paint',
                    color: '#F8FAFC'
                });
                break;
            }
            case 'relocate_room': {
                const targetRoom = (modified.rooms || []).find(r => 
                    r.name.toLowerCase().includes(command.query.toLowerCase()) ||
                    r.type.toLowerCase().includes(command.query.toLowerCase())
                );
                if (targetRoom && command.targetZone) {
                    targetRoom.zone = command.targetZone;
                    targetRoom.name = `${targetRoom.name.replace(/\s*\([A-Z]+\)/g, '')} (${command.targetZone})`;
                }
                break;
            }
            case 'change_style': {
                if (modified.materials) {
                    modified.materials.facadeStyle = command.style;
                }
                if (modified.project) {
                    modified.project.style = command.style;
                }
                break;
            }
            default:
                break;
        }

        const validation = this.validator.validatePlan(modified);
        modified.metadata = modified.metadata || {};
        modified.metadata.validation = validation;

        return modified;
    }

    executeNaturalLanguage(plan, naturalLanguageText) {
        const cmd = ArchitecturalIntentParser.parse(naturalLanguageText);
        return this.executeCommand(plan, cmd);
    }
}

export default ArchitecturalCommandEngine;
