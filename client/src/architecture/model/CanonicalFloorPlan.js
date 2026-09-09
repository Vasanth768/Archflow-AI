/**
 * CanonicalFloorPlan.js - Single Source of Truth Floor Plan Model
 * 
 * Manages the authoritative lifecycle of an architectural project.
 */

import { Option04Data } from './Option04Data.js';
import { createCanonicalPlan } from './schema.js';

export class CanonicalFloorPlan {
    constructor(data = null) {
        this.plan = data ? JSON.parse(JSON.stringify(data)) : JSON.parse(JSON.stringify(Option04Data));
    }

    static fromOption04() {
        return new CanonicalFloorPlan(Option04Data);
    }

    static createEmpty(options) {
        return new CanonicalFloorPlan(createCanonicalPlan(options));
    }

    get data() {
        return this.plan;
    }

    get project() { return this.plan.project; }
    get site() { return this.plan.site; }
    get walls() { return this.plan.walls; }
    get rooms() { return this.plan.rooms; }
    get doors() { return this.plan.doors; }
    get windows() { return this.plan.windows; }
    get stairs() { return this.plan.stairs; }
    get columns() { return this.plan.columns; }
    get furniture() { return this.plan.furniture; }
    get dimensions() { return this.plan.dimensions; }
    get annotations() { return this.plan.annotations; }
    get materials() { return this.plan.materials; }

    getRoom(id) {
        return this.plan.rooms.find(r => r.id === id);
    }

    getWall(id) {
        return this.plan.walls.find(w => w.id === id);
    }

    toJSON() {
        return JSON.parse(JSON.stringify(this.plan));
    }
}
