/**
 * main.js
 * Master Game Loop & Engine Orchestrator for 3D Highway Car Racing.
 */

import * as THREE from 'three';
import { AudioManager } from './AudioManager.js';
import { CarFactory } from './Car.js';
import { WorldManager } from './World.js';
import { TrafficManager } from './Traffic.js';
import { CollectiblesManager } from './Collectibles.js';
import { EffectsManager } from './Effects.js';
import { HUDManager } from './HUD.js';
import { SettingsManager } from './SettingsManager.js';
import { i18n } from './i18n.js';

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();

        // High Score
        this.highScore = parseInt(localStorage.getItem('apex_racer_highscore') || '0', 10);

        // Core Managers
        this.audio = new AudioManager();
        this.carFactory = new CarFactory();
        this.hud = new HUDManager();

        // Game State
        this.isPlaying = false;
        this.isGameOver = false;
        this.isPaused = false;

        // Player Stats & Physics
        this.playerColor = 0xff2a5f; // Default Crimson
        this.currentTheme = 'beach';
        this.cameraMode = 0; // 0: Chase, 1: Hood, 2: Top-down

        this.playerCar = null;
        this.playerSpeed = 0; // Current forward speed (units/s)
        this.minSpeed = 12;
        this.normalTopSpeed = 42;
        this.boostTopSpeed = 62;
        this.acceleration = 8;
        this.braking = 36;
        this.steerAngle = 0;
        this.maxLateralSpeed = 22;
        this.lateralVelocity = 0;
        this.bodyRollAngle = 0;
        this.bodyPitchAngle = 0;

        // Vertical Jump & Ramp Mechanics
        this.isJumping = false;
        this.jumpVelocityY = 0;
        this.jumpGravity = -34;

        // Dynamic Crash Physics State (Prevents freezing upon collision)
        this.isCrashing = false;
        this.crashTimer = 0;
        this.crashDuration = 1.9;
        this.crashVelocity = new THREE.Vector3();
        this.crashAngularVelocity = new THREE.Vector3();

        // Nitro
        this.nitroEnergy = 100;
        this.nitroMax = 100;
        this.isBoosting = false;

        // Powerups
        this.hasShield = false;
        this.magnetTimeLeft = 0;

        // Store, Wallet & Upgrades State
        this.totalCoins = parseInt(localStorage.getItem('apex_racer_total_coins') || '250', 10);
        this.ownedCars = JSON.parse(localStorage.getItem('apex_racer_owned_cars') || '["apex"]');
        this.equippedCar = localStorage.getItem('apex_racer_equipped_car') || 'apex';
        this.previewCarModel = this.equippedCar;
        this.isInStore = false;

        this.carCatalog = {
            apex: { name: 'Apex GT', price: 0, speedBonus: 0, boostBonus: 0, accelBonus: 0 },
            supra: { name: 'Supra MK4 2JZ', price: 500, speedBonus: 6, boostBonus: 10, accelBonus: 2 },
            venom: { name: 'Venom Hypercar', price: 1200, speedBonus: 12, boostBonus: 16, accelBonus: 4 },
            phantom: { name: 'Cyber Phantom', price: 2500, speedBonus: 18, boostBonus: 22, accelBonus: 6 },
            custom: { name: 'Custom Car', price: 0, speedBonus: 10, boostBonus: 14, accelBonus: 4 }
        };

        const defaultUpgrades = { engine: 1, nitro: 1, magnet: 1, gold: 1, shield: 0 };
        try {
            this.upgrades = Object.assign(defaultUpgrades, JSON.parse(localStorage.getItem('apex_racer_upgrades') || '{}'));
        } catch {
            this.upgrades = defaultUpgrades;
        }

        this.upgradeCosts = {
            engine: [0, 150, 300, 550, 900],
            nitro: [0, 150, 280, 500, 850],
            magnet: [0, 120, 240, 420, 700],
            gold: [0, 200, 400, 750, 1200],
            shield: [0, 250, 500, 900, 1500]
        };
        this.maxUpgradeLevel = 5;

        // Scoring
        this.score = 0;
        this.distanceTraveled = 0;
        this.coinsCollected = 0;
        this.multiplier = 1;
        this.nearMissCount = 0;
        this.comboResetTimer = 0;

        // Inputs
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false
        };

        this.initThree();
        this.initWorld();
        this.initPlayer();
        this.initInputs();

        // Settings & i18n — must run after DOM + renderer are ready
        this.settings = new SettingsManager(this);
        this.settings.init();
        this.i18n = i18n;
        this.i18n.updateDOM(); // Apply saved language to DOM on load

        this.setupEventListeners();
        this.hud.updateStoreCoins(this.totalCoins);

        // Start render loop (idle/menu state)
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            68,
            window.innerWidth / window.innerHeight,
            0.1,
            600
        );
        this.camera.position.set(0, 4.5, -8.5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        this.container.appendChild(this.renderer.domElement);

        // Resize Listener
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Setup Studio / Cyberpunk Environment Map for realistic metallic car reflections
        this.setupEnvironmentMap();
    }

    setupEnvironmentMap() {
        try {
            const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
            pmremGenerator.compileEquirectangularShader();

            const envCanvas = document.createElement('canvas');
            envCanvas.width = 512;
            envCanvas.height = 256;
            const ctx = envCanvas.getContext('2d');
            if (ctx) {
                // Cyberpunk / Studio horizon gradient
                const grad = ctx.createLinearGradient(0, 0, 0, 256);
                grad.addColorStop(0, '#1e1b4b');   // Night sky deep indigo
                grad.addColorStop(0.4, '#312e81');
                grad.addColorStop(0.5, '#00f7ff');  // Horizon neon cyan glow
                grad.addColorStop(0.52, '#ff007f'); // Horizon magenta glow
                grad.addColorStop(0.65, '#0f172a'); // Dark road asphalt reflection
                grad.addColorStop(1, '#020617');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 512, 256);

                // Overhead studio light strips for stunning specular highlights on car hood and curves
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(80, 40, 70, 30);
                ctx.fillRect(320, 35, 90, 25);
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(200, 100, 120, 18);

                const envTexture = new THREE.CanvasTexture(envCanvas);
                envTexture.mapping = THREE.EquirectangularReflectionMapping;
                const envRenderTarget = pmremGenerator.fromEquirectangular(envTexture);
                this.scene.environment = envRenderTarget.texture;
                pmremGenerator.dispose();
                envTexture.dispose();
            }
        } catch (err) {
            console.warn('Environment map setup skipped:', err);
        }
    }

    initWorld() {
        this.world = new WorldManager(this.scene);
        this.traffic = new TrafficManager(this.scene, this.carFactory, this.world);
        this.collectibles = new CollectiblesManager(this.scene, this.world);
        this.effects = new EffectsManager(this.scene, this.camera);

        // Near-miss listener
        this.traffic.onNearMiss = (car, dist) => {
            if (!this.isPlaying || this.isGameOver) return;
            this.nearMissCount++;
            this.multiplier = Math.min(this.multiplier + 1, 8);
            this.comboResetTimer = 3.5; // Combo expires in 3.5s

            const bonus = 150 * this.multiplier;
            this.score += bonus;
            this.nitroEnergy = Math.min(this.nitroMax, this.nitroEnergy + 15);

            this.audio.playNearMissSound();
            this.hud.showToast(`CLOSE CALL! +${bonus} (${this.multiplier}x)`, 'highlight');
        };

        // Supra MK4 2JZ-GTE Turbo & Backfire Callbacks
        this.audio.onBackfire = () => {
            if (this.playerCar && this.effects && this.isPlaying && !this.isGameOver) {
                this.effects.spawnBackfirePop(this.playerCar.position);
            }
        };

        this.audio.onTurboFlutter = (isHighBoost) => {
            if (isHighBoost && this.hud && this.isPlaying && !this.isGameOver) {
                this.hud.showToast('STUTUTUTU! 💨', 'highlight');
            }
        };
    }

    initPlayer() {
        if (this.playerCar) {
            this.scene.remove(this.playerCar);
        }
        const modelToLoad = this.isInStore ? this.previewCarModel : this.equippedCar;
        this.playerCar = this.carFactory.createPlayerCar(this.playerColor, modelToLoad);
        this.playerCar.position.set(this.world.laneCenters[1], 0, 0); // Start in 2nd lane
        this.scene.add(this.playerCar);
    }

    initInputs() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (['KeyA', 'KeyD', 'KeyW', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }

            if (e.repeat) return;
            this.audio.resume();

            switch (e.code) {
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.up = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.down = true;
                    break;
                case 'Space':
                    this.keys.space = true;
                    break;
                case 'KeyC':
                    this.toggleCamera();
                    break;
                case 'KeyM':
                    this.cycleMapTheme();
                    break;
                case 'KeyP':
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.up = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.down = false;
                    break;
                case 'Space':
                    this.keys.space = false;
                    break;
            }
        });

        // Touch Control Buttons
        this.setupTouchButton('btn-left', 'left');
        this.setupTouchButton('btn-right', 'right');
        this.setupTouchButton('btn-nitro', 'up');
        this.setupTouchButton('btn-brake', 'down');

        const btnCamera = document.getElementById('btn-camera');
        if (btnCamera) btnCamera.addEventListener('click', () => this.toggleCamera());

        const btnPause = document.getElementById('btn-pause');
        if (btnPause) btnPause.addEventListener('click', () => this.togglePause());

        const btnAudio = document.getElementById('btn-audio');
        if (btnAudio) {
            btnAudio.addEventListener('click', () => {
                const muted = this.audio.toggleMute();
                btnAudio.textContent = muted ? '🔇' : '🔊';
            });
        }
    }

    setupTouchButton(id, keyName) {
        const btn = document.getElementById(id);
        if (!btn) return;

        const press = (e) => {
            e.preventDefault();
            this.audio.resume();
            this.keys[keyName] = true;
            btn.classList.add('active');
        };

        const release = (e) => {
            e.preventDefault();
            this.keys[keyName] = false;
            btn.classList.remove('active');
        };

        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('pointerleave', release);
    }

    setupEventListeners() {
        // Start Game Button
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.audio.init();
                this.audio.startMusic();
                this.startGame();
            });
        }

        // Restart Button
        const restartBtn = document.getElementById('btn-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.audio.init();
                this.startGame();
            });
        }

        // To Main Menu Button
        const toMenuBtn = document.getElementById('btn-to-menu');
        if (toMenuBtn) {
            toMenuBtn.addEventListener('click', () => {
                this.goToMainMenu();
            });
        }

        // Resume Button
        const resumeBtn = document.getElementById('btn-resume');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }

        // Color Picker Options (Synchronized across start & game-over modals)
        const colorOptions = document.querySelectorAll('.color-swatch');
        colorOptions.forEach((opt) => {
            opt.addEventListener('click', () => {
                const colorAttr = opt.getAttribute('data-color');
                colorOptions.forEach(c => {
                    c.classList.toggle('active', c.getAttribute('data-color') === colorAttr);
                });
                const colorHex = parseInt(colorAttr, 16);
                this.playerColor = colorHex;
                if (this.playerCar && this.carFactory) {
                    this.carFactory.setPlayerColor(this.playerCar, colorHex);
                }
            });
        });

        // Theme / Scenery Map Switcher Options (Synchronized across start, pause, & game-over modals)
        const themeOptions = document.querySelectorAll('.theme-btn');
        themeOptions.forEach((btn) => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                this.applyTheme(theme);
            });
        });

        // Quick map cycle button in HUD
        const quickMapBtn = document.getElementById('btn-quick-map');
        if (quickMapBtn) {
            quickMapBtn.addEventListener('click', () => {
                this.cycleMapTheme();
            });
        }

        // Pause screen menu button
        const pauseMenuBtn = document.getElementById('btn-pause-menu');
        if (pauseMenuBtn) {
            pauseMenuBtn.addEventListener('click', () => {
                this.togglePause();
                this.goToMainMenu();
            });
        }

        // Store Open Buttons
        const storeBtn = document.getElementById('btn-open-store');
        if (storeBtn) {
            storeBtn.addEventListener('click', () => this.openStore());
        }

        const gameOverStoreBtn = document.getElementById('btn-game-over-store');
        if (gameOverStoreBtn) {
            gameOverStoreBtn.addEventListener('click', () => this.openStore());
        }

        // Store Close Button
        const closeStoreBtn = document.getElementById('btn-close-store');
        if (closeStoreBtn) {
            closeStoreBtn.addEventListener('click', () => this.closeStore());
        }

        // Store Tab Switching
        const tabBtns = document.querySelectorAll('.store-tab-btn');
        tabBtns.forEach((tBtn) => {
            tBtn.addEventListener('click', () => {
                const targetTab = tBtn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.toggle('active', b === tBtn));
                document.querySelectorAll('.store-tab-content').forEach(c => {
                    c.classList.toggle('active', c.id === `store-tab-${targetTab}`);
                });
                this.audio.playEquipSound();
            });
        });

        // Car Cards & Buy/Equip Actions
        const carCards = document.querySelectorAll('.car-card');
        carCards.forEach((card) => {
            const model = card.getAttribute('data-model');
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-car-action')) return;
                this.previewCar(model);
            });

            const actionBtn = card.querySelector('.btn-car-action');
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.buyOrEquipCar(model);
                });
            }
        });

        // Upgrade Buttons
        const upgradeBtns = document.querySelectorAll('.btn-upgrade');
        upgradeBtns.forEach((btn) => {
            const upgradeKey = btn.getAttribute('data-upgrade');
            btn.addEventListener('click', () => {
                this.purchaseUpgrade(upgradeKey);
            });
        });

        // Custom Car Upload & Folder Load Buttons
        const btnUploadCar = document.getElementById('btn-upload-car');
        const inputCustomCar = document.getElementById('input-custom-car');
        if (btnUploadCar && inputCustomCar) {
            btnUploadCar.addEventListener('click', () => {
                inputCustomCar.click();
            });
            inputCustomCar.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    this.loadCustomCarFromFile(file);
                }
            });
        }

        const btnLoadFolderCar = document.getElementById('btn-load-folder-car');
        if (btnLoadFolderCar) {
            btnLoadFolderCar.addEventListener('click', () => {
                this.loadCustomCarFromFolder();
            });
        }

        // Custom Car Transform Controls (Rotate / Scale Slider / Reset)
        const btnRotateCar = document.getElementById('btn-rotate-car');
        if (btnRotateCar) {
            btnRotateCar.addEventListener('click', () => {
                this.carFactory.rotateCustomCar(90);
                this.initPlayer();
                this.hud.showToast('MODEL ROTATED 90° 🔄', 'info');
            });
        }

        const sliderScaleCar = document.getElementById('slider-scale-car');
        const scaleDisplay = document.getElementById('scale-display');
        if (sliderScaleCar) {
            const currentPct = Math.round((this.carFactory.customScaleMultiplier || 1.0) * 100);
            sliderScaleCar.value = currentPct;
            if (scaleDisplay) scaleDisplay.textContent = `${currentPct}%`;

            sliderScaleCar.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (scaleDisplay) scaleDisplay.textContent = `${val}%`;
                this.carFactory.setCustomScale(val / 100);
                this.initPlayer();
            });
        }

        const btnResetTransform = document.getElementById('btn-reset-transform');
        if (btnResetTransform) {
            btnResetTransform.addEventListener('click', () => {
                this.carFactory.resetCustomCarTransform();
                if (sliderScaleCar) sliderScaleCar.value = 100;
                if (scaleDisplay) scaleDisplay.textContent = '100%';
                this.initPlayer();
                this.hud.showToast('TRANSFORM RESET ↺', 'info');
            });
        }

        // ── Quick Language Toggle (HUD button) ──
        const quickLangBtn = document.getElementById('btn-quick-lang');
        if (quickLangBtn) {
            quickLangBtn.addEventListener('click', () => {
                const newLang = this.i18n.toggleLanguage();
                const msg = newLang === 'id' ? 'Bahasa Indonesia aktif! 🇮🇩' : 'Language: English! 🇬🇧';
                this.hud.showToast(msg, 'highlight');
            });
        }

        // ── Language Buttons inside Settings Modal ──
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                this.i18n.setLanguage(lang);
                const msg = lang === 'id' ? 'Bahasa Indonesia aktif! 🇮🇩' : 'Language: English! 🇬🇧';
                this.hud.showToast(msg, 'highlight');
            });
        });

        // ── Quick Settings (HUD ⚙️ button) ──
        const quickSettingsBtn = document.getElementById('btn-quick-settings');
        if (quickSettingsBtn) {
            quickSettingsBtn.addEventListener('click', () => {
                this.settings.showSettingsModal();
            });
        }

        // ── Save & Close Settings ──
        const saveCloseBtn = document.getElementById('btn-close-settings-save');
        if (saveCloseBtn) {
            saveCloseBtn.addEventListener('click', () => {
                this.settings.save();
                this.settings.hideSettingsModal();
                this.hud.showToast('✅ Settings Saved!', 'success');
            });
        }
    }

    async loadCustomCarFromFile(file) {
        try {
            this.hud.showToast(`LOADING ${file.name}... ⏳`, 'info');
            const arrayBuffer = await file.arrayBuffer();
            const cleanName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
            await this.carFactory.loadGLTF(arrayBuffer, cleanName);

            this.carCatalog.custom.name = cleanName;
            if (!this.ownedCars.includes('custom')) {
                this.ownedCars.push('custom');
            }
            this.equippedCar = 'custom';
            this.previewCarModel = 'custom';

            // Show custom car card in showroom
            const customCard = document.getElementById('card-custom-car');
            const customLabel = document.getElementById('custom-car-label');
            if (customCard) customCard.style.display = 'flex';
            if (customLabel) customLabel.textContent = cleanName;

            // Sync scale slider UI
            const sliderScaleCar = document.getElementById('slider-scale-car');
            const scaleDisplay = document.getElementById('scale-display');
            if (sliderScaleCar) {
                const pct = Math.round((this.carFactory.customScaleMultiplier || 1.0) * 100);
                sliderScaleCar.value = pct;
                if (scaleDisplay) scaleDisplay.textContent = `${pct}%`;
            }

            this.initPlayer();
            this.updateStoreUI();
            this.audio.playPurchaseSound();
            this.hud.showToast(`CUSTOM CAR "${cleanName}" LOADED! 🏎️`, 'highlight');
        } catch (err) {
            console.error('Failed to load custom GLTF:', err);
            this.audio.playErrorSound();
            this.hud.showToast('FAILED TO LOAD .GLB MODEL! ❌', 'error');
        }
    }

    async loadCustomCarFromFolder() {
        this.hud.showToast('CHECKING MODELS/ FOLDER... ⏳', 'info');

        let modelFiles = [];
        try {
            // Use server API to get actual list of models in the folder
            const apiRes = await fetch('/api/models');
            if (apiRes.ok) {
                modelFiles = await apiRes.json();
            }
        } catch (e) {
            // Fallback to common names if server API is unavailable
            modelFiles = ['models/car.glb', 'models/custom.glb', 'models/mobil.glb'];
        }

        if (modelFiles.length === 0) {
            this.audio.playErrorSound();
            this.hud.showToast('NO .GLB FILES IN MODELS/ FOLDER! 📁', 'error');
            alert('Tidak ada file .glb di folder models/!\n\nSilakan letakkan file mobil .glb Anda di:\n"d:\\wow\\models\\"\n\nBisa nama apa saja, misalnya: car.glb, gtr.glb, mobil.glb, dll.');
            return;
        }

        // Load the first available model
        const filePath = modelFiles[0];
        try {
            const encodedPath = filePath.split('/').map(s => encodeURIComponent(s)).join('/');
            const res = await fetch(encodedPath);
            if (res.ok) {
                const blob = await res.blob();
                const fileName = filePath.split('/').pop();
                const file = new File([blob], fileName);
                await this.loadCustomCarFromFile(file);
                return;
            }
        } catch (e) {
            console.error('Failed to load model:', filePath, e);
        }

        this.audio.playErrorSound();
        this.hud.showToast('GAGAL LOAD .GLB! CEK KONSOL ❌', 'error');
        alert('Gagal memuat model dari folder models/!\n\nPastikan server dijalankan dengan jalankan_game.bat\ndan file .glb tidak rusak.');
    }

    openStore() {
        this.isInStore = true;
        this.previewCarModel = this.equippedCar;
        this.initPlayer();
        this.hud.hideStartScreen();
        this.hud.hideGameOver();
        this.hud.showStore();
        this.updateStoreUI();
        this.audio.playEquipSound();
    }

    closeStore() {
        this.isInStore = false;
        this.previewCarModel = this.equippedCar;
        this.initPlayer();
        this.hud.hideStore();
        if (this.isGameOver) {
            this.hud.showGameOver(
                this.score,
                this.highScore,
                this.score >= this.highScore,
                this.distanceTraveled,
                this.coinsCollected,
                this.nearMissCount
            );
        } else {
            this.hud.showStartScreen();
        }
    }

    updateStoreUI() {
        this.hud.updateStoreCoins(this.totalCoins);

        if (this.ownedCars.includes('custom') && this.carFactory.customModelScene) {
            const customCard = document.getElementById('card-custom-car');
            const customLabel = document.getElementById('custom-car-label');
            if (customCard) customCard.style.display = 'flex';
            if (customLabel) customLabel.textContent = this.carCatalog.custom.name;
        }

        // Update Car Cards
        Object.keys(this.carCatalog).forEach((model) => {
            const isOwned = this.ownedCars.includes(model);
            const isEquipped = this.equippedCar === model;
            const price = this.carCatalog[model].price;
            this.hud.updateCarCardUI(model, isOwned, isEquipped, price);
        });

        // Update Upgrade Pips
        Object.keys(this.upgrades).forEach((key) => {
            const currentLv = this.upgrades[key];
            const maxLv = this.maxUpgradeLevel;
            const isMax = currentLv >= maxLv;
            const nextCost = !isMax ? this.upgradeCosts[key][currentLv] : 0;
            this.hud.renderUpgradePips(key, currentLv, maxLv, nextCost, isMax);
        });
    }

    previewCar(model) {
        if (this.previewCarModel === model) return;
        this.previewCarModel = model;
        this.initPlayer();
        this.audio.playEquipSound();
    }

    buyOrEquipCar(model) {
        if (!this.carCatalog[model]) return;
        const isOwned = this.ownedCars.includes(model);

        if (isOwned) {
            // Equip car
            this.equippedCar = model;
            this.previewCarModel = model;
            localStorage.setItem('apex_racer_equipped_car', model);
            this.initPlayer();
            this.updateStoreUI();
            this.audio.playEquipSound();
            this.hud.showToast(`${this.carCatalog[model].name} EQUIPPED!`, 'success');
        } else {
            // Try buy car
            const price = this.carCatalog[model].price;
            if (this.totalCoins >= price) {
                this.totalCoins -= price;
                this.ownedCars.push(model);
                this.equippedCar = model;
                this.previewCarModel = model;

                localStorage.setItem('apex_racer_total_coins', this.totalCoins);
                localStorage.setItem('apex_racer_owned_cars', JSON.stringify(this.ownedCars));
                localStorage.setItem('apex_racer_equipped_car', model);

                this.initPlayer();
                this.updateStoreUI();
                this.audio.playPurchaseSound();
                this.hud.showToast(`UNLOCKED ${this.carCatalog[model].name}! 🏎️`, 'highlight');
            } else {
                this.audio.playErrorSound();
                this.hud.showToast(`NEED ${price - this.totalCoins} MORE COINS! 🪙`, 'error');
            }
        }
    }

    purchaseUpgrade(upgradeKey) {
        if (!this.upgrades[upgradeKey]) return;
        const currentLv = this.upgrades[upgradeKey];
        if (currentLv >= this.maxUpgradeLevel) {
            this.hud.showToast('ALREADY AT MAX LEVEL!', 'info');
            return;
        }

        const cost = this.upgradeCosts[upgradeKey][currentLv];
        if (this.totalCoins >= cost) {
            this.totalCoins -= cost;
            this.upgrades[upgradeKey]++;

            localStorage.setItem('apex_racer_total_coins', this.totalCoins);
            localStorage.setItem('apex_racer_upgrades', JSON.stringify(this.upgrades));

            this.updateStoreUI();
            this.audio.playPurchaseSound();
            const names = {
                engine: 'ENGINE TUNING',
                nitro: 'NITRO SUPERCHARGER',
                magnet: 'FLUX MAGNET',
                gold: 'GOLD RUSH',
                shield: 'EMERGENCY SHIELD'
            };
            this.hud.showToast(`${names[upgradeKey] || upgradeKey} UPGRADED TO LV ${this.upgrades[upgradeKey]}! ⚡`, 'highlight');
        } else {
            this.audio.playErrorSound();
            this.hud.showToast(`NEED ${cost - this.totalCoins} MORE COINS! 🪙`, 'error');
        }
    }

    syncModalCustomizers() {
        const hexStr = this.playerColor.toString(16).padStart(6, '0');
        const colorOptions = document.querySelectorAll('.color-swatch');
        colorOptions.forEach(c => {
            c.classList.toggle('active', c.getAttribute('data-color') === hexStr);
        });

        const themeOptions = document.querySelectorAll('.theme-btn');
        themeOptions.forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-theme') === this.currentTheme);
        });
    }

    applyTheme(themeKey) {
        if (!this.world || !this.world.themes[themeKey]) return;
        this.currentTheme = themeKey;
        this.world.setTheme(themeKey);

        const themeObj = this.world.themes[themeKey];
        const themeOptions = document.querySelectorAll('.theme-btn');
        themeOptions.forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-theme') === themeKey);
        });

        if (this.hud && themeObj) {
            this.hud.showToast(`${themeObj.icon || '📍'} MAP: ${themeObj.name}`, 'highlight');
        }
    }

    cycleMapTheme() {
        const mapList = ['beach', 'mountain', 'desert', 'sakura', 'cyberpunk', 'sunset'];
        const curIdx = mapList.indexOf(this.currentTheme);
        const nextIdx = (curIdx + 1) % mapList.length;
        this.applyTheme(mapList[nextIdx]);
    }

    goToMainMenu() {
        this.hud.hideGameOver();
        this.hud.hideStore();
        this.hud.showStartScreen();
        this.hud.setPause(false);
        this.hud.updateStoreCoins(this.totalCoins);

        this.isPlaying = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.isCrashing = false;
        this.isInStore = false;
        this.previewCarModel = this.equippedCar;
        this.crashTimer = 0;
        this.lateralVelocity = 0;
        this.bodyRollAngle = 0;
        this.bodyPitchAngle = 0;
        this.steerAngle = 0;
        this.isJumping = false;
        this.jumpVelocityY = 0;
        this.crashVelocity.set(0, 0, 0);
        this.crashAngularVelocity.set(0, 0, 0);

        // Reset positions & scene to showcase rotation
        this.initPlayer();
        this.playerCar.position.set(this.world.laneCenters[1], 0, 0);
        this.playerCar.rotation.set(0, 0, 0);
        this.playerSpeed = 0;
        this.world.reset(0);
        this.traffic.clear();
        this.collectibles.clear();
        this.effects.clear();

        // Silence engine in menu
        this.audio.updateEngine(0, false, false, false);
        this.hud.updateSpeed(0, 0);
        this.hud.updateNitro(100);
        this.hud.updateStats(0, 0, 0, 1);
        this.hud.updatePowerups(false, false, 0);

        this.syncModalCustomizers();
    }

    startGame() {
        this.hud.hideStartScreen();
        this.hud.hideGameOver();
        this.hud.hideStore();
        this.hud.setPause(false);

        this.isPlaying = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.isCrashing = false;
        this.isInStore = false;
        this.isJumping = false;
        this.jumpVelocityY = 0;
        this.crashTimer = 0;
        this.lateralVelocity = 0;
        this.bodyRollAngle = 0;
        this.bodyPitchAngle = 0;
        this.steerAngle = 0;
        this.crashVelocity.set(0, 0, 0);
        this.crashAngularVelocity.set(0, 0, 0);

        // Ensure equipped car is active
        this.previewCarModel = this.equippedCar;
        this.initPlayer();

        // Apply Upgrades & Car Performance Attributes
        const carInfo = this.carCatalog[this.equippedCar] || this.carCatalog.apex;
        const engineBonus = (this.upgrades.engine - 1) * 2.2;
        this.normalTopSpeed = 42 + engineBonus + carInfo.speedBonus * 0.25;
        this.boostTopSpeed = 62 + engineBonus * 1.5 + carInfo.boostBonus * 0.25;
        this.acceleration = 8 + carInfo.accelBonus * 0.3;

        this.nitroMax = 100 + (this.upgrades.nitro - 1) * 25;
        this.nitroEnergy = this.nitroMax;

        // Reset positions & stats
        this.playerCar.position.set(this.world.laneCenters[1], 0, 0);
        this.playerCar.rotation.set(0, 0, 0);
        this.playerSpeed = 16;
        this.world.reset(0);

        // Emergency Shield Upgrade
        if (this.upgrades.shield > 0) {
            this.hasShield = true;
            if (this.playerCar.userData.shieldMesh) {
                this.playerCar.userData.shieldMesh.visible = true;
            }
            this.hud.showToast('EMERGENCY SHIELD ACTIVE! 🛡️', 'highlight');
        } else {
            this.hasShield = false;
            if (this.playerCar.userData.shieldMesh) {
                this.playerCar.userData.shieldMesh.visible = false;
            }
        }

        this.magnetTimeLeft = 0;
        this.score = 0;
        this.distanceTraveled = 0;
        this.coinsCollected = 0;
        this.multiplier = 1;
        this.nearMissCount = 0;
        this.comboResetTimer = 0;

        // Re-initialize traffic and items
        this.traffic.init(this.playerCar.position.z);
        this.collectibles.init(this.playerCar.position.z);
        this.effects.clear();

        this.hud.showToast('RACE START!', 'success');
    }

    togglePause() {
        if (!this.isPlaying || this.isGameOver) return;
        this.isPaused = !this.isPaused;
        this.hud.setPause(this.isPaused);
        if (this.isPaused) {
            this.clock.stop();
        } else {
            this.clock.start();
        }
    }

    toggleCamera() {
        this.cameraMode = (this.cameraMode + 1) % 3;
        const modes = ['CHASE CAM', 'HOOD CAM', 'TOP-DOWN CAM'];
        this.hud.showToast(modes[this.cameraMode], 'info');
    }

    handleCollect(type, position) {
        switch (type) {
            case 'coin':
                const goldLevel = this.upgrades.gold || 1;
                const coinsGained = goldLevel; // 1 to 5 coins per pickup
                this.coinsCollected += coinsGained;
                this.score += 100 * this.multiplier * coinsGained;
                this.audio.playCoinSound();
                break;
            case 'nitro':
                this.nitroEnergy = Math.min(this.nitroMax, this.nitroEnergy + 40);
                this.audio.playNitroSound();
                this.hud.showToast('NITRO REFILLED! ⚡', 'highlight');
                break;
            case 'shield':
                this.hasShield = true;
                if (this.playerCar.userData.shieldMesh) {
                    this.playerCar.userData.shieldMesh.visible = true;
                }
                this.audio.playPowerupSound();
                this.hud.showToast('SHIELD ACTIVATED! 🛡️', 'success');
                break;
            case 'magnet':
                const magnetDuration = 10 + (this.upgrades.magnet - 1) * 3.0;
                this.magnetTimeLeft = Math.max(this.magnetTimeLeft, magnetDuration);
                this.audio.playPowerupSound();
                this.hud.showToast(`MAGNET ACTIVE (${Math.ceil(magnetDuration)}s)! 🧲`, 'highlight');
                break;
        }
    }

    launchRampJump(speed, rampTruck) {
        if (this.isJumping) return;
        this.isJumping = true;
        if (rampTruck) {
            rampTruck.userData.hasLaunched = true;
        }

        // Lift car up to guarantee complete clearance over truck cab
        this.playerCar.position.y = Math.max(this.playerCar.position.y, 2.6);

        // Dynamic forward boost kick for exhilaration
        this.playerSpeed = Math.min(this.boostTopSpeed + 12, this.playerSpeed + 14);

        // High vertical pop velocity based on vehicle speed
        const speedRatio = Math.max(0.7, speed / this.normalTopSpeed);
        this.jumpVelocityY = 22 + speedRatio * 10; // ~29 to 35 u/s vertical pop!
        this.jumpGravity = -32;

        // Aerodynamic nose-up launch pitch
        this.bodyPitchAngle = -0.28;
        this.playerCar.rotation.x = this.bodyPitchAngle;

        // Reward player with instant Nitro refill
        this.nitroEnergy = this.nitroMax;

        // Big stunt bonus score
        const jumpPoints = 3000 * this.multiplier;
        this.score += jumpPoints;

        // Audio and dynamic visual feedback
        this.audio.playRampJumpSound();
        this.hud.showToast('🚀 MEGA RAMP JUMP! +3,000', 'highlight');
        this.effects.spawnSparks(this.playerCar.position, 24);
        this.effects.addCameraShake(0.85);
    }

    triggerCrash(collision) {
        if (this.isCrashing || this.isGameOver) return;
        this.isCrashing = true;
        this.crashTimer = 0;

        this.audio.playCrashSound();
        this.effects.triggerCrashExplosion(this.playerCar.position);
        this.effects.addCameraShake(1.2);

        // Calculate realistic impact bounce direction away from hit vehicle
        const colPos = collision ? collision.position : this.playerCar.position;
        const deltaX = this.playerCar.position.x - colPos.x;
        const normPush = deltaX >= 0 ? 1 : -1;
        const pushX = normPush * (4.2 + Math.random() * 2.5);

        this.crashVelocity.set(
            pushX,
            5.2 + Math.random() * 2.2, // Lift into air
            this.playerSpeed * 0.45    // Forward slide momentum
        );

        this.crashAngularVelocity.set(
            (Math.random() - 0.5) * 6,
            -normPush * (10 + Math.random() * 5), // Natural spinout
            normPush * (6 + Math.random() * 4)
        );

        if (collision) {
            collision.userData.speed *= 0.25;
            collision.rotation.y += normPush * -0.2; // Realistic impact deflection
            this.effects.spawnSparks(collision.position, 18);
            this.effects.spawnTireSmoke(collision.position, normPush);
        }

        const isNewHigh = this.score > this.highScore;
        if (isNewHigh) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('apex_racer_highscore', this.highScore.toString());
        }
    }

    update(delta) {
        // Crash Sequence Physics (Keeps the game actively animating without freezing!)
        if (this.isCrashing) {
            this.crashTimer += delta;

            // Gravity & velocity integration
            this.crashVelocity.y -= 25 * delta;
            this.playerCar.position.x += this.crashVelocity.x * delta;
            this.playerCar.position.y += this.crashVelocity.y * delta;
            this.playerCar.position.z += this.crashVelocity.z * delta;

            // Road contact, bounce & friction sparks
            if (this.playerCar.position.y <= 0) {
                this.playerCar.position.y = 0;
                if (Math.abs(this.crashVelocity.y) > 2.0) {
                    this.crashVelocity.y = -this.crashVelocity.y * 0.35; // Bounce off asphalt
                    this.effects.addCameraShake(0.35);
                    this.effects.spawnSparks(this.playerCar.position, 14);
                } else {
                    this.crashVelocity.y = 0;
                }
                // Asphalt friction
                this.crashVelocity.x *= 0.88;
                this.crashVelocity.z *= 0.86;
                this.effects.spawnSparks(this.playerCar.position, 6);
                this.effects.spawnTireSmoke(this.playerCar.position, 0);
            }

            // Tumble spin
            this.playerCar.rotation.x += this.crashAngularVelocity.x * delta;
            this.playerCar.rotation.y += this.crashAngularVelocity.y * delta;
            this.playerCar.rotation.z += this.crashAngularVelocity.z * delta;
            this.crashAngularVelocity.multiplyScalar(0.93);

            // Keep the world, traffic, effects, and camera ALIVE!
            this.world.update(this.playerCar.position.z, delta);
            this.traffic.update(delta, this.playerCar.position.z, this.crashVelocity.z, this.playerCar);
            this.effects.update(delta, this.playerCar, false, 0);
            this.updateCamera(delta);
            this.audio.updateEngine(0, false, false, false);

            // Once slide completes (~1.9s), smoothly show Game Over modal
            if (this.crashTimer >= this.crashDuration && !this.isGameOver) {
                this.isGameOver = true;
                this.isPlaying = false;
                this.isCrashing = false;

                // Bank collected coins into persistent wallet
                this.totalCoins += this.coinsCollected;
                localStorage.setItem('apex_racer_total_coins', this.totalCoins);
                this.hud.updateStoreCoins(this.totalCoins);

                const isNewHigh = this.score >= this.highScore;
                this.syncModalCustomizers();
                this.hud.showGameOver(
                    this.score,
                    this.highScore,
                    isNewHigh,
                    this.distanceTraveled,
                    this.coinsCollected,
                    this.nearMissCount
                );
            }
            return;
        }

        if (!this.isPlaying || this.isPaused || this.isGameOver) return;

        // 1. Combo Timer decay
        if (this.comboResetTimer > 0) {
            this.comboResetTimer -= delta;
            if (this.comboResetTimer <= 0) {
                this.multiplier = 1;
            }
        }

        // 2. Magnet Timer decay
        if (this.magnetTimeLeft > 0) {
            this.magnetTimeLeft -= delta;
        }

        // 3. Acceleration & Speed logic
        this.isBoosting = (this.keys.up || this.keys.space) && this.nitroEnergy > 0;

        let targetMax = this.normalTopSpeed;
        if (this.isBoosting) {
            targetMax = this.boostTopSpeed;
            this.nitroEnergy = Math.max(0, this.nitroEnergy - 28 * delta);
        } else {
            // Passive slow recharge
            this.nitroEnergy = Math.min(this.nitroMax, this.nitroEnergy + 4.5 * delta);
        }

        if (this.keys.down) {
            // Braking
            this.playerSpeed = Math.max(this.minSpeed, this.playerSpeed - this.braking * delta);
        } else if (this.isBoosting) {
            this.playerSpeed = Math.min(targetMax, this.playerSpeed + this.acceleration * 1.6 * delta);
        } else {
            // Normal throttle forward
            if (this.playerSpeed < targetMax) {
                this.playerSpeed = Math.min(targetMax, this.playerSpeed + this.acceleration * delta);
            } else {
                this.playerSpeed = Math.max(targetMax, this.playerSpeed - 20 * delta);
            }
        }

        // Taillight brake flare (update only on state transition)
        if (this.isBrakingState !== this.keys.down) {
            this.isBrakingState = this.keys.down;
            if (this.playerCar && this.playerCar.userData.taillightMat) {
                this.playerCar.userData.taillightMat.color.setHex(this.isBrakingState ? 0xff0022 : 0x880011);
            }
        }

        // 4. Lateral Steering (Smooth fluid physics with lateral inertia)
        // Note: In Three.js looking forward along +Z: Left on screen is +X, Right on screen is -X.
        let steerDir = 0; // -1 for Left on screen, +1 for Right on screen
        if (this.keys.left) steerDir -= 1;
        if (this.keys.right) steerDir += 1;

        // Smooth steering acceleration & inertia glide (eliminates stiffness!)
        const targetLatVel = -steerDir * this.maxLateralSpeed;
        if (steerDir !== 0) {
            this.lateralVelocity += (targetLatVel - this.lateralVelocity) * 14 * delta;
        } else {
            this.lateralVelocity += (0 - this.lateralVelocity) * 12 * delta;
        }

        this.playerCar.position.x += this.lateralVelocity * delta;

        // Clamp to road boundaries (-8.8 to 8.8) with soft boundary bounce
        const roadLimit = this.world.roadWidth / 2 - 1.2;
        if (this.playerCar.position.x < -roadLimit) {
            this.playerCar.position.x = -roadLimit;
            this.lateralVelocity = 0;
            this.playerSpeed = Math.max(this.minSpeed, this.playerSpeed - 25 * delta);
        } else if (this.playerCar.position.x > roadLimit) {
            this.playerCar.position.x = roadLimit;
            this.lateralVelocity = 0;
            this.playerSpeed = Math.max(this.minSpeed, this.playerSpeed - 25 * delta);
        }

        // Forward movement
        const forwardDistance = this.playerSpeed * delta;
        this.playerCar.position.z += forwardDistance;
        this.distanceTraveled += forwardDistance;

        // Score based on distance & speed
        this.score += forwardDistance * (this.playerSpeed / 25) * this.multiplier;

        // 5. Body Roll & Pitch Dynamics (Smooth spring suspension)
        const latRatio = this.lateralVelocity / this.maxLateralSpeed; // -1 to +1
        const targetSteerAngle = latRatio * 0.42;
        this.steerAngle += (targetSteerAngle - this.steerAngle) * 14 * delta;

        // Roll when turning (car leans outward with spring damping)
        const targetRoll = -latRatio * 0.15;
        this.bodyRollAngle += (targetRoll - this.bodyRollAngle) * 10 * delta;
        this.playerCar.rotation.z = this.bodyRollAngle;

        // Yaw when turning (front of car points into direction of travel)
        this.playerCar.rotation.y = this.steerAngle * 0.52;

        // Pitch when accelerating / braking
        const targetPitch = this.keys.down ? 0.05 : (this.isBoosting ? -0.04 : 0);
        this.bodyPitchAngle += (targetPitch - this.bodyPitchAngle) * 8 * delta;
        this.playerCar.rotation.x = this.bodyPitchAngle;

        // Vertical Jump & Gravity Integration
        if (this.isJumping) {
            this.jumpVelocityY += this.jumpGravity * delta;
            this.playerCar.position.y += this.jumpVelocityY * delta;

            // In-flight aerodynamic pitch (nose points up while rising, points down while descending)
            const targetJumpPitch = this.jumpVelocityY > 0 ? -0.16 : 0.14;
            this.bodyPitchAngle += (targetJumpPitch - this.bodyPitchAngle) * 6 * delta;
            this.playerCar.rotation.x = this.bodyPitchAngle;

            // Touchdown detection on highway
            if (this.playerCar.position.y <= 0) {
                this.playerCar.position.y = 0;
                this.isJumping = false;
                this.jumpVelocityY = 0;
                this.bodyPitchAngle = 0;
                this.playerCar.rotation.x = 0;

                this.audio.playLandingSound();
                this.effects.spawnTireSmoke(this.playerCar.position, 0);
                this.effects.spawnSparks(this.playerCar.position, 14);
                this.effects.addCameraShake(0.55);
                this.hud.showToast('PERFECT LANDING! 🎯', 'success');
            }
        }

        // Spin wheels
        const wheelAngle = (forwardDistance / 0.36);
        for (let i = 0; i < this.playerCar.userData.wheels.length; i++) {
            this.playerCar.userData.wheels[i].rotation.x += wheelAngle;
        }
        // Steer front wheels
        for (let i = 0; i < this.playerCar.userData.frontWheels.length; i++) {
            this.playerCar.userData.frontWheels[i].rotation.y = this.steerAngle;
        }

        // Tire screech & smoke on hard turns
        const isScreeching = Math.abs(this.lateralVelocity) > 16 && this.playerSpeed > 45;
        this.audio.setTireScreech(isScreeching ? 0.75 : 0);
        if (isScreeching) {
            this.effects.spawnTireSmoke(this.playerCar.position, this.lateralVelocity > 0 ? 1 : -1);
        }

        // 6. Shield Visual Pulse
        if (this.hasShield && this.playerCar.userData.shieldMesh) {
            this.playerCar.userData.shieldMesh.rotation.y += 2.0 * delta;
            this.playerCar.userData.shieldMesh.rotation.z += 1.5 * delta;
        }

        // 7. Update World, Traffic, Collectibles, Effects
        this.world.update(this.playerCar.position.z, delta);

        const trafficResult = this.traffic.update(delta, this.playerCar.position.z, this.playerSpeed, this.playerCar);
        let onRampThisFrame = false;

        if (trafficResult) {
            if (trafficResult.ramp) {
                onRampThisFrame = true;
                // Driving up the inclined ramp platform
                const { car: rampTruck, progress } = trafficResult.ramp;

                // Center-assist guidance onto ramp runway
                this.playerCar.position.x += (rampTruck.position.x - this.playerCar.position.x) * 5 * delta;
                this.lateralVelocity *= 0.8;

                if (progress < 0.88) {
                    this.playerCar.position.y = Math.max(0.12, progress * 1.45);
                    this.bodyPitchAngle = -0.22;
                    this.playerCar.rotation.x = this.bodyPitchAngle;
                    this.effects.spawnSparks(this.playerCar.position, 2);
                } else {
                    // Crest reached -> MEGA LAUNCH!
                    this.launchRampJump(this.playerSpeed, rampTruck);
                }
            } else if (trafficResult.collision) {
                const collision = trafficResult.collision;
                if (this.hasShield) {
                    // Shield absorbs crash!
                    this.hasShield = false;
                    if (this.playerCar.userData.shieldMesh) {
                        this.playerCar.userData.shieldMesh.visible = false;
                    }
                    this.effects.triggerCrashExplosion(collision.position);
                    this.audio.playCrashSound();
                    this.hud.showToast('SHIELD BROKEN! 💥', 'highlight');
                    // Deflect traffic car naturally with speed reduction and sparks
                    collision.userData.speed *= 0.35;
                    collision.rotation.y += (collision.position.x > this.playerCar.position.x ? 0.2 : -0.2);
                    this.effects.spawnSparks(collision.position, 16);
                    this.playerSpeed *= 0.65; // Speed drop penalty
                } else {
                    this.triggerCrash(collision);
                }
            }
        }

        // Soft gravity ground settlement if car drove off ramp side without launching
        if (!this.isJumping && !onRampThisFrame && this.playerCar.position.y > 0) {
            this.playerCar.position.y = Math.max(0, this.playerCar.position.y - 18 * delta);
            if (this.playerCar.position.y === 0) {
                this.bodyPitchAngle = 0;
            }
        }

        const hasActiveMagnet = (this.magnetTimeLeft > 0) || (this.equippedCar === 'phantom');
        this.collectibles.update(
            delta,
            this.clock.getElapsedTime(),
            this.playerCar.position,
            hasActiveMagnet,
            (type, pos) => this.handleCollect(type, pos)
        );

        const speedRatio = this.playerSpeed / this.boostTopSpeed;
        this.effects.update(delta, this.playerCar, this.isBoosting, speedRatio);

        // 8. Update Audio
        this.audio.updateEngine(this.playerSpeed / this.normalTopSpeed, this.keys.up, this.isBoosting, true);

        // 9. Update HUD
        const speedKmH = this.playerSpeed * 2.5; // Displays 40 km/h start -> 105 km/h cruise -> 155 km/h nitro
        this.hud.updateSpeedometer(speedKmH, speedRatio, this.isBoosting);
        this.hud.updateNitro(this.nitroEnergy);
        this.hud.updateStats(this.score, this.distanceTraveled, this.coinsCollected, this.multiplier);
        this.hud.updatePowerups(this.hasShield, hasActiveMagnet, this.magnetTimeLeft);

        // 10. Update Camera
        this.updateCamera(delta);
    }

    updateCamera(delta) {
        if (!this.playerCar) return;

        const carPos = this.playerCar.position;

        if (this.cameraMode === 0) {
            // Chase Cam (Smooth follow with speed lag, dynamic crash tracking & aerial jump elevation)
            const targetX = carPos.x;
            const targetY = 3.6 + (this.isBoosting ? 0.3 : 0) + (this.isCrashing ? 1.8 : 0) + carPos.y * 0.65;
            const targetZ = carPos.z - (this.isCrashing ? 10.5 : 7.5) - (this.playerSpeed / this.boostTopSpeed) * 1.5;

            this.camera.position.x += (targetX - this.camera.position.x) * 12 * delta;
            this.camera.position.y += (targetY - this.camera.position.y) * 8 * delta;
            this.camera.position.z += (targetZ - this.camera.position.z) * 14 * delta;

            const lookTarget = new THREE.Vector3(
                carPos.x + this.steerAngle * 0.8,
                1.4 + carPos.y * 0.75,
                carPos.z + (this.isCrashing ? 4 : 12)
            );
            this.camera.lookAt(lookTarget);

            // Dynamic FOV with speed & crash cinematics
            const crashFovBoost = this.isCrashing ? 10 : 0;
            const targetFov = 68 + (this.playerSpeed / this.boostTopSpeed) * 18 + crashFovBoost;
            this.camera.fov += (targetFov - this.camera.fov) * 5 * delta;
            this.camera.updateProjectionMatrix();
        } else if (this.cameraMode === 1) {
            // Hood / Cockpit View (follows car height in jump)
            this.camera.position.set(carPos.x, 1.35 + carPos.y, carPos.z + 0.6);
            const lookTarget = new THREE.Vector3(carPos.x + this.steerAngle * 1.5, 1.2 + carPos.y, carPos.z + 30);
            this.camera.lookAt(lookTarget);
            this.camera.fov = 80;
            this.camera.updateProjectionMatrix();
        } else {
            // Top-down Arcade Cam
            this.camera.position.set(carPos.x, 24 + carPos.y * 0.5, carPos.z - 10);
            this.camera.lookAt(new THREE.Vector3(carPos.x, carPos.y, carPos.z + 15));
            this.camera.fov = 65;
            this.camera.updateProjectionMatrix();
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        const delta = Math.min(this.clock.getDelta(), 0.1);

        this.update(delta);

        // Idle menu / Showroom car rotation if not racing
        if (!this.isPlaying && this.playerCar && !this.isGameOver) {
            const time = this.clock.getElapsedTime();
            const rotSpeed = this.isInStore ? 0.55 : 0.35;
            const camRadius = this.isInStore ? 5.6 : 6.8;
            const camY = this.isInStore ? 2.4 : 3.2;
            this.camera.position.x = Math.sin(time * rotSpeed) * camRadius;
            this.camera.position.z = Math.cos(time * rotSpeed) * camRadius;
            this.camera.position.y = camY;
            this.camera.lookAt(this.playerCar.position.x, 0.9, this.playerCar.position.z);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Robust game initialization supporting all module load timings
function initGame() {
    try {
        window.game = new Game();
    } catch (err) {
        console.error('[TURBO OVERDRIVE] Initialization error:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

