import { encodingForModel, Tiktoken } from "js-tiktoken";
import type { ModelRun, LayerActivations } from './types'
import { GPT2WebGL, type ForwardHooks } from 'gpt2-webgl' // resolved by vite alias

let model: GPT2WebGL | null = null

export async function loadModel(manifestUrl: string): Promise<void> {
  if (model) return
  // Fetch the manifest produced by download_weights.py
  const res = await fetch(manifestUrl)
  if (!res.ok) throw new Error(`Failed to fetch manifest at ${manifestUrl}`)
  const manifest = await res.json()

  // Offscreen canvas is fine (we don't need to draw the built-in views)
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024

  model = new GPT2WebGL(canvas, manifest)
  await model.loadWeights()
}

export async function runPrompt(prompt: string): Promise<ModelRun> {
  if (!model) throw new Error('Model not loaded')
  const enc = encodingForModel("gpt2");
  const ids = enc.encode(prompt)
  const tokenStrings = ids.map(id => enc.decode([id]))

  const captures: Float32Array[] = []
  const hooks: ForwardHooks = {
    onLayerEnd: (layerIndex, resid, T, D) => {
      // make a copy to keep it stable
      captures[layerIndex] = new Float32Array(resid)
    },
  }

  // Run one forward pass over the prompt tokens to collect activations
  // (no generation loop needed here)
  await model.forward(ids, hooks)

  if (captures.length === 0) {
    throw new Error('No layer activations captured — is the onLayerEnd hook wired?')
  }

  const T = tokenStrings.length
  const D = captures[0].length / T | 0
  const layers: LayerActivations[] = []
  for (let i = 0; i < captures.length; i++) {
    if (!captures[i]) continue
    layers.push({
      tokens: tokenStrings,
      T, D,
      layerIndex: i,
      data: captures[i],
    })
  }

  // L = last layer index (0-based). If you also emitted final LN with index nLayers, it will be included.
  const L = layers.length - 1
  return { layers, L, T, D, tokens: tokenStrings }
}
