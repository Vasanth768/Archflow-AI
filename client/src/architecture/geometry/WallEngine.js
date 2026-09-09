/**
 * WallEngine.js - Mathematical Wall Graph and Topology Solver
 */

import { WallNetwork } from '../../engine/cad/WallNetwork.js';

export class WallEngine {
    constructor(walls = [], options = {}) {
        this.network = new WallNetwork(walls, options);
    }

    get walls() {
        return this.network.walls;
    }

    addWall(wallData) {
        return this.network.addWall(wallData);
    }

    removeWall(wallId) {
        return this.network.removeWall(wallId);
    }

    getWall(wallId) {
        return this.network.getWall(wallId);
    }

    moveWall(wallId, deltaX, deltaY) {
        return this.network.moveWall(wallId, deltaX, deltaY);
    }

    getWallLength(wall) {
        return this.network.getWallLength(wall);
    }

    getWallPolygon(wall) {
        return this.network.getWallPolygon(wall);
    }

    extractEnclosedRooms() {
        return this.network.extractEnclosedRooms();
    }

    toJSON() {
        return this.network.toJSON();
    }
}
