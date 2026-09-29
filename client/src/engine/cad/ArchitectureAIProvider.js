/**
 * ArchitectureAIProvider.js - Production AI & Deterministic CAD Bridge
 * 
 * Strict Architectural Contract:
 * - Gemini / NLP parses natural language requests into structured architectural JSON commands.
 * - Deterministic PlanGenerator / ConstraintValidator constructs all CAD geometry.
 * - Exact requested dimensions (e.g. Master Bedroom 12x14 -> 144" x 168") are preserved.
 * - Vastu analysis is computed from actual final room coordinates.
 */

import { ConstraintValidator } from './ConstraintValidator.js';
import { geminiClient } from '../ai/GeminiClient.js';
import { generateDefaultFloorPlan } from './PlanGenerator.js';
import { ArchitecturalIntentParser } from '../../architecture/ai/ArchitecturalIntentParser.js';
import { formatFeetInches, parseArchitecturalDimension } from './UnitEngine.js';

export class ArchitectureAIProvider {
    constructor(adapter = null) {
        this.adapter = adapter;
        this.validator = new ConstraintValidator();
    }

    /**
     * Text -> Structured Canonical Floor Plan via Deterministic CAD Solver
     */
    async generatePlanFromText(prompt, options = {}) {
        let parsed = null;
        try {
            parsed = await geminiClient.parsePlanRequirements(prompt, options);
        } catch (e) {
            console.warn('[ArchitectureAIProvider] Gemini parse fallback to regex:', e);
        }

        const widthFt = parsed?.plot?.width || options.width || this.extractDimension(prompt, 'width') || 30;
        const lengthFt = parsed?.plot?.length || options.length || this.extractDimension(prompt, 'length') || 40;
        const facing = parsed?.plot?.facing || options.facing || this.extractFacing(prompt) || 'East';
        const floors = parsed?.floors || options.floors || 1;
        const style = parsed?.style || options.style || 'Standard Modern';
        const buildingType = parsed?.buildingType || options.type || 'Residential';

        // Extract any specific room dimension requests from prompt if not in parsed
        const requirements = parsed?.requirements || {};
        
        // Check for specific room dimensions in prompt (e.g. "master bedroom 12x14")
        const mbMatch = prompt.match(/master\s*(?:bedroom|bed)?\s*(\d+)\s*(?:x|by|×)\s*(\d+)/i);
        if (mbMatch) {
            requirements.masterBedroom = {
                width: parseInt(mbMatch[1], 10),
                length: parseInt(mbMatch[2], 10)
            };
        }

        const kitMatch = prompt.match(/kitchen\s*(\d+)\s*(?:x|by|×)\s*(\d+)/i);
        if (kitMatch) {
            requirements.kitchen = {
                width: parseInt(kitMatch[1], 10),
                length: parseInt(kitMatch[2], 10)
            };
        }

        // Generate complete architectural CAD plan using deterministic PlanGenerator
        const plan = generateDefaultFloorPlan({
            name: options.name || `${widthFt}×${lengthFt} ${facing} Facing Residence`,
            width: widthFt,
            length: lengthFt,
            facing: facing,
            floors: floors,
            style: style,
            type: buildingType,
            requirements: requirements
        });

        // Run deterministic CAD constraint validation
        const valRes = this.validator.validatePlan(plan);
        plan.metadata = plan.metadata || {};
        plan.metadata.validation = valRes;
        plan.metadata.aiSummary = parsed?.summary || `Generated ${widthFt}x${lengthFt} ${facing} plan.`;

        return plan;
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

        // 1. Try Gemini NLP Command Extraction
        let geminiCmd = null;
        try {
            geminiCmd = await geminiClient.parseCommand(instruction, currentPlan);
        } catch (e) {
            console.warn('[ArchitectureAIProvider] Gemini command parse fallback:', e);
        }

        // 2. Fallback to Local Deterministic Regex Parser
        const cmd = (geminiCmd && geminiCmd.success !== false && geminiCmd.action !== 'UNKNOWN')
            ? geminiCmd
            : ArchitecturalIntentParser.parse(instruction);

        const action = (cmd?.action || '').toUpperCase();
        const targetRoomStr = (cmd?.targetRoom || cmd?.query || '').toLowerCase();
        const lower = instruction.toLowerCase();

        if (action === 'RESIZE_ROOM' || action === 'RESIZE_SINGLE_DIM') {
            const target = (modified.rooms || []).find(r => 
                r.name.toLowerCase().includes(targetRoomStr) || 
                r.type.toLowerCase().includes(targetRoomStr)
            ) || modified.rooms[0];

            if (target) {
                const wInches = cmd.widthInches || (cmd.dimensions?.width ? cmd.dimensions.width * 12 : null);
                const lInches = cmd.lengthInches || (cmd.dimensions?.length ? cmd.dimensions.length * 12 : null);

                if (wInches) {
                    target.w = wInches;
                    if (target.clearDimensions) target.clearDimensions.width = wInches;
                }
                if (lInches) {
                    target.h = lInches;
                    if (target.clearDimensions) target.clearDimensions.length = lInches;
                }
                target.dimensionLabel = `${formatFeetInches(target.w, false)} × ${formatFeetInches(target.h, false)}`;
                target.areaSqFt = Math.round((target.w * target.h / 144) * 10) / 10;
                modified.project.name = `${modified.project.name} (${target.name} Resized)`;
            }
        } else if (action === 'ADD_ROOM' || lower.includes('add room') || lower.includes('add bedroom') || lower.includes('add toilet')) {
            const isToilet = targetRoomStr.includes('toilet') || lower.includes('toilet');
            const roomName = isToilet ? 'ATTACHED TOILET' : 'BEDROOM 3';
            const widthInches = cmd.widthInches || (isToilet ? 72 : 132);
            const lengthInches = cmd.lengthInches || (isToilet ? 60 : 120);

            modified.rooms.push({
                id: `r_${Date.now()}`,
                name: roomName,
                type: isToilet ? 'attached_toilet' : 'bedroom',
                x: 60,
                y: 60,
                w: widthInches,
                h: lengthInches,
                clearDimensions: { width: widthInches, length: lengthInches },
                dimensionLabel: `${formatFeetInches(widthInches, false)} × ${formatFeetInches(lengthInches, false)}`,
                areaSqFt: Math.round((widthInches * lengthInches / 144) * 10) / 10,
                color: isToilet ? '#F0FDF4' : '#F1F5F9'
            });
            modified.project.name = `${modified.project.name} (+ ${roomName})`;
        } else if (action === 'RELOCATE_ROOM' || action === 'CHANGE_STYLE') {
            if (cmd.targetZone && targetRoomStr.includes('kitchen')) {
                const kitch = modified.rooms.find(r => r.type === 'kitchen');
                if (kitch) {
                    kitch.zone = cmd.targetZone;
                    kitch.name = `KITCHEN (${cmd.targetZone})`;
                }
            }
            if (cmd.style) {
                if (modified.project) modified.project.style = cmd.style;
                if (modified.materials) modified.materials.facadeStyle = cmd.style;
            }
        }

        // Validate modified plan with deterministic CAD constraints
        const valRes = this.validator.validatePlan(modified);
        modified.metadata.validation = valRes;

        return modified;
    }

    extractDimension(text, type) {
        const match = text.match(/(\d+)\s*(?:x|by|×)\s*(\d+)/i);
        if (match) {
            return type === 'width' ? parseInt(match[1], 10) : parseInt(match[2], 10);
        }
        return null;
    }

    extractFacing(text) {
        if (/north-east|northeast/i.test(text)) return 'North-East';
        if (/north-west|northwest/i.test(text)) return 'North-West';
        if (/south-east|southeast/i.test(text)) return 'South-East';
        if (/south-west|southwest/i.test(text)) return 'South-West';
        if (/north/i.test(text)) return 'North';
        if (/south/i.test(text)) return 'South';
        if (/east/i.test(text)) return 'East';
        if (/west/i.test(text)) return 'West';
        return 'East';
    }
}

export default ArchitectureAIProvider;
