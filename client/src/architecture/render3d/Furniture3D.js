/**
 * Furniture3D.js - Parametric 3D Semantic Furniture Generator
 */

import * as THREE from 'three';

export class Furniture3D {
    static createMesh(furn, centerX, centerZ, furnitureMaterial) {
        const fx = furn.x + furn.width / 2 - centerX;
        const fz = furn.y + furn.length / 2 - centerZ;
        const furnH = furn.type === 'bed' ? 24 : furn.type === 'sofa' ? 32 : furn.type === 'car' ? 54 : 30;

        const furnGeo = new THREE.BoxGeometry(furn.width, furnH, furn.length);
        const furnMesh = new THREE.Mesh(furnGeo, furnitureMaterial);
        furnMesh.position.set(fx, furnH / 2, fz);
        furnMesh.rotation.y = ((furn.rotation || 0) * Math.PI) / 180;
        furnMesh.castShadow = true;
        furnMesh.receiveShadow = true;

        return furnMesh;
    }
}
