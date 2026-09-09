/**
 * Wall3D.js - Parametric 3D Wall Mesh Generator
 */

import * as THREE from 'three';

export class Wall3D {
    static createMesh(wall, centerX, centerZ, wallHeight, exteriorMat, interiorMat) {
        const x1 = wall.start.x - centerX;
        const z1 = wall.start.y - centerZ;
        const x2 = wall.end.x - centerX;
        const z2 = wall.end.y - centerZ;

        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dz, dx);
        const thickness = wall.thickness || 9;

        const wallGeo = new THREE.BoxGeometry(len, wallHeight, thickness);
        const wallMat = wall.type === 'exterior' ? exteriorMat : interiorMat;
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);

        wallMesh.position.set((x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2);
        wallMesh.rotation.y = -angle;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;

        return wallMesh;
    }
}
