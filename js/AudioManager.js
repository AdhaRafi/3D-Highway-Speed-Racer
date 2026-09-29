/**
 * AudioManager.js
 * Procedural Web Audio API sound synthesizer for 3D Car Racing.
 * Zero external audio files required - 100% reliable and instantaneous.
 */

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isMusicMuted = false;
        this.initialized = false;

        // Engine sound nodes
        this.engineGain = null;
        this.engineOscA = null;
        this.engineOscB = null;
        this.engineSub = null;
        this.pulseLFO = null;
        this.pulseGain = null;
        this.exhaustNoise = null;
        this.exhaustNoiseFilter = null;
        this.exhaustNoiseGain = null;
        this.exhaustResonator = null;
        this.engineFilter = null;
        this.engineActive = false;

        // Toyota Supra MK4 2JZ-GTE Turbo & "STUTUTUTU" Flutter State
        this.boostPressure = 0;        // 0.0 to 1.0 (accumulates under boost)
        this.wasAccelerating = false;
        this.wasBoosting = false;
        this.currentGear = 1;
        this.lastShiftTime = 0;
        this.lastFlutterTime = 0;
        this.onBackfire = null;        // Callback for exhaust flame visuals
        this.onTurboFlutter = null;    // Callback for HUD toast

        // Twin-Turbo spool whistle nodes
        this.spoolOsc = null;
        this.spoolGain = null;
        this.spoolFilter = null;

        // Tire screech nodes
        this.screechGain = null;
        this.screechSource = null;

        // Synthwave music state
        this.musicInterval = null;
        this.musicStep = 0;
        this.musicTempo = 130;
    }

    init() {
        if (this.initialized) {
            this.resume();
            return;
        }
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        this.initialized = true;

        // Pre-allocate 1-second shared noise buffer ONCE to eliminate all runtime allocations & freezes
        const sampleRate = this.ctx.sampleRate;
        this.sharedNoiseBuffer = this.ctx.createBuffer(1, sampleRate, sampleRate);
        const nData = this.sharedNoiseBuffer.getChannelData(0);
        for (let i = 0; i < sampleRate; i++) {
            nData[i] = Math.random() * 2 - 1;
        }

        this.setupEngineSound();
        this.setupScreechSound();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setupEngineSound() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Master engine output gain
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, now);

        // 1. Custom PeriodicWave representing the legendary Toyota Supra MK4 2JZ-GTE 3.0L Twin-Turbo Inline-6
        // Distinctive metallic rasp, high-RPM howling harmonics, and deep inline-6 combustion rumble
        const numHarmonics = 18;
        const real = new Float32Array(numHarmonics);
        const imag = new Float32Array(numHarmonics);
        const harmonicWeights = [
            0,      // DC
            0.60,   // 1st: Sub rumble (half-order cadence)
            0.92,   // 2nd: Low chest thump
            1.00,   // 3rd: 2JZ Primary 3-pulse inline-6 firing fundamental
            0.55,   // 4th: Even overtone
            0.45,   // 5th: Odd harmonic throat
            0.85,   // 6th: 2JZ 6-cylinder octave howl
            0.35,   // 7th: Metallic cylinder scrape
            0.40,   // 8th: Upper induction body
            0.65,   // 9th: 3rd order resonance (the iconic 2JZ metallic rasp!)
            0.25,   // 10th
            0.20,   // 11th
            0.50,   // 12th: 4th order mechanical singing
            0.15,   // 13th
            0.18,   // 14th
            0.30,   // 15th: High-rpm turbine whistle
            0.12,   // 16th
            0.08    // 17th
        ];
        for (let i = 1; i < numHarmonics; i++) {
            imag[i] = harmonicWeights[i];
        }
        const supra2JZWave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });

        // Bank A: Primary cylinder bank
        this.engineOscA = this.ctx.createOscillator();
        this.engineOscA.setPeriodicWave(supra2JZWave);
        this.engineOscA.frequency.setValueAtTime(45, now);

        // Bank B: Secondary cylinder bank slightly detuned (1.012x) for rich acoustic chorusing
        this.engineOscB = this.ctx.createOscillator();
        this.engineOscB.setPeriodicWave(supra2JZWave);
        this.engineOscB.frequency.setValueAtTime(45.5, now);

        // Sub Rumble oscillator: deep 1st order sub-bass (triangle wave)
        this.engineSub = this.ctx.createOscillator();
        this.engineSub.type = 'triangle';
        this.engineSub.frequency.setValueAtTime(32, now);

        const oscMixGain = this.ctx.createGain();
        oscMixGain.gain.setValueAtTime(0.68, now);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.42, now);

        this.engineOscA.connect(oscMixGain);
        this.engineOscB.connect(oscMixGain);
        this.engineSub.connect(subGain);

        // 2. Combustion Pulse Amplitude Modulator (Tremolo)
        // Modulates engine volume at 2JZ 3-pulse firing cadence
        this.pulseLFO = this.ctx.createOscillator();
        this.pulseLFO.type = 'sawtooth';
        this.pulseLFO.frequency.setValueAtTime(30, now);

        this.pulseGain = this.ctx.createGain();
        this.pulseGain.gain.setValueAtTime(0.24, now); // modulation depth

        const tremoloGain = this.ctx.createGain();
        tremoloGain.gain.setValueAtTime(0.76, now); // base level

        this.pulseLFO.connect(this.pulseGain);
        this.pulseGain.connect(tremoloGain.gain);

        oscMixGain.connect(tremoloGain);
        subGain.connect(tremoloGain);

        // 3. Exhaust Gas Airflow Noise Generator (High-velocity straight-pipe rush)
        this.exhaustNoise = this.ctx.createBufferSource();
        this.exhaustNoise.buffer = this.sharedNoiseBuffer;
        this.exhaustNoise.loop = true;

        this.exhaustNoiseFilter = this.ctx.createBiquadFilter();
        this.exhaustNoiseFilter.type = 'bandpass';
        this.exhaustNoiseFilter.frequency.setValueAtTime(340, now);
        this.exhaustNoiseFilter.Q.setValueAtTime(2.4, now);

        this.exhaustNoiseGain = this.ctx.createGain();
        this.exhaustNoiseGain.gain.setValueAtTime(0.015, now);

        this.exhaustNoise.connect(this.exhaustNoiseFilter);
        this.exhaustNoiseFilter.connect(this.exhaustNoiseGain);

        // 4. Turbocharger Spool Whine (High-frequency turbine whistle)
        this.spoolOsc = this.ctx.createOscillator();
        this.spoolOsc.type = 'sine';
        this.spoolOsc.frequency.setValueAtTime(1600, now);

        this.spoolFilter = this.ctx.createBiquadFilter();
        this.spoolFilter.type = 'bandpass';
        this.spoolFilter.frequency.setValueAtTime(2200, now);
        this.spoolFilter.Q.setValueAtTime(3.8, now);

        this.spoolGain = this.ctx.createGain();
        this.spoolGain.gain.setValueAtTime(0, now);

        this.spoolOsc.connect(this.spoolFilter);
        this.spoolFilter.connect(this.spoolGain);

        // 5. 3-Inch Straight Pipe Exhaust Resonator & Lowpass Cabinet
        this.exhaustResonator = this.ctx.createBiquadFilter();
        this.exhaustResonator.type = 'peaking';
        this.exhaustResonator.frequency.setValueAtTime(280, now);
        this.exhaustResonator.Q.setValueAtTime(2.6, now);
        this.exhaustResonator.gain.setValueAtTime(6.0, now);

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(320, now);
        this.engineFilter.Q.setValueAtTime(2.0, now);

        // Bass shelf for visceral low end
        const bassBoost = this.ctx.createBiquadFilter();
        bassBoost.type = 'lowshelf';
        bassBoost.frequency.setValueAtTime(90, now);
        bassBoost.gain.setValueAtTime(4.5, now);

        // Warm analog saturation curve
        const saturation = this.ctx.createWaveShaper();
        saturation.curve = this.makeWarmSaturationCurve();
        saturation.oversample = '4x';

        // Connect audio graph
        tremoloGain.connect(this.exhaustResonator);
        this.exhaustNoiseGain.connect(this.exhaustResonator);
        this.spoolGain.connect(this.exhaustResonator);

        this.exhaustResonator.connect(bassBoost);
        bassBoost.connect(this.engineFilter);
        this.engineFilter.connect(saturation);
        saturation.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        // Start continuous sound generators
        this.engineOscA.start(now);
        this.engineOscB.start(now);
        this.engineSub.start(now);
        this.pulseLFO.start(now);
        this.exhaustNoise.start(now);
        this.spoolOsc.start(now);
        this.engineActive = true;
    }

    makeWarmSaturationCurve() {
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = Math.tanh(x * 1.5);
        }
        return curve;
    }

    setupScreechSound() {
        if (!this.ctx) return;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.sharedNoiseBuffer;
        noise.loop = true;

        // Realistic tire friction bandpass
        const screechFilter = this.ctx.createBiquadFilter();
        screechFilter.type = 'bandpass';
        screechFilter.frequency.setValueAtTime(750, this.ctx.currentTime);
        screechFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        this.screechGain = this.ctx.createGain();
        this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

        noise.connect(screechFilter);
        screechFilter.connect(this.screechGain);
        this.screechGain.connect(this.ctx.destination);
        noise.start();
    }

    /**
     * Iconic Supra MK4 Turbo Blow-off / Wastegate Compressor Surge ("STUTUTUTU")
     * Lightweight 4-pulse compressor flutter with zero runtime buffer allocations
     */
    playTurboFlutter(intensity = 1.0) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        if (now - this.lastFlutterTime < 0.45) return; // Debounce rapid triggers
        this.lastFlutterTime = now;

        const interval = 0.052; // ~19 Hz flutter cycle frequency
        const chirpFreqs = [
            { start: 1650, end: 1180, dur: 0.044, gain: 0.36 },
            { start: 1480, end: 1040, dur: 0.042, gain: 0.28 },
            { start: 1300, end: 900,  dur: 0.040, gain: 0.20 },
            { start: 1100, end: 760,  dur: 0.038, gain: 0.12 }
        ];

        chirpFreqs.forEach((c, idx) => {
            const t = now + idx * interval;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(c.start, t);
            osc.frequency.exponentialRampToValueAtTime(c.end, t + c.dur);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(c.start * 1.06, t);
            filter.frequency.exponentialRampToValueAtTime(c.end * 0.95, t + c.dur);
            filter.Q.setValueAtTime(6.0, t);

            const peak = c.gain * Math.min(1.4, Math.max(0.4, intensity));
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(peak, t + 0.003);
            gain.gain.exponentialRampToValueAtTime(0.001, t + c.dur);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + c.dur + 0.02);
        });

        // Air pressure release hiss burst using pre-allocated shared noise buffer
        if (this.sharedNoiseBuffer) {
            const hiss = this.ctx.createBufferSource();
            hiss.buffer = this.sharedNoiseBuffer;

            const hissFilter = this.ctx.createBiquadFilter();
            hissFilter.type = 'bandpass';
            hissFilter.frequency.setValueAtTime(2400, now);
            hissFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
            hissFilter.Q.setValueAtTime(2.2, now);

            const hissGain = this.ctx.createGain();
            hissGain.gain.setValueAtTime(0.001, now);
            hissGain.gain.linearRampToValueAtTime(0.24 * intensity, now + 0.012);
            hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            hiss.connect(hissFilter);
            hissFilter.connect(hissGain);
            hissGain.connect(this.ctx.destination);
            hiss.start(now);
            hiss.stop(now + 0.38);
        }

        // Notify HUD toast
        if (this.onTurboFlutter) {
            this.onTurboFlutter(intensity >= 0.8);
        }
    }

    /**
     * Unburnt fuel exhaust backfire pops & bangs (Anti-lag crackles)
     */
    playBackfirePop(count = 1) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const popCount = Math.min(count, 2);

        for (let i = 0; i < popCount; i++) {
            const t = now + 0.03 + i * 0.08;

            // Sub bass exhaust thud
            const sub = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            sub.type = 'triangle';
            sub.frequency.setValueAtTime(140, t);
            sub.frequency.exponentialRampToValueAtTime(35, t + 0.07);

            subGain.gain.setValueAtTime(0.35, t);
            subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

            sub.connect(subGain);
            subGain.connect(this.ctx.destination);
            sub.start(t);
            sub.stop(t + 0.1);

            // Sharp gunshot/whip crack using shared noise buffer
            if (this.sharedNoiseBuffer) {
                const crack = this.ctx.createBufferSource();
                crack.buffer = this.sharedNoiseBuffer;

                const crackFilter = this.ctx.createBiquadFilter();
                crackFilter.type = 'highpass';
                crackFilter.frequency.setValueAtTime(800, t);

                const crackGain = this.ctx.createGain();
                crackGain.gain.setValueAtTime(0.35, t);
                crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

                crack.connect(crackFilter);
                crackFilter.connect(crackGain);
                crackGain.connect(this.ctx.destination);
                crack.start(t);
                crack.stop(t + 0.06);
            }
        }

        if (this.onBackfire) {
            this.onBackfire();
        }
    }

    updateEngine(speedRatio, isAccelerating, isBoosting, isDriving = true) {
        if (!this.ctx || !this.engineActive || this.isMuted || !isDriving) {
            if (this.engineGain && this.ctx) {
                this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            }
            if (this.spoolGain && this.ctx) {
                this.spoolGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            }
            return;
        }

        const now = this.ctx.currentTime;
        const clampedSpeed = Math.max(0, Math.min(speedRatio, 1.4));

        // Simulated high-revving 6-speed manual transmission (2JZ-GTE powerband up to 8,400 RPM)
        let gear = 1;
        let gearRpm = 1050;
        let gearProgress = 0;

        if (clampedSpeed < 0.03) {
            gear = 1;
            gearRpm = 1050 + (isAccelerating ? 700 : 0);
        } else if (clampedSpeed < 0.22) {
            gear = 1;
            gearProgress = (clampedSpeed - 0.03) / 0.19;
            gearRpm = 1800 + gearProgress * 5000; // 1800 -> 6800 RPM
        } else if (clampedSpeed < 0.46) {
            gear = 2;
            gearProgress = (clampedSpeed - 0.22) / 0.24;
            gearRpm = 3200 + gearProgress * 4200; // 3200 -> 7400 RPM
        } else if (clampedSpeed < 0.72) {
            gear = 3;
            gearProgress = (clampedSpeed - 0.46) / 0.26;
            gearRpm = 4000 + gearProgress * 3800; // 4000 -> 7800 RPM
        } else if (clampedSpeed < 1.0) {
            gear = 4;
            gearProgress = (clampedSpeed - 0.72) / 0.28;
            gearRpm = 4800 + gearProgress * 3400; // 4800 -> 8200 RPM
        } else {
            gear = 5;
            gearProgress = Math.min((clampedSpeed - 1.0) / 0.4, 1.0);
            gearRpm = 5600 + gearProgress * 2800; // 5600 -> 8400 RPM (Redline scream!)
        }

        // Add throttle rev flare & nitro surge
        if (isAccelerating) gearRpm += 350;
        if (isBoosting) gearRpm += 750;

        // Upshift detection -> trigger shift flutter & pop (only on distinct upshifts at high revs)
        if (gear > this.currentGear && gearRpm > 5500 && now - this.lastShiftTime > 1.2) {
            this.lastShiftTime = now;
            this.playTurboFlutter(0.6);
            this.playBackfirePop(1);
        }
        this.currentGear = gear;

        // Boost pressure accumulation
        if (isAccelerating || isBoosting) {
            this.boostPressure = Math.min(1.0, this.boostPressure + (isBoosting ? 0.08 : 0.04));
        } else {
            this.boostPressure = Math.max(0, this.boostPressure - 0.08);
        }

        // THROTTLE LIFT-OFF / NITRO RELEASE DETECTION:
        // Only triggers when releasing accelerator after building solid boost
        if (this.wasAccelerating && !isAccelerating && this.boostPressure > 0.38 && now - this.lastFlutterTime > 0.5) {
            this.playTurboFlutter(this.boostPressure);
            this.playBackfirePop(1);
            this.boostPressure = 0;
        } else if (this.wasBoosting && !isBoosting && now - this.lastFlutterTime > 0.5) {
            this.playTurboFlutter(1.2);
            this.playBackfirePop(2);
            this.boostPressure = 0;
        }

        this.wasAccelerating = isAccelerating;
        this.wasBoosting = isBoosting;

        // 2JZ-GTE Inline-6 Fundamental Firing Frequency (3 power strokes per crankshaft rev)
        // 1050 RPM -> 52.5 Hz base, 8400 RPM -> 420 Hz base
        const baseFreq = (gearRpm / 60) * 3.0;
        const detuneFreq = baseFreq * 1.012;

        // Inline-6 combustion pulse frequency
        const pulseFreq = (gearRpm / 60) * 1.5;

        // Straight-pipe exhaust resonator frequency & cutoff
        const resoFreq = 220 + (gearRpm / 8400) * 460 + (isAccelerating ? 90 : 0);
        const filterCutoff = 280 + (gearRpm / 8400) * 980 + (isBoosting ? 380 : 0);

        // Smooth parameter transitions
        if (this.engineOscA) this.engineOscA.frequency.setTargetAtTime(baseFreq, now, 0.07);
        if (this.engineOscB) this.engineOscB.frequency.setTargetAtTime(detuneFreq, now, 0.07);
        if (this.engineSub) this.engineSub.frequency.setTargetAtTime(baseFreq * 0.45, now, 0.07);
        if (this.pulseLFO) this.pulseLFO.frequency.setTargetAtTime(pulseFreq, now, 0.06);

        if (this.exhaustResonator) this.exhaustResonator.frequency.setTargetAtTime(resoFreq, now, 0.08);
        if (this.engineFilter) this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.08);

        // Turbocharger Spool Whistle (Sweeps 1600 Hz -> 5200 Hz with boost and speed)
        if (this.spoolOsc && this.spoolFilter && this.spoolGain) {
            const spoolFreq = 1600 + this.boostPressure * 2600 + clampedSpeed * 1000;
            const spoolVol = (this.boostPressure * (isBoosting ? 0.095 : 0.055)) + (isAccelerating ? 0.02 : 0);
            this.spoolOsc.frequency.setTargetAtTime(spoolFreq, now, 0.08);
            this.spoolFilter.frequency.setTargetAtTime(spoolFreq * 1.05, now, 0.08);
            this.spoolGain.gain.setTargetAtTime(spoolVol, now, 0.06);
        }

        // Exhaust airflow noise volume
        const noiseVol = (0.015 + (clampedSpeed * 0.04) + (isAccelerating ? 0.025 : 0) + (isBoosting ? 0.055 : 0));
        if (this.exhaustNoiseGain) this.exhaustNoiseGain.gain.setTargetAtTime(noiseVol, now, 0.06);
        if (this.exhaustNoiseFilter) this.exhaustNoiseFilter.frequency.setTargetAtTime(280 + clampedSpeed * 460, now, 0.08);

        // Master engine volume (punchy, crisp, visceral)
        const masterVol = 0.14 + clampedSpeed * 0.12 + (isAccelerating ? 0.04 : 0) + (isBoosting ? 0.05 : 0);
        this.engineGain.gain.setTargetAtTime(masterVol, now, 0.05);
    }

    setTireScreech(intensity) {
        if (!this.ctx || !this.screechGain || this.isMuted) return;
        const targetGain = Math.min(Math.max(intensity, 0), 1) * 0.22;
        this.screechGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    playNitroSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // High sweep whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);

        // Nitro exhaust blast pop
        this.playPopSound();
    }

    playPopSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playCoinSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        // Two bright bell tones: 987Hz (B5) -> 1318Hz (E6)
        osc1.frequency.setValueAtTime(987, now);
        osc1.frequency.setValueAtTime(1318, now + 0.08);

        osc2.frequency.setValueAtTime(1975, now);
        osc2.frequency.setValueAtTime(2637, now + 0.08);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.36);
        osc2.stop(now + 0.36);
    }

    playNearMissSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.18);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
    }

    playPowerupSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.18, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.28);
        });
    }

    playRampJumpSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Dynamic soaring whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);

        // Power chord chime (C5, G5, C6)
        [523.25, 783.99, 1046.5].forEach((freq, idx) => {
            const chordOsc = this.ctx.createOscillator();
            const chordGain = this.ctx.createGain();
            chordOsc.type = 'sine';
            chordOsc.frequency.setValueAtTime(freq, now + idx * 0.04);
            chordGain.gain.setValueAtTime(0.16, now + idx * 0.04);
            chordGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);
            chordOsc.connect(chordGain);
            chordGain.connect(this.ctx.destination);
            chordOsc.start(now + idx * 0.04);
            chordOsc.stop(now + idx * 0.04 + 0.45);
        });
    }

    playLandingSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Low impact suspension thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playCrashSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Sub bass impact
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'square';
        subOsc.frequency.setValueAtTime(150, now);
        subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.5);
        subGain.gain.setValueAtTime(0.5, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.65);

        // White noise metal impact explosion
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
    }

    startMusic() {
        if (!this.ctx || this.isMusicMuted || this.musicInterval) return;
        this.musicStep = 0;
        const stepTime = (60 / this.musicTempo) / 4 * 1000; // 16th notes

        // Synthwave chord progression: Am -> F -> C -> G
        const bassNotes = [
            110, 110, 110, 110,  110, 110, 110, 164.81, // A
            87.31, 87.31, 87.31, 87.31,  87.31, 87.31, 130.81, 110, // F
            130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 196, 164.81, // C
            98, 98, 98, 98, 98, 98, 146.83, 130.81 // G
        ];

        this.musicInterval = setInterval(() => {
            if (this.isMusicMuted || !this.ctx || this.ctx.state === 'suspended') return;
            const now = this.ctx.currentTime;
            const noteIndex = this.musicStep % bassNotes.length;
            const freq = bassNotes[noteIndex];

            // Synthwave rolling bass
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq / 2, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, now);
            filter.frequency.exponentialRampToValueAtTime(120, now + 0.12);
            filter.Q.setValueAtTime(5, now);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);

            // Snare / clap on 5 and 13 (2 and 4 beat in 16th grid)
            const beatInBar = this.musicStep % 16;
            if (beatInBar === 4 || beatInBar === 12) {
                this.playSynthSnare(now);
            }

            this.musicStep++;
        }, stepTime);
    }

    playSynthSnare(time) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.12);
    }

    playPurchaseSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const chord = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6 triumphant chord
        chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.2, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.38);
        });
    }

    playErrorSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        // Low rejection buzz pair
        [0, 0.12].forEach((offset) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now + offset);
            osc.frequency.linearRampToValueAtTime(110, now + offset + 0.09);

            gain.gain.setValueAtTime(0.22, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.11);
        });
    }

    playEquipSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        // Mechanical latch / cocking sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.engineGain && this.ctx) {
            this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    toggleMusic() {
        this.isMusicMuted = !this.isMusicMuted;
        if (this.isMusicMuted) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.isMusicMuted;
    }
}
