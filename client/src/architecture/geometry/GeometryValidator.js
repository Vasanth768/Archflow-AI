/**
 * GeometryValidator.js - Architectural Constraint and Geometry Validator
 */

import { ConstraintValidator, ValidationStatus } from '../../engine/cad/ConstraintValidator.js';

export { ConstraintValidator, ValidationStatus };

export class GeometryValidator {
    constructor(options = {}) {
        this.validator = new ConstraintValidator(options);
    }

    validate(plan) {
        return this.validator.validatePlan(plan);
    }
}
export default GeometryValidator;
