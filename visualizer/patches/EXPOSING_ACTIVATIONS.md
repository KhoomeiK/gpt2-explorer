# Exposing per-layer residual activations from gpt2-webgl

This app needs the **residual stream (hidden states)** after each Transformer block.
If your `gpt2-webgl` build doesn't expose them, add a tiny hook.

Below is a minimal example. Your actual file paths and class names may differ slightly.

---

## 1) Add a `hooks` bag to the forward pass

```ts
// In src/model/GPT2.ts (or similar top-level file)
export class GPT2 {
  async forward(inputIds: number[], hooks?: { onLayerEnd?: (layerIndex: number, resid: Float32Array, T: number, D: number) => void }) {
    const T = inputIds.length;
    // ... token and position embeddings -> resid: Float32Array (T*D)
    let resid = this.embed(inputIds); // Float32Array length T*D

    for (let l = 0; l < this.config.n_layer; l++) {
      resid = this.blocks[l].forward(resid, T);
      if (hooks?.onLayerEnd) hooks.onLayerEnd(l, resid, T, this.config.n_embd);
    }
    // logits = layernorm(resid) * lm_head, etc.
    return { /* logits, etc. */ };
  }
}
```

## 2) Ensure each block returns updated residual of shape (T*D)

```ts
// In src/model/Block.ts
export class Block {
  forward(resid: Float32Array, T: number): Float32Array {
    // attn -> add
    // mlp -> add
    return residOut; // Float32Array length T*D
  }
}
```

With the above, the visualizer can pass `onLayerEnd` to collect per-layer residuals.
