import * as THREE from 'three';
import { Player } from './player.ts';
import { TrackManager } from './track.ts';
import { Controls } from './controls.ts';

class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private player: Player;
    private trackManager: TrackManager;
    private score: number = 0;
    private isGameRunning: boolean = false;
    private speedMultiplier: number = 1;
    private shardsCollected: number = 0; // Current run coins
    private totalCoins: number = 0; // Persistent wallet
    private boostTimer: number = 0;
    private clock: THREE.Clock;
    private selectedCharacter: number = 0;
    private unlockedCharacters: number[] = [0]; // Default char unlocked
    private hasShield: boolean = false; // Tank ability

    constructor() {
        this.loadProgress();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015); // Reduced fog density

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); // Tighter FOV
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Realism: Enable Shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.clock = new THREE.Clock();

        // Lighting
        // Realistic ambient light
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(20, 50, 20); // Higher sun
        directionalLight.castShadow = true;

        // Better shadow quality
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.far = 200;

        this.scene.add(directionalLight);

        // Initial camera position - Higher and angled down (Subway Surfers style)
        this.camera.position.set(0, 7, 12);
        this.camera.lookAt(0, 0, -10);

        // Initialize components
        this.player = new Player(this.scene);
        this.trackManager = new TrackManager(this.scene);
        new Controls(this.player, this);

        // UI Events
        // UI Events
        document.getElementById('enter-game-btn')?.addEventListener('click', () => {
            document.getElementById('landing-page')?.classList.add('hidden');
            document.getElementById('game-container')?.classList.remove('hidden');
            // Maybe play a sound or music here?
        });

        document.getElementById('start-button')?.addEventListener('click', () => this.startGame());
        document.getElementById('restart-button')?.addEventListener('click', () => this.resetGame());

        const buyBtn = document.getElementById('buy-button');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => {
                this.buyCharacter();
            });
        }

        // Shop Selection Logic
        const cards = document.querySelectorAll('.char-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const charId = parseInt((card as HTMLElement).dataset.char || "0");
                const cost = parseInt((card as HTMLElement).dataset.cost || "0");

                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharacter = charId;

                const isUnlocked = this.unlockedCharacters.includes(charId);
                const startBtn = document.getElementById('start-button');

                if (isUnlocked) {
                    // Character Unlocked
                    this.player.setCharacter(this.selectedCharacter);
                    if (startBtn) startBtn.style.display = 'inline-block';
                    if (buyBtn) buyBtn.classList.remove('visible');
                } else {
                    // Character Locked
                    if (startBtn) startBtn.style.display = 'none';

                    if (buyBtn) {
                        buyBtn.innerText = `UNLOCK (${cost})`;
                        buyBtn.classList.add('visible');

                        // Check affordability
                        if (this.totalCoins >= cost) {
                            buyBtn.style.opacity = '1.0';
                            buyBtn.style.cursor = 'pointer';
                        } else {
                            buyBtn.style.opacity = '0.5';
                            buyBtn.style.cursor = 'not-allowed';
                        }
                    }
                }
            });
        });

        // Initial UI update
        this.updateShopUI();

        window.addEventListener('resize', () => this.onWindowResize());

        this.animate();
    }

    private startGame() {
        this.isGameRunning = true;
        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('end-screen')?.classList.add('hidden');
        this.score = 0;
        this.updateUI();
        this.player.setCharacter(this.selectedCharacter);

        // Reset speed multiplier
        this.speedMultiplier = 1.0;
        this.boostTimer = 0;
    }

    private resetGame() {
        this.player.reset();
        this.trackManager.reset();
        this.startGame();
    }

    public gameOver() {
        this.isGameRunning = false;

        // Save coins
        this.totalCoins += this.shardsCollected;
        this.saveProgress();

        const endScreen = document.getElementById('end-screen');
        if (endScreen) {
            endScreen.classList.remove('hidden');
            const scoreEl = document.getElementById('final-score');
            if (scoreEl) scoreEl.innerText = `Final Score: ${Math.floor(this.score)}`;
        }
        this.updateUI();
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        if (this.isGameRunning) {
            this.score += delta * 10;

            // Speed Boost logic
            if (this.boostTimer > 0) {
                this.boostTimer -= delta;
                this.speedMultiplier = 2.0;
                if (this.boostTimer <= 0) {
                    this.speedMultiplier = 1.0;
                }
            }

            this.updateUI();

            // Dynamic Difficulty
            // Base speed 18, increases by score. Cap at 50 to prevent uncontrollability.
            const baseSpeed = 18;
            const difficultyFactor = Math.min(this.score / 150, 32); // Caps after score 4800
            const gameSpeed = (baseSpeed + difficultyFactor) * this.speedMultiplier;

            this.player.update(delta);
            this.trackManager.update(delta, gameSpeed);

            // Coin Magnet Logic (Magneto or Powerup)
            if (this.selectedCharacter === 1 || this.powerupMagnetActive) {
                this.trackManager.attractCoins(this.player.getPosition(), delta, 15); // 15 range
            }

            const collisionResult = this.trackManager.checkCollision(this.player.getPosition());

            if (typeof collisionResult === 'string' && collisionResult.startsWith("powerup_")) {
                const type = collisionResult.split('_')[1];
                this.activatePowerUp(type);
            } else if (collisionResult === "game_over") {
                if (this.hasShield) {
                    this.hasShield = false;
                    this.scene.fog = new THREE.FogExp2(0xff0000, 0.05); // Flash red
                    setTimeout(() => {
                        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.02); // Reset to day (should match cycle)
                    }, 500);
                } else {
                    this.gameOver();
                }
            } else if (collisionResult === "speed_boost") {
                this.triggerSpeedBoost();
            } else if (collisionResult === "shard") {
                this.collectShard();
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    private triggerSpeedBoost() {
        this.boostTimer = 3.0; // 3 seconds boost
    }

    private collectShard() {
        this.shardsCollected++;
        this.score += 50; // Bonus score for shards
    }

    private updateUI() {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = Math.floor(this.score).toString();

        const shardsEl = document.getElementById('shards');
        if (shardsEl) shardsEl.innerText = this.shardsCollected.toString();

        // Update Total Coins in Menu if visible
        const menuCoinsEl = document.getElementById('menu-coins-display');
        if (menuCoinsEl) menuCoinsEl.innerText = this.totalCoins.toString();
    }

    private buyCharacter() {
        const cost = [0, 50, 100, 200][this.selectedCharacter]; // Cost lookup

        if (this.totalCoins >= cost && !this.unlockedCharacters.includes(this.selectedCharacter)) {
            this.totalCoins -= cost;
            this.unlockedCharacters.push(this.selectedCharacter);
            this.saveProgress();
            this.updateUI();
            this.updateShopUI();

            // Auto-select after buy
            const startBtn = document.getElementById('start-button');
            const buyBtn = document.getElementById('buy-button');
            if (startBtn) startBtn.style.display = 'inline-block';
            if (buyBtn) buyBtn.classList.remove('visible');

            this.player.setCharacter(this.selectedCharacter);
        }
    }

    private updateShopUI() {
        const cards = document.querySelectorAll('.char-card');
        cards.forEach(card => {
            const charId = parseInt((card as HTMLElement).dataset.char || "0");
            if (this.unlockedCharacters.includes(charId)) {
                card.classList.remove('locked');
            } else {
                card.classList.add('locked');
            }
        });
        this.updateUI();
    }

    private activatePowerUp(type: string) {
        console.log("Activated Powerup: " + type);
        // Reset effects if needed or stack?

        if (type === "jetpack") {
            this.player.setFlying(true);
            setTimeout(() => this.player.setFlying(false), 10000); // 10s flight
        } else if (type === "hoverboard") {
            this.hasShield = true;
            // Visual: Attach board to feet?
            setTimeout(() => this.hasShield = false, 15000);
        } else if (type === "sneakers") {
            this.player.startSuperJump();
            setTimeout(() => this.player.endSuperJump(), 15000);
        } else if (type === "magnet") {
            // Already implemented magnet logic in animate, just need to force it on
            // We can use a separate flag "powerupMagnet"
            this.powerupMagnetActive = true;
            setTimeout(() => this.powerupMagnetActive = false, 15000);
        }
    }

    // New flags for powerups
    private powerupMagnetActive: boolean = false;

    private saveProgress() {
        const data = {
            totalCoins: this.totalCoins,
            unlockedCharacters: this.unlockedCharacters
        };
        localStorage.setItem('railwayRunnerSave', JSON.stringify(data));
    }

    private loadProgress() {
        const saved = localStorage.getItem('railwayRunnerSave');
        if (saved) {
            const data = JSON.parse(saved);
            this.totalCoins = data.totalCoins || 0;
            this.unlockedCharacters = data.unlockedCharacters || [0];
        }
    }
}

new Game();
