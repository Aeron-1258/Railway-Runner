import * as THREE from 'three';

export class TrackManager {
    private scene: THREE.Scene;
    private segments: THREE.Group[] = [];
    private obstacles: THREE.Mesh[] = [];
    private segmentLength: number = 20;
    private numSegments: number = 10;
    private trackWidth: number = 10;
    private laneWidth: number = 3;
    private currentSpeed: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initTrack();
    }

    private initTrack() {
        for (let i = 0; i < this.numSegments; i++) {
            this.createSegment(i * -this.segmentLength);
        }
    }

    private createSegment(z: number) {
        const segment = new THREE.Group();

        // Gravel Ground - Industrial/Railway look
        const groundGeom = new THREE.PlaneGeometry(30, this.segmentLength);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x5d4037, // Brownish gravel
            roughness: 1.0,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        segment.add(ground);

        // Sleepers (Wooden planks)
        const sleeperGeom = new THREE.BoxGeometry(this.trackWidth, 0.15, 0.6);
        const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 }); // Dark wood

        for (let i = 0; i < this.segmentLength / 1.5; i++) {
            const sleeper = new THREE.Mesh(sleeperGeom, sleeperMat);
            sleeper.position.set(0, 0.05, -this.segmentLength / 2 + i * 1.5);
            sleeper.receiveShadow = true;
            segment.add(sleeper);
        }

        // Rails (Metal)
        const railGeom = new THREE.BoxGeometry(0.2, 0.2, this.segmentLength);
        const railMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.4
        });

        const laneOffsets = [-1, 0, 1];
        laneOffsets.forEach(lane => {
            const center = lane * this.laneWidth;
            // Left Rail
            const railL = new THREE.Mesh(railGeom, railMat);
            railL.position.set(center - 0.6, 0.2, 0);
            railL.castShadow = true;
            segment.add(railL);

            // Right Rail
            const railR = new THREE.Mesh(railGeom, railMat);
            railR.position.set(center + 0.6, 0.2, 0);
            railR.castShadow = true;
            segment.add(railR);
        });

        // Trees along the sides
        const trunkGeom = new THREE.CylinderGeometry(0.2, 0.3, 1.2);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });

        // Variety of leaf geometries
        const leafGeometries = [
            new THREE.SphereGeometry(1.0, 8, 8),
            new THREE.ConeGeometry(0.8, 2.0, 8),
            new THREE.DodecahedronGeometry(0.9)
        ];
        const leavesMat = new THREE.MeshStandardMaterial({
            color: 0x2e7d32,
            roughness: 0.7
        });

        for (let i = 0; i < 6; i++) {
            const side = i < 3 ? -1 : 1;
            const treeX = side * (7 + Math.random() * 5);
            const treeZ = (Math.random() - 0.5) * this.segmentLength;

            // Trunk
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            const trunkHeight = 0.8 + Math.random() * 0.8;
            trunk.scale.y = trunkHeight;
            trunk.position.set(treeX, trunkHeight * 0.6, treeZ);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            segment.add(trunk);

            // Leaves (Random Variety)
            const leafGeom = leafGeometries[Math.floor(Math.random() * leafGeometries.length)];
            const leaves = new THREE.Mesh(leafGeom, leavesMat);
            leaves.position.set(treeX, trunkHeight * 1.2 + 0.5, treeZ);
            leaves.rotation.y = Math.random() * Math.PI;
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            segment.add(leaves);
        }

        // Overhead Wires (Catenary)
        const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 5);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const barGeom = new THREE.CylinderGeometry(0.05, 0.05, 12); // Crossbar spanning tracks

        // Add poles at start of segment
        const poleL = new THREE.Mesh(poleGeom, poleMat);
        poleL.position.set(-6, 2.5, -this.segmentLength / 2);
        poleL.castShadow = true;
        segment.add(poleL);

        const poleR = new THREE.Mesh(poleGeom, poleMat);
        poleR.position.set(6, 2.5, -this.segmentLength / 2);
        poleR.castShadow = true;
        segment.add(poleR);

        const crossbar = new THREE.Mesh(barGeom, poleMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(0, 4.5, -this.segmentLength / 2);
        segment.add(crossbar);

        // Wires
        const wireGeom = new THREE.CylinderGeometry(0.02, 0.02, this.segmentLength);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

        const wireOffsets = [-this.laneWidth, 0, this.laneWidth];
        wireOffsets.forEach(x => {
            const wire = new THREE.Mesh(wireGeom, wireMat);
            wire.rotation.x = Math.PI / 2;
            wire.position.set(x, 4.4, 0); // Hang slightly below crossbar
            segment.add(wire);
        });

        segment.position.z = z;

        this.scene.add(segment);
        this.segments.push(segment);

        if (z < -20) {
            this.spawnObstacle(z);
        }
    }

    private spawnObstacle(z: number) {
        const lane = Math.floor(Math.random() * 3) - 1;
        const rand = Math.random();

        if (rand > 0.4) {
            this.spawnTrainCar(lane, z);
        } else if (rand > 0.1) {
            this.spawnBarrier(lane, z);
        } else {
            // Spawn a speed pad or a cluster of shards
            if (Math.random() > 0.5) {
                this.spawnSpeedPad(lane, z);
            } else {
                this.spawnShardCluster(lane, z);
            }
        }
    }

    private spawnShardCluster(lane: number, z: number) {
        for (let i = 0; i < 3; i++) {
            this.spawnShard(lane, z - (i * 3));
        }
    }

    private spawnShard(lane: number, z: number) {
        // Coin Shape (Golden Disk)
        const coinGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
        const coinMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.3,
            emissive: 0xffa000,
            emissiveIntensity: 0.4
        });
        const coin = new THREE.Mesh(coinGeom, coinMat);
        coin.rotation.x = Math.PI / 2; // Face the player
        coin.rotation.z = Math.PI / 2; // Stand upright
        coin.position.set(lane * this.laneWidth, 0.8, z);
        coin.name = "shard"; // Keep internal name for collision logic
        coin.castShadow = true;
        this.scene.add(coin);
        this.obstacles.push(coin as any);

        // Add a small light to the coin
        const light = new THREE.PointLight(0xffd700, 0.8, 3);
        coin.add(light);
    }

    private spawnSpeedPad(lane: number, z: number) {
        const padGeom = new THREE.PlaneGeometry(2.5, 4);
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        const pad = new THREE.Mesh(padGeom, padMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(lane * this.laneWidth, 0.02, z);
        pad.name = "speed_pad";
        this.scene.add(pad);
        this.obstacles.push(pad as any);
    }

    private spawnBarrier(lane: number, z: number) {
        const barrierGroup = new THREE.Group();

        // Top Bar (Red/White Stripes)
        const barGeom = new THREE.BoxGeometry(2.4, 0.4, 0.2);
        const barMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.2 });
        const bar = new THREE.Mesh(barGeom, barMat);
        bar.position.y = 0.8;
        bar.castShadow = true;
        barrierGroup.add(bar);

        // White stripes (simulated with small boxes)
        const stripeGeom = new THREE.BoxGeometry(0.4, 0.41, 0.21);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        for (let i = 0; i < 3; i++) {
            const stripe = new THREE.Mesh(stripeGeom, stripeMat);
            stripe.position.set(-0.8 + (i * 0.8), 0.8, 0);
            barrierGroup.add(stripe);
        }

        // Legs
        const legGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x888888 });

        const legL = new THREE.Mesh(legGeom, legMat);
        legL.position.set(-1.0, 0.4, 0);
        barrierGroup.add(legL);

        const legR = new THREE.Mesh(legGeom, legMat);
        legR.position.set(1.0, 0.4, 0);
        barrierGroup.add(legR);

        barrierGroup.position.set(lane * this.laneWidth, 0, z);
        barrierGroup.name = "barrier";
        this.scene.add(barrierGroup);
        this.obstacles.push(barrierGroup as any);
    }

    private spawnTrainCar(lane: number, z: number) {
        const trainGroup = new THREE.Group();

        // Traffic Logic based on Speed
        // Speed < 20: No traffic
        // Speed 20-30: 30% chance, slow trains
        // Speed 30+: 50% chance, fast trains
        let movingChance = 0;
        let trainSpeed = 0;

        if (this.currentSpeed > 30) {
            movingChance = 0.5;
            trainSpeed = 25;
        } else if (this.currentSpeed > 20) {
            movingChance = 0.3;
            trainSpeed = 15;
        }

        const isMoving = Math.random() < movingChance && z < -40;

        // Container Body
        const trainColor = 0xffb74d; // Orange-ish
        const geom = new THREE.BoxGeometry(2.6, 3.5, 12);
        const mat = new THREE.MeshStandardMaterial({
            color: trainColor,
            roughness: 0.7,
            metalness: 0.1
        });
        const body = new THREE.Mesh(geom, mat);
        body.position.y = 1.75;
        body.castShadow = true;
        body.receiveShadow = true;
        trainGroup.add(body);

        // Wheels
        const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 2.7);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const wheelZ = [-4, 4];

        wheelZ.forEach(wz => {
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(0, 0.4, wz);
            trainGroup.add(wheel);
        });

        // Detailed Doors
        const doorGeom = new THREE.PlaneGeometry(1.2, 2.5);
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0xef6c00, // Darker orange
            side: THREE.DoubleSide
        });

        const door1 = new THREE.Mesh(doorGeom, doorMat);
        door1.position.set(-0.6, 1.8, 4.51); // Front face (slightly out)
        trainGroup.add(door1);

        const door2 = new THREE.Mesh(doorGeom, doorMat);
        door2.position.set(0.6, 1.8, 4.51);
        trainGroup.add(door2);

        // Side Vents/Details
        const ventGeom = new THREE.BoxGeometry(0.1, 2.0, 8.0);
        // Make vents slightly darker by not adding light? No, just stick out.
        // Actually let's use a darker color for the detailing.
        const detailMat = new THREE.MeshStandardMaterial({ color: 0xbf360c });

        const ventL = new THREE.Mesh(ventGeom, detailMat);
        ventL.position.set(-1.41, 2.0, 0);
        trainGroup.add(ventL);

        // Couplers / Bumpers
        const bumperGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.5);
        const bumperMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

        const bumperZ = [4.5, -4.5]; // Front and Back
        const bumperX = [-0.8, 0.8];

        bumperZ.forEach(z => {
            bumperX.forEach(x => {
                const bumper = new THREE.Mesh(bumperGeom, bumperMat);
                bumper.rotation.x = Math.PI / 2;
                bumper.position.set(x, 0.8, z);
                trainGroup.add(bumper);
            });
        });

        const ventR = new THREE.Mesh(ventGeom, detailMat);
        ventR.position.set(1.41, 2.0, 0);
        trainGroup.add(ventR);

        // Front Lights (if moving)
        if (isMoving) {
            const lightGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.1);
            const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow glow
            const light = new THREE.Mesh(lightGeom, lightMat);
            light.rotation.x = Math.PI / 2;
            light.position.set(0, 3.2, 4.6); // Top front
            trainGroup.add(light);

            // Add userData for movement
            trainGroup.userData = { velocity: trainSpeed };
            trainGroup.name = "moving_train";
        } else {
            trainGroup.name = "train";
        }

        trainGroup.position.set(lane * this.laneWidth, 0, z);
        this.scene.add(trainGroup);
        this.obstacles.push(trainGroup as any);
    }



    public update(delta: number, speed: number) {
        // Move segments
        this.segments.forEach(segment => {
            segment.position.z += speed * delta;

            // Recycle segment
            if (segment.position.z > this.segmentLength) {
                segment.position.z -= this.numSegments * this.segmentLength;
            }
        });

        // Move obstacles
        const trainSpeed = speed * 0.7; // Trains are fast!
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];

            if (obstacle.name === "train") {
                obstacle.position.z += (speed + trainSpeed) * delta;
            } else {
                obstacle.position.z += speed * delta;
            }

            // Remove off-screen obstacles
            if (obstacle.position.z > 20) {
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);

                // Spawn a new one far away
                this.spawnObstacle(-this.numSegments * this.segmentLength + 10);
            }
        }
    }

    public attractCoins(playerPos: THREE.Vector3, delta: number, range: number) {
        this.obstacles.forEach(obs => {
            if (obs.name === "shard") { // "shard" is our coin
                const dist = obs.position.distanceTo(playerPos);
                if (dist < range) {
                    const dir = new THREE.Vector3().subVectors(playerPos, obs.position).normalize();
                    obs.position.add(dir.multiplyScalar(20 * delta)); // Move fast towards player
                }
            }
        });
    }

    public checkCollision(playerPosition: THREE.Vector3): string | null {
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(playerPosition.x, playerPosition.y + 0.6, playerPosition.z),
            new THREE.Vector3(0.5, 1.0, 0.5) // Slightly tighter hitbox
        );

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);

            if (playerBox.intersectsBox(obstacleBox)) {
                if (obstacle.name === "speed_pad") {
                    this.scene.remove(obstacle);
                    this.obstacles.splice(i, 1);
                    return "speed_boost";
                } else if (obstacle.name === "shard") {
                    this.scene.remove(obstacle);
                    this.obstacles.splice(i, 1);
                    return "shard";
                }

                return "game_over";
            }
        }
        return null;
    }

    public reset() {
        this.obstacles.forEach(o => this.scene.remove(o));
        this.obstacles = [];
        this.segments.forEach((s, i) => {
            s.position.z = i * -this.segmentLength;
        });
    }
}
