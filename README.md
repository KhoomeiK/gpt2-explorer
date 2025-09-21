# GPT-2 Latent Representation Explorer

visualizing high dim space is hard so rather than just PCAing 768 -> 2, it renders similarity as graph connectedness at an adjustable cosine threshold

## Instructions
- follow [gpt2-webgl](https://github.com/nathan-barry/gpt2-webgl)'s (which is mostly mirrored in `gpt2/` but slightly edited to expose activation hooks) instructions to download gpt-2 weights
- copy the weights over to `visualizer/public/assets/weights`
- in `visualizer/` run `npm run i` and then `npm run dev`
- go to `localhost:5173`
