/// <reference lib="webworker" />
import type { WorkerMessage, BuildGraphMessage, ThresholdMessage, Edge } from '../types';

let T = 0, D = 0;
let sims: Float32Array | null = null; // row-major T x T
let metric: 'cosine' | 'dot' = 'cosine';

function normalizeRows(data: Float32Array, T: number, D: number): Float32Array {
  const out = new Float32Array(data.length);
  for (let i=0; i<T; i++) {
    let norm = 0;
    const base = i*D;
    for (let j=0; j<D; j++) {
      const v = data[base + j];
      norm += v*v;
    }
    norm = Math.sqrt(norm) || 1.0;
    for (let j=0; j<D; j++) out[base + j] = data[base + j] / norm;
  }
  return out;
}

function computeSims(data: Float32Array, T_: number, D_: number, metric_: 'cosine'| 'dot') {
  T = T_; D = D_; metric = metric_;
  const X = (metric === 'cosine') ? normalizeRows(data, T, D) : data;
  const out = new Float32Array(T*T);
  for (let i=0; i<T; i++) {
    out[i*T + i] = 1.0;
    for (let j=i+1; j<T; j++) {
      let dot = 0;
      let bi = i*D, bj = j*D;
      for (let k=0; k<D; k++) dot += X[bi + k] * X[bj + k];
      out[i*T + j] = dot;
      out[j*T + i] = dot;
    }
  }
  sims = out;
}

function thresholdEdges(threshold: number, kCap = 16): Edge[] {
  if (!sims) return [];
  const edges: Edge[] = [];
  for (let i=0; i<T; i++) {
    // collect candidate neighbors with sim >= threshold
    const nbrs: { j:number; w:number }[] = [];
    for (let j=0; j<T; j++) {
      if (j===i) continue;
      const w = sims[i*T + j];
      if (w >= threshold) nbrs.push({ j, w });
    }
    // pick top-k by weight
    nbrs.sort((a,b)=> b.w - a.w);
    const take = Math.min(kCap, nbrs.length);
    for (let n=0; n<take; n++) {
      const j = nbrs[n].j, w = nbrs[n].w;
      if (i < j) edges.push({ source: i, target: j, w });
    }
  }
  return edges;
}

self.onmessage = (ev: MessageEvent<WorkerMessage>) => {
  const msg = ev.data as WorkerMessage;
  if (msg.type === 'build-sims') {
    const { layerIndex, T, D, data, metric } = msg.payload;
    computeSims(data, T, D, metric);
    (self as any).postMessage({ type: 'sims-ready', payload: { layerIndex } });
  } else if (msg.type === 'threshold') {
    const { threshold, kCap } = msg.payload;
    const edges = thresholdEdges(threshold, kCap);
    (self as any).postMessage({ type: 'edges', payload: { edges } });
  }
};
