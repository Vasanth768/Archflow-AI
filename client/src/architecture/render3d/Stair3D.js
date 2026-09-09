/**
 * Stair3D.js - Parametric 3D Staircase Generator
 */

import * as THREE from 'three';

export class Stair3D {
    static createMesh(stair, centerX, centerZ, wallHeight, stairMaterial) {
        const group = new THREE.Group();
        const sx = stair.x + stair.width / 2 - centerX;
        const sz = stair.y + stair.length / 2 - centerZ;
        const numSteps = stair.steps || 18;
        const stepH = wallHeight / numSteps;
        const stepL = stair.length / (numSteps / 2);

        for (let i = 0; i < numSteps / 2; i++) {
            const stepGeo = new THREE.BoxGeometry(stair.width / 2 - 2, stepH * (i + 1), stepL);
            const stepMesh = new THREE.Mesh(stepGeo, stairMaterial);
            stepMesh.position.set(sx - stair.width / 4, (stepH * (i + 1)) / 2, sz - stair.length / 2 + stepL * (i + 0.5));
            stepMesh.castShadow = true;
            group.add(stepMesh);
        }

        return group;
    }
}
