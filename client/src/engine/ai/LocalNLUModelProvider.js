/**
 * LocalNLUModelProvider.js - Local-First AI Provider for ArchFlow AI
 * 
 * Operates 100% locally without requiring paid external AI APIs.
 * Combines local rule-based intent parsing, architectural term normalization,
 * canonical plan specification building, and deterministic validation explanations.
 */

import { ArchitecturalIntentParser } from '../../architecture/ai/ArchitecturalIntentParser.js';
import { generateDefaultFloorPlan } from '../cad/PlanGenerator.js';
import { ConstraintValidator } from '../cad/ConstraintValidator.js';

export class LocalNLUModelProvider {
    constructor() {
        this.validator = new ConstraintValidator();
    }

    /**
     * Parses architectural text requirement into canonical JSON plan specification
     */
    async parseIntent(prompt, options = {}) {
        const parsed = ArchitecturalIntentParser.parsePlanPrompt(prompt);
        return {
            plot: parsed.plot,
            requirements: parsed.requirements,
            summary: `Parsed ${parsed.plot.width}x${parsed.plot.length} ${parsed.plot.facing} facing plan requirement with ${parsed.requirements.bedrooms} BHK.`
        };
    }

    /**
     * Normalizes architectural terms and synonyms
     */
    normalizeTerms(term) {
        if (!term) return 'other';
        const str = String(term).toLowerCase().trim();

        if (str.includes('master') || str.includes('periya bed')) return 'master_bedroom';
        if (str.includes('samayal') || str.includes('kitchen')) return 'kitchen';
        if (str.includes('hall') || str.includes('living') || str.includes('verandah')) return 'living';
        if (str.includes('pooja') || str.includes('swamy')) return 'pooja';
        if (str.includes('kuliyal') || str.includes('bath') || str.includes('toilet')) return 'attached_toilet';
        if (str.includes('office') || str.includes('study') || str.includes('padipau')) return 'home_office';
        return 'bedroom';
    }

    /**
     * Builds complete 2D floor plan object from prompt via local deterministic layout solver
     */
    async buildPlanSpecification(prompt, options = {}) {
        const intent = await this.parseIntent(prompt, options);

        const plan = generateDefaultFloorPlan({
            name: options.name || `${intent.plot.width}×${intent.plot.length} ${intent.plot.facing} Residence`,
            width: intent.plot.width,
            length: intent.plot.length,
            facing: intent.plot.facing,
            floors: options.floors || 1,
            style: options.style || 'Standard Modern',
            requirements: intent.requirements
        });

        // Run validation
        const valRes = this.validator.validatePlan(plan);
        plan.metadata = plan.metadata || {};
        plan.metadata.validation = valRes;
        plan.metadata.aiSummary = intent.summary;
        plan.metadata.localAIProvider = 'ArchFlow Local NLU Engine v1.0';

        return plan;
    }

    /**
     * Explains validation result in natural language
     */
    explainValidation(validationResult) {
        if (!validationResult) return 'Validation passed with zero issues.';
        if (validationResult.isValid) {
            return `Floor plan passed all CAD validation rules with zero errors. Plotted area: ${validationResult.stats.totalBuiltUpAreaSqFt || 0} sq ft across ${validationResult.stats.totalRooms || 0} rooms.`;
        }

        const errorsText = validationResult.errors.join('; ');
        return `Validation Warning: ${errorsText}`;
    }

    /**
     * Interprets user modification command locally
     */
    interpretModification(instruction, currentPlan) {
        const parsedCmd = ArchitecturalIntentParser.parse(instruction);
        return parsedCmd;
    }
}

export default LocalNLUModelProvider;
