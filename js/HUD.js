/**
 * HUD.js
 * Manages racing instruments, speedometer gauge, nitro bar, score counters,
 * powerup badges, popups, and user interaction modals.
 */

export class HUDManager {
    constructor() {
        // Elements
        this.speedValue = document.getElementById('speed-value');
        this.rpmArc = document.getElementById('rpm-arc');
        this.scoreValue = document.getElementById('score-value');
        this.distanceValue = document.getElementById('distance-value');
        this.coinValue = document.getElementById('coin-value');
        this.multiplierValue = document.getElementById('multiplier-value');
        this.nitroFill = document.getElementById('nitro-fill');
        this.nitroText = document.getElementById('nitro-text');

        this.badgeShield = document.getElementById('badge-shield');
        this.badgeMagnet = document.getElementById('badge-magnet');
        this.bannerToast = document.getElementById('banner-toast');

        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.storeScreen = document.getElementById('store-screen');
        this.storeCoinVal = document.getElementById('store-coin-val');
        this.titleCoinVal = document.getElementById('title-coin-val');

        this.finalScoreEl = document.getElementById('final-score');
        this.highScoreEl = document.getElementById('high-score');
        this.statDistanceEl = document.getElementById('stat-distance');
        this.statCoinsEl = document.getElementById('stat-coins');
        this.statNearMissEl = document.getElementById('stat-near-miss');
        this.newRecordBadge = document.getElementById('new-record-badge');

        this.toastTimeout = null;
    }

    updateSpeedometer(speedKmH, speedRatio, isBoosting) {
        if (this.speedValue) {
            this.speedValue.textContent = Math.floor(speedKmH);
        }

        if (this.rpmArc) {
            // RPM Arc length from 0 to 220
            const maxDash = 220;
            const rpm = speedRatio * maxDash;
            this.rpmArc.style.strokeDashoffset = maxDash - rpm;
            if (isBoosting) {
                this.rpmArc.style.stroke = '#00f7ff';
            } else if (speedRatio > 0.85) {
                this.rpmArc.style.stroke = '#ff0055';
            } else if (speedRatio > 0.5) {
                this.rpmArc.style.stroke = '#facc15';
            } else {
                this.rpmArc.style.stroke = '#38bdf8';
            }
        }
    }

    updateNitro(percent) {
        if (this.nitroFill) {
            this.nitroFill.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
        }
        if (this.nitroText) {
            if (percent >= 100) {
                this.nitroText.textContent = 'NITRO READY!';
                this.nitroText.classList.add('pulse');
            } else {
                this.nitroText.textContent = `${Math.floor(percent)}%`;
                this.nitroText.classList.remove('pulse');
            }
        }
    }

    updateStats(score, distanceMeters, coins, multiplier) {
        if (this.scoreValue) this.scoreValue.textContent = Math.floor(score).toLocaleString();
        if (this.distanceValue) this.distanceValue.textContent = `${(distanceMeters / 1000).toFixed(2)} km`;
        if (this.coinValue) this.coinValue.textContent = coins;
        if (this.multiplierValue) this.multiplierValue.textContent = `${multiplier}x`;
    }

    updatePowerups(hasShield, hasMagnet, magnetTimeLeft) {
        if (this.badgeShield) {
            this.badgeShield.style.display = hasShield ? 'flex' : 'none';
        }
        if (this.badgeMagnet) {
            this.badgeMagnet.style.display = hasMagnet ? 'flex' : 'none';
            if (hasMagnet) {
                const subEl = this.badgeMagnet.querySelector('.badge-time');
                if (subEl) subEl.textContent = `${Math.ceil(magnetTimeLeft)}s`;
            }
        }
    }

    showToast(message, type = 'info') {
        if (!this.bannerToast) return;

        this.bannerToast.textContent = message;
        this.bannerToast.className = `toast-banner show ${type}`;

        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.bannerToast.className = 'toast-banner';
        }, 1200);
    }

    showGameOver(score, highScore, isNewHigh, distance, coins, nearMisses) {
        if (this.finalScoreEl) this.finalScoreEl.textContent = Math.floor(score).toLocaleString();
        if (this.highScoreEl) this.highScoreEl.textContent = Math.floor(highScore).toLocaleString();
        if (this.statDistanceEl) this.statDistanceEl.textContent = `${Math.floor(distance)} m`;
        if (this.statCoinsEl) this.statCoinsEl.textContent = coins;
        if (this.statNearMissEl) this.statNearMissEl.textContent = nearMisses;

        if (this.newRecordBadge) {
            this.newRecordBadge.style.display = isNewHigh ? 'block' : 'none';
        }

        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = 'flex';
        }
    }

    hideGameOver() {
        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = 'none';
        }
    }

    hideStartScreen() {
        if (this.startScreen) {
            this.startScreen.style.display = 'none';
        }
    }

    showStartScreen() {
        if (this.startScreen) {
            this.startScreen.style.display = 'flex';
        }
    }

    setPause(isPaused) {
        if (this.pauseScreen) {
            this.pauseScreen.style.display = isPaused ? 'flex' : 'none';
        }
    }

    showStore() {
        if (this.storeScreen) {
            this.storeScreen.style.display = 'flex';
        }
    }

    hideStore() {
        if (this.storeScreen) {
            this.storeScreen.style.display = 'none';
        }
    }

    updateStoreCoins(coins) {
        const formatted = Math.floor(coins).toLocaleString();
        if (this.storeCoinVal) this.storeCoinVal.textContent = formatted;
        if (this.titleCoinVal) this.titleCoinVal.textContent = formatted;
    }

    renderUpgradePips(upgradeKey, currentLevel, maxLevel, cost, isMax) {
        const container = document.getElementById(`pips-${upgradeKey}`);
        if (container) {
            container.innerHTML = '';
            for (let i = 1; i <= maxLevel; i++) {
                const pip = document.createElement('div');
                pip.className = `pip ${i <= currentLevel ? 'filled' : ''}`;
                container.appendChild(pip);
            }
        }

        const btn = document.querySelector(`.btn-upgrade[data-upgrade="${upgradeKey}"]`);
        if (btn) {
            if (isMax) {
                btn.textContent = 'MAX LEVEL';
                btn.disabled = true;
            } else {
                btn.textContent = `UPGRADE ${cost} 🪙`;
                btn.disabled = false;
            }
        }
    }

    updateCarCardUI(model, isOwned, isEquipped, price) {
        const card = document.querySelector(`.car-card[data-model="${model}"]`);
        if (!card) return;

        const actionBtn = card.querySelector('.btn-car-action');
        const tag = card.querySelector('.car-tag');

        if (isEquipped) {
            card.classList.add('active');
            if (tag) {
                tag.className = 'car-tag tag-unlocked';
                tag.textContent = 'EQUIPPED';
            }
            if (actionBtn) {
                actionBtn.className = 'btn-car-action btn-equipped';
                actionBtn.textContent = 'EQUIPPED';
                actionBtn.disabled = true;
            }
        } else if (isOwned) {
            card.classList.remove('active');
            if (tag) {
                tag.className = 'car-tag tag-unlocked';
                tag.textContent = 'UNLOCKED';
            }
            if (actionBtn) {
                actionBtn.className = 'btn-car-action btn-equip';
                actionBtn.textContent = 'SELECT CAR';
                actionBtn.disabled = false;
            }
        } else {
            card.classList.remove('active');
            if (tag) {
                tag.className = 'car-tag tag-price';
                tag.textContent = `🪙 ${price}`;
            }
            if (actionBtn) {
                actionBtn.className = 'btn-car-action btn-buy';
                actionBtn.textContent = `BUY ${price} 🪙`;
                actionBtn.disabled = false;
            }
        }
    }
}

