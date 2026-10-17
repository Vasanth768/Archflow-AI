/**
 * ArchitectureAIProvider.js - Local-First AI & Deterministic CAD Bridge
 * 
 * Strict Architectural Contract:
 * 1. Uses LocalNLUModelProvider for offline local-first generation (requires zero paid APIs).
 * 2. Connects to cloud AI APIs only when explicitly enabled.
 * 3. Deterministic DynamicLayoutSolver / PlanGenerator / ConstraintValidator constructs 100% of geometry.
 * 4. Exact requested dimensions (e.g. Master Bedroom 12x14 -> 144" x 168") are preserved.
 */

import { ConstraintValidator } from './ConstraintValidator.js';
import { generateDefaultFloorPlan } from './PlanGenerator.js';
import { ArchitecturalIntentParser } from '../../architecture/ai/ArchitecturalIntentParser.js';
import { LocalNLUModelProvider } from '../ai/LocalNLUModelProvider.js';
import { formatFeetInches } from './UnitEngine.js';

const localNLU = new LocalNLUModelProvider();

export class ArchitectureAIProvider {
    constructor(adapter = null) {
        this.adapter = adapter;
        this.validator = new ConstraintValidator();
    }

    /**
     * Text -> Structured Canonical Floor Plan via Local-First Deterministic CAD Solver
     */
    async generatePlanFromText(prompt, options = {}) {
        // Use local-first NLU provider by default
        return await localNLU.buildPlanSpecification(prompt, options);
    }

    /**
     * Natural Language Plan Modification via Deterministic Geometry Updates
     */
    async modifyPlan(currentPlan, instruction) {
        if (!currentPlan) return currentPlan;
        const modified = JSON.parse(JSON.stringify(currentPlan));

        modified.metadata = modified.metadata || {};
        modified.metadata.versionHistory = modified.metadata.versionHistory || [];
        modified.metadata.versionHistory.push({
            timestamp: new Date().toISOString(),
            instruction: instruction,
            previousVersion: modified.project?.name || 'Previous Plan'
        });

        // Local Deterministic Intent Parsing
        const cmd = ArchitecturalIntentParser.parse(instruction);
        const action = (cmd?.action || '').toUpperCase();
        const targetRoomStr = (cmd?.query || '').toLowerCase();

        if (action === 'RESIZE_ROOM') {
            const target = (modified.rooms || []).find(r => 
                r.name.toLowerCase().includes(targetRoomStr) || 
                r.type.toLowerCase().includes(targetRoomStr)
            ) || modified.rooms[0];

            if (target) {
                const wInches = cmd.widthInches;
                const lInches = cmd.lengthInches;

                if (wInches) {
                    target.w = wInches;
                    if (target.clearDimensions) target.clearDimensions.width = wInches;
                }
                if (lInches) {
                    target.h = lInches;
                    if (target.clearDimensions) target.clearDimensions.length = lInches;
                }
                target.dimensionLabel = `${formatFeetInches(target.w, false)} × ${formatFeetInches(target.h, false)}`;
                target.areaSqFt = Math.round(((target.w * target.h) / 144) * 10) / 10;
                modified.project.name = `${modified.project.name} (${target.name} Resized)`;
            }
        } else if (action === 'ADD_ROOM') {
            const roomName = cmd.name || 'NEW ROOM';
            const widthInches = cmd.widthInches || 132;
            const lengthInches = cmd.lengthInches || 120;

            modified.rooms.push({
                id: `r_${Date.now()}`,
                name: roomName,
                type: cmd.roomType || 'bedroom',
                x: 60,
                y: 60,
                w: widthInches,
                h: lengthInches,
                clearDimensions: { width: widthInches, length: lengthInches },
                dimensionLabel: `${formatFeetInches(widthInches, false)} × ${formatFeetInches(lengthInches, false)}`,
                areaSqFt: Math.round(((widthInches * lengthInches) / 144) * 10) / 10,
                color: '#F1F5F9'
            });
            modified.project.name = `${modified.project.name} (+ ${roomName})`;
        }

        // Validate modified plan with deterministic CAD constraints
        const valRes = this.validator.validatePlan(modified);
        modified.metadata.validation = valRes;

        return modified;
    }
}

export default ArchitectureAIProvider;
