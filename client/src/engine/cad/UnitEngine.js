/**
 * Unit Conversion & Dimension Parsing Engine
 * 
 * Provides zero-error mathematical conversion between architectural representations
 * (Feet & Inches, Metric mm/m) and the internal canonical unit (INCHES).
 */

export const INCHES_PER_FOOT = 12;
export const MM_PER_INCH = 25.4;
export const METERS_PER_INCH = 0.0254;
export const SQ_INCHES_PER_SQ_FT = 144;

/**
 * Parses any architectural string or number into exact numeric INCHES.
 * 
 * Supported formats:
 * - "15'-3\"" or "15' 3\"" or "15'-3" -> 183
 * - "9'-8 1/2\"" -> 116.5
 * - "45'" or "45'-0\"" -> 540
 * - "15.25'" or "15.25 ft" -> 183
 * - "3500mm" -> 137.795
 * - 15.25 (feet if decimal >= 10, or directly inches if tagged)
 * 
 * @param {string|number} input
 * @param {string} defaultUnit - 'feet' | 'inches' | 'mm' | 'm'
 * @returns {number} inches
 */
export function parseArchitecturalDimension(input, defaultUnit = 'feet') {
    if (input === null || input === undefined || input === '') return 0;
    if (typeof input === 'number') {
        if (defaultUnit === 'inches') return input;
        if (defaultUnit === 'mm') return input / MM_PER_INCH;
        if (defaultUnit === 'm') return input / METERS_PER_INCH;
        return input * INCHES_PER_FOOT; // default feet to inches
    }

    const str = String(input).trim();
    if (!str) return 0;

    // Check for metric mm / m
    const mmMatch = str.match(/^([\d.]+)\s*mm$/i);
    if (mmMatch) {
        return parseFloat(mmMatch[1]) / MM_PER_INCH;
    }
    const mMatch = str.match(/^([\d.]+)\s*m$/i);
    if (mMatch) {
        return parseFloat(mMatch[1]) / METERS_PER_INCH;
    }

    // Check for pure inches notation: e.g. 9" or 4.5" or 9 in
    const pureInchesMatch = str.match(/^([\d.]+)\s*(?:\"|in|inch|inches)$/i);
    if (pureInchesMatch) {
        return parseFloat(pureInchesMatch[1]);
    }

    // Standard feet and inches notation: 15'-3", 15' 3", 15'-3 1/2", 15'-3, 15'
    const ftInRegex = /^(\d+)'(?:[-\s]*(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+)?(?:"|in)?)?$/;
    const match = str.match(ftInRegex);
    if (match) {
        const feet = parseInt(match[1], 10);
        let inches = 0;
        if (match[2]) {
            inches = parseFractionalInches(match[2].trim());
        }
        return feet * INCHES_PER_FOOT + inches;
    }

    // Decimal feet (e.g. "15.25", "15.25'")
    const decimalMatch = str.match(/^([\d.]+)\s*(?:'|ft|feet)?$/i);
    if (decimalMatch) {
        const val = parseFloat(decimalMatch[1]);
        if (defaultUnit === 'inches') return val;
        return val * INCHES_PER_FOOT;
    }

    // Fallback: float parse
    const fallback = parseFloat(str);
    return isNaN(fallback) ? 0 : fallback * (defaultUnit === 'inches' ? 1 : INCHES_PER_FOOT);
}

/**
 * Parses fractional string like "3 1/2" or "3/4" into decimal inches
 */
function parseFractionalInches(str) {
    if (!str) return 0;
    if (str.includes(' ')) {
        const parts = str.split(/\s+/);
        return parseFloat(parts[0]) + parseFraction(parts[1]);
    }
    if (str.includes('/')) {
        return parseFraction(str);
    }
    return parseFloat(str) || 0;
}

function parseFraction(fractionStr) {
    const [num, den] = fractionStr.split('/').map(s => parseFloat(s));
    if (!den || isNaN(num) || isNaN(den)) return 0;
    return num / den;
}

/**
 * Formats canonical numeric INCHES into standard architectural Feet & Inches string.
 * Example: 183 -> 15'-3", 116 -> 9'-8", 540 -> 45'-0"
 * 
 * @param {number} inches
 * @param {boolean} includeFractions
 * @returns {string} e.g. "15'-3\""
 */
export function formatFeetInches(inches, includeFractions = true) {
    if (isNaN(inches) || inches === null || inches === undefined) return `0'-0"`;

    const totalInches = Math.abs(inches);
    const sign = inches < 0 ? '-' : '';

    let feet = Math.floor(totalInches / INCHES_PER_FOOT);
    let remInches = totalInches % INCHES_PER_FOOT;

    // Rounding to nearest 1/16" or 1/8" if fractions enabled, else nearest whole inch
    if (!includeFractions) {
        remInches = Math.round(remInches);
        if (remInches >= 12) {
            feet += 1;
            remInches = 0;
        }
        return `${sign}${feet}'-${remInches}"`;
    }

    const wholeInches = Math.floor(remInches);
    const frac = remInches - wholeInches;
    
    // Snap to nearest 1/8
    const eighths = Math.round(frac * 8);
    let fracStr = '';
    let adjustedWhole = wholeInches;

    if (eighths === 8) {
        adjustedWhole += 1;
    } else if (eighths === 4) {
        fracStr = ' 1/2';
    } else if (eighths === 2) {
        fracStr = ' 1/4';
    } else if (eighths === 6) {
        fracStr = ' 3/4';
    } else if (eighths > 0) {
        fracStr = ` ${eighths}/8`;
    }

    if (adjustedWhole >= 12) {
        feet += 1;
        adjustedWhole = 0;
    }

    return `${sign}${feet}'-${adjustedWhole}${fracStr}"`;
}

/**
 * Calculates square footage from area in square inches.
 */
export function sqInchesToSqFt(sqInches) {
    return Math.round((sqInches / SQ_INCHES_PER_SQ_FT) * 100) / 100;
}

/**
 * Formats dimensions for Room Label (e.g., "KITCHEN 9'-3\" × 9'-8\"")
 */
export function formatRoomDimensions(widthInches, lengthInches) {
    return `${formatFeetInches(widthInches, false)} × ${formatFeetInches(lengthInches, false)}`;
}
