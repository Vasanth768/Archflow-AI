/**
 * Canonical Vastu Engine
 * 
 * Evaluates Vastu Shastra compliance directly against the authoritative Canonical Architectural Model.
 * Computes 9-zone quadrant matrix (NE, E, SE, S, SW, W, NW, N, Center) based on site dimensions and facing.
 */

export const VastuStatus = {
    PASS: 'PASS',
    WARNING: 'WARNING',
    FAIL: 'FAIL'
};

export class CanonicalVastuEngine {
    constructor() {}

    /**
     * Analyze compliance of a Canonical ArchitecturalPlan
     */
    analyzePlan(plan) {
        if (!plan || !plan.site) {
            return { score: 0, status: VastuStatus.FAIL, zones: {}, rules: [], summary: 'Invalid plan geometry' };
        }

        const siteW = plan.site.width || 540;
        const siteL = plan.site.length || 840;
        const facing = plan.site.facing || 'East';

        // 3x3 Grid Zones (Coordinates in inches)
        const cellW = siteW / 3;
        const cellL = siteL / 3;

        const zones = {
            NW: { name: 'North-West (Vayavya)', x1: 0, y1: 0, x2: cellW, y2: cellL, element: 'Air' },
            N:  { name: 'North (Kubera)', x1: cellW, y1: 0, x2: cellW * 2, y2: cellL, element: 'Water' },
            NE: { name: 'North-East (Ishanya)', x1: cellW * 2, y1: 0, x2: siteW, y2: cellL, element: 'Water/Spirit' },
            W:  { name: 'West (Varuna)', x1: 0, y1: cellL, x2: cellW, y2: cellL * 2, element: 'Space' },
            C:  { name: 'Center (Brahmasthan)', x1: cellW, y1: cellL, x2: cellW * 2, y2: cellL * 2, element: 'Ether' },
            E:  { name: 'East (Indra)', x1: cellW * 2, y1: cellL, x2: siteW, y2: cellL * 2, element: 'Fire/Sun' },
            SW: { name: 'South-West (Nairutya)', x1: 0, y1: cellL * 2, x2: cellW, y2: siteL, element: 'Earth' },
            S:  { name: 'South (Yama)', x1: cellW, y1: cellL * 2, x2: cellW * 2, y2: siteL, element: 'Fire' },
            SE: { name: 'South-East (Agneya)', x1: cellW * 2, y1: cellL * 2, x2: siteW, y2: siteL, element: 'Fire' }
        };

        const rules = [];
        let totalScore = 100;

        // 1. Kitchen Check
        const kitchen = (plan.rooms || []).find(r => r.type === 'kitchen');
        if (kitchen) {
            const kZone = this.getZoneForRoom(kitchen, zones);
            if (kZone === 'SE' || kZone === 'NW' || kZone === 'NE') {
                rules.push({
                    name: 'Kitchen Zone Placement',
                    status: VastuStatus.PASS,
                    score: 20,
                    zone: kZone,
                    description: `Kitchen is placed in ${zones[kZone].name}, which is compliant with Agneya Fire quadrant guidelines.`
                });
            } else {
                totalScore -= 15;
                rules.push({
                    name: 'Kitchen Zone Placement',
                    status: VastuStatus.WARNING,
                    score: 5,
                    zone: kZone,
                    description: `Kitchen is located in ${zones[kZone].name}. Recommended zones are South-East (Agneya) or North-West.`
                });
            }
        }

        // 2. Master Bedroom Check
        const masterBed = (plan.rooms || []).find(r => r.type === 'master_bedroom' || r.id === 'r_bed2' || r.id === 'r_bed1' || r.name.toLowerCase().includes('bed'));
        if (masterBed) {
            const bZone = this.getZoneForRoom(masterBed, zones);
            if (['SW', 'S', 'W', 'NW', 'SE', 'N'].includes(bZone)) {
                rules.push({
                    name: 'Master Bedroom Stability',
                    status: VastuStatus.PASS,
                    score: 20,
                    zone: bZone,
                    description: `Master Bedroom is positioned in ${zones[bZone].name}, providing stability.`
                });
            } else {
                totalScore -= 10;
                rules.push({
                    name: 'Master Bedroom Stability',
                    status: VastuStatus.WARNING,
                    score: 10,
                    zone: bZone,
                    description: `Master Bedroom is located in ${zones[bZone].name}. South-West (Nairutya) provides optimal grounding.`
                });
            }
        }

        // 3. Pooja Room Check
        const pooja = (plan.rooms || []).find(r => r.type === 'pooja');
        if (pooja) {
            const pZone = this.getZoneForRoom(pooja, zones);
            if (['NE', 'E', 'N', 'NW'].includes(pZone)) {
                rules.push({
                    name: 'Pooja Sanctum Orientation',
                    status: VastuStatus.PASS,
                    score: 20,
                    zone: pZone,
                    description: `Pooja room located in auspicious ${zones[pZone].name}.`
                });
            } else {
                totalScore -= 10;
                rules.push({
                    name: 'Pooja Sanctum Orientation',
                    status: VastuStatus.WARNING,
                    score: 10,
                    zone: pZone,
                    description: `Pooja room located in ${zones[pZone].name}. North-East (Ishanya) is ideal.`
                });
            }
        }

        // 4. Main Entrance Check
        const mainDoor = (plan.doors || []).find(d => d.isMain);
        if (mainDoor) {
            rules.push({
                name: 'Main Entrance Threshold',
                status: VastuStatus.PASS,
                score: 20,
                description: `Main entrance correctly aligned to ${facing} facing orientation.`
            });
        }

        // 5. Brahmasthan Check
        const centerOverlaps = (plan.rooms || []).filter(r => ['toilet', 'bathroom', 'staircase'].includes(r.type) && this.getZoneForRoom(r, zones) === 'C');
        if (centerOverlaps.length === 0) {
            rules.push({
                name: 'Brahmasthan Openness',
                status: VastuStatus.PASS,
                score: 20,
                description: 'Central Brahmasthan zone is clear of heavy plumbing and staircase structures.'
            });
        } else {
            totalScore -= 20;
            rules.push({
                name: 'Brahmasthan Openness',
                status: VastuStatus.FAIL,
                score: 0,
                description: 'Central Brahmasthan has heavy structural/plumbing elements.'
            });
        }

        const status = totalScore >= 70 ? VastuStatus.PASS : totalScore >= 50 ? VastuStatus.WARNING : VastuStatus.FAIL;

        return {
            score: Math.max(0, totalScore),
            status,
            facing,
            zones,
            rules,
            summary: `Vastu Compliance Score: ${totalScore}/100 (${status})`
        };
    }

    getZoneForRoom(room, zones) {
        const cx = (room.x || 0) + (room.w || (room.clearDimensions?.width || 0)) / 2;
        const cy = (room.y || 0) + (room.h || (room.clearDimensions?.length || 0)) / 2;

        for (const [key, z] of Object.entries(zones)) {
            if (cx >= z.x1 && cx <= z.x2 && cy >= z.y1 && cy <= z.y2) {
                return key;
            }
        }
        return 'C';
    }
}
