import React from 'react';

interface ControlsProps {
  prompt: string;
  setPrompt: (s: string) => void;
  runModel: () => void;
  threshold: number;
  setThreshold: (v: number) => void;
  kCap: number;
  setKCap: (v: number) => void;
  layer: number;
  setLayer: (v: number) => void;
  L: number;
  playing: boolean;
  setPlaying: (b: boolean) => void;
  showLabels: boolean;
  setShowLabels: (b: boolean) => void;
  metric: 'cosine' | 'dot';
  setMetric: (m: 'cosine' | 'dot') => void;
}

export const Controls: React.FC<ControlsProps> = (props) => {
  const {
    prompt, setPrompt, runModel,
    threshold, setThreshold,
    kCap, setKCap,
    layer, setLayer, L,
    playing, setPlaying,
    showLabels, setShowLabels,
    metric, setMetric
  } = props;

  return (
    <div className="sidebar">
      <h2>GPT‑2 Latent Representation Explorer</h2>
      <div className="row">
        <div className="label">Prompt</div>
        <textarea rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} style={{width:'100%'}} placeholder="Type a short prompt and press Run…" />
        <div className="row-inline" style={{marginTop:8}}>
          <button onClick={runModel}>Run</button>
        </div>
      </div>

      <div className="row">
        <div className="label">Similarity metric</div>
        <div className="row-inline">
          <button aria-pressed={metric==='cosine'} onClick={()=>setMetric('cosine')}>Cosine</button>
          <button aria-pressed={metric==='dot'} onClick={()=>setMetric('dot')}>Dot</button>
        </div>
      </div>

      <div className="row">
        <div className="label">Threshold τ (edge if sim ≥ τ)</div>
        <input type="range" min="-1" max="1" step="0.01" value={threshold} onChange={e=>setThreshold(parseFloat(e.target.value))} />
        <div className="hint">τ = {threshold.toFixed(2)}</div>
      </div>

      <div className="row">
        <div className="label">Cap neighbors per node (k)</div>
        <input type="range" min="2" max="24" step="1" value={kCap} onChange={e=>setKCap(parseInt(e.target.value))} />
        <div className="hint">k = {kCap}</div>
      </div>

      <div className="row">
        <div className="label">Layer</div>
        <input type="range" min="0" max={L} step="1" value={layer} onChange={e=>setLayer(parseInt(e.target.value))} />
        <div className="row-inline">
          <div>0</div>
          <div style={{textAlign:'center'}}>ℓ = {layer}</div>
          <div style={{textAlign:'right'}}>{L}</div>
        </div>
        <div className="row-inline">
          <button onClick={()=>setPlaying(!playing)} aria-pressed={playing}>{playing ? 'Pause' : 'Play'}</button>
        </div>
      </div>

      <div className="row checkbox-row">
        <input id="labels" type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)} />
        <label htmlFor="labels">Show token labels</label>
      </div>

      <div className="row">
        <div className="label">Token color legend (by sequence index)</div>
        <div className="legend" />
      </div>

      <div className="row stats">
        <div id="stats"></div>
      </div>

      <div className="row hint">
        <div>Scroll to zoom. Drag to pan.</div>
      </div>
    </div>
  );
}
