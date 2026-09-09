/**
 * Architectural3DGenerator.js - Complete 3D Scene Generator from Canonical Model
 */

import { CADRenderer3D } from '../../engine/cad/CADRenderer3D.js';
import { Wall3D } from './Wall3D.js';
import { Room3D } from './Room3D.js';
import { Door3D } from './Door3D.js';
import { Window3D } from './Window3D.js';
import { Stair3D } from './Stair3D.js';
import { Furniture3D } from './Furniture3D.js';

export class Architectural3DGenerator extends CADRenderer3D {
    constructor(container, options = {}) {
        super(container, options);
    }
}

export { Wall3D, Room3D, Door3D, Window3D, Stair3D, Furniture3D };
export default Architectural3DGenerator;
