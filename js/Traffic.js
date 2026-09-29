/**
 * Traffic.js
 * AI Traffic Manager with multi-lane distribution, speed variations,
 * safe spawning, near-miss detection, and accurate collision bounding boxes.
 */

import * as THREE from 'three';

export class TrafficManager {
    constructor(scene, carFactory, world) {
        this.scene = scene;
        this.carFactory = carFactory;
        this.world = world;

        this.trafficCars = [];
        this.maxTraffic = 9;
        this.vehicleTypes = ['ramp_truck', 'sedan', 'sport', 'ramp_truck', 'suv', 'truck'];

        this.playerBox = new THREE.Box3();
        this.trafficBox = new THREE.Box3();

        // Near-miss callback
        this.onNearMiss = null;
    }

    init(startZ = 60) {
        // Clear any existing cars
        this.clear();

        // Guaranteed ramp truck 75m ahead in center-left lane for immediate launch action!
        this.spawnCar(startZ + 75, 'ramp_truck', 1);

        // Spawn rest of initial fleet with wide comfortable spacing
        for (let i = 1; i < this.maxTraffic; i++) {
            const z = startZ + 75 + i * 55 + (Math.random() * 14 - 7);
            this.spawnCar(z);
        }
    }

    spawnCar(zPos, forcedType = null, forcedLane = null) {
        const type = forcedType || this.vehicleTypes[Math.floor(Math.random() * this.vehicleTypes.length)];
        const car = this.carFactory.createTrafficCar(type);

        // Pick lane
        const laneIndex = (forcedLane !== null && forcedLane !== undefined)
            ? forcedLane
            : Math.floor(Math.random() * this.world.laneCenters.length);
        const laneX = this.world.laneCenters[laneIndex];

        // Smooth cruising speed for AI traffic
        const baseSpeed = 18 + laneIndex * 2.5 + Math.random() * 5;
        car.userData.speed = baseSpeed;
        car.userData.targetSpeed = baseSpeed;
        car.userData.lane = laneIndex;
        car.userData.hasNearMissed = false;
        car.userData.hasLaunched = false;

        car.position.set(laneX, 0, zPos);
        this.scene.add(car);
        this.trafficCars.push(car);
    }

    update(delta, playerZ, playerSpeed, playerCar) {
        // Physical player bounding box taking vertical height (jump) into account
        const px = playerCar.position.x;
        const py = playerCar.position.y || 0;
        const pz = playerCar.position.z;
        const playerHalfW = 0.82; // Tight, fair lateral margin
        const playerHalfL = 1.85; // Tight, fair longitudinal margin

        this.playerBox.min.set(px - playerHalfW, py + 0.1, pz - playerHalfL);
        this.playerBox.max.set(px + playerHalfW, py + 1.4, pz + playerHalfL);

        let collision = null;

        for (let i = 0; i < this.trafficCars.length; i++) {
            const car = this.trafficCars[i];

            // Move car forward along positive Z
            car.position.z += car.userData.speed * delta;

            // Spin wheels
            const wheelSpeed = (car.userData.speed * delta) / 0.35;
            for (let w = 0; w < car.userData.wheels.length; w++) {
                car.userData.wheels[w].rotation.x += wheelSpeed;
            }

            const cx = car.position.x;
            const cz = car.position.z;

            // RAMP TRUCK INTERACTION: Only when driving straight up from rear corridor!
            if (car.userData.isRamp) {
                const dx = Math.abs(px - cx);
                const dz = pz - cz; // dz < 0 means player is behind truck center

                if (!car.userData.hasLaunched && py <= 1.2) {
                    // Strict ramp center runway (dx < 0.72) approaching from rear touchdown
                    if (dx < 0.72 && dz >= -5.8 && dz <= 1.8) {
                        const rampProgress = THREE.MathUtils.clamp((dz - (-5.8)) / 7.2, 0, 1);
                        return {
                            ramp: {
                                car,
                                progress: rampProgress
                            }
                        };
                    }
                }
            }

            // Accurate physical dimensions for traffic types
            const type = car.userData.type || 'sedan';
            let tHalfW = 0.85;
            let tHalfL = 1.85;
            let tHeight = 1.4;

            if (type === 'truck' || type === 'ramp_truck') {
                tHalfW = 1.08;
                tHalfL = 3.8;
                tHeight = 2.4;
            } else if (type === 'suv') {
                tHalfW = 0.95;
                tHalfL = 2.0;
                tHeight = 1.6;
            }

            this.trafficBox.min.set(cx - tHalfW, 0.1, cz - tHalfL);
            this.trafficBox.max.set(cx + tHalfW, tHeight, cz + tHalfL);

            if (this.playerBox.intersectsBox(this.trafficBox)) {
                // If player is flying in the air above vehicle height, soar right over!
                if (py < tHeight - 0.2) {
                    collision = car;
                    break; // CRITICAL: Stop immediately so collision is the exact car hit!
                }
            }

            // Near-Miss detection
            // Player is overtaking fast, lateral distance < 2.5m, longitudinal overlap
            if (!car.userData.hasNearMissed && !collision) {
                const dz = Math.abs(pz - cz);
                const dx = Math.abs(px - cx);

                if (dz < 2.6 && dx > 0.9 && dx < 2.6 && playerSpeed > car.userData.speed + 6) {
                    car.userData.hasNearMissed = true;
                    if (this.onNearMiss) {
                        this.onNearMiss(car, dx);
                    }
                }
            }

            // Recycle cars that fall far behind player
            if (car.position.z < playerZ - 35) {
                this.recycleCar(car, playerZ);
            }
        }

        if (collision) {
            return { collision };
        }
        return null;
    }

    recycleCar(car, playerZ) {
        // Find furthest car ahead
        let maxZ = playerZ + 80;
        for (let i = 0; i < this.trafficCars.length; i++) {
            if (this.trafficCars[i].position.z > maxZ) {
                maxZ = this.trafficCars[i].position.z;
            }
        }

        // Reposition ahead with wide comfortable gap
        const newZ = maxZ + 55 + Math.random() * 30;
        const laneIndex = Math.floor(Math.random() * this.world.laneCenters.length);
        const laneX = this.world.laneCenters[laneIndex];

        car.position.set(laneX, 0, newZ);
        car.userData.lane = laneIndex;
        car.userData.speed = 18 + laneIndex * 2.5 + Math.random() * 5;
        car.userData.hasNearMissed = false;
        car.userData.hasLaunched = false;
    }

    clear() {
        for (let i = 0; i < this.trafficCars.length; i++) {
            this.scene.remove(this.trafficCars[i]);
        }
        this.trafficCars = [];
    }
}
