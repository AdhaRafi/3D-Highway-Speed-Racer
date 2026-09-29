/**
 * Effects.js
 * Particle systems for speed lines, exhaust nitro flame, tire smoke,
 * crash explosions, and camera shake.
 */

import * as THREE from 'three';

export class EffectsManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.particles = [];
        this.speedLines = null;
        this.cameraShakeIntensity = 0;
        this.particleMultiplier = 1.0; // Controlled by SettingsManager

        // Pre-allocated reusable assets for backfire flames & smoke (Zero Garbage Collection)
        this.backfireConeGeom = new THREE.ConeGeometry(0.18, 0.85, 6);
        this.backfireConeGeom.rotateX(-Math.PI / 2);
        this.blueFlameMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff, transparent: true, opacity: 0.95 });
        this.orangeFlameMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.95 });
        this.backfireSmokeGeom = new THREE.SphereGeometry(0.18, 5, 5);
        this.backfireSmokeMat = new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.45 });

        this.initSpeedLines();
    }

    initSpeedLines() {
        const count = 120;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 6); // 2 vertices per line segment

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 6 + Math.random() * 14;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius + 2;
            const z = Math.random() * 40 - 20;

            const idx = i * 6;
            positions[idx] = x;
            positions[idx + 1] = y;
            positions[idx + 2] = z;

            // Tail
            positions[idx + 3] = x;
            positions[idx + 4] = y;
            positions[idx + 5] = z - 6.0;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.LineBasicMaterial({
            color: 0x00f7ff,
            transparent: true,
            opacity: 0,
            linewidth: 2
        });

        this.speedLines = new THREE.LineSegments(geom, mat);
        this.scene.add(this.speedLines);
    }

    triggerCrashExplosion(position) {
        // Spawn fiery debris particles (scaled by quality setting)
        const count = Math.round(40 * this.particleMultiplier);
        const colors = [0xff4500, 0xffa500, 0xffffff, 0x333333];

        for (let i = 0; i < count; i++) {
            const size = 0.2 + Math.random() * 0.4;
            const geom = new THREE.BoxGeometry(size, size, size);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const mat = new THREE.MeshBasicMaterial({ color });
            const mesh = new THREE.Mesh(geom, mat);

            mesh.position.copy(position);
            mesh.position.y += 0.5;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 18,
                Math.random() * 14 + 5,
                (Math.random() - 0.5) * 18
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                gravity: 28,
                life: 1.0,
                decay: 1.0 + Math.random() * 0.8
            });
        }

        // Heavy camera shake
        this.addCameraShake(0.8);
    }

    spawnTireSmoke(position, side) {
        const geom = new THREE.SphereGeometry(0.25, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.6
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(position);
        mesh.position.x += side * 0.9;
        mesh.position.y = 0.15;
        mesh.position.z -= 1.8;

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 1.5 + 0.5,
            -Math.random() * 4 - 2
        );

        this.scene.add(mesh);
        this.particles.push({
            mesh,
            velocity,
            gravity: -1.0, // Rises slightly
            life: 0.4,
            decay: 1.5
        });
    }

    spawnSparks(position, count = 8) {
        const colors = [0xffe600, 0xff9900, 0xffffff];
        for (let i = 0; i < count; i++) {
            const sparkGeom = new THREE.BoxGeometry(0.08, 0.08, 0.25);
            const sparkMat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)]
            });
            const spark = new THREE.Mesh(sparkGeom, sparkMat);
            spark.position.copy(position);
            spark.position.y += 0.1;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 14,
                Math.random() * 5 + 1,
                (Math.random() - 0.5) * 14
            );

            this.scene.add(spark);
            this.particles.push({
                mesh: spark,
                velocity,
                gravity: 22,
                life: 0.4,
                decay: 2.0
            });
        }
    }

    spawnBackfirePop(position) {
        if (!position) return;
        // Dual exhaust anti-lag flame bursts (Cyan & Orange)
        [-0.4, 0.4].forEach((side) => {
            const isBlue = Math.random() > 0.35;
            const flameMat = isBlue ? this.blueFlameMat : this.orangeFlameMat;
            const flame = new THREE.Mesh(this.backfireConeGeom, flameMat);
            flame.position.set(position.x + side, position.y + 0.32, position.z - 2.5);

            this.scene.add(flame);
            this.particles.push({
                mesh: flame,
                isShared: true,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 1.0,
                    -14
                ),
                gravity: 0,
                life: 0.12,
                decay: 2.8
            });

            // Backfire smoke burst
            const smoke = new THREE.Mesh(this.backfireSmokeGeom, this.backfireSmokeMat);
            smoke.position.set(position.x + side, position.y + 0.32, position.z - 2.7);
            this.scene.add(smoke);
            this.particles.push({
                mesh: smoke,
                isShared: true,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 1.5 + 0.5,
                    -6
                ),
                gravity: -1.0,
                life: 0.25,
                decay: 1.8
            });
        });

        this.addCameraShake(0.08);
    }

    addCameraShake(amount) {
        this.cameraShakeIntensity = Math.min(this.cameraShakeIntensity + amount, 1.2);
    }

    update(delta, playerCar, isBoosting, speedRatio) {
        // 1. Update Speed Lines visibility & position around camera
        if (this.speedLines) {
            this.speedLines.position.copy(this.camera.position);
            const targetOpacity = isBoosting ? 0.75 : (speedRatio > 0.8 ? (speedRatio - 0.8) * 2.0 : 0);
            this.speedLines.material.opacity += (targetOpacity - this.speedLines.material.opacity) * 10 * delta;
        }

        // 2. Nitro Flames animation
        if (playerCar && playerCar.userData.flames) {
            const [fL, fR] = playerCar.userData.flames;
            if (isBoosting) {
                fL.visible = true;
                fR.visible = true;
                const scale = 0.8 + Math.random() * 0.5;
                fL.scale.set(scale, scale * 1.2, scale);
                fR.scale.set(scale, scale * 1.2, scale);
            } else {
                fL.visible = false;
                fR.visible = false;
            }
        }

        // 3. Update Particles (Debris & Smoke)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay * delta;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                if (!p.isShared) {
                    if (p.mesh.geometry) p.mesh.geometry.dispose();
                    if (p.mesh.material) p.mesh.material.dispose();
                }
                this.particles.splice(i, 1);
                continue;
            }

            p.velocity.y -= p.gravity * delta;
            p.mesh.position.addScaledVector(p.velocity, delta);

            if (p.mesh.material.opacity !== undefined) {
                p.mesh.material.opacity = p.life;
            }
            p.mesh.scale.multiplyScalar(1.0 + delta * 0.8);
        }

        // 4. Camera Shake Decay
        if (this.cameraShakeIntensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
            this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
        }
    }

    clear() {
        for (let i = 0; i < this.particles.length; i++) {
            this.scene.remove(this.particles[i].mesh);
        }
        this.particles = [];
        this.cameraShakeIntensity = 0;
    }
}
