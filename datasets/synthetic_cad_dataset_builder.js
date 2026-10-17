/**
 * synthetic_cad_dataset_builder.js - Stage 8B Reproducible Synthetic Dataset Builder
 * 
 * Generates verified, non-copyrighted, geometrically sound 2D CAD architectural datasets
 * for local model training (70% train, 15% validation, 15% test).
 * 
 * Reuses:
 * - PlanGenerator.js (Canonical floor plan synthesis)
 * - DynamicLayoutSolver.js (Collision-free layout arrangement)
 * - ConstraintValidator.js (Zero-tolerance overlap and containment verification)
 * - CanonicalSchema.js (Standardized inches-based coordinate model)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDefaultFloorPlan } from '../client/src/engine/cad/PlanGenerator.js';
import { ConstraintValidator } from '../client/src/engine/cad/ConstraintValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seeded PRNG (Mulberry32) for bit-for-bit deterministic reproducibility
 */
export function createSeededRandom(seed = 42) {
    let s = seed >>> 0;
    return function() {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Creates structural fingerprint for deduplication to prevent dataset leakage
 */
export function computeLayoutFingerprint(plan) {
    const site = plan.site || {};
    const rooms = (plan.rooms || []).map(r => {
        const type = r.type || 'room';
        const w = Math.round(r.w || (r.clearDimensions?.width || 0));
        const h = Math.round(r.h || (r.clearDimensions?.length || 0));
        const x = Math.round(r.x || 0);
        const y = Math.round(r.y || 0);
        return `${type}:${w}x${h}@${x},${y}`;
    }).sort().join('|');

    return `${site.width}x${site.length}_${site.facing || 'East'}_[${rooms}]`;
}

/**
 * Synthetic Dataset Generator Class
 */
export class SyntheticCADDatasetBuilder {
    constructor(options = {}) {
        this.version = "1.0.0";
        this.seed = options.seed !== undefined ? options.seed : 42;
        this.rng = createSeededRandom(this.seed);
        this.validator = new ConstraintValidator();
        this.targetCount = options.targetCount || 1000;
        this.maxBytes = options.maxBytes || 20 * 1024 * 1024; // 20 MB safety ceiling
        this.outputDir = options.outputDir || path.resolve(__dirname, 'synthetic_cad_dataset');

        // Parameter distributions
        this.plotWidths = [20, 22, 24, 25, 27, 30, 32, 33, 35, 36, 40, 45, 50, 55, 60];
        this.plotLengths = [25, 30, 32, 35, 38, 40, 42, 45, 48, 50, 55, 60, 65, 70, 75, 80];
        this.facings = ['East', 'North', 'South', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
        this.bhkList = [1, 2, 3, 4];
        this.buildingTypes = ['Single Floor', 'Duplex', 'Villa'];

        this.rejectionCounts = {
            ROOM_OVERLAP: 0,
            DOOR_ORPHANED_OR_EXCEEDED: 0,
            WINDOW_ORPHANED_OR_EXCEEDED: 0,
            WALL_TOO_SHORT_OR_OUTSIDE: 0,
            UNCONTAINED_ROOM: 0,
            TOO_FEW_ROOMS: 0,
            DUPLICATE_LAYOUT: 0,
            VALIDATION_ERROR: 0
        };
    }

    randomChoice(arr) {
        return arr[Math.floor(this.rng() * arr.length)];
    }

    randomInt(min, max) {
        return Math.floor(this.rng() * (max - min + 1)) + min;
    }

    generatePrompt(plotW, plotL, unit, bhk, facing, mbW, mbL, kitW, kitL) {
        const templates = [
            `${plotW}x${plotL} ${unit} plot, ${bhk}BHK residence, master bedroom ${mbW}x${mbL}, kitchen ${kitW}x${kitL}, ${facing} facing entrance`,
            `Design a ${bhk}BHK architectural layout on a ${plotW} by ${plotL} ${unit} plot facing ${facing} with ${mbW}x${mbL} master bedroom`,
            `${plotW}x${plotL} plot la ${bhk}BHK floor plan venum, master bedroom ${mbW}x${mbL}, ${facing} facing`,
            `Contemporary ${bhk}BHK residential floor plan, plot size ${plotW}x${plotL} ${unit}, entrance towards ${facing}`
        ];
        return templates[Math.floor(this.rng() * templates.length)];
    }

    generateSingleCandidate(index) {
        const plotW = this.randomChoice(this.plotWidths);
        const plotL = this.randomChoice(this.plotLengths);
        const facing = this.randomChoice(this.facings);
        const bhk = this.randomChoice(this.bhkList);
        const buildingType = this.randomChoice(this.buildingTypes);
        const unit = this.rng() < 0.15 ? 'm' : 'ft';

        // Master bed and kitchen dimensions proportional to plot
        const maxMbW = Math.max(10, Math.min(18, Math.floor(plotW * 0.45)));
        const maxMbL = Math.max(12, Math.min(20, Math.floor(plotL * 0.4)));
        const mbW = this.randomInt(10, maxMbW);
        const mbL = this.randomInt(12, maxMbL);

        const maxKitW = Math.max(8, Math.min(14, Math.floor(plotW * 0.35)));
        const maxKitL = Math.max(8, Math.min(14, Math.floor(plotL * 0.3)));
        const kitW = this.randomInt(8, maxKitW);
        const kitL = this.randomInt(8, maxKitL);

        const pooja = this.rng() < 0.5;
        const parking = this.rng() < 0.4;
        const attachedToilet = this.rng() < 0.7;
        const balcony = bhk >= 2 && this.rng() < 0.35;
        const study = bhk >= 3 && this.rng() < 0.25;

        const promptText = this.generatePrompt(plotW, plotL, unit, bhk, facing, mbW, mbL, kitW, kitL);

        const planOptions = {
            id: `plan_syn_${index + 1}`,
            name: `${plotW}×${plotL} ${facing} Residence`,
            width: plotW,
            length: plotL,
            unitSystem: unit === 'm' ? 'metric' : 'imperial',
            facing: facing,
            type: buildingType,
            requirements: {
                bedrooms: bhk,
                masterBedroom: { width: mbW, length: mbL },
                kitchen: { width: kitW, length: kitL },
                pooja,
                parking,
                attachedToilet,
                balcony,
                study
            }
        };

        const plan = generateDefaultFloorPlan(planOptions);
        return { planOptions, plan, promptText };
    }

    validateCandidate(plan) {
        if (!plan) return { valid: false, reason: 'VALIDATION_ERROR' };

        const site = plan.site || {};
        if (!site.width || site.width <= 0 || !site.length || site.length <= 0) {
            return { valid: false, reason: 'INVALID_SITE_BOUNDS' };
        }

        const rooms = plan.rooms || [];
        if (rooms.length < 2) {
            return { valid: false, reason: 'TOO_FEW_ROOMS' };
        }

        // Run comprehensive constraint validator
        const valResult = this.validator.validatePlan(plan);
        if (!valResult.isValid || valResult.errors.length > 0) {
            const errStr = valResult.errors.join(' ');
            if (errStr.includes('overlaps with')) return { valid: false, reason: 'ROOM_OVERLAP' };
            if (errStr.includes('Door')) return { valid: false, reason: 'DOOR_ORPHANED_OR_EXCEEDED' };
            if (errStr.includes('Window')) return { valid: false, reason: 'WINDOW_ORPHANED_OR_EXCEEDED' };
            if (errStr.includes('Wall')) return { valid: false, reason: 'WALL_TOO_SHORT_OR_OUTSIDE' };
            return { valid: false, reason: 'VALIDATION_ERROR' };
        }

        // Strict envelope containment check
        const env = site.buildableEnvelope || { x: 0, y: 0, width: site.width, length: site.length };
        const envMaxX = (env.x || 0) + (env.width || site.width) + 0.1;
        const envMaxY = (env.y || 0) + (env.length || site.length) + 0.1;

        for (const r of rooms) {
            const rx = r.x || 0;
            const ry = r.y || 0;
            const rw = r.w || (r.clearDimensions?.width || 0);
            const rh = r.h || (r.clearDimensions?.length || 0);

            if (rx < (env.x || 0) - 0.1 || ry < (env.y || 0) - 0.1 ||
                rx + rw > envMaxX || ry + rh > envMaxY) {
                return { valid: false, reason: 'UNCONTAINED_ROOM' };
            }
        }

        return { valid: true, validation: valResult };
    }

    buildDataset() {
        console.log(`[DatasetBuilder] Starting synthetic CAD dataset generation.`);
        console.log(`  Seed: ${this.seed}`);
        console.log(`  Target Accepted Count: ${this.targetCount}`);
        console.log(`  Output Directory: ${this.outputDir}`);

        const acceptedSamples = [];
        const seenFingerprints = new Set();
        let totalCandidates = 0;
        const maxCandidates = this.targetCount * 5; // Safety cap on loop

        while (acceptedSamples.length < this.targetCount && totalCandidates < maxCandidates) {
            totalCandidates++;
            const { planOptions, plan, promptText } = this.generateSingleCandidate(totalCandidates);

            // 1. Geometric validation
            const valCheck = this.validateCandidate(plan);
            if (!valCheck.valid) {
                this.rejectionCounts[valCheck.reason] = (this.rejectionCounts[valCheck.reason] || 0) + 1;
                continue;
            }

            // 2. Duplicate fingerprint check
            const fingerprint = computeLayoutFingerprint(plan);
            if (seenFingerprints.has(fingerprint)) {
                this.rejectionCounts.DUPLICATE_LAYOUT++;
                continue;
            }
            seenFingerprints.add(fingerprint);

            // 3. Assemble structured dataset sample
            const sampleId = `archflow_syn_${String(acceptedSamples.length + 1).padStart(4, '0')}`;
            const structuredSample = {
                id: sampleId,
                fingerprint: fingerprint,
                input: {
                    plot: {
                        widthFt: planOptions.width,
                        lengthFt: planOptions.length,
                        widthInches: plan.site.width,
                        lengthInches: plan.site.length,
                        facing: plan.site.facing,
                        unitSystem: planOptions.unitSystem
                    },
                    requirements: planOptions.requirements,
                    prompt: promptText
                },
                target: {
                    site: {
                        width: plan.site.width,
                        length: plan.site.length,
                        facing: plan.site.facing,
                        setbacks: plan.site.setbacks,
                        buildableEnvelope: plan.site.buildableEnvelope
                    },
                    rooms: (plan.rooms || []).map(r => ({
                        id: r.id,
                        name: r.name,
                        type: r.type,
                        x: Math.round(r.x),
                        y: Math.round(r.y),
                        w: Math.round(r.w),
                        h: Math.round(r.h),
                        zone: r.zone,
                        clearDimensions: r.clearDimensions,
                        areaSqFt: r.areaSqFt
                    })),
                    walls: (plan.walls || []).map(w => ({
                        id: w.id,
                        start: { x: Math.round(w.start.x), y: Math.round(w.start.y) },
                        end: { x: Math.round(w.end.x), y: Math.round(w.end.y) },
                        thickness: w.thickness,
                        isExterior: Boolean(w.isExterior)
                    })),
                    doors: (plan.doors || []).map(d => ({
                        id: d.id,
                        wallId: d.wallId,
                        width: d.width,
                        positionAlongWall: Math.round(d.positionAlongWall || 0),
                        swing: d.swing || 'left'
                    })),
                    windows: (plan.windows || []).map(w => ({
                        id: w.id,
                        wallId: w.wallId,
                        width: w.width,
                        positionAlongWall: Math.round(w.positionAlongWall || 0)
                    }))
                },
                validation: {
                    status: 'VALID',
                    isValid: true,
                    errorCount: 0,
                    warningCount: valCheck.validation.warnings ? valCheck.validation.warnings.length : 0,
                    overlapCount: 0,
                    roomCount: (plan.rooms || []).length,
                    wallCount: (plan.walls || []).length,
                    doorCount: (plan.doors || []).length,
                    windowCount: (plan.windows || []).length,
                    totalBuiltUpAreaSqFt: valCheck.validation.stats?.totalBuiltUpAreaSqFt || 0,
                    siteAreaSqFt: valCheck.validation.stats?.siteAreaSqFt || 0
                }
            };

            acceptedSamples.push(structuredSample);

            if (acceptedSamples.length % 200 === 0) {
                console.log(`  [Progress] Accepted: ${acceptedSamples.length}/${this.targetCount} (Total examined: ${totalCandidates})`);
            }
        }

        // 4. Partition into Train (70%), Validation (15%), Test (15%)
        const total = acceptedSamples.length;
        const trainCount = Math.floor(total * 0.70);
        const valCount = Math.floor(total * 0.15);
        const testCount = total - trainCount - valCount;

        const trainSet = acceptedSamples.slice(0, trainCount);
        const valSet = acceptedSamples.slice(trainCount, trainCount + valCount);
        const testSet = acceptedSamples.slice(trainCount + valCount);

        const totalRejected = Object.values(this.rejectionCounts).reduce((a, b) => a + b, 0);

        const metadata = {
            generator: "ArchFlow Synthetic CAD Dataset Builder",
            version: this.version,
            seed: this.seed,
            schemaVersion: "1.0.0",
            generatedAt: new Date().toISOString(),
            targetCount: this.targetCount,
            totalExamined: totalCandidates,
            totalAccepted: total,
            totalRejected: totalRejected,
            acceptanceRate: `${((total / Math.max(1, totalCandidates)) * 100).toFixed(2)}%`,
            rejectionBreakdown: this.rejectionCounts,
            splits: {
                trainCount: trainSet.length,
                valCount: valSet.length,
                testCount: testSet.length,
                trainRatio: `${((trainSet.length / total) * 100).toFixed(1)}%`,
                valRatio: `${((valSet.length / total) * 100).toFixed(1)}%`,
                testRatio: `${((testSet.length / total) * 100).toFixed(1)}%`
            }
        };

        return {
            trainSet,
            valSet,
            testSet,
            metadata
        };
    }

    saveToDisk(result) {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const trainPath = path.join(this.outputDir, 'train.json');
        const valPath = path.join(this.outputDir, 'val.json');
        const testPath = path.join(this.outputDir, 'test.json');
        const metaPath = path.join(this.outputDir, 'metadata.json');

        const trainJson = JSON.stringify(result.trainSet, null, 2);
        const valJson = JSON.stringify(result.valSet, null, 2);
        const testJson = JSON.stringify(result.testSet, null, 2);

        const totalBytes = Buffer.byteLength(trainJson) + Buffer.byteLength(valJson) + Buffer.byteLength(testJson);

        if (totalBytes > this.maxBytes) {
            throw new Error(`Dataset size (${(totalBytes / 1024 / 1024).toFixed(2)} MB) exceeds allowed limit of ${(this.maxBytes / 1024 / 1024).toFixed(2)} MB!`);
        }

        result.metadata.totalSizeBytes = totalBytes;
        result.metadata.totalSizeMB = Number((totalBytes / (1024 * 1024)).toFixed(2));

        const metaJson = JSON.stringify(result.metadata, null, 2);

        fs.writeFileSync(trainPath, trainJson, 'utf-8');
        fs.writeFileSync(valPath, valJson, 'utf-8');
        fs.writeFileSync(testPath, testJson, 'utf-8');
        fs.writeFileSync(metaPath, metaJson, 'utf-8');

        console.log(`[DatasetBuilder] Successfully written dataset to ${this.outputDir}`);
        console.log(`  Train: ${trainPath} (${result.trainSet.length} samples, ${(Buffer.byteLength(trainJson)/1024).toFixed(1)} KB)`);
        console.log(`  Val:   ${valPath} (${result.valSet.length} samples, ${(Buffer.byteLength(valJson)/1024).toFixed(1)} KB)`);
        console.log(`  Test:  ${testPath} (${result.testSet.length} samples, ${(Buffer.byteLength(testJson)/1024).toFixed(1)} KB)`);
        console.log(`  Meta:  ${metaPath}`);
        console.log(`  Total Dataset Size: ${result.metadata.totalSizeMB} MB`);

        return {
            outputDir: this.outputDir,
            paths: { trainPath, valPath, testPath, metaPath },
            totalBytes,
            totalSizeMB: result.metadata.totalSizeMB,
            metadata: result.metadata
        };
    }
}

// CLI Execution if run directly
if (process.argv[1] && process.argv[1].endsWith('synthetic_cad_dataset_builder.js')) {
    const builder = new SyntheticCADDatasetBuilder({ targetCount: 1000, seed: 42 });
    const result = builder.buildDataset();
    builder.saveToDisk(result);
}
