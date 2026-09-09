import { VASTU_ZONES } from './VastuGeometry.js';

export const COMPLIANCE_STATUS = {
    PREFERRED: { level: 3, label: 'Preferred', color: '#10B981' },
    ACCEPTABLE: { level: 2, label: 'Acceptable', color: '#3B82F6' },
    WARNING: { level: 1, label: 'Warning', color: '#F59E0B' },
    HARD_VIOLATION: { level: 0, label: 'Hard Violation', color: '#EF4444' },
    UNKNOWN: { level: -1, label: 'Not Evaluated', color: '#94A3B8' }
};

export const normalizeRoomType = (name = '', type = '') => {
    const s = (name + ' ' + type).toLowerCase().trim();
    if (s === 'master_bedroom' || s.includes('master bed') || s === 'master bedroom') return 'master_bedroom';
    if (s.includes('bed') || s.includes('guest')) return 'bedroom'; // generic bedroom
    if (s.includes('kitchen') || s.includes('kitchenette')) return 'kitchen';
    if (s.includes('dining')) return 'dining';
    if (s.includes('pooja') || s.includes('prayer') || s.includes('mandir')) return 'pooja';
    if (s.includes('toilet') || s.includes('bath') || s.includes('wash') || s.includes('wc')) return 'toilet';
    if (s.includes('living') || s.includes('lounge') || s.includes('hall')) return 'living';
    if (s.includes('stair') || s.includes('step')) return 'staircase';
    if (s.includes('entr') || s.includes('door') || s.includes('foyer') || s.includes('porch') || s.includes('sitout')) return 'entrance';
    if (s.includes('park') || s.includes('car') || s.includes('garage')) return 'parking';
    return 'other';
};

export const VASTU_ROOM_RULES = {
    'pooja': {
        weight: 15,
        preferred: [VASTU_ZONES.NE],
        acceptable: [VASTU_ZONES.E, VASTU_ZONES.N],
        violations: [VASTU_ZONES.SW, VASTU_ZONES.S, VASTU_ZONES.NW], // Strong violations
        hardViolations: [VASTU_ZONES.CENTER], // And toilet overlap handled in validator
        recommendation: 'Move Pooja towards the North-East.'
    },
    'kitchen': {
        weight: 15,
        preferred: [VASTU_ZONES.SE],
        acceptable: [VASTU_ZONES.NW, VASTU_ZONES.S, VASTU_ZONES.E],
        violations: [VASTU_ZONES.NE, VASTU_ZONES.SW],
        hardViolations: [VASTU_ZONES.CENTER],
        recommendation: 'Kitchen belongs in the South-East fire zone.'
    },
    'master_bedroom': {
        weight: 15,
        preferred: [VASTU_ZONES.SW],
        acceptable: [VASTU_ZONES.S, VASTU_ZONES.W],
        violations: [VASTU_ZONES.NE, VASTU_ZONES.NW, VASTU_ZONES.SE],
        hardViolations: [VASTU_ZONES.CENTER],
        recommendation: 'Master Bedroom should be in the South-West.'
    },
    'bedroom': {
        weight: 10,
        preferred: [VASTU_ZONES.S, VASTU_ZONES.W, VASTU_ZONES.NW],
        acceptable: [VASTU_ZONES.SW, VASTU_ZONES.E, VASTU_ZONES.N],
        violations: [VASTU_ZONES.NE],
        hardViolations: [VASTU_ZONES.CENTER],
        recommendation: 'Bedrooms are fine in S/W/NW, but avoid North-East.'
    },
    'toilet': {
        weight: 10,
        preferred: [VASTU_ZONES.NW, VASTU_ZONES.W, VASTU_ZONES.S],
        acceptable: [VASTU_ZONES.SE],
        violations: [VASTU_ZONES.NE, VASTU_ZONES.SW],
        hardViolations: [VASTU_ZONES.CENTER],
        recommendation: 'Toilets must be in NW/W/S. Never in NE or Center.'
    },
    'living': {
        weight: 8,
        preferred: [VASTU_ZONES.N, VASTU_ZONES.E, VASTU_ZONES.NE, VASTU_ZONES.NW],
        acceptable: [VASTU_ZONES.W, VASTU_ZONES.CENTER],
        violations: [VASTU_ZONES.SW, VASTU_ZONES.S],
        hardViolations: [],
        recommendation: 'Living spaces are best in North or East.'
    },
    'staircase': {
        weight: 8,
        preferred: [VASTU_ZONES.S, VASTU_ZONES.SW, VASTU_ZONES.W],
        acceptable: [VASTU_ZONES.NW, VASTU_ZONES.SE],
        violations: [VASTU_ZONES.NE, VASTU_ZONES.N, VASTU_ZONES.E],
        hardViolations: [VASTU_ZONES.CENTER],
        recommendation: 'Staircase belongs in South or West.'
    },
    'entrance': {
        weight: 8,
        preferred: [VASTU_ZONES.N, VASTU_ZONES.E, VASTU_ZONES.NE],
        acceptable: [VASTU_ZONES.W, VASTU_ZONES.NW, VASTU_ZONES.S, VASTU_ZONES.SE],
        violations: [VASTU_ZONES.SW],
        hardViolations: [VASTU_ZONES.CENTER],
        recommendation: 'Entrance placement is critical, avoid SW.'
    },
    'dining': {
        weight: 0,
        preferred: [VASTU_ZONES.W, VASTU_ZONES.E],
        acceptable: [VASTU_ZONES.S, VASTU_ZONES.N, VASTU_ZONES.NW, VASTU_ZONES.SE],
        violations: [VASTU_ZONES.SW],
        hardViolations: [VASTU_ZONES.CENTER],
        recommendation: 'Dining is best placed in West or East.'
    },
    'parking': {
        weight: 0,
        preferred: [VASTU_ZONES.NW, VASTU_ZONES.SE],
        acceptable: [VASTU_ZONES.E, VASTU_ZONES.N, VASTU_ZONES.NE],
        violations: [VASTU_ZONES.SW],
        hardViolations: [VASTU_ZONES.CENTER],
        recommendation: 'Avoid parking in South-West.'
    }
};

export const evaluateRoomZone = (normType, zone, isBrahmasthan) => {
    const rules = VASTU_ROOM_RULES[normType];
    if (!rules) return { status: COMPLIANCE_STATUS.UNKNOWN, recommendation: '' };

    if (isBrahmasthan && rules.hardViolations.includes(VASTU_ZONES.CENTER)) {
        return { status: COMPLIANCE_STATUS.HARD_VIOLATION, recommendation: 'Severe violation: Occupies the central Brahmasthan.' };
    }
    
    if (rules.hardViolations.includes(zone)) return { status: COMPLIANCE_STATUS.HARD_VIOLATION, recommendation: rules.recommendation };
    if (rules.violations.includes(zone)) return { status: COMPLIANCE_STATUS.WARNING, recommendation: rules.recommendation };
    if (rules.acceptable.includes(zone)) return { status: COMPLIANCE_STATUS.ACCEPTABLE, recommendation: rules.recommendation };
    if (rules.preferred.includes(zone)) return { status: COMPLIANCE_STATUS.PREFERRED, recommendation: 'Excellent placement.' };
    
    return { status: COMPLIANCE_STATUS.WARNING, recommendation: rules.recommendation };
};
