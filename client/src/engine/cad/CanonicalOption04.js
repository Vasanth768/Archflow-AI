/**
 * CanonicalOption04.js
 * 
 * Re-exports the authoritative Canonical 30x40 East Facing House CAD Dataset
 * to ensure a unified single source of truth across all modules.
 */

import { House30x40CAD } from '../House30x40Data.js';
import { validateOption04Geometry } from '../Option04Data.js';

export const CanonicalOption04 = House30x40CAD;
export { validateOption04Geometry };
export default CanonicalOption04;

