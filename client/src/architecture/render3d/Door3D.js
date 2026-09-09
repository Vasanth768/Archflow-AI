/**
 * Door3D.js - Parametric 3D Wall-Hosted Door Generator
 */

import * as THREE from 'three';

export class Door3D {
    static createMesh(door, hostWall, centerX, centerZ, doorMaterial) {
        if (!hostWall) return null;

        const x1 = hostWall.start.x - centerX;
        const z1 = hostWall.start.y - centerZ;
        const x2 = hostWall.end.x - centerX;
        const z2 = hostWall.end.y - centerZ;

        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.hypot(dx, dz);
        if (len < 0.001) return null;

        const ux = dx / len;
        const uz = dz / len;

        const pos = door.positionAlongWall || 36;
        const w = door.width || 36;
        const h = door.height || 84;

        const posX = x1 + ux * (pos + w / 2);
        const posZ = z1 + uz * (pos + w / 2);
        const angle = Math.atan2(dz, dx);

        const doorGeo = new THREE.BoxGeometry(w, h, 3);
        const doorMesh = new THREE.Mesh(doorGeo, doorMaterial);
        doorMesh.position.set(posX, h / 2, posZ);
        doorMesh.rotation.y = -angle;

        return doorMesh;
    }
}
