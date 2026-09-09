/**
 * Option04Data.js - Canonical Dataset for "GF Scheme Plan - Option 04"
 * 
 * Authoritative geometry source:
 * - Envelope: 45'-0" × 70'-0" (540" × 840")
 * - Exact Engineer Plan clear room dimensions:
 *   - KITCHEN: 9'-3" × 9'-8"
 *   - DINING: 15'-3" × 9'-3"
 *   - LIVING ROOM: 15'-3" × 19'-3"
 *   - PORTICO: 12'-6" × 18'-6"
 *   - STORE: 4'-6" × 5'-3"
 *   - POOJA: 4'-6" × 3'-3"
 *   - SITOUT: 15'-3" × 6'-0"
 *   - BEDROOM 1: 9'-3" × 15'-3"
 *   - A. TOILET 1: 7'-9" × 3'-9"
 *   - STAIRCASE: 8'-6" × 6'-6"
 *   - BEDROOM 2: 9'-2" × 10'-3"
 *   - A. TOILET 2: 9'-3" × 4'-3"
 *   - TOILET: 5'-3" × 3'-3"
 *   - BATH: 5'-3" × 5'-9"
 */

import { Option04CAD, validateOption04Geometry } from '../../engine/Option04Data.js';

export const Option04Data = Option04CAD;
export { validateOption04Geometry };
export default Option04Data;
