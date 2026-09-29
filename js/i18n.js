/**
 * i18n.js
 * Internationalization module for Turbo Overdrive 3D.
 * Supports Indonesian (Bahasa Indonesia 🇮🇩) and English (English 🇬🇧).
 */

export const translations = {
    id: {
        // App Title & Taglines
        app_title: "TURBO OVERDRIVE 3D",
        app_subtitle: "Balapan Jalan Tol Berkecepatan Tinggi",

        // Main Menu / Start Screen
        start_race: "⚡ MULAI BALAPAN",
        store: "🛒 GARASI & TOKO",
        settings: "⚙️ PENGATURAN",
        select_livery: "Pilih Warna Supercar",
        select_map: "Pilih Pemandangan Map",

        // Controls Quick Guide & Table
        controls_steer: "Kemudi",
        controls_steer_left: "Belok Kiri",
        controls_steer_right: "Belok Kanan",
        controls_nitro: "Nitro Boost",
        controls_brake: "Rem",
        controls_cam: "Ganti Sudut Kamera",
        controls_map: "Ganti Pemandangan Map",
        controls_pause: "Jeda / Menu Game",
        controls_settings: "Buka Pengaturan",

        // Map Names
        map_beach: "🏖️ Pantai Tropis",
        map_mountain: "🏔️ Gunung Salju",
        map_desert: "🏜️ Gurun Canyon",
        map_sakura: "🌸 Lembah Sakura",
        map_cyberpunk: "🌃 Cyberpunk",
        map_sunset: "🌇 Neon Sunset",

        // HUD Elements
        hud_speed_unit: "KM/H",
        hud_nitro: "NITRO BOOST",
        hud_nitro_ready: "NITRO SIAP! ⚡",
        hud_shield: "🛡️ PERISAI",
        hud_magnet: "🧲 MAGNET",
        hud_coins: "KOIN",
        hud_score: "SKOR",
        hud_distance: "JARAK",

        // Pause Screen
        pause_title: "GAME DIJEDA",
        pause_subtitle: "Ganti pemandangan map atau istirahat sejenak",
        pause_live_map: "Pilih Pemandangan Langsung",
        resume_race: "LANJUTKAN BALAPAN",
        main_menu: "🏠 MENU UTAMA",

        // Game Over Screen
        game_over_crash: "MOBIL TABRAKAN!",
        game_over_crash_sub: "Hati-hati dengan lalu lintas di jalan raya!",
        game_over_new_record: "🏆 REKOR TERBAIK BARU!",
        game_over_final_score: "SKOR AKHIR",
        game_over_high_score: "REKOR TERBAIK",
        game_over_distance: "JARAK TEMPUH",
        game_over_coins: "KOIN DIPEROLEH",
        game_over_near_miss: "HAMPIR TABRAK",
        game_over_change_livery: "Ganti Warna Supercar",
        game_over_change_map: "Ganti Pemandangan Map",
        game_over_race_again: "⚡ BALAPAN LAGI",

        // Settings Modal
        settings_title: "PENGATURAN GAME",
        settings_subtitle: "Sesuaikan Kualitas Grafik & Bahasa",
        settings_tab_graphics: "🎨 Grafik",
        settings_tab_language: "🌐 Bahasa",
        settings_tab_controls: "🎮 Kontrol",
        settings_preset: "Preset Kualitas Grafik",
        settings_preset_low: "Rendah (Hemat FPS)",
        settings_preset_medium: "Sedang (Seimbang)",
        settings_preset_high: "Tinggi (Rekomendasi)",
        settings_preset_ultra: "Ultra (Maksimal)",
        settings_shadows: "Bayangan Dinamis",
        settings_shadows_desc: "Efek bayangan matahari Three.js realistis",
        settings_particles: "Kualitas Partikel & Asap",
        settings_particles_desc: "Percikan benturan, api turbo knalpot & asap ban",
        settings_resolution: "Skala Resolusi Render (DPI)",
        settings_resolution_desc: "1x untuk kecepatan maksimal, 1.5x/2x untuk ketajaman tinggi",
        settings_language_select: "Pilih Bahasa / Select Language",
        settings_save_close: "SIMPAN & TUTUP",

        // Garage / Store
        store_title: "GARASI & TOKO UPGRADE",
        store_subtitle: "Beli supercar eksotis & tingkatkan kemampuan balap",
        store_tab_cars: "🏎️ MOBIL SPORT",
        store_tab_upgrades: "⚡ UPGRADE MESIN",
        store_return: "KEMBALI KE BALAPAN",
        store_equipped: "DIPAKAI",
        store_equip: "PAKAI",
        store_buy: "BELI",
        store_max: "MAX",
        store_upgrade_btn: "UPGRADE",

        // Toasts
        toast_map_changed: "📍 MAP: ",
        toast_shield_broken: "PERISAI HANCUR! 💥",
        toast_landing: "PENDARATAN SEMPURNA! 🎯",
        toast_nitro_empty: "NITRO BELUM SIAP!",
        toast_lang_changed: "Bahasa berhasil diubah ke Bahasa Indonesia! 🇮🇩",
        toast_settings_saved: "Pengaturan berhasil disimpan! ✅"
    },

    en: {
        // App Title & Taglines
        app_title: "TURBO OVERDRIVE 3D",
        app_subtitle: "Endless High-Speed Highway Racer",

        // Main Menu / Start Screen
        start_race: "⚡ START RACE",
        store: "🛒 GARAGE & STORE",
        settings: "⚙️ SETTINGS",
        select_livery: "Select Supercar Livery",
        select_map: "Select Scenery Map",

        // Controls Quick Guide & Table
        controls_steer: "Steer",
        controls_steer_left: "Steer Left",
        controls_steer_right: "Steer Right",
        controls_nitro: "Nitro Boost",
        controls_brake: "Brake",
        controls_cam: "Camera View",
        controls_map: "Cycle Map",
        controls_pause: "Pause Game",
        controls_settings: "Open Settings",

        // Map Names
        map_beach: "🏖️ Emerald Beach",
        map_mountain: "🏔️ Alpine Ridge",
        map_desert: "🏜️ Red Rock Desert",
        map_sakura: "🌸 Kyoto Blossom",
        map_cyberpunk: "🌃 Cyberpunk",
        map_sunset: "🌇 Neon Sunset",

        // HUD Elements
        hud_speed_unit: "KM/H",
        hud_nitro: "NITRO BOOST",
        hud_nitro_ready: "NITRO READY! ⚡",
        hud_shield: "🛡️ SHIELD",
        hud_magnet: "🧲 MAGNET",
        hud_coins: "COINS",
        hud_score: "SCORE",
        hud_distance: "DISTANCE",

        // Pause Screen
        pause_title: "GAME PAUSED",
        pause_subtitle: "Switch scenery map or take a quick breather",
        pause_live_map: "Live Scenery Switcher",
        resume_race: "RESUME RACE",
        main_menu: "🏠 MAIN MENU",

        // Game Over Screen
        game_over_crash: "CAR CRASHED!",
        game_over_crash_sub: "Watch out for highway traffic next time!",
        game_over_new_record: "🏆 NEW PERSONAL BEST!",
        game_over_final_score: "FINAL SCORE",
        game_over_high_score: "HIGH SCORE",
        game_over_distance: "DISTANCE",
        game_over_coins: "COINS COLLECTED",
        game_over_near_miss: "NEAR MISSES",
        game_over_change_livery: "Change Supercar Livery",
        game_over_change_map: "Change Scenery Map",
        game_over_race_again: "⚡ RACE AGAIN",

        // Settings Modal
        settings_title: "GAME SETTINGS",
        settings_subtitle: "Customize Graphics Quality & Language",
        settings_tab_graphics: "🎨 Graphics",
        settings_tab_language: "🌐 Language",
        settings_tab_controls: "🎮 Controls",
        settings_preset: "Graphics Quality Preset",
        settings_preset_low: "Low (Max FPS)",
        settings_preset_medium: "Medium (Balanced)",
        settings_preset_high: "High (Recommended)",
        settings_preset_ultra: "Ultra (Maximum)",
        settings_shadows: "Dynamic Shadows",
        settings_shadows_desc: "Realtime 3D sun shadow map",
        settings_particles: "Particle & Smoke Quality",
        settings_particles_desc: "Crash sparks, turbo backfire & tire drift smoke",
        settings_resolution: "Render Resolution Scale (DPI)",
        settings_resolution_desc: "1x for fastest rendering, 1.5x/2x for crystal-clear visuals",
        settings_language_select: "Select Language",
        settings_save_close: "APPLY & CLOSE",

        // Garage / Store
        store_title: "GARAGE & UPGRADE STORE",
        store_subtitle: "Acquire exotic supercars & upgrade performance",
        store_tab_cars: "🏎️ SPORTS CARS",
        store_tab_upgrades: "⚡ PERFORMANCE",
        store_return: "RETURN TO RACE",
        store_equipped: "EQUIPPED",
        store_equip: "EQUIP",
        store_buy: "BUY",
        store_max: "MAX",
        store_upgrade_btn: "UPGRADE",

        // Toasts
        toast_map_changed: "📍 MAP: ",
        toast_shield_broken: "SHIELD BROKEN! 💥",
        toast_landing: "PERFECT LANDING! 🎯",
        toast_nitro_empty: "NITRO NOT READY!",
        toast_lang_changed: "Language switched to English! 🇬🇧",
        toast_settings_saved: "Settings applied successfully! ✅"
    }
};

class I18nManager {
    constructor() {
        // Default to Indonesian as requested by the user, or restore saved choice
        const savedLang = localStorage.getItem('turbo_racer_lang');
        this.currentLang = (savedLang === 'en' || savedLang === 'id') ? savedLang : 'id';
    }

    get lang() {
        return this.currentLang;
    }

    t(key) {
        const dict = translations[this.currentLang] || translations.id;
        return dict[key] || key;
    }

    setLanguage(newLang) {
        if (!translations[newLang]) return;
        this.currentLang = newLang;
        localStorage.setItem('turbo_racer_lang', newLang);
        this.updateDOM();

        // Dispatch custom event for modules that need to refresh their strings
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
    }

    toggleLanguage() {
        const nextLang = this.currentLang === 'id' ? 'en' : 'id';
        this.setLanguage(nextLang);
        return nextLang;
    }

    updateDOM() {
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                // If element has icons/kbd children that shouldn't be overwritten, handle gracefully
                el.textContent = translation;
            }
        });

        // Update active class on language toggle buttons
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            const btnLang = btn.getAttribute('data-lang');
            btn.classList.toggle('active', btnLang === this.currentLang);
        });

        // Update quick toggle button text if exists
        const quickLangBtn = document.getElementById('btn-quick-lang');
        if (quickLangBtn) {
            quickLangBtn.textContent = this.currentLang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN';
        }
    }
}

export const i18n = new I18nManager();
