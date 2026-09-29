/**
 * Collectibles.js
 * 3D Collectible Items: Golden Coins, Nitro Refills, Shield Orbs, and Coin Magnets.
 * Features rotating animations, hover bobbing, and magnetic attraction.
 */

import * as THREE from 'three';

export class CollectiblesManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;

        this.items = [];
        this.maxItems = 48; // Increased from 16 to 48 for rich, continuous item stream

        // Shared geometries & materials
        this.coinGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16);
        this.coinGeom.rotateX(Math.PI / 2);
        this.coinMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.85,
            roughness: 0.25,
            emissive: 0xffa500,
            emissiveIntensity: 0.35
        });

        // Nitro canister geometry
        this.nitroGeom = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 12);
        this.nitroMat = new THREE.MeshStandardMaterial({
            color: 0x00f7ff,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.7
        });

        // Shield orb geometry
        this.shieldGeom = new THREE.IcosahedronGeometry(0.65, 2);
        this.shieldMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            wireframe: true,
            emissive: 0x0284c7,
            emissiveIntensity: 0.7
        });

        // Magnet geometry
        this.magnetGeom = new THREE.TorusGeometry(0.5, 0.16, 8, 16);
        this.magnetMat = new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            metalness: 0.6,
            roughness: 0.3,
            emissive: 0xe11d48,
            emissiveIntensity: 0.5
        });
    }

    init(startZ = 40) {
        this.clear();
        let currentZ = startZ + 35;

        // Spawn initial fleet of 48 collectibles with continuous patterns (coin chains + nitro bottles)
        for (let i = 0; i < this.maxItems; i++) {
            currentZ += 8 + Math.random() * 10;
            this.spawnItem(currentZ);
        }
    }

    getItemConfig(type) {
        switch (type) {
            case 'nitro':
                return { geom: this.nitroGeom, mat: this.nitroMat };
            case 'shield':
                return { geom: this.shieldGeom, mat: this.shieldMat };
            case 'magnet':
                return { geom: this.magnetGeom, mat: this.magnetMat };
            default:
                return { geom: this.coinGeom, mat: this.coinMat };
        }
    }

    spawnItem(zPos) {
        const rand = Math.random();
        let type = 'coin';
        if (rand < 0.68) {
            type = 'coin';
        } else if (rand < 0.88) {
            type = 'nitro'; // frequent nitro bottles so players can keep boosting
        } else if (rand < 0.94) {
            type = 'shield';
        } else {
            type = 'magnet';
        }

        const config = this.getItemConfig(type);
        const mesh = new THREE.Mesh(config.geom, config.mat);
        mesh.castShadow = true;

        const laneIndex = Math.floor(Math.random() * this.world.laneCenters.length);
        const laneX = this.world.laneCenters[laneIndex];

        mesh.position.set(laneX, 1.0, zPos);
        mesh.userData = {
            type,
            baseY: 1.0,
            bobOffset: Math.random() * Math.PI * 2,
            collected: false
        };

        this.scene.add(mesh);
        this.items.push(mesh);
    }

    update(delta, time, playerPos, hasMagnet, onCollect) {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];

            // Rotation & Hover bobbing
            item.rotation.y += 2.8 * delta;
            item.position.y = item.userData.baseY + Math.sin(time * 3.5 + item.userData.bobOffset) * 0.18;

            // Magnetic attraction for coins
            if (hasMagnet && item.userData.type === 'coin') {
                const distToPlayer = item.position.distanceTo(playerPos);
                if (distToPlayer < 22.0) {
                    const dir = new THREE.Vector3().subVectors(playerPos, item.position).normalize();
                    item.position.addScaledVector(dir, 28 * delta);
                }
            }

            // Accurate 3D Pickup detection (checks width, height & depth)
            const dx = Math.abs(item.position.x - playerPos.x);
            const dy = Math.abs(item.position.y - playerPos.y);
            const dz = Math.abs(item.position.z - playerPos.z);

            if (dx < 1.4 && dy < 2.0 && dz < 2.4) {
                // Item collected!
                if (onCollect) {
                    onCollect(item.userData.type, item.position);
                }
                // IMMEDIATELY recycle item to the front of the highway so it never disappears!
                this.recycleItem(item, playerPos.z);
                continue;
            }

            // Recycle items that fall behind player
            if (item.position.z < playerPos.z - 25) {
                this.recycleItem(item, playerPos.z);
            }
        }
    }

    recycleItem(item, playerZ) {
        // Find furthest item currently in front of player
        let maxZ = playerZ + 70;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].position.z > maxZ) {
                maxZ = this.items[i].position.z;
            }
        }

        // Randomize next item type to keep a healthy, balanced stream of coins & nitro
        const rand = Math.random();
        let newType = 'coin';
        if (rand < 0.68) {
            newType = 'coin';
        } else if (rand < 0.88) {
            newType = 'nitro';
        } else if (rand < 0.94) {
            newType = 'shield';
        } else {
            newType = 'magnet';
        }

        const config = this.getItemConfig(newType);
        item.geometry = config.geom;
        item.material = config.mat;
        item.userData.type = newType;
        item.userData.collected = false;

        // Position ahead in a random lane
        const newZ = maxZ + 9 + Math.random() * 12;
        const laneIndex = Math.floor(Math.random() * this.world.laneCenters.length);
        const laneX = this.world.laneCenters[laneIndex];

        item.position.set(laneX, 1.0, newZ);
        item.visible = true;

        if (!item.parent) {
            this.scene.add(item);
        }
    }

    clear() {
        for (let i = 0; i < this.items.length; i++) {
            this.scene.remove(this.items[i]);
        }
        this.items = [];
    }
}
