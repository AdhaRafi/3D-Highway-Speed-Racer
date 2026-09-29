/**
 * SettingsManager.js
 * Manages Graphics Quality presets (Low/Medium/High/Ultra),
 * Shadows toggle, particle density, DPI scaling, and modal interactions.
 */

export class SettingsManager {
    constructor(game) {
        this.game = game;

        // Default settings
        this.settings = {
            preset: 'high',
            shadows: true,
            particles: 'high',
            resolution: 'native', // '1x' or 'native'
        };

        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem('turbo_racer_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Could not load settings from localStorage:', e);
        }
    }

    save() {
        try {
            localStorage.setItem('turbo_racer_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Could not save settings to localStorage:', e);
        }
    }

    init() {
        this.applySettings();
        this.setupEventListeners();
    }

    applyPreset(preset) {
        this.settings.preset = preset;

        if (preset === 'low') {
            this.settings.shadows = false;
            this.settings.particles = 'low';
            this.settings.resolution = '1x';
        } else if (preset === 'medium') {
            this.settings.shadows = true;
            this.settings.particles = 'low';
            this.settings.resolution = '1x';
        } else if (preset === 'high') {
            this.settings.shadows = true;
            this.settings.particles = 'high';
            this.settings.resolution = 'native';
        } else if (preset === 'ultra') {
            this.settings.shadows = true;
            this.settings.particles = 'ultra';
            this.settings.resolution = 'native';
        }

        this.applySettings();
        this.save();
        this.syncModalUI();
    }

    applySettings() {
        if (!this.game) return;

        // 1. DPI / Resolution Scaling
        const renderer = this.game.renderer;
        if (renderer) {
            if (this.settings.resolution === '1x') {
                renderer.setPixelRatio(1.0);
            } else {
                const maxDpr = this.settings.preset === 'ultra' ? 2.0 : 1.5;
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
            }
        }

        // 2. Shadows
        const world = this.game.world;
        if (renderer && renderer.shadowMap) {
            renderer.shadowMap.enabled = this.settings.shadows;
            if (world && world.sunLight) {
                world.sunLight.castShadow = this.settings.shadows;
            }
        }

        // 3. Particle Density
        const effects = this.game.effects;
        if (effects) {
            if (this.settings.particles === 'low') {
                effects.particleMultiplier = 0.45;
            } else if (this.settings.particles === 'ultra') {
                effects.particleMultiplier = 1.4;
            } else {
                effects.particleMultiplier = 1.0;
            }
        }
    }

    setupEventListeners() {
        // Preset cards / chips
        const presetBtns = document.querySelectorAll('.setting-preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.getAttribute('data-preset');
                this.applyPreset(preset);
            });
        });

        // Toggle switches
        const shadowToggle = document.getElementById('setting-shadows');
        if (shadowToggle) {
            shadowToggle.addEventListener('change', (e) => {
                this.settings.shadows = e.target.checked;
                this.settings.preset = 'custom';
                this.applySettings();
                this.save();
                this.syncModalUI();
            });
        }

        const particleSelect = document.getElementById('setting-particles');
        if (particleSelect) {
            particleSelect.addEventListener('change', (e) => {
                this.settings.particles = e.target.value;
                this.settings.preset = 'custom';
                this.applySettings();
                this.save();
                this.syncModalUI();
            });
        }

        const resSelect = document.getElementById('setting-resolution');
        if (resSelect) {
            resSelect.addEventListener('change', (e) => {
                this.settings.resolution = e.target.value;
                this.settings.preset = 'custom';
                this.applySettings();
                this.save();
                this.syncModalUI();
            });
        }

        // Settings Modal Tabs
        const tabBtns = document.querySelectorAll('.settings-tab-btn');
        tabBtns.forEach(tBtn => {
            tBtn.addEventListener('click', () => {
                const tab = tBtn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.toggle('active', b === tBtn));
                document.querySelectorAll('.settings-tab-pane').forEach(p => {
                    p.classList.toggle('active', p.id === `settings-tab-${tab}`);
                });
            });
        });

        // Close Settings Button
        const closeBtn = document.getElementById('btn-close-settings');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideSettingsModal();
            });
        }

        // Open Settings Buttons
        const openBtns = document.querySelectorAll('.btn-open-settings');
        openBtns.forEach(b => {
            b.addEventListener('click', () => {
                this.showSettingsModal();
            });
        });
    }

    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.syncModalUI();
        }
    }

    hideSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    syncModalUI() {
        // Sync Preset buttons
        const presetBtns = document.querySelectorAll('.setting-preset-btn');
        presetBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-preset') === this.settings.preset);
        });

        // Sync Checkbox & Selects
        const shadowToggle = document.getElementById('setting-shadows');
        if (shadowToggle) shadowToggle.checked = this.settings.shadows;

        const particleSelect = document.getElementById('setting-particles');
        if (particleSelect) particleSelect.value = this.settings.particles;

        const resSelect = document.getElementById('setting-resolution');
        if (resSelect) resSelect.value = this.settings.resolution;
    }
}
