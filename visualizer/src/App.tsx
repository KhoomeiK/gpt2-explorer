import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controls } from './ui/Controls';
import { GraphCanvas } from './render/GraphCanvas';
import { createSimController } from './graph/simulation';
import { seqIndexToColor } from './utils/colors';
import type { ModelRun } from './types';
import type { Edge } from './types';

// Workers (Vite-friendly URL import)
const workerUrl = new URL('./workers/similarity-worker.ts', import.meta.url);

export const App: React.FC = () => {
  const [prompt, setPrompt] = useState('The quick brown fox jumps over the lazy dog.');
  const [threshold, setThreshold] = useState(0.10);
  const [kCap, setKCap] = useState(8);
  const [layer, setLayer] = useState(0);
  const [L, setL] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [metric, setMetric] = useState<'cosine' | 'dot'>('cosine');

  const [modelRun, setModelRun] = useState<ModelRun | null>(null);
  const simRef = useRef<ReturnType<typeof createSimController> | null>(null);
  const [graphVersion, setGraphVersion] = useState(0); // bump to trigger canvas rerender

  const threshRef = useRef(threshold);
  const kCapRef = useRef(kCap);

  useEffect(() => { threshRef.current = threshold; }, [threshold]);
  useEffect(() => { kCapRef.current = kCap; }, [kCap]);

  // Similarity worker
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    workerRef.current = new Worker(workerUrl, { type: 'module' });
    const w = workerRef.current;
    w.onmessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (msg.type === 'sims-ready') {
        // request edges with current threshold
        w.postMessage({
          type: 'threshold',
          payload: { layerIndex: layer, threshold: threshRef.current, kCap: kCapRef.current },
        });    
      } else if (msg.type === 'edges') {
        const edges: Edge[] = msg.payload.edges;
        // console.log('edges received:', edges.length, 'sample:', edges.slice(0, 5));
        simRef.current?.setLinks(edges);
        setGraphVersion(v => v+1);
        // update stats
        const stats = document.getElementById('stats');
        if (stats) stats.textContent = `|V|=${modelRun?.T ?? 0}  |E|=${edges.length}`;
      }
    };
    return () => { w.terminate(); };
  }, []);

  // Initialize simulation when we know T
  useEffect(() => {
    if (!modelRun) return;
    const T = modelRun.T;
    simRef.current = createSimController(T);
    const colors = Array.from({ length: T }, (_, i) => seqIndexToColor(i, T));
    simRef.current.setNodes(modelRun.tokens, colors);
    setL(modelRun.L);
  }, [modelRun]);

  // Animate layer scrubbing
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setLayer(l => (l >= L ? 0 : l + 1));
    }, 900);
    return () => clearInterval(id);
  }, [playing, L]);

  // When layer changes or threshold/metric changes, rebuild sims & edges
  useEffect(() => {
    if (!modelRun) return;
    buildSims(layer);
  }, [modelRun, layer, metric]);

  useEffect(() => {
    if (!modelRun) return;
    requestEdges();
  }, [threshold, kCap]);

  function buildSims(layerIdx: number) {
    if (!modelRun) return;
    const w = workerRef.current!;
    const la = modelRun.layers[layerIdx];
    w.postMessage({ type: 'build-sims', payload: { layerIndex: layerIdx, T: la.T, D: la.D, data: la.data, metric } });
  }
  function requestEdges() {
    const w = workerRef.current!;
    w.postMessage({ type: 'threshold', payload: { layerIndex: layer, threshold, kCap } });
  }

  async function runModel() {
    // Lazy import to avoid bundling errors if gpt2-webgl isn't present until user adds it
    try {
      const { loadModel, runPrompt } = await import('./gpt2Adapter');
      // Note: update manifest path to where you host the weights (download via repo script)
      await loadModel('/manifest.json');
      const res = await runPrompt(prompt);
      setModelRun(res);
      setLayer(0);
      setPlaying(false);
    } catch (err:any) {
      console.error(err);
      alert('Failed to run GPT‑2. Did you integrate gpt2-webgl and host weights? See README.');
    }
  }

  const graph = useMemo(() => {
    return simRef.current?.getGraph() ?? null;
  }, [graphVersion]);

  return (
    <div className="app">
      <Controls
        prompt={prompt} setPrompt={setPrompt}
        runModel={runModel}
        threshold={threshold} setThreshold={setThreshold}
        kCap={kCap} setKCap={setKCap}
        layer={layer} setLayer={setLayer} L={L}
        playing={playing} setPlaying={setPlaying}
        showLabels={showLabels} setShowLabels={setShowLabels}
        metric={metric} setMetric={setMetric}
      />
      <GraphCanvas graph={graph} showLabels={showLabels} tokens={modelRun?.tokens ?? []} />
    </div>
  );
};
