# 🏎️ 3D Highway Speed Racer (Turbo Overdrive 3D)

A high-speed 3D highway traffic racing game built with **Three.js** and **WebGL**, featuring procedural sports cars, dynamic AI traffic, nitro boost, powerups, synthwave audio, and custom 3D model (.GLB) support!

---

## 🌟 Features

- **High-Speed 3D Highway Action:** Fast-paced traffic dodging on endless multi-lane highways.
- **Dynamic AI Traffic:** Diverse vehicles with realistic lane behavior and speeds.
- **Nitro Boost & Drift Mechanics:** Power through traffic with speed boosts and responsive steering.
- **Custom 3D Car Import:** Load your own `.glb` / `.gltf` 3D car models easily directly from UI or the `models/` directory.
- **Synthwave Audio & FX:** Procedural/synth audio effects, engine sounds, nitro rushes, and immersive background tracks.
- **Multilingual Support:** English & Indonesian language toggles.
- **Rich HUD & Settings:** Camera angle switcher, sound toggles, graphics options, touch & keyboard controls.

---

## 🎮 Controls

| Action | Keyboard | Mobile / Touch |
| --- | --- | --- |
| **Steer Left / Right** | `A` / `D` or `←` / `→` | On-screen Left/Right Buttons or Tilt |
| **Accelerate** | `W` or `↑` | Auto / On-screen Gas Button |
| **Brake / Reverse** | `S` or `↓` | On-screen Brake Button |
| **Nitro Boost** | `Spacebar` or `Shift` | Nitro Button |
| **Switch Camera** | `C` | Camera Toggle Button |
| **Pause Game** | `Esc` or `P` | Pause Button |

---

## 🚀 How to Run Locally

### Option 1: Quick Run (Windows)
Double-click `jalankan_game.bat` to launch the local Node server and automatically open the game in your default browser.

### Option 2: Using Node.js
```bash
# Start server
node server.js
# Or with npm
npm start
```
Then open `http://localhost:3000` in your browser.

### Option 3: Python Simple Server
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

---

## 📁 Project Structure

```text
GameCar/
├── index.html            # Main game HTML & HUD UI layout
├── style.css             # Cyberpunk / modern arcade styling
├── server.js             # Lightweight Node.js static & model API server
├── jalankan_game.bat     # Windows one-click launcher
├── package.json          # Project metadata & npm scripts
├── js/                   # Core game logic (Three.js ES modules)
│   ├── main.js           # Game manager & loop
│   ├── Car.js            # Player car physics & rendering
│   ├── Traffic.js        # AI traffic spawner & behavior
│   ├── World.js          # Infinite highway environment & scenery
│   ├── Effects.js        # Particles, nitro flames & post-effects
│   ├── AudioManager.js   # Dynamic Web Audio synthesizer & sound FX
│   ├── HUD.js            # Heads-up display, speedometer & gauges
│   └── ...
└── models/               # 3D .GLB car models folder
```

---

## 📄 License

This project is licensed under the MIT License - see the [package.json](package.json) file for details.
