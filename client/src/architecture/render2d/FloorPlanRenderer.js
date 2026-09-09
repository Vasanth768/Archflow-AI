/**
 * FloorPlanRenderer.js - High-Precision 2D Architectural CAD Canvas Renderer
 */

import { CADRenderer2D } from '../../engine/cad/CADRenderer2D.js';

export class FloorPlanRenderer extends CADRenderer2D {
    constructor(canvas, options = {}) {
        super(canvas, options);
    }
}

export { CADRenderer2D };
export default FloorPlanRenderer;
