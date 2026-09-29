/**
 * Car.js
 * 3D Procedural Supercar & Traffic Vehicle Mesh Builder with dynamic materials,
 * LED lights, spinning alloy wheels, brake lights, and body tilt physics.
 */

import * as THREE from 'three';
import { GLTFLoader } from './GLTFLoader.js';

export class CarFactory {
    constructor() {
        this.gltfLoader = new GLTFLoader();
        this.customModelScene = null;
        this.customCarName = 'Custom Car';
        this.customRotationOffset = parseFloat(localStorage.getItem('apex_racer_custom_rot') || '0');
        this.customScaleMultiplier = parseFloat(localStorage.getItem('apex_racer_custom_scale') || '1.0');

        // Soft blurred radial neon underglow texture (eliminates hard rectangular borders)
        const ugCanvas = document.createElement('canvas');
        ugCanvas.width = 128;
        ugCanvas.height = 128;
        const ugCtx = ugCanvas.getContext('2d');
        if (ugCtx) {
            const grad = ugCtx.createRadialGradient(64, 64, 4, 64, 64, 64);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)');
            grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ugCtx.fillStyle = grad;
            ugCtx.fillRect(0, 0, 128, 128);
        }
        this.underglowTexture = new THREE.CanvasTexture(ugCanvas);

        // Shared materials for memory efficiency
        this.tireMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.8,
            metalness: 0.1
        });

        this.rimMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4d4d8,
            roughness: 0.3,
            metalness: 0.85
        });

        this.caliperMaterial = new THREE.MeshStandardMaterial({
            color: 0xff1744,
            roughness: 0.4,
            metalness: 0.6
        });

        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x111625,
            roughness: 0.1,
            metalness: 0.9,
            transmission: 0.6,
            transparent: true,
            opacity: 0.85
        });

        this.chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.2,
            metalness: 0.9
        });

        this.carbonMaterial = new THREE.MeshStandardMaterial({
            color: 0x222226,
            roughness: 0.6,
            metalness: 0.4
        });
    }

    /**
     * Create player's high-performance supercar
     * @param {number} bodyColor - Hex color for car paint
     * @param {string} carModel - Model identifier ('apex' | 'supra' | 'venom' | 'phantom' | 'custom')
     */
    createPlayerCar(bodyColor = 0xff2a5f, carModel = 'apex') {
        if (carModel === 'custom' && this.customModelScene) {
            return this.createCustomCarFromGLTF(this.customModelScene.clone(true), this.customCarName);
        }

        const car = new THREE.Group();

        // Car Body Material (Sleek Metallic Finish with glowing vibrancy at night)
        const paintMaterial = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.22,
            metalness: 0.65,
            emissive: bodyColor,
            emissiveIntensity: 0.14,
            envMapIntensity: 1.5
        });

        // 1. Lower Chassis & Underbody
        const chassisWidth = carModel === 'venom' ? 2.15 : (carModel === 'supra' ? 2.05 : 2.0);
        const chassisLength = carModel === 'phantom' ? 4.5 : 4.4;
        const chassisGeom = new THREE.BoxGeometry(chassisWidth, 0.45, chassisLength);
        const chassis = new THREE.Mesh(chassisGeom, paintMaterial);
        chassis.position.y = 0.45;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        car.add(chassis);

        // 2. Front Nose & Hood (sloped down)
        const hoodGeom = new THREE.BoxGeometry(1.85, 0.28, 1.6);
        const hood = new THREE.Mesh(hoodGeom, paintMaterial);
        hood.position.set(0, 0.58, 1.25);
        hood.rotation.x = -0.06;
        hood.castShadow = true;
        car.add(hood);

        // Power Bulge on Hood for Supra
        if (carModel === 'supra') {
            const bulgeGeom = new THREE.BoxGeometry(0.7, 0.1, 1.2);
            const bulge = new THREE.Mesh(bulgeGeom, this.carbonMaterial);
            bulge.position.set(0, 0.74, 1.25);
            car.add(bulge);
        }

        // Front Splitter / Lip
        const splitterWidth = carModel === 'venom' ? 2.25 : 2.1;
        const splitterGeom = new THREE.BoxGeometry(splitterWidth, 0.08, 0.65);
        const splitter = new THREE.Mesh(splitterGeom, this.carbonMaterial);
        splitter.position.set(0, 0.24, 2.15);
        splitter.castShadow = true;
        car.add(splitter);

        // Canards for Venom Hypercar
        if (carModel === 'venom') {
            const canardGeom = new THREE.BoxGeometry(0.3, 0.04, 0.35);
            const canardL = new THREE.Mesh(canardGeom, this.carbonMaterial);
            canardL.position.set(-1.08, 0.45, 1.85);
            canardL.rotation.z = -0.25;
            car.add(canardL);

            const canardR = canardL.clone();
            canardR.position.x = 1.08;
            canardR.rotation.z = 0.25;
            car.add(canardR);
        }

        // Front Grille
        const grilleGeom = new THREE.BoxGeometry(1.4, 0.22, 0.1);
        const grilleMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
        const grille = new THREE.Mesh(grilleGeom, grilleMat);
        grille.position.set(0, 0.38, 2.21);
        car.add(grille);

        // 3. Cabin & Canopy (Sleek curved aerodynamic glass dome)
        const cabinHeight = carModel === 'venom' ? 0.48 : (carModel === 'phantom' ? 0.52 : 0.58);
        const cabinY = carModel === 'venom' ? 0.82 : 0.88;
        const cabinGeom = new THREE.BoxGeometry(1.48, cabinHeight, 2.1);
        const cabin = new THREE.Mesh(cabinGeom, paintMaterial);
        cabin.position.set(0, cabinY, -0.2);
        cabin.castShadow = true;
        car.add(cabin);

        // Windshield (Front & Rear angled glass)
        const windshieldGeom = new THREE.BoxGeometry(1.44, cabinHeight - 0.03, 1.15);
        const windshield = new THREE.Mesh(windshieldGeom, this.glassMaterial);
        windshield.position.set(0, cabinY + 0.02, 0.25);
        windshield.rotation.x = -0.38;
        car.add(windshield);

        const rearGlassGeom = new THREE.BoxGeometry(1.44, cabinHeight - 0.03, 0.95);
        const rearGlass = new THREE.Mesh(rearGlassGeom, this.glassMaterial);
        rearGlass.position.set(0, cabinY + 0.02, -0.65);
        rearGlass.rotation.x = 0.42;
        car.add(rearGlass);

        // Roof Scoop / Shark Fin
        if (carModel === 'venom') {
            // Shark fin along roof & engine bay
            const finGeom = new THREE.BoxGeometry(0.06, 0.35, 1.6);
            const fin = new THREE.Mesh(finGeom, this.carbonMaterial);
            fin.position.set(0, cabinY + 0.35, -0.6);
            car.add(fin);
        } else if (carModel !== 'phantom') {
            const scoopGeom = new THREE.BoxGeometry(0.35, 0.12, 0.8);
            const scoop = new THREE.Mesh(scoopGeom, this.carbonMaterial);
            scoop.position.set(0, 1.22, -0.25);
            car.add(scoop);
        }

        // 4. Rear Spoiler Wings / Fins by Model
        if (carModel === 'phantom') {
            // Dual Vertical Cyber Stabilizer Blades with illuminated edge strips
            const bladeGeom = new THREE.BoxGeometry(0.08, 0.65, 1.2);
            const neonStripMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
            [-0.85, 0.85].forEach((bx) => {
                const blade = new THREE.Mesh(bladeGeom, this.carbonMaterial);
                blade.position.set(bx, 1.0, -1.8);
                blade.rotation.z = bx > 0 ? -0.15 : 0.15;
                car.add(blade);

                const stripGeom = new THREE.BoxGeometry(0.1, 0.08, 1.22);
                const strip = new THREE.Mesh(stripGeom, neonStripMat);
                strip.position.set(bx, 1.32, -1.8);
                strip.rotation.z = bx > 0 ? -0.15 : 0.15;
                car.add(strip);
            });
        } else if (carModel === 'supra') {
            // Iconic Supra high hoop arch wing
            const topWingGeom = new THREE.BoxGeometry(2.15, 0.08, 0.45);
            const topWing = new THREE.Mesh(topWingGeom, paintMaterial);
            topWing.position.set(0, 1.32, -2.05);
            car.add(topWing);

            const sidePylonGeom = new THREE.BoxGeometry(0.08, 0.65, 0.4);
            const pylonL = new THREE.Mesh(sidePylonGeom, paintMaterial);
            pylonL.position.set(-0.95, 0.98, -2.05);
            pylonL.rotation.z = 0.08;
            car.add(pylonL);

            const pylonR = pylonL.clone();
            pylonR.position.x = 0.95;
            pylonR.rotation.z = -0.08;
            car.add(pylonR);
        } else if (carModel === 'venom') {
            // Extreme Low GT3 carbon wing with endplates
            const wingGeom = new THREE.BoxGeometry(2.25, 0.08, 0.55);
            const wing = new THREE.Mesh(wingGeom, this.carbonMaterial);
            wing.position.set(0, 1.05, -2.1);
            car.add(wing);

            const pylonGeom = new THREE.BoxGeometry(0.06, 0.42, 0.25);
            const pylonL = new THREE.Mesh(pylonGeom, this.carbonMaterial);
            pylonL.position.set(-0.7, 0.82, -2.05);
            car.add(pylonL);
            const pylonR = pylonL.clone();
            pylonR.position.x = 0.7;
            car.add(pylonR);

            // Vertical endplates
            const endplateGeom = new THREE.BoxGeometry(0.04, 0.35, 0.6);
            const endplateL = new THREE.Mesh(endplateGeom, this.carbonMaterial);
            endplateL.position.set(-1.12, 1.05, -2.1);
            car.add(endplateL);
            const endplateR = endplateL.clone();
            endplateR.position.x = 1.12;
            car.add(endplateR);
        } else {
            // Apex GT Spoiler Wing
            const wingGeom = new THREE.BoxGeometry(2.1, 0.08, 0.5);
            const wing = new THREE.Mesh(wingGeom, this.carbonMaterial);
            wing.position.set(0, 1.1, -2.05);
            wing.castShadow = true;
            car.add(wing);

            const pylonGeom = new THREE.BoxGeometry(0.06, 0.45, 0.25);
            const pylonL = new THREE.Mesh(pylonGeom, this.carbonMaterial);
            pylonL.position.set(-0.65, 0.85, -2.0);
            car.add(pylonL);
            const pylonR = pylonL.clone();
            pylonR.position.x = 0.65;
            car.add(pylonR);
        }

        // Rear Diffuser
        const diffuserGeom = new THREE.BoxGeometry(1.8, 0.16, 0.5);
        const diffuser = new THREE.Mesh(diffuserGeom, this.carbonMaterial);
        diffuser.position.set(0, 0.25, -2.18);
        diffuser.rotation.x = 0.15;
        car.add(diffuser);

        // 5. Headlights (Bright LED cluster)
        const headlightColor = carModel === 'venom' ? 0xffea00 : 0x90e0ef;
        const headlightGeom = new THREE.BoxGeometry(0.42, 0.14, 0.15);
        const headlightMat = new THREE.MeshBasicMaterial({ color: headlightColor });
        
        const headlightL = new THREE.Mesh(headlightGeom, headlightMat);
        headlightL.position.set(-0.72, 0.52, 2.18);
        car.add(headlightL);

        const headlightR = new THREE.Mesh(headlightGeom, headlightMat);
        headlightR.position.set(0.72, 0.52, 2.18);
        car.add(headlightR);

        // Headlight Beams (Visual forward glow projection)
        const beamGeom = new THREE.ConeGeometry(0.9, 10, 8, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide
        });
        const beamL = new THREE.Mesh(beamGeom, beamMat);
        beamL.position.set(-0.72, 0.5, 7.0);
        beamL.rotation.x = Math.PI / 2;
        car.add(beamL);

        const beamR = beamL.clone();
        beamR.position.x = 0.72;
        car.add(beamR);

        // 6. Taillights (Full-width LED bar or Supra Quad Rounds)
        let taillights;
        const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
        if (carModel === 'supra') {
            taillights = new THREE.Group();
            [-0.75, -0.45, 0.45, 0.75].forEach((rx) => {
                const roundGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12);
                roundGeom.rotateX(Math.PI / 2);
                const roundMesh = new THREE.Mesh(roundGeom, taillightMat);
                roundMesh.position.set(rx, 0.62, -2.21);
                taillights.add(roundMesh);
            });
            car.add(taillights);
        } else {
            const taillightGeom = new THREE.BoxGeometry(1.9, 0.12, 0.1);
            taillights = new THREE.Mesh(taillightGeom, taillightMat);
            taillights.position.set(0, 0.62, -2.21);
            car.add(taillights);
        }

        // 7. Exhaust Tips & Nitro Flames
        let flames = [];
        const flameMat = new THREE.MeshBasicMaterial({
            color: carModel === 'phantom' ? 0x00ffff : 0x00f7ff,
            transparent: true,
            opacity: 0.9
        });
        const flameGeom = new THREE.ConeGeometry(0.18, 1.1, 8);
        flameGeom.rotateX(-Math.PI / 2);

        if (carModel === 'supra') {
            // Big single 4-inch angled titanium cannon
            const exhaustGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.35, 14);
            exhaustGeom.rotateX(Math.PI / 2);
            const exhaust = new THREE.Mesh(exhaustGeom, this.chromeMaterial);
            exhaust.position.set(-0.62, 0.28, -2.22);
            exhaust.rotation.y = 0.12;
            car.add(exhaust);

            const flameL = new THREE.Mesh(flameGeom, flameMat);
            flameL.position.set(-0.62, 0.28, -2.85);
            flameL.visible = false;
            car.add(flameL);
            flames.push(flameL);
        } else if (carModel === 'venom') {
            // Quad center exhausts
            [-0.32, -0.11, 0.11, 0.32].forEach((ex, idx) => {
                const exhaustGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 12);
                exhaustGeom.rotateX(Math.PI / 2);
                const exhaust = new THREE.Mesh(exhaustGeom, this.chromeMaterial);
                exhaust.position.set(ex, 0.28, -2.22);
                car.add(exhaust);

                if (idx === 0 || idx === 3) {
                    const flame = new THREE.Mesh(flameGeom, flameMat);
                    flame.position.set(ex, 0.28, -2.8);
                    flame.visible = false;
                    car.add(flame);
                    flames.push(flame);
                }
            });
        } else {
            // Dual Chrome Exhaust Tips
            const exhaustGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12);
            exhaustGeom.rotateX(Math.PI / 2);
            const exhaustL = new THREE.Mesh(exhaustGeom, this.chromeMaterial);
            exhaustL.position.set(-0.4, 0.32, -2.22);
            car.add(exhaustL);

            const exhaustR = exhaustL.clone();
            exhaustR.position.x = 0.4;
            car.add(exhaustR);

            const flameL = new THREE.Mesh(flameGeom, flameMat);
            flameL.position.set(-0.4, 0.32, -2.8);
            flameL.visible = false;
            car.add(flameL);

            const flameR = flameL.clone();
            flameR.position.x = 0.4;
            flameR.visible = false;
            car.add(flameR);

            flames.push(flameL, flameR);
        }

        // 8. 4 Wheels (Front Left, Front Right, Rear Left, Rear Right)
        const wheels = [];
        const frontWheels = [];
        const wheelPositions = [
            { x: -1.05, y: 0.36, z: 1.35, isFront: true },   // FL
            { x: 1.05, y: 0.36, z: 1.35, isFront: true },    // FR
            { x: -1.05, y: 0.38, z: -1.35, isFront: false }, // RL
            { x: 1.05, y: 0.38, z: -1.35, isFront: false }   // RR
        ];

        wheelPositions.forEach((pos) => {
            const wheelGroup = new THREE.Group();
            wheelGroup.position.set(pos.x, pos.y, pos.z);

            // Tire
            const tireGeom = new THREE.CylinderGeometry(pos.y, pos.y, 0.35, 18);
            tireGeom.rotateZ(Math.PI / 2);
            const tire = new THREE.Mesh(tireGeom, this.tireMaterial);
            tire.castShadow = true;
            wheelGroup.add(tire);

            // Rim
            const rimGeom = new THREE.CylinderGeometry(pos.y * 0.7, pos.y * 0.7, 0.36, 12);
            rimGeom.rotateZ(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeom, this.rimMaterial);
            wheelGroup.add(rim);

            // Rim spokes (5 spokes)
            for (let i = 0; i < 5; i++) {
                const spokeGeom = new THREE.BoxGeometry(0.37, 0.05, pos.y * 0.65);
                const spoke = new THREE.Mesh(spokeGeom, this.rimMaterial);
                spoke.rotation.x = (i * Math.PI) / 2.5;
                wheelGroup.add(spoke);
            }

            // Brake Caliper
            const caliperGeom = new THREE.BoxGeometry(0.12, 0.16, 0.18);
            const caliper = new THREE.Mesh(caliperGeom, this.caliperMaterial);
            caliper.position.set(pos.x > 0 ? -0.12 : 0.12, 0.1, 0);
            wheelGroup.add(caliper);

            car.add(wheelGroup);
            wheels.push(wheelGroup);
            if (pos.isFront) frontWheels.push(wheelGroup);
        });

        // Underglow Neon Ground Mesh (Casts realistic soft colored glow on asphalt)
        const underglowGeom = new THREE.PlaneGeometry(2.4, 4.4);
        underglowGeom.rotateX(-Math.PI / 2);
        const underglowMat = new THREE.MeshBasicMaterial({
            color: bodyColor,
            map: this.underglowTexture,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const underglowMesh = new THREE.Mesh(underglowGeom, underglowMat);
        underglowMesh.position.y = 0.04;
        car.add(underglowMesh);

        // Underglow Neon Point Light
        const underglowLight = new THREE.PointLight(bodyColor, 4.0, 9.5, 1.2);
        underglowLight.position.set(0, 0.25, 0);
        car.add(underglowLight);

        // Forward Headlight Projector SpotLight (illuminates road ahead)
        const headlightSpot = new THREE.SpotLight(0xf1f5f9, 3.5, 45, Math.PI / 5, 0.45, 1.0);
        headlightSpot.position.set(0, 0.6, 2.0);
        const spotTarget = new THREE.Object3D();
        spotTarget.position.set(0, 0, 32);
        car.add(spotTarget);
        headlightSpot.target = spotTarget;
        car.add(headlightSpot);

        // Shield Mesh (Transparent protective sphere around player)
        const shieldGeom = new THREE.SphereGeometry(2.6, 24, 18);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
        shieldMesh.visible = false;
        car.add(shieldMesh);

        // Store references on car object
        car.userData = {
            model: carModel,
            paintMaterial,
            underglowMesh,
            underglowLight,
            headlightSpot,
            taillights,
            taillightMat,
            flames,
            wheels,
            frontWheels,
            shieldMesh,
            speed: 0,
            steerAngle: 0,
            tiltZ: 0,
            pitchX: 0
        };

        return car;
    }

    /**
     * Remove studio floor planes, backdrops, cameras, lights from imported 3D models
     */
    cleanModelScene(scene) {
        if (!scene) return;
        const toRemove = [];
        scene.traverse((child) => {
            if (child.isCamera || child.isLight) {
                toRemove.push(child);
                return;
            }
            if (child.isMesh) {
                const name = (child.name || '').toLowerCase();
                const parentName = (child.parent?.name || '').toLowerCase();
                const isFloorName = /plane|floor|ground|backdrop|studio|shadow|stage|grid|base_plate/i.test(name) ||
                                    /plane|floor|ground|backdrop|studio|stage/i.test(parentName);

                child.geometry?.computeBoundingBox();
                const gBox = child.geometry?.boundingBox;
                let isHugeFlat = false;
                if (gBox) {
                    const gx = Math.abs(gBox.max.x - gBox.min.x);
                    const gy = Math.abs(gBox.max.y - gBox.min.y);
                    const gz = Math.abs(gBox.max.z - gBox.min.z);
                    if ((gy < 0.2 && (gx > 4 || gz > 4)) || (isFloorName && (gx > 2 || gz > 2))) {
                        isHugeFlat = true;
                    }
                }
                if (isFloorName || isHugeFlat) {
                    toRemove.push(child);
                }
            }
        });
        toRemove.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
        });
    }

    /**
     * Load a GLTF/GLB model from URL or ArrayBuffer
     */
    loadGLTF(dataOrUrl, name = 'Custom Supercar') {
        return new Promise((resolve, reject) => {
            const onLoad = (gltf) => {
                this.customModelScene = gltf.scene || gltf.scenes[0];
                this.cleanModelScene(this.customModelScene);
                this.customCarName = name;
                resolve(this.customModelScene);
            };

            if (typeof dataOrUrl === 'string') {
                this.gltfLoader.load(dataOrUrl, onLoad, undefined, reject);
            } else if (dataOrUrl instanceof ArrayBuffer) {
                // Use a Blob URL as resource path so that embedded textures in GLB
                // (which are stored as relative references) can be resolved correctly.
                const blob = new Blob([dataOrUrl], { type: 'model/gltf-binary' });
                const blobUrl = URL.createObjectURL(blob);
                this.gltfLoader.load(blobUrl, (gltf) => {
                    URL.revokeObjectURL(blobUrl); // cleanup memory
                    onLoad(gltf);
                }, undefined, (err) => {
                    URL.revokeObjectURL(blobUrl);
                    reject(err);
                });
            } else {
                reject(new Error('Invalid GLTF data source'));
            }
        });
    }

    /**
     * Adapt any custom 3D model into a playable racing supercar
     */
    createCustomCarFromGLTF(modelScene, customName = 'Custom Supercar') {
        const car = new THREE.Group();

        // 1. Clean backdrop/floor meshes from model
        this.cleanModelScene(modelScene);

        // 2. Calculate bounding box of ONLY the actual car meshes
        const box = new THREE.Box3().setFromObject(modelScene);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Standard car length in game is ~4.4 units, width ~2.0 units, height ~1.3 units
        const carLength = Math.max(size.x, size.z);
        const baseScale = 4.4 / (carLength > 0.001 ? carLength : 1.0);
        const finalScale = baseScale * (this.customScaleMultiplier || 1.0);

        // Container to cleanly isolate center, pivot, scale and rotation
        const container = new THREE.Group();

        // Center model mesh directly inside container
        modelScene.position.set(
            -center.x,
            -box.min.y,
            -center.z
        );
        container.add(modelScene);
        container.scale.setScalar(finalScale);

        // Calculate rotation: auto-align if sideways (X > Z by at least 20%)
        let autoRot = 0;
        if (size.x > size.z * 1.2) {
            autoRot = Math.PI / 2;
        }
        container.rotation.y = autoRot + (this.customRotationOffset || 0);

        // 3. Material enhancements: preserve textures, enhance reflections, enable shadows
        modelScene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(mat => {
                    if (!mat) return;
                    mat.envMapIntensity = 1.6;

                    if (mat.map) {
                        mat.map.anisotropy = 4;
                    }

                    if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                        if (!mat.map) {
                            // If base color is dark (like metallic black car paint), ensure surface highlights pop
                            const isDark = mat.color && ((mat.color.r + mat.color.g + mat.color.b) / 3 < 0.25);
                            if (isDark) {
                                mat.roughness = 0.25;
                                mat.metalness = 0.65;
                            }
                        }
                        mat.needsUpdate = true;
                    }
                });
            }
        });

        car.add(container);

        // 4. Directional fill lights attached to car for specular reflections on custom model
        const carKeyLight = new THREE.DirectionalLight(0xffffff, 0.9);
        carKeyLight.position.set(2, 6, 4);
        car.add(carKeyLight);

        const carRimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
        carRimLight.position.set(-2, 4, -4);
        car.add(carRimLight);

        // 2. Soft Realistic Underglow Ground Glow (Feathered radial blur, no blocky edges)
        const underglowGeom = new THREE.PlaneGeometry(2.4, 4.4);
        underglowGeom.rotateX(-Math.PI / 2);
        const underglowMat = new THREE.MeshBasicMaterial({
            color: 0x00f7ff,
            map: this.underglowTexture,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const underglowMesh = new THREE.Mesh(underglowGeom, underglowMat);
        underglowMesh.position.y = 0.04;
        car.add(underglowMesh);

        const underglowLight = new THREE.PointLight(0x00f7ff, 3.5, 9, 1.2);
        underglowLight.position.set(0, 0.25, 0);
        car.add(underglowLight);

        // 3. Headlight Projector SpotLight (Forward road illumination)
        const headlightSpot = new THREE.SpotLight(0xf1f5f9, 3.8, 48, Math.PI / 5, 0.45, 1.0);
        headlightSpot.position.set(0, 0.6, 2.0);
        const spotTarget = new THREE.Object3D();
        spotTarget.position.set(0, 0, 32);
        car.add(spotTarget);
        headlightSpot.target = spotTarget;
        car.add(headlightSpot);

        // 4. Nitro Exhaust Flames at the rear
        const flameGeom = new THREE.ConeGeometry(0.2, 1.2, 8);
        flameGeom.rotateX(-Math.PI / 2);
        const flameMat = new THREE.MeshBasicMaterial({
            color: 0x00f7ff,
            transparent: true,
            opacity: 0.95
        });
        const flameL = new THREE.Mesh(flameGeom, flameMat);
        flameL.position.set(-0.45, 0.35, -2.5);
        flameL.visible = false;
        car.add(flameL);
        const flameR = flameL.clone();
        flameR.position.x = 0.45;
        flameR.visible = false;
        car.add(flameR);

        // 5. Shield Mesh
        const shieldGeom = new THREE.SphereGeometry(2.7, 24, 18);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
        shieldMesh.visible = false;
        car.add(shieldMesh);

        // 6. Taillights: The custom 3D model already has its authentic 3D taillights modeled,
        // so we omit the artificial red block and maintain an empty group for game engine hooks
        const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0022, visible: false });
        const taillights = new THREE.Group();
        car.add(taillights);

        car.userData = {
            model: 'custom',
            customName: customName,
            paintMaterial: null,
            underglowMesh,
            underglowLight,
            headlightSpot,
            taillights,
            taillightMat,
            flames: [flameL, flameR],
            wheels: [],
            frontWheels: [],
            shieldMesh,
            speed: 0,
            steerAngle: 0,
            tiltZ: 0,
            pitchX: 0
        };

        return car;
    }

    /**
     * Rotate custom car by degrees (clockwise around Y axis)
     */
    rotateCustomCar(deg = 90) {
        this.customRotationOffset = ((this.customRotationOffset || 0) + (deg * Math.PI / 180)) % (Math.PI * 2);
        localStorage.setItem('apex_racer_custom_rot', this.customRotationOffset.toString());
    }

    /**
     * Scale custom car up or down
     */
    scaleCustomCar(delta = 0.15) {
        const current = this.customScaleMultiplier || 1.0;
        this.customScaleMultiplier = Math.max(0.4, Math.min(3.0, current + delta));
        localStorage.setItem('apex_racer_custom_scale', this.customScaleMultiplier.toString());
    }

    /**
     * Reset custom car transformations
     */
    resetCustomCarTransform() {
        this.customRotationOffset = 0;
        this.customScaleMultiplier = 1.0;
        localStorage.removeItem('apex_racer_custom_rot');
        localStorage.removeItem('apex_racer_custom_scale');
    }

    /**
     * Create traffic vehicles (Sedan, SUV, Sports, Semi-Truck)
     */
    createTrafficCar(type = 'sedan', colorHex = null) {
        const car = new THREE.Group();
        const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0xf8fafc, 0x334155];
        const color = colorHex !== null ? colorHex : colors[Math.floor(Math.random() * colors.length)];

        const bodyMat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.32,
            metalness: 0.45,
            emissive: color,
            emissiveIntensity: 0.08 // luminous self-glow ensures high visibility in night/cyberpunk theme
        });

        let dimensions = { width: 1.9, height: 1.3, length: 4.2 };
        let boundingRadius = 2.4;
        let isRampTruck = false;

        if (type === 'sedan') {
            // Main body
            const lowerGeom = new THREE.BoxGeometry(1.9, 0.5, 4.2);
            const lower = new THREE.Mesh(lowerGeom, bodyMat);
            lower.position.y = 0.45;
            lower.castShadow = true;
            car.add(lower);

            // Cabin
            const cabinGeom = new THREE.BoxGeometry(1.5, 0.5, 2.2);
            const cabin = new THREE.Mesh(cabinGeom, this.glassMaterial);
            cabin.position.set(0, 0.9, -0.2);
            cabin.castShadow = true;
            car.add(cabin);

            // Roof
            const roofGeom = new THREE.BoxGeometry(1.48, 0.08, 2.1);
            const roof = new THREE.Mesh(roofGeom, bodyMat);
            roof.position.set(0, 1.15, -0.2);
            car.add(roof);
        } else if (type === 'suv') {
            dimensions = { width: 2.1, height: 1.65, length: 4.6 };
            boundingRadius = 2.7;

            // Bulky SUV body
            const lowerGeom = new THREE.BoxGeometry(2.1, 0.7, 4.6);
            const lower = new THREE.Mesh(lowerGeom, bodyMat);
            lower.position.y = 0.55;
            lower.castShadow = true;
            car.add(lower);

            const cabinGeom = new THREE.BoxGeometry(1.8, 0.65, 2.9);
            const cabin = new THREE.Mesh(cabinGeom, this.glassMaterial);
            cabin.position.set(0, 1.15, -0.3);
            cabin.castShadow = true;
            car.add(cabin);

            // Roof Rack
            const rackGeom = new THREE.BoxGeometry(1.6, 0.08, 2.4);
            const rack = new THREE.Mesh(rackGeom, this.carbonMaterial);
            rack.position.set(0, 1.52, -0.3);
            car.add(rack);
        } else if (type === 'truck') {
            dimensions = { width: 2.4, height: 2.8, length: 8.2 };
            boundingRadius = 4.5;

            // Cab
            const cabGeom = new THREE.BoxGeometry(2.3, 2.2, 2.4);
            const cab = new THREE.Mesh(cabGeom, bodyMat);
            cab.position.set(0, 1.4, 2.6);
            cab.castShadow = true;
            car.add(cab);

            // Windshield
            const windGeom = new THREE.BoxGeometry(2.1, 0.8, 0.2);
            const wind = new THREE.Mesh(windGeom, this.glassMaterial);
            wind.position.set(0, 1.8, 3.8);
            car.add(wind);

            // Cargo Trailer (Metal container)
            const trailerMat = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                roughness: 0.5,
                metalness: 0.6
            });
            const trailerGeom = new THREE.BoxGeometry(2.35, 2.4, 5.6);
            const trailer = new THREE.Mesh(trailerGeom, trailerMat);
            trailer.position.set(0, 1.6, -1.4);
            trailer.castShadow = true;
            car.add(trailer);
        } else if (type === 'ramp_truck') {
            // SPECIAL RAMP TRUCK (Players can drive onto the ramp and LAUNCH into the air!)
            isRampTruck = true;
            dimensions = { width: 2.35, height: 2.4, length: 8.4 };
            boundingRadius = 4.6;

            // 1. Truck Cab (Front)
            const cabGeom = new THREE.BoxGeometry(2.3, 2.0, 2.2);
            const cab = new THREE.Mesh(cabGeom, bodyMat);
            cab.position.set(0, 1.3, 2.7);
            cab.castShadow = true;
            car.add(cab);

            // Cab Windshield
            const windGeom = new THREE.BoxGeometry(2.1, 0.75, 0.15);
            const wind = new THREE.Mesh(windGeom, this.glassMaterial);
            wind.position.set(0, 1.65, 3.82);
            car.add(wind);

            // Dual Amber Roof Safety Strobes
            const strobeGeom = new THREE.BoxGeometry(0.35, 0.18, 0.22);
            const strobeMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
            const strobeL = new THREE.Mesh(strobeGeom, strobeMat);
            strobeL.position.set(-0.75, 2.38, 2.7);
            car.add(strobeL);
            const strobeR = strobeL.clone();
            strobeR.position.x = 0.75;
            car.add(strobeR);

            // Dual Chrome Smokestacks
            const stackGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8);
            const stackL = new THREE.Mesh(stackGeom, this.chromeMaterial);
            stackL.position.set(-1.08, 1.7, 1.6);
            car.add(stackL);
            const stackR = stackL.clone();
            stackR.position.x = 1.08;
            car.add(stackR);

            // 2. Heavy Duty Flatbed Underframe
            const frameGeom = new THREE.BoxGeometry(2.2, 0.35, 6.2);
            const frame = new THREE.Mesh(frameGeom, this.carbonMaterial);
            frame.position.set(0, 0.35, -1.3);
            frame.castShadow = true;
            car.add(frame);

            // 3. Inclined Wedge Launch Ramp Platform
            // Starts near asphalt at rear (y=0.10, z=-4.4) and rises up to cab deck (y=1.38, z=1.6)
            const rampLength = 6.2;
            const rampGeom = new THREE.BoxGeometry(2.2, 0.14, rampLength);
            const rampMat = new THREE.MeshStandardMaterial({
                color: 0x334155,
                metalness: 0.7,
                roughness: 0.4
            });
            const rampMesh = new THREE.Mesh(rampGeom, rampMat);
            rampMesh.rotation.x = -0.21;
            rampMesh.position.set(0, 0.74, -1.4);
            rampMesh.castShadow = true;
            rampMesh.receiveShadow = true;
            car.add(rampMesh);

            // Ramp Side Safety Guide Rails (Hazard Yellow)
            const railGeom = new THREE.BoxGeometry(0.12, 0.36, rampLength);
            const railMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
            const railL = new THREE.Mesh(railGeom, railMat);
            railL.rotation.x = -0.21;
            railL.position.set(-1.08, 0.88, -1.4);
            car.add(railL);
            const railR = railL.clone();
            railR.position.x = 1.08;
            car.add(railR);

            // 4. Glowing Neon Launch Arrows on Ramp Surface (>>>)
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
            for (let a = -2.0; a <= 2.0; a += 1.2) {
                const arrowGeom = new THREE.ConeGeometry(0.38, 0.65, 3);
                arrowGeom.rotateX(-Math.PI / 2);
                const arrow = new THREE.Mesh(arrowGeom, arrowMat);
                arrow.rotation.x = -0.21;
                arrow.position.set(0, 0.86 + a * 0.21, -1.4 + a);
                car.add(arrow);
            }
        } else {
            // Sport coupe
            dimensions = { width: 2.0, height: 1.2, length: 4.3 };
            boundingRadius = 2.4;

            const bodyGeom = new THREE.BoxGeometry(2.0, 0.45, 4.3);
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            body.position.y = 0.45;
            body.castShadow = true;
            car.add(body);

            const cabinGeom = new THREE.BoxGeometry(1.4, 0.5, 1.9);
            const cabin = new THREE.Mesh(cabinGeom, this.glassMaterial);
            cabin.position.set(0, 0.85, -0.2);
            cabin.castShadow = true;
            car.add(cabin);

            // Spoiler
            const spoilerGeom = new THREE.BoxGeometry(1.8, 0.08, 0.4);
            const spoiler = new THREE.Mesh(spoilerGeom, this.carbonMaterial);
            spoiler.position.set(0, 0.95, -2.0);
            car.add(spoiler);
        }

        // Add Wheels (4 wheels, or 6 wheels for heavy duty trucks)
        const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
        wheelGeom.rotateZ(Math.PI / 2);
        const wX = dimensions.width * 0.5 + 0.05;
        const wZ = dimensions.length * 0.32;

        let wheelPositions = [
            [-wX, 0.35, wZ],
            [wX, 0.35, wZ],
            [-wX, 0.35, -wZ],
            [wX, 0.35, -wZ]
        ];

        if (isRampTruck || type === 'truck') {
            wheelPositions = [
                [-wX, 0.35, 2.5],
                [wX, 0.35, 2.5],
                [-wX, 0.35, -1.2],
                [wX, 0.35, -1.2],
                [-wX, 0.35, -2.6],
                [wX, 0.35, -2.6]
            ];
        }

        const wheels = [];
        wheelPositions.forEach((pos) => {
            const wheel = new THREE.Mesh(wheelGeom, this.tireMaterial);
            wheel.position.set(...pos);
            wheel.castShadow = true;
            car.add(wheel);
            wheels.push(wheel);
        });

        // Headlights (Front) - Bright LED Lamps
        const hlGeom = new THREE.BoxGeometry(0.38, 0.14, 0.08);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xfff7a0 });
        const hlL = new THREE.Mesh(hlGeom, hlMat);
        hlL.position.set(-dimensions.width * 0.36, 0.52, dimensions.length * 0.5 + 0.02);
        car.add(hlL);
        const hlR = hlL.clone();
        hlR.position.x = dimensions.width * 0.36;
        car.add(hlR);

        // Taillights (Rear) - Luminous Neon Red LED Bar (crystal clear in night theme)
        const tlGeom = new THREE.BoxGeometry(0.35, 0.16, 0.08);
        const tlMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
        const tlL = new THREE.Mesh(tlGeom, tlMat);
        const tlX = isRampTruck ? 1.12 : dimensions.width * 0.36;
        const tlY = isRampTruck ? 0.35 : 0.54;
        const tlZ = isRampTruck ? -4.4 : -dimensions.length * 0.5 - 0.02;
        tlL.position.set(-tlX, tlY, tlZ);
        car.add(tlL);
        const tlR = tlL.clone();
        tlR.position.x = tlX;
        car.add(tlR);

        car.userData = {
            type,
            isRamp: isRampTruck,
            dimensions,
            boundingRadius,
            wheels,
            taillights: [tlL, tlR],
            tlMat,
            speed: 0,
            targetSpeed: 0,
            lane: 0
        };

        return car;
    }

    setPlayerColor(car, colorHex) {
        if (!car) return;
        if (car.userData.paintMaterial) {
            car.userData.paintMaterial.color.setHex(colorHex);
            car.userData.paintMaterial.emissive.setHex(colorHex);
        }
        if (car.userData.underglowLight) {
            car.userData.underglowLight.color.setHex(colorHex);
        }
        if (car.userData.underglowMesh) {
            car.userData.underglowMesh.material.color.setHex(colorHex);
        }
    }

    rotateCustomCar(degrees = 90) {
        this.customRotationOffset = (this.customRotationOffset || 0) + (degrees * Math.PI / 180);
        // Normalize rotation to [0, 2*PI)
        this.customRotationOffset = this.customRotationOffset % (Math.PI * 2);
        localStorage.setItem('apex_racer_custom_rot', this.customRotationOffset.toString());
        return this.customRotationOffset;
    }

    setCustomScale(multiplier) {
        this.customScaleMultiplier = Math.max(0.2, Math.min(4.0, multiplier));
        localStorage.setItem('apex_racer_custom_scale', this.customScaleMultiplier.toString());
        return this.customScaleMultiplier;
    }

    scaleCustomCar(delta) {
        return this.setCustomScale((this.customScaleMultiplier || 1.0) + delta);
    }

    resetCustomCarTransform() {
        this.customRotationOffset = 0;
        this.customScaleMultiplier = 1.0;
        localStorage.removeItem('apex_racer_custom_rot');
        localStorage.removeItem('apex_racer_custom_scale');
    }
}
