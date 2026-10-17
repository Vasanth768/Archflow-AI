/**
 * DynamicLayoutSolver.js - Dynamic Architectural Layout Solver for ArchFlow AI
 * 
 * Generates feasible, collision-free, constraint-validated spatial room placements
 * for arbitrary plot sizes, room counts, and room dimensions.
 */

import { RoomType, DimensionMode } from './CanonicalSchema.js';

export class DynamicLayoutSolver {
    constructor(options = {}) {
        this.extWallThick = options.exteriorWallThickness || 9;
        this.intWallThick = options.interiorWallThickness || 4.5;
        this.minCirculationWidth = options.minCirculationWidth || 36;
        this.maxIterations = options.maxIterations || 150;
    }

    solveLayout(envelope, roomRequirements = []) {
        const availableW = envelope.width - (2 * this.extWallThick);
        const availableL = envelope.length - (2 * this.extWallThick);

        if (availableW <= 0 || availableL <= 0) {
            return {
                success: false,
                conflict: true,
                rooms: [],
                score: 0,
                issues: ['Buildable area is too small for construction after applying exterior walls and setbacks.'],
                alternatives: ['Increase plot width and length', 'Reduce setbacks']
            };
        }

        const normalizedReqs = this.normalizeRequirements(roomRequirements, availableW, availableL);

        // Feasibility Pre-Check: Total room area vs usable envelope area
        const totalReqArea = normalizedReqs.reduce((acc, r) => acc + (r.width * r.length), 0);
        const maxAvailableArea = availableW * availableL;
        const hasExactOversizedRoom = normalizedReqs.some(r => 
            r.dimensionMode === DimensionMode.EXACT && 
            ((r.width > availableW && r.length > availableW) || (r.length > availableL && r.width > availableL) || (r.width > availableW && r.length > availableL))
        );

        if (hasExactOversizedRoom || totalReqArea > maxAvailableArea) {
            const conflictReasons = [];
            if (hasExactOversizedRoom) {
                const oversized = normalizedReqs.filter(r => 
                    r.dimensionMode === DimensionMode.EXACT && (r.width > availableW || r.length > availableL)
                );
                oversized.forEach(r => {
                    conflictReasons.push(`Room "${r.name}" (${Math.round(r.width/12)}'×${Math.round(r.length/12)}') exceeds usable buildable envelope (${Math.round(availableW/12)}'×${Math.round(availableL/12)}').`);
                });
            }
            if (totalReqArea > maxAvailableArea) {
                conflictReasons.push(`Total requested room area (${Math.round(totalReqArea / 144)} sq ft) exceeds usable buildable floor area (${Math.round(maxAvailableArea / 144)} sq ft).`);
            }

            const requiredAreaSqFt = Math.round(totalReqArea / 144);
            const usableAreaSqFt = Math.round(maxAvailableArea / 144);
            return {
                success: false,
                conflict: {
                    status: 'INFEASIBLE',
                    message: conflictReasons.join(' '),
                    requiredAreaSqFt,
                    usableAreaSqFt,
                    issues: conflictReasons
                },
                rooms: [],
                score: 0,
                issues: conflictReasons,
                alternatives: [
                    'Increase plot width or length',
                    'Reduce the number of rooms or remove optional rooms',
                    'Adjust individual room dimensions to fit the buildable envelope'
                ]
            };
        }

        let bestCandidate = null;
        let highestScore = -Infinity;

        const strategies = [
            'exact_preserve_packing',
            'functional_cluster_packing',
            'zone_grid_packing',
            'guillotine_packing',
            'coordinate_search_packing'
        ];

        for (const strategy of strategies) {
            const candidate = this.generateCandidate(strategy, availableW, availableL, envelope.facing, normalizedReqs);
            if (candidate && candidate.isValid && candidate.rooms.length === normalizedReqs.length) {
                const score = this.evaluateCandidate(candidate.rooms, availableW, availableL, normalizedReqs, envelope.facing);
                if (score > highestScore) {
                    highestScore = score;
                    bestCandidate = candidate;
                }
            }
        }

        if (!bestCandidate || !bestCandidate.isValid || bestCandidate.rooms.length !== normalizedReqs.length) {
            const allIssues = bestCandidate ? bestCandidate.issues : [
                'Unable to place all requested rooms within plot envelope without geometric overlap or boundary violation while preserving exact dimensions.'
            ];
            return {
                success: false,
                conflict: {
                    status: 'INFEASIBLE',
                    message: allIssues.join(' ') || 'Layout could not be solved within plot constraints while preserving exact dimensions.',
                    requiredAreaSqFt: Math.round(totalReqArea / 144),
                    usableAreaSqFt: Math.round(maxAvailableArea / 144),
                    issues: allIssues
                },
                rooms: [],
                score: 0,
                issues: allIssues,
                alternatives: [
                    'Increase plot width or length',
                    'Reduce the number of rooms or remove optional rooms',
                    'Adjust individual room dimensions'
                ]
            };
        }

        const finalRooms = bestCandidate.rooms.map(r => ({
            ...r,
            x: (envelope.x || 0) + this.extWallThick + r.relX,
            y: (envelope.y || 0) + this.extWallThick + r.relY,
            clearDimensions: {
                width: r.w,
                length: r.h,
                widthFt: Math.round((r.w / 12) * 10) / 10,
                lengthFt: Math.round((r.h / 12) * 10) / 10
            }
        }));

        const envelopeAreaSqFt = Math.round(((availableW * availableL) / 144) * 10) / 10;
        const totalBuiltUpAreaSqFt = Math.round((finalRooms.reduce((acc, r) => acc + (r.w * r.h), 0) / 144) * 10) / 10;
        const circulationAreaSqFt = Math.max(0, Math.round((envelopeAreaSqFt - totalBuiltUpAreaSqFt) * 10) / 10);

        return {
            success: true,
            conflict: false,
            rooms: finalRooms,
            score: highestScore,
            issues: bestCandidate.issues || [],
            strategy: bestCandidate.strategy,
            diagnostics: {
                envelopeAreaSqFt,
                totalBuiltUpAreaSqFt,
                circulationAreaSqFt,
                explanation: 'Circulation area accounts for internal corridors, room entry thresholds, and spatial clearances.'
            }
        };
    }

    normalizeRequirements(roomReqs, availableW, availableL) {
        return roomReqs.map((req, idx) => {
            const type = req.type || RoomType.BEDROOM;
            const isExact = Boolean(req.exactDimensions || req.isExact || (req.width && req.length));
            const mode = req.dimensionMode || (isExact ? DimensionMode.EXACT : DimensionMode.PREFERRED);

            const defaults = this.getDefaultRoomDimensions(type, availableW, availableL);
            const reqW = req.width ? Math.round(req.width) : defaults.w;
            const reqL = req.length ? Math.round(req.length) : defaults.l;

            return {
                id: req.id || `req_${type}_${idx + 1}`,
                name: req.name || this.getRoomDisplayName(type, idx + 1),
                type: type,
                width: reqW,
                length: reqL,
                dimensionMode: mode,
                isExact: isExact,
                floor: req.floor || 1,
                attachedTo: req.attachedTo || (req.isAttached ? 'r_master_bedroom' : null),
                isAttached: Boolean(req.isAttached || req.attachedTo || type === RoomType.ATTACHED_TOILET),
                priority: req.priority || this.getRoomPriority(type),
                preferredZone: req.preferredZone || this.getVastuZone(type),
                color: req.color || this.getRoomColor(type)
            };
        });
    }

    evaluateCandidate(rooms, maxW, maxL, requirements, facing) {
        let score = 1000;

        for (let i = 0; i < rooms.length; i++) {
            for (let j = i + 1; j < rooms.length; j++) {
                if (this.checkOverlap(rooms[i], rooms[j])) {
                    score -= 5000;
                }
            }
        }

        rooms.forEach(r => {
            if (r.relX < 0 || r.relY < 0 || r.relX + r.w > maxW + 0.1 || r.relY + r.h > maxL + 0.1) {
                score -= 3000;
            }
        });

        requirements.forEach(req => {
            const placed = rooms.find(r => r.reqId === req.id || r.type === req.type);
            if (placed) {
                const matchW = Math.abs(placed.w - req.width) < 1;
                const matchL = Math.abs(placed.h - req.length) < 1;

                if (req.dimensionMode === DimensionMode.EXACT || req.isExact) {
                    if (matchW && matchL) score += 1000;
                    else score -= 4000;
                } else if (matchW || matchL) {
                    score += 200;
                }
            } else {
                score -= 1000;
            }
        });

        rooms.forEach(r => {
            const req = requirements.find(q => q.id === r.reqId || q.type === r.type);
            if (req && req.preferredZone) {
                const zone = this.calculateRoomZone(r.relX, r.relY, r.w, r.h, maxW, maxL);
                if (zone === req.preferredZone) score += 300;
            }
        });

        return score;
    }

    generateCandidate(strategy, maxW, maxL, facing, requirements) {
        const rooms = [];
        const issues = [];

        if (strategy === 'exact_preserve_packing') {
            let curYLeft = 0;
            let curYRight = 0;

            const masterReq = requirements.find(r => r.type === RoomType.MASTER_BEDROOM);
            const masterW = masterReq ? masterReq.width : Math.min(144, Math.floor(maxW * 0.5));
            const leftColW = Math.min(masterW, maxW);
            const rightColW = Math.max(0, maxW - leftColW - this.intWallThick);

            const ordered = [...requirements].sort((a, b) => a.priority - b.priority);

            for (const req of ordered) {
                let placedW = req.width;
                let placedH = req.length;
                let relX = 0;
                let relY = 0;

                const isEastZone = ['SE', 'NE', 'E'].includes(req.preferredZone) || 
                                   req.type === RoomType.KITCHEN || 
                                   req.type === RoomType.POOJA || 
                                   req.type === RoomType.LIVING ||
                                   req.type === RoomType.DINING;

                if (isEastZone && rightColW >= 48) {
                    relX = leftColW + this.intWallThick;
                    relY = curYRight;

                    if (req.dimensionMode !== DimensionMode.EXACT && !req.isExact) {
                        if (placedW > rightColW) placedW = rightColW;
                    }

                    if (relX + placedW > maxW + 0.1 || relY + placedH > maxL + 0.1) {
                        issues.push(`Room "${req.name}" exceeds East column envelope.`);
                    }

                    curYRight += placedH + this.intWallThick;
                } else {
                    relX = 0;
                    relY = curYLeft;

                    if (req.dimensionMode !== DimensionMode.EXACT && !req.isExact) {
                        if (placedW > leftColW) placedW = leftColW;
                    }

                    if (relX + placedW > maxW + 0.1 || relY + placedH > maxL + 0.1) {
                        issues.push(`Room "${req.name}" exceeds West column envelope.`);
                    }

                    curYLeft += placedH + this.intWallThick;
                }

                rooms.push({
                    reqId: req.id,
                    name: req.name,
                    type: req.type,
                    relX: Math.round(relX),
                    relY: Math.round(relY),
                    w: Math.round(placedW),
                    h: Math.round(placedH),
                    floor: req.floor || 1,
                    isExact: Boolean(req.isExact),
                    isAttached: Boolean(req.isAttached),
                    attachedTo: req.attachedTo || null,
                    color: req.color
                });
            }
        } else if (strategy === 'functional_cluster_packing') {
            // Functional cluster: West column (Master, attached bath, bedrooms), East column (Kitchen, Living, Pooja)
            let curYLeft = 0;
            let curYRight = 0;

            const westRooms = requirements.filter(r => 
                r.type === RoomType.MASTER_BEDROOM || 
                r.type === RoomType.BEDROOM || 
                r.type === RoomType.ATTACHED_TOILET ||
                r.type === RoomType.COMMON_BATHROOM ||
                r.type === RoomType.STUDY
            ).sort((a, b) => a.priority - b.priority);

            const eastRooms = requirements.filter(r => !westRooms.includes(r))
                .sort((a, b) => a.priority - b.priority);

            const maxWestW = Math.max(0, ...westRooms.map(r => r.width), 120);
            const colWestW = Math.min(maxWestW, Math.floor(maxW * 0.52));
            const colEastW = maxW - colWestW - this.intWallThick;

            westRooms.forEach(req => {
                let w = req.width;
                let h = req.length;
                if (!req.isExact && w > colWestW) w = colWestW;

                rooms.push({
                    reqId: req.id,
                    name: req.name,
                    type: req.type,
                    relX: 0,
                    relY: curYLeft,
                    w: w,
                    h: h,
                    floor: req.floor || 1,
                    isExact: Boolean(req.isExact),
                    isAttached: Boolean(req.isAttached),
                    attachedTo: req.attachedTo || null,
                    color: req.color
                });
                curYLeft += h + this.intWallThick;
            });

            eastRooms.forEach(req => {
                let w = req.width;
                let h = req.length;
                if (!req.isExact && w > colEastW) w = colEastW;

                rooms.push({
                    reqId: req.id,
                    name: req.name,
                    type: req.type,
                    relX: colWestW + this.intWallThick,
                    relY: curYRight,
                    w: w,
                    h: h,
                    floor: req.floor || 1,
                    isExact: Boolean(req.isExact),
                    isAttached: Boolean(req.isAttached),
                    attachedTo: req.attachedTo || null,
                    color: req.color
                });
                curYRight += h + this.intWallThick;
            });
        } else {
            // Coordinate search & guillotine grid placement
            let occupiedRects = [];
            const ordered = [...requirements].sort((a, b) => a.priority - b.priority);

            ordered.forEach(req => {
                let placed = false;
                let targetW = req.width;
                let targetH = req.length;

                // If attached to a specific bedroom, try placing adjacent to it first
                if (req.attachedTo) {
                    const host = rooms.find(r => r.reqId === req.attachedTo || r.type === req.attachedTo);
                    if (host) {
                        const candidatePositions = [
                            { relX: host.relX, relY: host.relY + host.h + this.intWallThick },
                            { relX: host.relX + host.w + this.intWallThick, relY: host.relY },
                            { relX: host.relX, relY: Math.max(0, host.relY - targetH - this.intWallThick) }
                        ];

                        for (const pos of candidatePositions) {
                            if (pos.relX + targetW <= maxW && pos.relY + targetH <= maxL && pos.relX >= 0 && pos.relY >= 0) {
                                const testRoom = { relX: pos.relX, relY: pos.relY, w: targetW, h: targetH };
                                let hasCollision = occupiedRects.some(occ => this.checkOverlap(testRoom, occ));
                                if (!hasCollision) {
                                    rooms.push({
                                        reqId: req.id,
                                        name: req.name,
                                        type: req.type,
                                        relX: pos.relX,
                                        relY: pos.relY,
                                        w: targetW,
                                        h: targetH,
                                        floor: req.floor || 1,
                                        isExact: Boolean(req.isExact),
                                        isAttached: Boolean(req.isAttached),
                                        attachedTo: req.attachedTo || null,
                                        color: req.color
                                    });
                                    occupiedRects.push(testRoom);
                                    placed = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (!placed) {
                    const step = 6;
                    for (let y = 0; y <= maxL - targetH; y += step) {
                        for (let x = 0; x <= maxW - targetW; x += step) {
                            const testRoom = { relX: x, relY: y, w: targetW, h: targetH };
                            let hasCollision = occupiedRects.some(occ => this.checkOverlap(testRoom, occ));

                            if (!hasCollision) {
                                rooms.push({
                                    reqId: req.id,
                                    name: req.name,
                                    type: req.type,
                                    relX: x,
                                    relY: y,
                                    w: targetW,
                                    h: targetH,
                                    floor: req.floor || 1,
                                    isExact: Boolean(req.isExact),
                                    isAttached: Boolean(req.isAttached),
                                    attachedTo: req.attachedTo || null,
                                    color: req.color
                                });
                                occupiedRects.push(testRoom);
                                placed = true;
                                break;
                            }
                        }
                        if (placed) break;
                    }
                }

                if (!placed) {
                    issues.push(`Unable to place room "${req.name}" without overlap.`);
                }
            });
        }

        let isValid = (issues.length === 0) && (rooms.length === requirements.length);
        for (let i = 0; i < rooms.length; i++) {
            if (rooms[i].relX < -0.1 || rooms[i].relY < -0.1 || 
                rooms[i].relX + rooms[i].w > maxW + 0.1 || 
                rooms[i].relY + rooms[i].h > maxL + 0.1) {
                isValid = false;
                issues.push(`Room "${rooms[i].name}" extends beyond plot envelope.`);
            }
            for (let j = i + 1; j < rooms.length; j++) {
                if (this.checkOverlap(rooms[i], rooms[j])) {
                    isValid = false;
                    issues.push(`Room "${rooms[i].name}" overlaps with "${rooms[j].name}".`);
                }
            }
        }

        return {
            strategy,
            rooms,
            isValid,
            issues
        };
    }

    checkOverlap(r1, r2) {
        return !(r1.relX + r1.w - 0.1 <= r2.relX ||
                 r2.relX + r2.w - 0.1 <= r1.relX ||
                 r1.relY + r1.h - 0.1 <= r2.relY ||
                 r2.relY + r2.h - 0.1 <= r1.relY);
    }

    calculateRoomZone(x, y, w, h, maxW, maxL) {
        const cx = x + (w / 2);
        const cy = y + (h / 2);

        const isEast = cx >= maxW / 2;
        const isNorth = cy >= maxL / 2;

        if (!isEast && !isNorth) return 'SW';
        if (isEast && !isNorth) return 'SE';
        if (isEast && isNorth) return 'NE';
        return 'NW';
    }

    getDefaultRoomDimensions(type, availableW, availableL) {
        const scaleW = Math.min(1.0, availableW / 360);
        const scaleL = Math.min(1.0, availableL / 480);

        switch (type) {
            case RoomType.MASTER_BEDROOM:
                return { w: Math.round(144 * scaleW), l: Math.round(168 * scaleL) };
            case RoomType.BEDROOM:
            case RoomType.GUEST_ROOM:
                return { w: Math.round(132 * scaleW), l: Math.round(144 * scaleL) };
            case RoomType.LIVING:
            case RoomType.FAMILY_ROOM:
                return { w: Math.round(180 * scaleW), l: Math.round(180 * scaleL) };
            case RoomType.DINING:
                return { w: Math.round(144 * scaleW), l: Math.round(144 * scaleL) };
            case RoomType.KITCHEN:
                return { w: Math.round(120 * scaleW), l: Math.round(120 * scaleL) };
            case RoomType.TOILET:
            case RoomType.ATTACHED_TOILET:
            case RoomType.BATHROOM:
                return { w: Math.round(72 * scaleW), l: Math.round(60 * scaleL) };
            case RoomType.COMMON_BATHROOM:
                return { w: Math.round(72 * scaleW), l: Math.round(60 * scaleL) };
            case RoomType.POOJA:
                return { w: Math.round(60 * scaleW), l: Math.round(60 * scaleL) };
            case RoomType.HOME_OFFICE:
            case RoomType.STUDY:
                return { w: Math.round(120 * scaleW), l: Math.round(120 * scaleL) };
            case RoomType.STORE:
                return { w: Math.round(84 * scaleW), l: Math.round(72 * scaleL) };
            case RoomType.UTILITY:
            case RoomType.LAUNDRY:
                return { w: Math.round(84 * scaleW), l: Math.round(60 * scaleL) };
            case RoomType.PARKING:
            case RoomType.PORTICO:
                return { w: Math.round(144 * scaleW), l: Math.round(192 * scaleL) };
            default:
                return { w: Math.round(120 * scaleW), l: Math.round(120 * scaleL) };
        }
    }

    getRoomPriority(type) {
        switch (type) {
            case RoomType.MASTER_BEDROOM: return 1;
            case RoomType.KITCHEN: return 2;
            case RoomType.LIVING: return 3;
            case RoomType.DINING: return 4;
            case RoomType.POOJA: return 5;
            case RoomType.BEDROOM: return 6;
            case RoomType.ATTACHED_TOILET: return 7;
            case RoomType.COMMON_BATHROOM: return 8;
            case RoomType.STUDY:
            case RoomType.HOME_OFFICE: return 9;
            case RoomType.UTILITY: return 10;
            case RoomType.STORE: return 11;
            case RoomType.PARKING: return 12;
            default: return 15;
        }
    }

    getVastuZone(type) {
        switch (type) {
            case RoomType.MASTER_BEDROOM: return 'SW';
            case RoomType.KITCHEN: return 'SE';
            case RoomType.POOJA: return 'NE';
            case RoomType.BEDROOM: return 'NW';
            case RoomType.LIVING: return 'NE';
            case RoomType.DINING: return 'SE';
            case RoomType.ATTACHED_TOILET: return 'W';
            case RoomType.COMMON_BATHROOM: return 'W';
            case RoomType.STUDY:
            case RoomType.HOME_OFFICE: return 'NW';
            case RoomType.STORE: return 'SW';
            case RoomType.UTILITY: return 'SE';
            case RoomType.PARKING: return 'SE';
            default: return 'Center';
        }
    }

    getRoomDisplayName(type, num) {
        switch (type) {
            case RoomType.MASTER_BEDROOM: return 'MASTER BEDROOM';
            case RoomType.BEDROOM: return `BEDROOM ${num}`;
            case RoomType.KITCHEN: return 'KITCHEN';
            case RoomType.LIVING: return 'LIVING HALL';
            case RoomType.DINING: return 'DINING ROOM';
            case RoomType.ATTACHED_TOILET: return 'ATT. TOILET';
            case RoomType.COMMON_BATHROOM: return 'COMMON TOILET';
            case RoomType.BATHROOM: return 'BATHROOM';
            case RoomType.POOJA: return 'POOJA ROOM';
            case RoomType.HOME_OFFICE: return 'HOME OFFICE';
            case RoomType.STUDY: return 'STUDY ROOM';
            case RoomType.STORE: return 'STORE ROOM';
            case RoomType.UTILITY: return 'UTILITY AREA';
            case RoomType.PARKING: return 'PARKING';
            default: return `${type.toUpperCase()} ${num}`;
        }
    }

    getRoomColor(type) {
        switch (type) {
            case RoomType.MASTER_BEDROOM: return '#EEF2FF';
            case RoomType.BEDROOM: return '#F1F5F9';
            case RoomType.KITCHEN: return '#FEF3C7';
            case RoomType.LIVING: return '#FFFFFF';
            case RoomType.DINING: return '#FFF7ED';
            case RoomType.ATTACHED_TOILET: return '#F0FDF4';
            case RoomType.COMMON_BATHROOM: return '#ECFDF5';
            case RoomType.BATHROOM: return '#ECFDF5';
            case RoomType.POOJA: return '#FEFCE8';
            case RoomType.STUDY:
            case RoomType.HOME_OFFICE: return '#F8FAFC';
            case RoomType.STORE: return '#F1F5F9';
            case RoomType.UTILITY: return '#F8FAFC';
            default: return '#F8FAFC';
        }
    }
}

export default DynamicLayoutSolver;
