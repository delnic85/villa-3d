# Villa 3D

Tour virtuale modificabile (three.js + WebXR) pensato per Meta Quest 3; funziona anche da computer e telefono.

- `index.html`, `js/`, `vendor/`: l'app
- `scene.json`: la scena (muri, stanze, arredi). Il tour la ricarica da solo ogni 15 secondi.
- `tools/gen-scene.mjs`: genera `scene.json` dalle misure delle piante (`node tools/gen-scene.mjs "etichetta versione"`)
