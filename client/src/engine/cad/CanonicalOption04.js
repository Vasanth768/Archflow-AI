/**
 * CanonicalOption04.js
 * 
 * Re-exports the authoritative Canonical Option 04 CAD Dataset from Option04Data.js
 * to ensure a unified single source of truth across all modules.
 */

import { Option04CAD, validateOption04Geometry } from '../Option04Data.js';

export const CanonicalOption04 = Option04CAD;
export { validateOption04Geometry };
export default CanonicalOption04;
