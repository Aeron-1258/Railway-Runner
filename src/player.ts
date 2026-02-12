import * as THREE from 'three';

export class Player {
    private mesh: THREE.Group;
    private currentLane: number = 0; // -1: Left, 0: Center, 1: Right
    private targetX: number = 0;
    private laneWidth: number = 3;
    private lerpSpeed: number = 10;
    private isJumping: boolean = false;
    private jumpVelocity: number = 0;
    private gravity: number = -25;
    private jumpInitialVelocity: number = 10;

    private leftLeg: THREE.Object3D | null = null;
    private rightLeg: THREE.Object3D | null = null;
    private leftArm: THREE.Object3D | null = null;
    private rightArm: THREE.Object3D | null = null;

    constructor(scene: THREE.Scene) {
        this.mesh = new THREE.Group();
        scene.add(this.mesh);
        this.setCharacter(0);
    }

    public getMesh() {
        return this.mesh;
    }

    public setCharacter(type: number) {
        // Reset abilities
        this.jumpInitialVelocity = 10;

        // Apply Character Stats
        if (type === 2) { // Jumper
            this.jumpInitialVelocity = 15; // Higher jump
        }

        while (this.mesh.children.length > 0) {
            this.mesh.remove(this.mesh.children[0]);
        }

        if (type === 1) { // Princess (Magneto)
            this.createPrincess();
        } else if (type === 2) { // Jumper
            this.createJumper();
        } else if (type === 3) { // Tank
            this.createTank();
        } else {
            this.createStreetRunner();
        }
    }

    private createStreetRunner() {
        // Caps, Shorts, Backpack
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x4facfe, roughness: 0.5 });
        const shortsMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
        const capMat = new THREE.MeshStandardMaterial({ color: 0xff4b2b });

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), skinMat);
        head.position.y = 1.6;
        head.castShadow = true;
        this.mesh.add(head);

        // Cap
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1), capMat);
        cap.position.set(0, 1.8, 0);
        this.mesh.add(cap);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.2), capMat);
        brim.position.set(0, 1.8, 0.25);
        this.mesh.add(brim);

        // Body (Shirt)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.6), shirtMat);
        body.position.y = 1.1;
        body.castShadow = true;
        this.mesh.add(body);

        // Shorts
        const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.3), shortsMat);
        shorts.position.y = 0.75;
        this.mesh.add(shorts);

        // Legs
        const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.7);
        this.leftLeg = new THREE.Mesh(legGeom, skinMat);
        this.leftLeg.position.set(-0.15, 0.35, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeom, skinMat);
        this.rightLeg.position.set(0.15, 0.35, 0);
        this.mesh.add(this.rightLeg);

        // Arms
        const armGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.6);
        this.leftArm = new THREE.Mesh(armGeom, skinMat);
        this.leftArm.position.set(-0.35, 1.2, 0);
        this.leftArm.rotation.z = Math.PI / 6;
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeom, skinMat);
        this.rightArm.position.set(0.35, 1.2, 0);
        this.rightArm.rotation.z = -Math.PI / 6;
        this.mesh.add(this.rightArm);

        // Backpack
        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.2), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        pack.position.set(0, 1.2, -0.2);
        this.mesh.add(pack);
    }

    private createPrincess() {
        // Dress, Long Hair, Crown
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
        const dressMat = new THREE.MeshStandardMaterial({ color: 0x4facfe, roughness: 0.4 });
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.5 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), skinMat);
        head.position.y = 1.6;
        head.castShadow = true;
        this.mesh.add(head);

        // Crown
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 0.15, 6), goldMat);
        crown.position.set(0, 1.85, 0);
        this.mesh.add(crown);

        // Hair (Long back)
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.1), hairMat);
        hair.position.set(0, 1.6, -0.2);
        this.mesh.add(hair);
        const bangs = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3), hairMat);
        bangs.position.set(0, 1.6, 0);
        bangs.rotation.x = -0.2;
        this.mesh.add(bangs);

        // Dress (Top)
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.5), dressMat);
        top.position.y = 1.2;
        top.castShadow = true;
        this.mesh.add(top);

        // Dress (Skirt) - Cone
        const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.0, 16), dressMat);
        skirt.position.y = 0.5;
        this.mesh.add(skirt);

        // Arms (Skin)
        const armGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.5);
        this.leftArm = new THREE.Mesh(armGeom, skinMat);
        this.leftArm.position.set(-0.3, 1.25, 0);
        this.leftArm.rotation.z = Math.PI / 8;
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeom, skinMat);
        this.rightArm.position.set(0.3, 1.25, 0);
        this.rightArm.rotation.z = -Math.PI / 8;
        this.mesh.add(this.rightArm);

        // Legs are hidden under skirt, but animate them anyway for jumping
        const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.7);
        this.leftLeg = new THREE.Mesh(legGeom, skinMat);
        this.leftLeg.position.set(-0.15, 0.35, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeom, skinMat);
        this.rightLeg.position.set(0.15, 0.35, 0);
        this.mesh.add(this.rightLeg);

        // Glove/Wrist detail
        const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const gloveL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15), gloveMat);
        gloveL.position.set(-0.38, 1.05, 0);
        gloveL.rotation.z = Math.PI / 8;
        this.mesh.add(gloveL);
        const gloveR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15), gloveMat);
        gloveR.position.set(0.38, 1.05, 0);
        gloveR.rotation.z = -Math.PI / 8;
        this.mesh.add(gloveR);
    }

    private createJumper() {
        // Sporty Green
        this.createStreetRunner(); // Reuse base for now
        // Override colors? Actually let's just create a distinct simple one for now or we will be here all day.
        // Let's modify the meshes after creation? No, cleaner to build separate.
        // For efficiency, I'll allow Jumper/Tank to fallback to a recolored street runner concept for now,
        // Since the user specifically asked for "2" (Princess).
        // But to be safe, I'll copy the street runner code and change colors.

        // Actually, let's just clear the mesh and rebuild purely.
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x76ff03, roughness: 0.5 });
        const shortsMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.8 });

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), skinMat);
        head.position.y = 1.6;
        this.mesh.add(head);

        // Headphones
        const headphoneMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 24, Math.PI), headphoneMat);
        band.position.y = 1.6;
        band.rotation.z = Math.PI / 2; // Arcing over head? No, standard torus is XY.
        // Torus is created in XY plane.
        this.mesh.add(band);
        const cupGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.1);
        const cupL = new THREE.Mesh(cupGeom, headphoneMat);
        cupL.rotation.z = Math.PI / 2;
        cupL.position.set(-0.35, 1.6, 0);
        this.mesh.add(cupL);
        const cupR = new THREE.Mesh(cupGeom, headphoneMat);
        cupR.rotation.z = Math.PI / 2;
        cupR.position.set(0.35, 1.6, 0);
        this.mesh.add(cupR);

        // Body
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.6), shirtMat);
        body.position.y = 1.1;
        this.mesh.add(body);

        // Shorts
        const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.3), shortsMat);
        shorts.position.y = 0.75;
        this.mesh.add(shorts);

        // Legs
        // Legs
        const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.7);
        this.leftLeg = new THREE.Mesh(legGeom, skinMat);
        this.leftLeg.position.set(-0.15, 0.35, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeom, skinMat);
        this.rightLeg.position.set(0.15, 0.35, 0);
        this.mesh.add(this.rightLeg);

        // Arms
        const armGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.6);
        this.leftArm = new THREE.Mesh(armGeom, skinMat);
        this.leftArm.position.set(-0.35, 1.2, 0);
        this.leftArm.rotation.z = Math.PI / 6;
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeom, skinMat);
        this.rightArm.position.set(0.35, 1.2, 0);
        this.rightArm.rotation.z = -Math.PI / 6;
        this.mesh.add(this.rightArm);
    }

    private createTank() {
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x2979ff, metalness: 0.8, roughness: 0.2 });

        // Head (Robot)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), metalMat);
        head.position.y = 1.7;
        this.mesh.add(head);

        // Eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.1), eyeMat);
        eyeL.position.set(-0.15, 1.7, 0.26);
        this.mesh.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.1), eyeMat);
        eyeR.position.set(0.15, 1.7, 0.26);
        this.mesh.add(eyeR);

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.5), metalMat);
        body.position.y = 1.1;
        this.mesh.add(body);

        // Legs
        const legGeom = new THREE.BoxGeometry(0.25, 0.7, 0.3);
        this.leftLeg = new THREE.Mesh(legGeom, metalMat);
        this.leftLeg.position.set(-0.2, 0.35, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeom, metalMat);
        this.rightLeg.position.set(0.2, 0.35, 0);
        this.mesh.add(this.rightLeg);

        // Arms
        const armGeom = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        this.leftArm = new THREE.Mesh(armGeom, metalMat);
        this.leftArm.position.set(-0.5, 1.1, 0);
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeom, metalMat);
        this.rightArm.position.set(0.5, 1.1, 0);
        this.mesh.add(this.rightArm);
    }

    public moveLeft() {
        if (this.currentLane > -1) {
            this.currentLane--;
            this.targetX = this.currentLane * this.laneWidth;
        }
    }

    public moveRight() {
        if (this.currentLane < 1) {
            this.currentLane++;
            this.targetX = this.currentLane * this.laneWidth;
        }
    }

    public jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpInitialVelocity;
        }
    }

    private isFlying: boolean = false;

    public setFlying(active: boolean) {
        this.isFlying = active;
        if (active) {
            this.mesh.position.y = 8; // High altitude
            this.jumpVelocity = 0;
            this.isJumping = false;
        } else {
            this.mesh.position.y = 0; // Return to ground
            this.jumpVelocity = 0;
        }
    }

    public startSuperJump() {
        this.jumpInitialVelocity = 20; // Super high
    }

    public endSuperJump() {
        this.jumpInitialVelocity = 10; // Reset
    }

    public reset() {
        this.currentLane = 0;
        this.targetX = 0;
        this.mesh.position.set(0, 0, 0);
        this.isJumping = false;
        this.isFlying = false;
        this.jumpVelocity = 0;
        this.jumpInitialVelocity = 10;
    }

    public update(delta: number) {
        // Smooth lane switching
        this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, this.targetX, this.lerpSpeed * delta);

        // Jump/Fly physics
        if (this.isFlying) {
            this.mesh.position.y = 8;
        } else if (this.isJumping) {
            this.mesh.position.y += this.jumpVelocity * delta;
            this.jumpVelocity += this.gravity * delta;

            if (this.mesh.position.y <= 0) {
                this.mesh.position.y = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }

        // Rotating coins and other children
        this.mesh.children.forEach(child => {
            // Check if it looks like a coin/ring orb
            if (child instanceof THREE.Mesh) {
                child.rotation.y += delta * 3;
            }
        });

        // Slight tilt when moving
        const targetTilt = (this.targetX - this.mesh.position.x) * 0.3;
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, -targetTilt, 5 * delta);
    }

    public getPosition() {
        return this.mesh.position;
    }
}
