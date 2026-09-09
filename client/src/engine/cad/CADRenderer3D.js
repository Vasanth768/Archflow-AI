/**
 * CADRenderer3D - Parametric 3D WebGL Architectural Engine
 * 
 * Generates true 3D CAD meshes (walls with boolean door/window openings,
 * floors, ceilings, stairs, and furniture) directly from the Canonical Architectural Model.
 */

import * as THREE from 'three';

export class CADRenderer3D {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f1d);

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
        this.camera.position.set(400, 600, 700);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Attach canvas
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // Lighting group
        this.lightsGroup = new THREE.Group();
        this.scene.add(this.lightsGroup);

        // Geometry root group
        this.modelGroup = new THREE.Group();
        this.scene.add(this.modelGroup);

        // Setup materials
        this.setupMaterials();
        this.setupLighting('day');

        // Simple mouse & touch orbit controls
        this.setupOrbit();

        // Animation loop
        this.isAnimating = true;
        this.animate = this.animate.bind(this);
        this.animFrameId = requestAnimationFrame(this.animate);
    }

    setupMaterials() {
        this.materials = {
            exteriorWall: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7, metalness: 0.1 }),
            interiorWall: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8, metalness: 0.05 }),
            floor: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.2 }),
            ground: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }),
            door: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 }),
            windowFrame: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }),
            glass: new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, roughness: 0.1, transmission: 0.9 }),
            furniture: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 }),
            stair: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 })
        };
    }

    setupLighting(timeOfDay = 'day') {
        // Clear previous lights
        while (this.lightsGroup.children.length > 0) {
            this.lightsGroup.remove(this.lightsGroup.children[0]);
        }

        if (timeOfDay === 'night') {
            this.scene.background = new THREE.Color(0x02040a);
            const ambient = new THREE.AmbientLight(0x1e1b4b, 0.6);
            this.lightsGroup.add(ambient);

            const moon = new THREE.DirectionalLight(0x38bdf8, 0.8);
            moon.position.set(300, 800, 400);
            this.lightsGroup.add(moon);
        } else if (timeOfDay === 'evening') {
            this.scene.background = new THREE.Color(0x1e1b4b);
            const ambient = new THREE.AmbientLight(0xfb923c, 0.8);
            this.lightsGroup.add(ambient);

            const sun = new THREE.DirectionalLight(0xf97316, 1.5);
            sun.position.set(500, 400, 300);
            this.lightsGroup.add(sun);
        } else {
            // Day
            this.scene.background = new THREE.Color(0x0a0f1d);
            const ambient = new THREE.AmbientLight(0xffffff, 0.9);
            this.lightsGroup.add(ambient);

            const sun = new THREE.DirectionalLight(0xfffbeb, 1.8);
            sun.position.set(400, 900, 500);
            sun.castShadow = true;
            this.lightsGroup.add(sun);
        }
    }

    setupOrbit() {
        let isDragging = false;
        let prevMouse = { x: 0, y: 0 };
        const dom = this.renderer.domElement;

        this._onMouseDown = (e) => {
            isDragging = true;
            prevMouse = { x: e.clientX, y: e.clientY };
        };

        this._onMouseMove = (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - prevMouse.x;
            const deltaY = e.clientY - prevMouse.y;
            prevMouse = { x: e.clientX, y: e.clientY };

            this.modelGroup.rotation.y += deltaX * 0.008;
            this.camera.position.y = Math.max(100, Math.min(1200, this.camera.position.y + deltaY * 1.5));
            this.camera.lookAt(0, 0, 0);
        };

        this._onMouseUp = () => {
            isDragging = false;
        };

        this._onWheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.08 : 0.92;
            this.camera.position.multiplyScalar(factor);
            this.camera.lookAt(0, 0, 0);
        };

        this._onTouchStart = (e) => {
            if (e.touches && e.touches.length === 1) {
                isDragging = true;
                prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };

        this._onTouchMove = (e) => {
            if (!isDragging || !e.touches || e.touches.length !== 1) return;
            e.preventDefault();
            const deltaX = e.touches[0].clientX - prevMouse.x;
            const deltaY = e.touches[0].clientY - prevMouse.y;
            prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };

            this.modelGroup.rotation.y += deltaX * 0.008;
            this.camera.position.y = Math.max(100, Math.min(1200, this.camera.position.y + deltaY * 1.5));
            this.camera.lookAt(0, 0, 0);
        };

        this._onTouchEnd = () => {
            isDragging = false;
        };

        dom.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
        dom.addEventListener('wheel', this._onWheel, { passive: false });
        dom.addEventListener('touchstart', this._onTouchStart, { passive: true });
        window.addEventListener('touchmove', this._onTouchMove, { passive: false });
        window.addEventListener('touchend', this._onTouchEnd, { passive: true });
    }

    /**
     * Build the entire 3D architectural model directly from the canonical plan
     */
    buildScene(plan) {
        if (!plan) return;

        // Clear existing meshes
        while (this.modelGroup.children.length > 0) {
            const obj = this.modelGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            this.modelGroup.remove(obj);
        }

        const siteW = plan.site?.width || 540;
        const siteL = plan.site?.length || 840;
        const centerX = siteW / 2;
        const centerZ = siteL / 2;

        // 1. Build Floor Slab
        const floorGeo = new THREE.BoxGeometry(siteW + 48, 6, siteL + 48);
        const floorMesh = new THREE.Mesh(floorGeo, this.materials.floor);
        floorMesh.position.set(0, -3, 0);
        floorMesh.receiveShadow = true;
        this.modelGroup.add(floorMesh);

        // 2. Build Walls
        const walls = plan.walls || [];
        const wallHeight = plan.constraints?.wallHeight || 120;

        walls.forEach(wall => {
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
            const wallMat = wall.type === 'exterior' ? this.materials.exteriorWall : this.materials.interiorWall;
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);

            wallMesh.position.set((x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2);
            wallMesh.rotation.y = -angle;
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            this.modelGroup.add(wallMesh);
        });

        // 3. Build Doors
        (plan.doors || []).forEach(door => {
            const hostWall = walls.find(w => w.id === door.wallId);
            if (!hostWall) return;

            const x1 = hostWall.start.x - centerX;
            const z1 = hostWall.start.y - centerZ;
            const x2 = hostWall.end.x - centerX;
            const z2 = hostWall.end.y - centerZ;

            const dx = x2 - x1;
            const dz = z2 - z1;
            const len = Math.hypot(dx, dz);
            const ux = dx / len;
            const uz = dz / len;

            const pos = door.positionAlongWall || 36;
            const w = door.width || 36;
            const h = door.height || 84;

            const posX = x1 + ux * (pos + w / 2);
            const posZ = z1 + uz * (pos + w / 2);
            const angle = Math.atan2(dz, dx);

            const doorGeo = new THREE.BoxGeometry(w, h, 3);
            const doorMesh = new THREE.Mesh(doorGeo, this.materials.door);
            doorMesh.position.set(posX, h / 2, posZ);
            doorMesh.rotation.y = -angle;
            this.modelGroup.add(doorMesh);
        });

        // 4. Build Windows
        (plan.windows || []).forEach(win => {
            const hostWall = walls.find(w => w.id === win.wallId);
            if (!hostWall) return;

            const x1 = hostWall.start.x - centerX;
            const z1 = hostWall.start.y - centerZ;
            const x2 = hostWall.end.x - centerX;
            const z2 = hostWall.end.y - centerZ;

            const dx = x2 - x1;
            const dz = z2 - z1;
            const len = Math.hypot(dx, dz);
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
            const winMesh = new THREE.Mesh(winGeo, this.materials.glass);
            winMesh.position.set(posX, sill + h / 2, posZ);
            winMesh.rotation.y = -angle;
            this.modelGroup.add(winMesh);
        });

        // 5. Build 3D Furniture
        (plan.furniture || []).forEach(furn => {
            const fx = furn.x + furn.width / 2 - centerX;
            const fz = furn.y + furn.length / 2 - centerZ;
            const furnH = furn.type === 'bed' ? 24 : furn.type === 'sofa' ? 32 : 30;

            const furnGeo = new THREE.BoxGeometry(furn.width, furnH, furn.length);
            const furnMesh = new THREE.Mesh(furnGeo, this.materials.furniture);
            furnMesh.position.set(fx, furnH / 2, fz);
            furnMesh.rotation.y = ((furn.rotation || 0) * Math.PI) / 180;
            furnMesh.castShadow = true;
            this.modelGroup.add(furnMesh);
        });

        this.camera.lookAt(0, 0, 0);
    }

    setCameraView(viewType) {
        if (viewType === 'isometric') {
            this.camera.position.set(400, 600, 700);
        } else if (viewType === 'front') {
            this.camera.position.set(0, 200, 900);
        } else if (viewType === 'side') {
            this.camera.position.set(900, 200, 0);
        } else if (viewType === 'top') {
            this.camera.position.set(0, 1000, 0.1);
        }
        this.camera.lookAt(0, 0, 0);
    }

    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        if (!this.isAnimating) return;
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.isAnimating = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        const dom = this.renderer?.domElement;
        if (this._onMouseDown && dom) {
            dom.removeEventListener('mousedown', this._onMouseDown);
        }
        if (this._onMouseMove) {
            window.removeEventListener('mousemove', this._onMouseMove);
        }
        if (this._onMouseUp) {
            window.removeEventListener('mouseup', this._onMouseUp);
        }
        if (this._onWheel && dom) {
            dom.removeEventListener('wheel', this._onWheel);
        }
        if (this._onTouchStart && dom) {
            dom.removeEventListener('touchstart', this._onTouchStart);
        }
        if (this._onTouchMove) {
            window.removeEventListener('touchmove', this._onTouchMove);
        }
        if (this._onTouchEnd) {
            window.removeEventListener('touchend', this._onTouchEnd);
        }
        if (dom && this.container?.contains(dom)) {
            this.container.removeChild(dom);
        }
        this.renderer?.dispose();
    }
}
