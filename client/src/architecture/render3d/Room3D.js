/**
 * Room3D.js - Parametric 3D Floor Mesh Generator
 */

import * as THREE from 'three';

export class Room3D {
    static createFloorMesh(room, centerX, centerZ, floorMaterial) {
        const x = room.x + room.w / 2 - centerX;
        const z = room.y + room.h / 2 - centerZ;

        const geo = new THREE.BoxGeometry(room.w - 1, 2, room.h - 1);
        const mesh = new THREE.Mesh(geo, floorMaterial);
        mesh.position.set(x, 1, z);
        mesh.receiveShadow = true;

        return mesh;
    }
}
