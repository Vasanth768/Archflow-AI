/**
 * generator.js - Synthetic Floor Plan Dataset Generator for ArchFlow AI Training
 * 
 * Generates structured datasets containing varied plot sizes, room counts, units,
 * exact room dimensions, natural language prompts, canonical plan specifications,
 * constraint annotations, and validation metadata.
 */

import fs from 'fs';
import path from 'path';
import { generateDefaultFloorPlan } from '../../client/src/engine/cad/PlanGenerator.js';
import { ConstraintValidator } from '../../client/src/engine/cad/ConstraintValidator.js';
import { ArchitecturalIntentParser } from '../../client/src/architecture/ai/ArchitecturalIntentParser.js';

const validator = new ConstraintValidator();

// Varied plot sizes (Feet & Meters)
const plotSizes = [
    { w: 20, l: 30, unit: 'ft' },
    { w: 25, l: 40, unit: 'ft' },
    { w: 30, l: 40, unit: 'ft' },
    { w: 30, l: 50, unit: 'ft' },
    { w: 33, l: 47, unit: 'ft' },
    { w: 40, l: 60, unit: 'ft' },
    { w: 50, l: 80, unit: 'ft' },
    { w: 12, l: 18, unit: 'm' },
    { w: 15, l: 25, unit: 'm' },
    { w: 22, l: 37, unit: 'ft' }
];

const orientations = ['East', 'North', 'South', 'West', 'North-East', 'South-East'];
const bhkOptions = [1, 2, 3, 4, 5];

export function generateSyntheticDataset(numSamples = 50) {
    const dataset = [];

    for (let i = 0; i < numSamples; i++) {
        const plot = plotSizes[i % plotSizes.length];
        const facing = orientations[i % orientations.length];
        const bedrooms = bhkOptions[i % bhkOptions.length];

        const mbW = 10 + (i % 5);
        const mbL = 12 + (i % 6);
        const kitW = 8 + (i % 4);
        const kitL = 9 + (i % 4);

        // Generate English and Tanglish natural language prompts
        const prompts = [
            `${plot.w}x${plot.l} ${plot.unit} plot, ${bedrooms}BHK, master bedroom ${mbW}x${mbL}, kitchen ${kitW}x${kitL}, ${facing}-facing entrance`,
            `${plot.w}x${plot.l} plot la ${bedrooms}BHK venum, master bedroom ${mbW}x${mbL} irukkanum, ${facing} facing entrance`,
            `Build ${bedrooms}BHK residence on ${plot.w} by ${plot.l} ${plot.unit} site facing ${facing}`
        ];

        const promptText = prompts[i % prompts.length];
        const intent = ArchitecturalIntentParser.parsePlanPrompt(promptText);

        const plan = generateDefaultFloorPlan({
            width: plot.w,
            length: plot.l,
            facing: facing,
            bedrooms: bedrooms,
            requirements: {
                bedrooms: bedrooms,
                masterBedroom: { width: mbW, length: mbL },
                kitchen: { width: kitW, length: kitL }
            }
        });

        const validation = validator.validatePlan(plan);

        dataset.push({
            id: `sample_${i + 1}`,
            prompt: promptText,
            intent: intent,
            plan: plan,
            validation: validation,
            metadata: {
                schemaVersion: '1.0.0',
                generatedAt: new Date().toISOString()
            }
        });
    }

    return dataset;
}

// Write to raw/ & normalized/ directories
const rawDir = path.resolve('datasets/floor_plans/raw');
const normDir = path.resolve('datasets/floor_plans/normalized');

if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
if (!fs.existsSync(normDir)) fs.mkdirSync(normDir, { recursive: true });

const samples = generateSyntheticDataset(20);
fs.writeFileSync(path.join(rawDir, 'synthetic_floorplans.json'), JSON.stringify(samples, null, 2));
console.log(`[DatasetGenerator] Successfully generated ${samples.length} synthetic floor plan training samples.`);
