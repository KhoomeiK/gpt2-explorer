export type FloatVec = Float32Array;

export interface LayerActivations {
  // Hidden states for one layer: T x D flattened row-major (token-major).
  // shape: [T, D] stored as length T*D Float32Array
  tokens: string[]; // decoded tokens for the prompt
  T: number;        // sequence length
  D: number;        // hidden size
  layerIndex: number; // 0..L (0 can be embeddings/resid_pre)
  data: Float32Array;
}

export interface ModelRun {
  layers: LayerActivations[]; // length L+1
  L: number;
  T: number;
  D: number;
  tokens: string[];
}

export interface Edge {
  source: number;
  target: number;
  w: number; // similarity weight (0..1)
}

export interface GraphLayer {
  layerIndex: number;
  // optional full similarity matrix for quick re-thresholding
  sims?: Float32Array; // length T*T (row-major)
  // cached edge sets by threshold bucket
  cache?: Map<string, Edge[]>;
  T: number;
}

export interface GraphState {
  nodes: { id: number; token: string; x: number; y: number; vx?: number; vy?: number; color: string; }[];
  links: { source: number; target: number; w: number; currStrength: number; }[];
}

export interface BuildGraphMessage {
  type: 'build-sims';
  payload: { layerIndex: number; T: number; D: number; data: Float32Array; metric: 'cosine' | 'dot' };
}

export interface ThresholdMessage {
  type: 'threshold';
  payload: { layerIndex: number; threshold: number; percentile?: number; kCap?: number };
}

export type WorkerMessage = BuildGraphMessage | ThresholdMessage;

