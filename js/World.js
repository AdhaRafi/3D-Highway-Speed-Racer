/**
 * World.js
 * Infinite Procedural 3D Scenery Environments:
 * - 🏖️ Pantai Tropis (Emerald Beach / Ocean Highway)
 * - 🏔️ Gunung Salju (Alpine Mountain Pass / Ridge)
 * - 🏜️ Gurun Canyon (Red Rock Desert / Monument Valley)
 * - 🌸 Lembah Sakura (Kyoto Blossom / Torii Gates)
 * - 🌃 Kota Cyberpunk (Cyberpunk Metropolis Skyline)
 * - 🌇 Neon Sunset (Outrun 80s Synthwave Drive)
 */

import * as THREE from 'three';

export class WorldManager {
    constructor(scene) {
        this.scene = scene;
        this.roadWidth = 20; // 4 wide lanes (5 units per lane)
        this.laneWidth = 5;
        this.numLanes = 4;
        this.laneCenters = [-7.5, -2.5, 2.5, 7.5];

        this.segmentLength = 60;
        this.numSegments = 10;
        this.totalVisibleDistance = this.segmentLength * this.numSegments; // 600 units

        this.roadSegments = [];
        this.animatableWater = [];
        this.animTime = 0;

        // Theme definitions with lighting, fog, colors and styling
        this.themes = {
            beach: {
                id: 'beach',
                name: 'Pantai Tropis',
                icon: '🏖️',
                skyColor: 0x38bdf8,
                fogColor: 0xbae6fd,
                fogNear: 80,
                fogFar: 440,
                sunColor: 0xfffbeb,
                sunIntensity: 2.6,
                ambientColor: 0x7dd3fc,
                ambientIntensity: 1.25,
                hemiSkyColor: 0x38bdf8,
                hemiGroundColor: 0xfef08a,
                hemiIntensity: 1.15,
                asphaltColor: 0x334155,
                roadLinesColor: 0xffffff,
                yellowLineColor: 0xfacc15,
                curbColor: 0xf1f5f9,
                guardrailColor: 0xe2e8f0,
                groundColor: 0xd4a373, // Golden sand
                lampPoleColor: 0xffffff,
                lampGlowColor: 0xfef08a
            },
            mountain: {
                id: 'mountain',
                name: 'Gunung Salju',
                icon: '🏔️',
                skyColor: 0x60a5fa,
                fogColor: 0xbfdbfe,
                fogNear: 70,
                fogFar: 450,
                sunColor: 0xffedd5,
                sunIntensity: 2.5,
                ambientColor: 0x93c5fd,
                ambientIntensity: 1.15,
                hemiSkyColor: 0x60a5fa,
                hemiGroundColor: 0x334155,
                hemiIntensity: 1.1,
                asphaltColor: 0x1e293b,
                roadLinesColor: 0xfacc15,
                yellowLineColor: 0xf59e0b,
                curbColor: 0x475569,
                guardrailColor: 0x64748b,
                groundColor: 0x334155, // Rocky highland
                lampPoleColor: 0x1e293b,
                lampGlowColor: 0xfde047
            },
            desert: {
                id: 'desert',
                name: 'Gurun Canyon',
                icon: '🏜️',
                skyColor: 0xf97316,
                fogColor: 0xfdba74,
                fogNear: 60,
                fogFar: 400,
                sunColor: 0xfef08a,
                sunIntensity: 2.7,
                ambientColor: 0xc2410c,
                ambientIntensity: 1.2,
                hemiSkyColor: 0xfb923c,
                hemiGroundColor: 0x78350f,
                hemiIntensity: 1.15,
                asphaltColor: 0x292524,
                roadLinesColor: 0xfde047,
                yellowLineColor: 0xf59e0b,
                curbColor: 0x78350f,
                guardrailColor: 0x9a3412,
                groundColor: 0x9a3412, // Red canyon sandstone
                lampPoleColor: 0x44403c,
                lampGlowColor: 0xfef08a
            },
            sakura: {
                id: 'sakura',
                name: 'Lembah Sakura',
                icon: '🌸',
                skyColor: 0xf472b6,
                fogColor: 0xfce7f3,
                fogNear: 70,
                fogFar: 420,
                sunColor: 0xffedd5,
                sunIntensity: 2.4,
                ambientColor: 0xf472b6,
                ambientIntensity: 1.2,
                hemiSkyColor: 0xf472b6,
                hemiGroundColor: 0x15803d,
                hemiIntensity: 1.1,
                asphaltColor: 0x1e293b,
                roadLinesColor: 0xffffff,
                yellowLineColor: 0xfb7185,
                curbColor: 0x475569,
                guardrailColor: 0xe2e8f0,
                groundColor: 0x166534, // Fresh spring moss
                lampPoleColor: 0x0f172a,
                lampGlowColor: 0xfef08a
            },
            cyberpunk: {
                id: 'cyberpunk',
                name: 'Kota Cyberpunk',
                icon: '🌃',
                skyColor: 0x09071b,
                fogColor: 0x120e2e,
                fogNear: 60,
                fogFar: 380,
                sunColor: 0xb59dfa,
                sunIntensity: 2.0,
                ambientColor: 0x6342c4,
                ambientIntensity: 1.4,
                hemiSkyColor: 0x818cf8,
                hemiGroundColor: 0x312e81,
                hemiIntensity: 1.2,
                asphaltColor: 0x1a1d29,
                roadLinesColor: 0x00f7ff,
                yellowLineColor: 0xf59e0b,
                curbColor: 0x3f3f46,
                guardrailColor: 0x94a3b8,
                groundColor: 0x0e0c1a,
                lampPoleColor: 0x475569,
                lampGlowColor: 0x00f7ff,
                buildingPalettes: [0x00f3ff, 0xff007f, 0x7928ca, 0x00ff88, 0xffbe0b]
            },
            sunset: {
                id: 'sunset',
                name: 'Neon Sunset',
                icon: '🌇',
                skyColor: 0x3b0764,
                fogColor: 0x831843,
                fogNear: 60,
                fogFar: 400,
                sunColor: 0xf97316,
                sunIntensity: 2.1,
                ambientColor: 0xbe185d,
                ambientIntensity: 1.2,
                hemiSkyColor: 0xf43f5e,
                hemiGroundColor: 0x4c0519,
                hemiIntensity: 1.0,
                asphaltColor: 0x1c1924,
                roadLinesColor: 0xfde047,
                yellowLineColor: 0xf59e0b,
                curbColor: 0x3b0764,
                guardrailColor: 0xa855f7,
                groundColor: 0x181024,
                lampPoleColor: 0x581c87,
                lampGlowColor: 0xf43f5e,
                buildingPalettes: [0xfbbf24, 0xf43f5e, 0xa855f7, 0x38bdf8]
            }
        };

        // Backward compatibility aliases
        this.themes.daylight = this.themes.beach;

        this.currentTheme = 'beach'; // Default to beautiful sunny beach

        // Lighting References
        this.ambientLight = null;
        this.sunLight = null;
        this.hemiLight = null;

        this.initLighting();
        this.initMaterials();
        this.buildInitialRoad();
    }

    initLighting() {
        const theme = this.themes[this.currentTheme];

        this.ambientLight = new THREE.AmbientLight(theme.ambientColor, theme.ambientIntensity);
        this.scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(
            theme.hemiSkyColor,
            theme.hemiGroundColor,
            theme.hemiIntensity
        );
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(theme.sunColor, theme.sunIntensity);
        this.sunLight.position.set(40, 80, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 300;
        this.sunLight.shadow.camera.left = -30;
        this.sunLight.shadow.camera.right = 30;
        this.sunLight.shadow.camera.top = 30;
        this.sunLight.shadow.camera.bottom = -30;
        this.sunLight.shadow.bias = -0.0005;
        this.scene.add(this.sunLight);

        // Scene fog & background
        this.scene.background = new THREE.Color(theme.skyColor);
        this.scene.fog = new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar);
    }

    initMaterials() {
        const theme = this.themes[this.currentTheme];

        this.asphaltMat = new THREE.MeshStandardMaterial({
            color: theme.asphaltColor,
            roughness: 0.85,
            metalness: 0.15
        });

        this.roadLineMat = new THREE.MeshBasicMaterial({
            color: theme.roadLinesColor
        });

        this.yellowLineMat = new THREE.MeshBasicMaterial({
            color: theme.yellowLineColor || 0xf59e0b
        });

        this.curbMat = new THREE.MeshStandardMaterial({
            color: theme.curbColor || 0x3f3f46,
            roughness: 0.7
        });

        this.guardrailMat = new THREE.MeshStandardMaterial({
            color: theme.guardrailColor || 0x94a3b8,
            metalness: 0.7,
            roughness: 0.35
        });

        this.lampPoleMat = new THREE.MeshStandardMaterial({
            color: theme.lampPoleColor || 0x475569,
            metalness: 0.6,
            roughness: 0.4
        });

        this.lampGlowMat = new THREE.MeshBasicMaterial({
            color: theme.lampGlowColor || 0x38bdf8
        });

        this.groundMat = new THREE.MeshStandardMaterial({
            color: theme.groundColor || 0x09090b,
            roughness: 0.95
        });

        // Reusable shared materials for scenery
        this.waterMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.12,
            metalness: 0.4,
            transparent: true,
            opacity: 0.92
        });

        this.sandMat = new THREE.MeshStandardMaterial({
            color: 0xd4a373,
            roughness: 0.95
        });

        this.palmTrunkMat = new THREE.MeshStandardMaterial({
            color: 0x78350f,
            roughness: 0.85
        });

        this.palmLeafMat = new THREE.MeshStandardMaterial({
            color: 0x15803d,
            roughness: 0.6
        });

        this.coconutMat = new THREE.MeshStandardMaterial({
            color: 0x451a03,
            roughness: 0.9
        });

        this.mountainRockMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.9
        });

        this.mountainSnowMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.4
        });

        this.pineFoliageMat = new THREE.MeshStandardMaterial({
            color: 0x14532d,
            roughness: 0.75
        });

        this.pineTrunkMat = new THREE.MeshStandardMaterial({
            color: 0x3e2723,
            roughness: 0.9
        });

        this.desertMesaMat = new THREE.MeshStandardMaterial({
            color: 0x9a3412,
            roughness: 0.92
        });

        this.cactusMat = new THREE.MeshStandardMaterial({
            color: 0x166534,
            roughness: 0.65
        });

        this.sakuraBlossomMat = new THREE.MeshStandardMaterial({
            color: 0xf472b6,
            roughness: 0.65,
            emissive: 0x3b0764,
            emissiveIntensity: 0.15
        });

        this.sakuraWoodMat = new THREE.MeshStandardMaterial({
            color: 0x271911,
            roughness: 0.85
        });

        this.toriiRedMat = new THREE.MeshStandardMaterial({
            color: 0xdc2626,
            roughness: 0.4
        });

        this.stoneLanternMat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.85
        });
    }

    buildInitialRoad() {
        this.roadSegments = [];
        this.animatableWater = [];
        for (let i = 0; i < this.numSegments; i++) {
            const zPos = i * this.segmentLength;
            this.createSegment(zPos);
        }
    }

    createSegment(zPos) {
        const group = new THREE.Group();
        group.position.z = zPos;

        // 1. Asphalt Road Surface
        const roadGeom = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength);
        roadGeom.rotateX(-Math.PI / 2);
        const roadMesh = new THREE.Mesh(roadGeom, this.asphaltMat);
        roadMesh.receiveShadow = true;
        group.add(roadMesh);

        // 2. Continuous Yellow Border Lines (Left and Right edges)
        const borderGeom = new THREE.PlaneGeometry(0.3, this.segmentLength);
        borderGeom.rotateX(-Math.PI / 2);

        const borderL = new THREE.Mesh(borderGeom, this.yellowLineMat);
        borderL.position.set(-this.roadWidth / 2 + 0.3, 0.01, 0);
        group.add(borderL);

        const borderR = new THREE.Mesh(borderGeom, this.yellowLineMat);
        borderR.position.set(this.roadWidth / 2 - 0.3, 0.01, 0);
        group.add(borderR);

        // 3. Dashed Lane Markings (3 lines for 4 lanes: at x = -5, 0, 5)
        const dashLanesX = [-5, 0, 5];
        const numDashes = Math.floor(this.segmentLength / 6); // 3m dash + 3m gap

        dashLanesX.forEach(x => {
            for (let d = 0; d < numDashes; d++) {
                const dashGeom = new THREE.PlaneGeometry(0.22, 3.2);
                dashGeom.rotateX(-Math.PI / 2);
                const dash = new THREE.Mesh(dashGeom, this.roadLineMat);
                const dashZ = -this.segmentLength / 2 + d * 6 + 1.6;
                dash.position.set(x, 0.015, dashZ);
                group.add(dash);
            }
        });

        // 4. Concrete Curbs
        const curbGeom = new THREE.BoxGeometry(0.6, 0.35, this.segmentLength);
        const curbL = new THREE.Mesh(curbGeom, this.curbMat);
        curbL.position.set(-this.roadWidth / 2 - 0.3, 0.15, 0);
        curbL.receiveShadow = true;
        group.add(curbL);

        const curbR = new THREE.Mesh(curbGeom, this.curbMat);
        curbR.position.set(this.roadWidth / 2 + 0.3, 0.15, 0);
        curbR.receiveShadow = true;
        group.add(curbR);

        // 5. Metallic Highway Guardrails
        const railGeom = new THREE.BoxGeometry(0.12, 0.5, this.segmentLength);
        const railL = new THREE.Mesh(railGeom, this.guardrailMat);
        railL.position.set(-this.roadWidth / 2 - 0.7, 0.6, 0);
        railL.castShadow = true;
        group.add(railL);

        const railR = new THREE.Mesh(railGeom, this.guardrailMat);
        railR.position.set(this.roadWidth / 2 + 0.7, 0.6, 0);
        railR.castShadow = true;
        group.add(railR);

        // 6. Outer Ground Terrain
        const groundGeom = new THREE.PlaneGeometry(320, this.segmentLength);
        groundGeom.rotateX(-Math.PI / 2);
        const groundMesh = new THREE.Mesh(groundGeom, this.groundMat);
        groundMesh.position.y = -0.1;
        groundMesh.receiveShadow = true;
        group.add(groundMesh);

        // 7. Dedicated Props Group (Cleanly swapped when theme changes)
        const propsGroup = new THREE.Group();
        group.add(propsGroup);
        group.userData.propsGroup = propsGroup;

        this.buildSegmentProps(propsGroup, zPos);

        this.scene.add(group);
        this.roadSegments.push(group);
    }

    /**
     * Dispatcher to build environment props based on active theme
     */
    buildSegmentProps(propsGroup, zPos) {
        const themeId = this.currentTheme;

        if (themeId === 'beach' || themeId === 'daylight') {
            this.buildBeachProps(propsGroup, zPos);
        } else if (themeId === 'mountain') {
            this.buildMountainProps(propsGroup, zPos);
        } else if (themeId === 'desert') {
            this.buildDesertProps(propsGroup, zPos);
        } else if (themeId === 'sakura') {
            this.buildSakuraProps(propsGroup, zPos);
        } else if (themeId === 'sunset') {
            this.buildSunsetProps(propsGroup, zPos);
        } else {
            this.buildCyberpunkProps(propsGroup, zPos);
        }
    }

    // =========================================================================
    // MAP 1: 🏖️ BEACH (PANTAI TROPIS)
    // =========================================================================
    buildBeachProps(group, zPos) {
        // 1. Shimmering Turquoise Ocean on the Left (x: -95, width: 170)
        const waterGeom = new THREE.PlaneGeometry(170, this.segmentLength, 6, 2);
        waterGeom.rotateX(-Math.PI / 2);
        const waterMesh = new THREE.Mesh(waterGeom, this.waterMat);
        waterMesh.position.set(-95, -0.3, 0);
        waterMesh.receiveShadow = true;
        group.add(waterMesh);
        this.animatableWater.push(waterMesh);

        // White surf foam edge along shoreline
        const surfGeom = new THREE.PlaneGeometry(1.6, this.segmentLength);
        surfGeom.rotateX(-Math.PI / 2);
        const surfMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
        const surfMesh = new THREE.Mesh(surfGeom, surfMat);
        surfMesh.position.set(-11.5, -0.05, 0);
        group.add(surfMesh);

        // 2. Beach Umbrellas & Surfboards on the sandy shore (Left x: -14 to -24)
        if (Math.abs(zPos) % 30 === 0) {
            this.addBeachUmbrella(group, -16, -this.segmentLength / 4);
        }
        if (Math.abs(zPos) % 45 === 0) {
            this.addSurfboard(group, -14, this.segmentLength / 3);
        }

        // 3. Sailboat bobbing offshore
        if (Math.abs(zPos) % (this.segmentLength * 2) === 0) {
            this.addSailboat(group, -55 - Math.random() * 25, (Math.random() - 0.5) * 20);
        }

        // 4. Distant Tropical Islands
        if (Math.abs(zPos) % (this.segmentLength * 3) === 0) {
            this.addTropicalIsland(group, -120, 0);
        }

        // 5. Coconut Palm Trees along coastal right side & beach strip
        const palmPositions = [
            { x: -16, z: -this.segmentLength / 3 },
            { x: 14 + Math.random() * 5, z: -this.segmentLength / 4 },
            { x: 18 + Math.random() * 8, z: this.segmentLength / 5 },
            { x: 26 + Math.random() * 10, z: -this.segmentLength / 6 }
        ];

        palmPositions.forEach(pos => {
            this.addPalmTree(group, pos.x, pos.z);
        });

        // 6. Coastal Minimalist White Streetlights
        this.addCoastalLights(group);

        // 7. Tropical Highway Arch Sign every 3 segments
        if (Math.abs(zPos) % (this.segmentLength * 3) === 0 && zPos > 0) {
            this.addBeachArchGantry(group, "EMERALD COAST HIGHWAY 🏄‍♂️");
        }
    }

    addPalmTree(group, x, z) {
        const palm = new THREE.Group();
        palm.position.set(x, 0, z);

        // Curved segmented trunk
        const height = 7 + Math.random() * 2.5;
        const trunkSegments = 5;
        let currentY = 0;
        let currentX = 0;
        const curveDir = x > 0 ? 1 : -1;

        for (let i = 0; i < trunkSegments; i++) {
            const segH = height / trunkSegments;
            const rTop = 0.22 - i * 0.02;
            const rBot = 0.28 - i * 0.02;
            const cylGeom = new THREE.CylinderGeometry(rTop, rBot, segH, 7);
            const cyl = new THREE.Mesh(cylGeom, this.palmTrunkMat);
            cyl.position.set(currentX, currentY + segH / 2, 0);
            cyl.rotation.z = curveDir * 0.05 * (i + 1);
            cyl.castShadow = true;
            palm.add(cyl);

            currentY += segH;
            currentX += curveDir * 0.15;
        }

        // Coconuts cluster under the crown
        for (let c = 0; c < 3; c++) {
            const nutGeom = new THREE.SphereGeometry(0.28, 6, 6);
            const nut = new THREE.Mesh(nutGeom, this.coconutMat);
            const ang = (c * Math.PI * 2) / 3;
            nut.position.set(currentX + Math.cos(ang) * 0.35, currentY - 0.2, Math.sin(ang) * 0.35);
            palm.add(nut);
        }

        // Palm fronds radiating outward & drooping down
        const numLeaves = 7;
        for (let l = 0; l < numLeaves; l++) {
            const angle = (l * Math.PI * 2) / numLeaves;
            const leafGroup = new THREE.Group();
            leafGroup.position.set(currentX, currentY, 0);
            leafGroup.rotation.y = angle;

            const leafGeom = new THREE.ConeGeometry(0.7, 3.8, 4);
            leafGeom.rotateX(Math.PI / 2.6); // Droop downward
            const leaf = new THREE.Mesh(leafGeom, this.palmLeafMat);
            leaf.position.set(0, -0.4, 1.8);
            leaf.castShadow = true;
            leafGroup.add(leaf);

            palm.add(leafGroup);
        }

        group.add(palm);
    }

    addBeachUmbrella(group, x, z) {
        const umbrella = new THREE.Group();
        umbrella.position.set(x, 0, z);

        // Thin pole
        const poleGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6);
        const pole = new THREE.Mesh(poleGeom, this.lampPoleMat);
        pole.position.y = 1.25;
        umbrella.add(pole);

        // Striped canopy cone
        const colors = [0xf43f5e, 0xfacc15, 0x06b6d4];
        const canopyColor = colors[Math.floor(Math.random() * colors.length)];
        const canopyGeom = new THREE.ConeGeometry(2.0, 0.8, 8);
        const canopyMat = new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.6 });
        const canopy = new THREE.Mesh(canopyGeom, canopyMat);
        canopy.position.y = 2.4;
        canopy.rotation.z = (Math.random() - 0.5) * 0.15;
        canopy.castShadow = true;
        umbrella.add(canopy);

        group.add(umbrella);
    }

    addSurfboard(group, x, z) {
        const boardGeom = new THREE.BoxGeometry(0.35, 2.0, 0.08);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
        const board = new THREE.Mesh(boardGeom, boardMat);
        board.position.set(x, 0.8, z);
        board.rotation.set(0.2, (Math.random() - 0.5) * 0.4, 0.25);
        board.castShadow = true;
        group.add(board);
    }

    addSailboat(group, x, z) {
        const boat = new THREE.Group();
        boat.position.set(x, -0.2, z);

        // White boat hull
        const hullGeom = new THREE.BoxGeometry(2.2, 0.7, 5.5);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.y = 0.35;
        boat.add(hull);

        // Mast pole
        const mastGeom = new THREE.CylinderGeometry(0.08, 0.08, 6.0, 6);
        const mast = new THREE.Mesh(mastGeom, this.lampPoleMat);
        mast.position.set(0, 3.3, 0.5);
        boat.add(mast);

        // Triangular sail
        const sailGeom = new THREE.ConeGeometry(1.8, 4.5, 3);
        sailGeom.rotateZ(Math.PI / 2);
        const sailMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide });
        const sail = new THREE.Mesh(sailGeom, sailMat);
        sail.position.set(0.9, 3.8, 0.2);
        boat.add(sail);

        group.add(boat);
    }

    addTropicalIsland(group, x, z) {
        const island = new THREE.Group();
        island.position.set(x, -0.3, z);

        // Rocky atoll base
        const rockGeom = new THREE.CylinderGeometry(14, 22, 5, 8);
        const rock = new THREE.Mesh(rockGeom, this.mountainRockMat);
        rock.position.y = 1.5;
        island.add(rock);

        // Sandy top cap
        const sandTopGeom = new THREE.CylinderGeometry(13.5, 14, 1.2, 8);
        const sandTop = new THREE.Mesh(sandTopGeom, this.sandMat);
        sandTop.position.y = 4.1;
        island.add(sandTop);

        // Mini palm tree cluster on island
        this.addPalmTree(island, 0, 0);
        this.addPalmTree(island, 4, 3);

        group.add(island);
    }

    addCoastalLights(group) {
        const zOffsets = [-this.segmentLength / 4, this.segmentLength / 4];
        zOffsets.forEach(z => {
            [this.roadWidth / 2 + 1.8].forEach(x => {
                const poleGroup = new THREE.Group();
                poleGroup.position.set(x, 0, z);

                const poleGeom = new THREE.CylinderGeometry(0.1, 0.16, 6.5, 8);
                const pole = new THREE.Mesh(poleGeom, this.lampPoleMat);
                pole.position.y = 3.25;
                poleGroup.add(pole);

                const lampGeom = new THREE.SphereGeometry(0.35, 8, 8);
                const lamp = new THREE.Mesh(lampGeom, this.lampGlowMat);
                lamp.position.set(-0.6, 6.5, 0);
                poleGroup.add(lamp);

                group.add(poleGroup);
            });
        });
    }

    addBeachArchGantry(group, text) {
        const arch = new THREE.Group();
        arch.position.set(0, 0, 0);

        // Wooden pillars
        const pillarGeom = new THREE.BoxGeometry(0.8, 8.5, 0.8);
        const pL = new THREE.Mesh(pillarGeom, this.palmTrunkMat);
        pL.position.set(-this.roadWidth / 2 - 1.2, 4.25, 0);
        arch.add(pL);

        const pR = new THREE.Mesh(pillarGeom, this.palmTrunkMat);
        pR.position.set(this.roadWidth / 2 + 1.2, 4.25, 0);
        arch.add(pR);

        // Wooden crossbeam
        const beamGeom = new THREE.BoxGeometry(this.roadWidth + 3, 1.0, 0.9);
        const beam = new THREE.Mesh(beamGeom, this.palmTrunkMat);
        beam.position.set(0, 8.2, 0);
        arch.add(beam);

        // Surfboard sign decoration
        const signGeom = new THREE.BoxGeometry(this.roadWidth * 0.7, 1.8, 0.25);
        const signMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
        const sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(0, 7.8, 0);
        arch.add(sign);

        group.add(arch);
    }

    // =========================================================================
    // MAP 2: 🏔️ MOUNTAIN (GUNUNG SALJU / ALPINE RIDGE)
    // =========================================================================
    buildMountainProps(group, zPos) {
        const sides = [-1, 1];

        sides.forEach(side => {
            // 1. Massive Snow-Capped Mountain Peaks in distance
            const numPeaks = 2 + Math.floor(Math.random() * 2);
            for (let p = 0; p < numPeaks; p++) {
                const peakX = (this.roadWidth / 2 + 35 + p * 30 + Math.random() * 20) * side;
                const peakZ = -this.segmentLength / 2 + (p * this.segmentLength) / numPeaks;
                const radius = 24 + Math.random() * 22;
                const height = 65 + Math.random() * 65;

                this.addMountainPeak(group, peakX, peakZ, radius, height);
            }

            // 2. Evergreen Pine / Fir Forest
            const numPines = 6 + Math.floor(Math.random() * 4);
            for (let t = 0; t < numPines; t++) {
                const treeX = (this.roadWidth / 2 + 3.5 + Math.random() * 26) * side;
                const treeZ = -this.segmentLength / 2 + (t * this.segmentLength) / numPines + (Math.random() * 4 - 2);
                this.addPineTree(group, treeX, treeZ);
            }

            // 3. Rocky Boulders along curbs
            if (Math.random() > 0.3) {
                const bX = (this.roadWidth / 2 + 1.8 + Math.random() * 2.0) * side;
                const bZ = (Math.random() - 0.5) * (this.segmentLength * 0.8);
                this.addBoulder(group, bX, bZ);
            }
        });

        // 4. Alpine Street Lamps
        this.addAlpineStreetLights(group);

        // 5. Alpine Stone Tunnel Portal / Highway Sign every 3 segments
        if (Math.abs(zPos) % (this.segmentLength * 3) === 0 && zPos > 0) {
            this.addMountainStoneArch(group);
        }
    }

    addMountainPeak(group, x, z, radius, height) {
        const peak = new THREE.Group();
        peak.position.set(x, 0, z);

        // Polygonal rocky base (sharp alpine facets)
        const rockGeom = new THREE.ConeGeometry(radius, height, 7);
        const rock = new THREE.Mesh(rockGeom, this.mountainRockMat);
        rock.position.y = height / 2;
        rock.castShadow = true;
        peak.add(rock);

        // Brilliant snow cap on the upper peak
        const snowH = height * 0.38;
        const snowR = radius * 0.38;
        const snowGeom = new THREE.ConeGeometry(snowR, snowH, 7);
        const snow = new THREE.Mesh(snowGeom, this.mountainSnowMat);
        snow.position.y = height - snowH / 2 + 0.1;
        peak.add(snow);

        group.add(peak);
    }

    addPineTree(group, x, z) {
        const tree = new THREE.Group();
        tree.position.set(x, 0, z);
        const scale = 0.8 + Math.random() * 0.6;
        tree.scale.set(scale, scale, scale);

        // Brown trunk
        const trunkGeom = new THREE.CylinderGeometry(0.25, 0.4, 2.5, 6);
        const trunk = new THREE.Mesh(trunkGeom, this.pineTrunkMat);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        tree.add(trunk);

        // 3 Tiers of pine foliage with snow-tipped edges
        const tiers = [
            { y: 2.8, r: 2.4, h: 2.8 },
            { y: 4.4, r: 1.8, h: 2.4 },
            { y: 5.8, r: 1.2, h: 2.0 }
        ];

        tiers.forEach(t => {
            const coneGeom = new THREE.ConeGeometry(t.r, t.h, 7);
            const cone = new THREE.Mesh(coneGeom, this.pineFoliageMat);
            cone.position.y = t.y;
            cone.castShadow = true;
            tree.add(cone);

            // Snow dusting cap on tier
            const snowCapGeom = new THREE.ConeGeometry(t.r * 0.55, t.h * 0.45, 7);
            const snowCap = new THREE.Mesh(snowCapGeom, this.mountainSnowMat);
            snowCap.position.y = t.y + t.h * 0.28;
            tree.add(snowCap);
        });

        group.add(tree);
    }

    addBoulder(group, x, z) {
        const bGeom = new THREE.DodecahedronGeometry(0.9 + Math.random() * 0.7, 0);
        const boulder = new THREE.Mesh(bGeom, this.mountainRockMat);
        boulder.position.set(x, 0.6, z);
        boulder.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        boulder.castShadow = true;
        group.add(boulder);
    }

    addAlpineStreetLights(group) {
        const zOffsets = [-this.segmentLength / 4, this.segmentLength / 4];
        zOffsets.forEach(z => {
            [-this.roadWidth / 2 - 1.8, this.roadWidth / 2 + 1.8].forEach(x => {
                const poleGroup = new THREE.Group();
                poleGroup.position.set(x, 0, z);

                const poleGeom = new THREE.CylinderGeometry(0.12, 0.16, 6.0, 6);
                const pole = new THREE.Mesh(poleGeom, this.lampPoleMat);
                pole.position.y = 3.0;
                poleGroup.add(pole);

                // Lantern head
                const lanternGeom = new THREE.BoxGeometry(0.5, 0.7, 0.5);
                const lantern = new THREE.Mesh(lanternGeom, this.lampGlowMat);
                lantern.position.set(0, 6.0, 0);
                poleGroup.add(lantern);

                group.add(poleGroup);
            });
        });
    }

    addMountainStoneArch(group) {
        const arch = new THREE.Group();
        arch.position.set(0, 0, 0);

        // Stone pillars
        const pillarGeom = new THREE.BoxGeometry(1.6, 9.0, 2.0);
        const pL = new THREE.Mesh(pillarGeom, this.mountainRockMat);
        pL.position.set(-this.roadWidth / 2 - 1.5, 4.5, 0);
        arch.add(pL);

        const pR = new THREE.Mesh(pillarGeom, this.mountainRockMat);
        pR.position.set(this.roadWidth / 2 + 1.5, 4.5, 0);
        arch.add(pR);

        // Massive stone crossbeam arch
        const beamGeom = new THREE.BoxGeometry(this.roadWidth + 4.5, 1.8, 2.2);
        const beam = new THREE.Mesh(beamGeom, this.mountainRockMat);
        beam.position.set(0, 8.5, 0);
        arch.add(beam);

        // Snow dusting on top of arch
        const snowGeom = new THREE.BoxGeometry(this.roadWidth + 4.5, 0.4, 2.3);
        const snow = new THREE.Mesh(snowGeom, this.mountainSnowMat);
        snow.position.set(0, 9.5, 0);
        arch.add(snow);

        group.add(arch);
    }

    // =========================================================================
    // MAP 3: 🏜️ DESERT (GURUN CANYON / RED ROCK VALLEY)
    // =========================================================================
    buildDesertProps(group, zPos) {
        const sides = [-1, 1];

        sides.forEach(side => {
            // 1. Towering Sandstone Mesas & Buttes
            const numMesas = 1 + Math.floor(Math.random() * 2);
            for (let m = 0; m < numMesas; m++) {
                const mesaX = (this.roadWidth / 2 + 40 + m * 35 + Math.random() * 25) * side;
                const mesaZ = -this.segmentLength / 2 + (m * this.segmentLength) / numMesas;
                const width = 25 + Math.random() * 25;
                const height = 30 + Math.random() * 45;
                this.addSandstoneMesa(group, mesaX, mesaZ, width, height);
            }

            // 2. Iconic Saguaro Cacti 🌵
            const numCacti = 3 + Math.floor(Math.random() * 3);
            for (let c = 0; c < numCacti; c++) {
                const cX = (this.roadWidth / 2 + 4 + Math.random() * 22) * side;
                const cZ = -this.segmentLength / 2 + (c * this.segmentLength) / numCacti + (Math.random() * 4 - 2);
                this.addSaguaroCactus(group, cX, cZ);
            }

            // 3. Desert red boulders & rock outcroppings
            if (Math.random() > 0.4) {
                const rX = (this.roadWidth / 2 + 2.5 + Math.random() * 4) * side;
                const rZ = (Math.random() - 0.5) * (this.segmentLength * 0.8);
                const rGeom = new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8, 0);
                const rock = new THREE.Mesh(rGeom, this.desertMesaMat);
                rock.position.set(rX, 0.7, rZ);
                rock.castShadow = true;
                group.add(rock);
            }
        });

        // 4. Weathered Route 66 Desert Gantry
        if (Math.abs(zPos) % (this.segmentLength * 3) === 0 && zPos > 0) {
            this.addDesertGantry(group);
        }
    }

    addSandstoneMesa(group, x, z, width, height) {
        const mesa = new THREE.Group();
        mesa.position.set(x, 0, z);

        // Layered stepped sandstone blocks
        const layer1Geom = new THREE.CylinderGeometry(width * 0.85, width, height * 0.6, 8);
        const l1 = new THREE.Mesh(layer1Geom, this.desertMesaMat);
        l1.position.y = height * 0.3;
        l1.castShadow = true;
        mesa.add(l1);

        const layer2Geom = new THREE.CylinderGeometry(width * 0.7, width * 0.82, height * 0.4, 8);
        const l2 = new THREE.Mesh(layer2Geom, this.desertMesaMat);
        l2.position.y = height * 0.8;
        l2.castShadow = true;
        mesa.add(l2);

        group.add(mesa);
    }

    addSaguaroCactus(group, x, z) {
        const cactus = new THREE.Group();
        cactus.position.set(x, 0, z);
        const height = 5.5 + Math.random() * 3.5;

        // Main ribbed trunk
        const trunkGeom = new THREE.CylinderGeometry(0.45, 0.5, height, 8);
        const trunk = new THREE.Mesh(trunkGeom, this.cactusMat);
        trunk.position.y = height / 2;
        trunk.castShadow = true;
        cactus.add(trunk);

        // Rounded top
        const capGeom = new THREE.SphereGeometry(0.45, 8, 6);
        const cap = new THREE.Mesh(capGeom, this.cactusMat);
        cap.position.y = height;
        cactus.add(cap);

        // Left curved arm
        const armH1 = height * 0.55;
        const armLHoriz = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.2, 7), this.cactusMat);
        armLHoriz.rotation.z = Math.PI / 2;
        armLHoriz.position.set(-0.8, armH1, 0);
        cactus.add(armLHoriz);

        const armLVert = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.8, 7), this.cactusMat);
        armLVert.position.set(-1.4, armH1 + 0.8, 0);
        armLVert.castShadow = true;
        cactus.add(armLVert);

        // Right curved arm at different height
        const armH2 = height * 0.7;
        const armRHoriz = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.1, 7), this.cactusMat);
        armRHoriz.rotation.z = -Math.PI / 2;
        armRHoriz.position.set(0.75, armH2, 0);
        cactus.add(armRHoriz);

        const armRVert = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 7), this.cactusMat);
        armRVert.position.set(1.3, armH2 + 0.7, 0);
        armRVert.castShadow = true;
        cactus.add(armRVert);

        group.add(cactus);
    }

    addDesertGantry(group) {
        const gantry = new THREE.Group();
        gantry.position.set(0, 0, 0);

        // Weathered steel posts
        const postGeom = new THREE.BoxGeometry(0.6, 8.5, 0.6);
        const pL = new THREE.Mesh(postGeom, this.guardrailMat);
        pL.position.set(-this.roadWidth / 2 - 1.2, 4.25, 0);
        gantry.add(pL);

        const pR = new THREE.Mesh(postGeom, this.guardrailMat);
        pR.position.set(this.roadWidth / 2 + 1.2, 4.25, 0);
        gantry.add(pR);

        // Truss
        const trussGeom = new THREE.BoxGeometry(this.roadWidth + 3, 0.8, 0.8);
        const truss = new THREE.Mesh(trussGeom, this.guardrailMat);
        truss.position.set(0, 8.0, 0);
        gantry.add(truss);

        // Route 66 Billboard Sign
        const signGeom = new THREE.BoxGeometry(this.roadWidth * 0.65, 2.0, 0.2);
        const signMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(0, 7.5, 0);
        gantry.add(sign);

        group.add(gantry);
    }

    // =========================================================================
    // MAP 4: 🌸 SAKURA (LEMBAH SAKURA / KYOTO BLOSSOM)
    // =========================================================================
    buildSakuraProps(group, zPos) {
        const sides = [-1, 1];

        sides.forEach(side => {
            // 1. Blooming Cherry Blossom Trees 🌸
            const numTrees = 5 + Math.floor(Math.random() * 3);
            for (let t = 0; t < numTrees; t++) {
                const treeX = (this.roadWidth / 2 + 3.5 + Math.random() * 22) * side;
                const treeZ = -this.segmentLength / 2 + (t * this.segmentLength) / numTrees + (Math.random() * 4 - 2);
                this.addSakuraTree(group, treeX, treeZ);
            }

            // 2. Traditional Stone Lanterns (Tōrō) along roadside
            const numLanterns = 2;
            for (let l = 0; l < numLanterns; l++) {
                const lanternX = (this.roadWidth / 2 + 1.8) * side;
                const lanternZ = -this.segmentLength / 4 + l * (this.segmentLength / 2);
                this.addStoneLantern(group, lanternX, lanternZ);
            }
        });

        // 3. Traditional Vermilion Torii Gate ⛩️ every 3 segments
        if (Math.abs(zPos) % (this.segmentLength * 3) === 0 && zPos > 0) {
            this.addToriiGate(group);
        }
    }

    addSakuraTree(group, x, z) {
        const tree = new THREE.Group();
        tree.position.set(x, 0, z);

        // Dark gnarled trunk
        const trunkGeom = new THREE.CylinderGeometry(0.3, 0.45, 3.8, 7);
        const trunk = new THREE.Mesh(trunkGeom, this.sakuraWoodMat);
        trunk.position.y = 1.9;
        trunk.castShadow = true;
        tree.add(trunk);

        // Fluffy clouds of pink blossoms
        const crownClusters = [
            { x: 0, y: 4.2, z: 0, r: 2.2 },
            { x: -1.2, y: 3.8, z: 0.6, r: 1.6 },
            { x: 1.2, y: 3.9, z: -0.5, r: 1.7 },
            { x: 0.4, y: 4.9, z: 0.3, r: 1.5 }
        ];

        crownClusters.forEach(c => {
            const bGeom = new THREE.DodecahedronGeometry(c.r, 1);
            const blossom = new THREE.Mesh(bGeom, this.sakuraBlossomMat);
            blossom.position.set(c.x, c.y, c.z);
            blossom.castShadow = true;
            tree.add(blossom);
        });

        group.add(tree);
    }

    addStoneLantern(group, x, z) {
        const lantern = new THREE.Group();
        lantern.position.set(x, 0, z);

        // Base pedestal
        const baseGeom = new THREE.BoxGeometry(0.8, 0.4, 0.8);
        const base = new THREE.Mesh(baseGeom, this.stoneLanternMat);
        base.position.y = 0.2;
        lantern.add(base);

        // Pillar
        const postGeom = new THREE.CylinderGeometry(0.18, 0.22, 1.2, 6);
        const post = new THREE.Mesh(postGeom, this.stoneLanternMat);
        post.position.y = 1.0;
        lantern.add(post);

        // Glowing light chamber
        const chamberGeom = new THREE.BoxGeometry(0.6, 0.5, 0.6);
        const chamberMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const chamber = new THREE.Mesh(chamberGeom, chamberMat);
        chamber.position.y = 1.7;
        lantern.add(chamber);

        // Pagoda style stone roof
        const roofGeom = new THREE.ConeGeometry(0.85, 0.45, 4);
        roofGeom.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeom, this.stoneLanternMat);
        roof.position.y = 2.15;
        lantern.add(roof);

        group.add(lantern);
    }

    addToriiGate(group) {
        const torii = new THREE.Group();
        torii.position.set(0, 0, 0);

        // Twin vermilion pillars (Hashira)
        const pillarGeom = new THREE.CylinderGeometry(0.45, 0.55, 9.5, 8);
        const pL = new THREE.Mesh(pillarGeom, this.toriiRedMat);
        pL.position.set(-this.roadWidth / 2 - 1.8, 4.75, 0);
        pL.castShadow = true;
        torii.add(pL);

        const pR = new THREE.Mesh(pillarGeom, this.toriiRedMat);
        pR.position.set(this.roadWidth / 2 + 1.8, 4.75, 0);
        pR.castShadow = true;
        torii.add(pR);

        // Lower straight tie beam (Nuki)
        const nukiGeom = new THREE.BoxGeometry(this.roadWidth + 4.5, 0.5, 0.6);
        const nuki = new THREE.Mesh(nukiGeom, this.toriiRedMat);
        nuki.position.set(0, 7.5, 0);
        torii.add(nuki);

        // Curved upper lintel beam (Kasagi) with black cap
        const kasagiGeom = new THREE.BoxGeometry(this.roadWidth + 6.0, 0.8, 0.9);
        const kasagiMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
        const kasagi = new THREE.Mesh(kasagiGeom, kasagiMat);
        kasagi.position.set(0, 9.2, 0);
        torii.add(kasagi);

        // Central plaque (Gakuzuka)
        const plaqueGeom = new THREE.BoxGeometry(1.2, 1.3, 0.2);
        const plaqueMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const plaque = new THREE.Mesh(plaqueGeom, plaqueMat);
        plaque.position.set(0, 8.35, 0.4);
        torii.add(plaque);

        group.add(torii);
    }

    // =========================================================================
    // MAP 5: 🌃 CYBERPUNK (KOTA CYBERPUNK)
    // =========================================================================
    buildCyberpunkProps(group, zPos) {
        this.addStreetLights(group);
        this.addBuildings(group);
        if (Math.abs(zPos) % (this.segmentLength * 3) === 0 && zPos > 0) {
            this.addOverheadGantry(group);
        }
    }

    // =========================================================================
    // MAP 6: 🌇 SUNSET (NEON SUNSET DRIVE)
    // =========================================================================
    buildSunsetProps(group, zPos) {
        this.addStreetLights(group);
        this.addBuildings(group);
        if (Math.abs(zPos) % (this.segmentLength * 3) === 0 && zPos > 0) {
            this.addOverheadGantry(group);
        }
    }

    // Standard Cyberpunk / City Props
    addStreetLights(group) {
        const zOffsets = [-this.segmentLength / 4, this.segmentLength / 4];
        zOffsets.forEach(z => {
            [-this.roadWidth / 2 - 1.8, this.roadWidth / 2 + 1.8].forEach((x, idx) => {
                const poleGroup = new THREE.Group();
                poleGroup.position.set(x, 0, z);

                const poleGeom = new THREE.CylinderGeometry(0.12, 0.18, 7.5, 8);
                const pole = new THREE.Mesh(poleGeom, this.lampPoleMat);
                pole.position.y = 3.75;
                poleGroup.add(pole);

                const armGeom = new THREE.BoxGeometry(2.4, 0.1, 0.1);
                const arm = new THREE.Mesh(armGeom, this.lampPoleMat);
                arm.position.set(idx === 0 ? 1.0 : -1.0, 7.4, 0);
                poleGroup.add(arm);

                const lampGeom = new THREE.BoxGeometry(0.8, 0.15, 0.35);
                const lamp = new THREE.Mesh(lampGeom, this.lampGlowMat);
                lamp.position.set(idx === 0 ? 2.0 : -2.0, 7.3, 0);
                poleGroup.add(lamp);

                group.add(poleGroup);
            });
        });
    }

    addBuildings(group) {
        const theme = this.themes[this.currentTheme] || this.themes.cyberpunk;
        const palettes = theme.buildingPalettes || [0x00f3ff, 0xff007f, 0x7928ca, 0x00ff88, 0xffbe0b];

        const sides = [-1, 1];
        sides.forEach(side => {
            const numBld = 4 + Math.floor(Math.random() * 3);
            for (let b = 0; b < numBld; b++) {
                const bZ = -this.segmentLength / 2 + (b * this.segmentLength) / numBld + (Math.random() * 4 - 2);
                const distanceX = (this.roadWidth / 2 + 8 + Math.random() * 65) * side;

                const width = 8 + Math.random() * 16;
                const depth = 8 + Math.random() * 16;
                const height = 25 + Math.random() * 75;

                const bGeom = new THREE.BoxGeometry(width, height, depth);
                const baseColor = new THREE.Color(0x0a0c16);
                const bMat = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    roughness: 0.7,
                    metalness: 0.3
                });

                const building = new THREE.Mesh(bGeom, bMat);
                building.position.set(distanceX, height / 2, bZ);
                building.castShadow = true;
                building.receiveShadow = true;
                group.add(building);

                // Neon window stripe or rooftop crown
                if (Math.random() > 0.3) {
                    const neonColor = palettes[Math.floor(Math.random() * palettes.length)];
                    const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });

                    if (Math.random() > 0.5) {
                        const stripGeom = new THREE.BoxGeometry(0.4, height * 0.9, 0.4);
                        const strip = new THREE.Mesh(stripGeom, neonMat);
                        strip.position.set(distanceX - (width / 2 * side), height * 0.5, bZ + depth / 2 - 0.2);
                        group.add(strip);
                    } else {
                        const crownGeom = new THREE.BoxGeometry(width * 0.85, 1.2, depth * 0.85);
                        const crown = new THREE.Mesh(crownGeom, neonMat);
                        crown.position.set(distanceX, height + 0.6, bZ);
                        group.add(crown);
                    }
                }
            }
        });
    }

    addOverheadGantry(group) {
        const gantry = new THREE.Group();
        gantry.position.set(0, 0, 0);

        const pillarGeom = new THREE.BoxGeometry(0.6, 8.5, 0.6);
        const pillarL = new THREE.Mesh(pillarGeom, this.lampPoleMat);
        pillarL.position.set(-this.roadWidth / 2 - 1.2, 4.25, 0);
        gantry.add(pillarL);

        const pillarR = new THREE.Mesh(pillarGeom, this.lampPoleMat);
        pillarR.position.set(this.roadWidth / 2 + 1.2, 4.25, 0);
        gantry.add(pillarR);

        const trussGeom = new THREE.BoxGeometry(this.roadWidth + 3, 0.8, 0.8);
        const truss = new THREE.Mesh(trussGeom, this.lampPoleMat);
        truss.position.set(0, 8.0, 0);
        gantry.add(truss);

        const signGeom = new THREE.BoxGeometry(this.roadWidth * 0.7, 2.2, 0.3);
        const signMat = new THREE.MeshBasicMaterial({ color: 0x050510 });
        const sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(0, 7.5, 0);
        gantry.add(sign);

        const frameGeom = new THREE.BoxGeometry(this.roadWidth * 0.68, 0.1, 0.35);
        const frameMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
        const frameTop = new THREE.Mesh(frameGeom, frameMat);
        frameTop.position.set(0, 8.5, 0);
        gantry.add(frameTop);

        const frameBottom = new THREE.Mesh(frameGeom, frameMat);
        frameBottom.position.set(0, 6.5, 0);
        gantry.add(frameBottom);

        group.add(gantry);
    }

    /**
     * Seamlessly recycle road segments ahead of player and animate environment
     */
    update(playerZ, delta = 0.016) {
        this.animTime += delta;

        // Animate ocean water ripples/oscillation on Beach map
        if (this.currentTheme === 'beach' || this.currentTheme === 'daylight') {
            const waveY = -0.3 + Math.sin(this.animTime * 2.0) * 0.08;
            for (let i = 0; i < this.animatableWater.length; i++) {
                this.animatableWater[i].position.y = waveY;
            }
        }

        // Keep the sun light positioned near the player for consistent shadow mapping
        if (this.sunLight) {
            this.sunLight.position.z = playerZ + 50;
            this.sunLight.target.position.z = playerZ;
            this.sunLight.target.updateMatrixWorld();
        }

        // Safety Resync Guard: If player restarted or position jumped outside visible segments
        let minZ = Infinity;
        let maxZ = -Infinity;
        for (let j = 0; j < this.roadSegments.length; j++) {
            const z = this.roadSegments[j].position.z;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }

        if (playerZ < minZ || playerZ > maxZ - this.segmentLength) {
            this.reset(playerZ);
            return;
        }

        // Loop through segments and check if any are far behind the player
        for (let i = 0; i < this.roadSegments.length; i++) {
            const seg = this.roadSegments[i];
            // If segment is more than 1.5 segments behind player, move it to the front
            if (seg.position.z < playerZ - this.segmentLength * 1.5) {
                let currentMaxZ = -Infinity;
                for (let j = 0; j < this.roadSegments.length; j++) {
                    if (this.roadSegments[j].position.z > currentMaxZ) {
                        currentMaxZ = this.roadSegments[j].position.z;
                    }
                }
                seg.position.z = currentMaxZ + this.segmentLength;
            }
        }
    }

    /**
     * Reset all road segments starting seamlessly around player
     */
    reset(startZ = 0) {
        for (let i = 0; i < this.roadSegments.length; i++) {
            this.roadSegments[i].position.z = startZ - this.segmentLength + i * this.segmentLength;
        }
        if (this.sunLight) {
            this.sunLight.position.z = startZ + 50;
            this.sunLight.target.position.z = startZ;
            this.sunLight.target.updateMatrixWorld();
        }
    }

    /**
     * Switch scenery theme & refresh all segment props immediately
     */
    setTheme(themeName) {
        if (!this.themes[themeName]) return;
        this.currentTheme = themeName;
        const theme = this.themes[themeName];

        // 1. Update Sky and Fog
        this.scene.background.setHex(theme.skyColor);
        this.scene.fog.color.setHex(theme.fogColor);
        this.scene.fog.near = theme.fogNear;
        this.scene.fog.far = theme.fogFar;

        // 2. Update Lights
        this.ambientLight.color.setHex(theme.ambientColor);
        this.ambientLight.intensity = theme.ambientIntensity;

        this.sunLight.color.setHex(theme.sunColor);
        this.sunLight.intensity = theme.sunIntensity;

        if (this.hemiLight) {
            this.hemiLight.color.setHex(theme.hemiSkyColor);
            this.hemiLight.groundColor.setHex(theme.hemiGroundColor);
            this.hemiLight.intensity = theme.hemiIntensity;
        }

        // 3. Update Road & Material Colors
        this.asphaltMat.color.setHex(theme.asphaltColor);
        this.roadLineMat.color.setHex(theme.roadLinesColor);
        this.yellowLineMat.color.setHex(theme.yellowLineColor || 0xf59e0b);
        this.curbMat.color.setHex(theme.curbColor || 0x3f3f46);
        this.guardrailMat.color.setHex(theme.guardrailColor || 0x94a3b8);
        this.groundMat.color.setHex(theme.groundColor || 0x0e0c1a);
        this.lampPoleMat.color.setHex(theme.lampPoleColor || 0x475569);
        this.lampGlowMat.color.setHex(theme.lampGlowColor || 0x38bdf8);

        // 4. Rebuild Scenery Props for all existing road segments
        this.animatableWater = [];
        this.roadSegments.forEach(seg => {
            if (seg.userData && seg.userData.propsGroup) {
                // Remove all existing props in this segment
                while (seg.userData.propsGroup.children.length > 0) {
                    const obj = seg.userData.propsGroup.children[0];
                    seg.userData.propsGroup.remove(obj);
                }
                // Build fresh scenery props for this theme
                this.buildSegmentProps(seg.userData.propsGroup, seg.position.z);
            }
        });
    }
}
