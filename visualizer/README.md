# GPT‑2 Activation Graph Visualizer (Browser)

Visualize token proximity graphs across GPT‑2 layers. Nodes are tokens; edges connect tokens whose hidden states are above a user‑set similarity threshold τ. As you scrub through layers, the graph **morphs smoothly** so you can watch clusters form and split.

https://github.com/nathan-barry/gpt2-webgl is used (or any similar build) to run GPT‑2 small (117M) in the browser via WebGL2.

## Features
- Run GPT‑2 on your prompt (browser).
- Build a **similarity graph** per layer (cosine or dot).
- Interactive **threshold τ** slider and **top‑k cap** to manage density.
- **Smooth morph** of layout between layers (persistent node positions + link strength tweening).
- Nodes **labeled** with their tokens and **color‑graded** by sequence index.
- Pan/zoom canvas; hover labels (basic); live edge/node counts.

## Quick start
1) Clone this repo (or unzip the bundle).
2) Install deps:
   ```bash
   npm install
   ```
3) Download GPT‑2 weights using the upstream script and place the produced files where your dev server can serve them (e.g., `public/`):
   ```bash
   # inside the gpt2-webgl repo
   pip install torch numpy transformers
   python download_weights.py
   # copy the downloaded *.bin files and generated manifest.json into this app's public/ (or adjust the path below)
   ```
4) Patch/expose per‑layer activations from gpt2‑webgl (tiny hook). See **patches/EXPOSING_ACTIVATIONS.md**.
5) Start the dev server:
   ```bash
   npm run dev
   ```
6) Open http://localhost:5173 and enter a short prompt. Click **Run**.

By default the app expects `manifest.json` at `/manifest.json`. Change that in `src/App.tsx` → `loadModel('/manifest.json')` if you host them elsewhere.

## Integration notes
- This visualizer imports `'gpt2-webgl'` at runtime. Make sure your build exposes it as an ESM import or as a global. If bundling issues arise, you can also `window.GPT2 = GPT2` and modify `src/gpt2Adapter.ts` to pick it from `window`.
- We require a forward hook: `onLayerEnd(layerIndex, resid, T, D)` where `resid` is a `Float32Array` of length `T*D` (row‑major, token‑major). If your library already has an attention visualizer, you likely have access to per‑block intermediates—wire them into the hook.
- Sequence lengths beyond ~256 may get heavy for O(T^2) similarity. For longer inputs, increase the **k** cap and raise τ.

## How it morphs
The app runs a single force simulation. When you change the layer or τ, it **does not reset positions**. Instead it merges the old and new edge sets and gently fades link strengths in/out (exponential smoothing), so clusters drift rather than jump.

## Directory overview
- `src/gpt2Adapter.ts` — glue to gpt2‑webgl + tokenizer.
- `src/workers/similarity-worker.ts` — computes similarity matrix per layer and filters edges by τ, capped to top‑k per node.
- `src/graph/simulation.ts` — d3‑force simulation with dynamic link strengths and smooth morphing.
- `src/render/GraphCanvas.tsx` — Canvas 2D renderer for nodes, edges, and labels with pan/zoom.
- `src/ui/Controls.tsx` — thresholds, layer scrubber, play/pause, toggles.

## Roadmap / nice‑to‑haves
- GPU‑accelerated pairwise dot products via a full‑screen WebGL shader.
- Alternative projections (UMAP/PCA) shown side‑by‑side.
- Overlay attention edges for comparison with proximity edges.

## License
MIT
