/**
 * Window3D.js - Parametric 3D Wall-Hosted Window Generator
 */

import * as THREE from 'three';

export class Window3D {
    static createMesh(win, hostWall, centerX, centerZ, glassMaterial) {
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

        const pos = win.positionAlongWall || 36;
        const w = win.width || 48;
        const h = win.height || 48;
        const sill = win.sillHeight || 36;

        const posX = x1 + ux * (pos + w / 2);
        const posZ = z1 + uz * (pos + w / 2);
        const angle = Math.atan2(dz, dx);

        const winGeo = new THREE.BoxGeometry(w, h, 2);
        const winMesh = new THREE.Mesh(winGeo, glassMaterial);
        winMesh.position.set(posX, sill + h / 2, posZ);
        winMesh.rotation.y = -angle;

        return winMesh;
    }
}
