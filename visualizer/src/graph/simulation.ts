import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import type { GraphState, Edge } from '../types';

export interface SimController {
  getGraph: () => GraphState;
  setLinks: (links: Edge[]) => void;
  setNodes: (tokens: string[], colors: string[]) => void;
  tick: (dt?: number) => void;
  onTick: (cb: () => void) => void;
}

export function createSimController(T: number): SimController {
  const nodes = Array.from({ length: T }, (_, i) => ({
    id: i, token: '', x: (Math.random()-0.5)*200, y: (Math.random()-0.5)*200, color: '#888'
  }));
  let links: { source: number; target: number; w: number; currStrength: number }[] = [];
  const sim = forceSimulation(nodes as any)
    .force('charge', forceManyBody().strength(-40))
    .force('center', forceCenter(0, 0))
    .stop();

  // Custom link force with dynamic strength
  const linkForce = forceLink(links as any)
    .id((d: any) => d.id)
    .distance((d:any)=> 40)
    .strength((d: any) => d.currStrength);
  sim.force('link', linkForce as any);

  let tickCb: (() => void) | null = null;
  function onTick(cb: () => void) { tickCb = cb; }
  sim.on('tick', () => { if (tickCb) tickCb(); });

  function setLinks(newEdges: Edge[]) {
    const N = nodes.length;
    // keep only edges within bounds (can happen if edges arrive from a previous T)
    newEdges = newEdges.filter(e =>
      e.source >= 0 && e.target >= 0 && e.source < N && e.target < N
    );

    // Merge with existing by key to morph strengths smoothly
    const key = (a:number,b:number) => a < b ? `${a}-${b}` : `${b}-${a}`;
    const nextMap = new Map<string, Edge>();
    for (const e of newEdges) nextMap.set(key(e.source, e.target), e);
    const curMap = new Map<string, { source:number; target:number; w:number; currStrength:number }>();
    for (const e of links) curMap.set(key(e.source, e.target), e);

    // Update existing and create new with currStrength tweening
    const merged: { source:number; target:number; w:number; currStrength:number }[] = [];
    for (const [k, e] of nextMap) {
      const prev = curMap.get(k);
      if (prev) {
        // Tween towards target
        merged.push({ source: e.source, target: e.target, w: e.w, currStrength: prev.currStrength * 0.6 + e.w * 0.4 });
      } else {
        merged.push({ source: e.source, target: e.target, w: e.w, currStrength: Math.min(0.05, e.w*0.5) });
      }
    }
    // Fade out edges that disappeared
    for (const [k, prev] of curMap) {
      if (!nextMap.has(k)) {
        const decayed = { ...prev, currStrength: prev.currStrength * 0.6 };
        if (decayed.currStrength > 0.02) {
          merged.push(decayed);
        }
      }
    }
    links = merged;
    linkForce.links(links as any);
    (linkForce as any).initialize(nodes as any);
    (sim as any).alpha(0.7).restart();
  }

  function setNodes(tokens: string[], colors: string[]) {
    for (let i=0; i<nodes.length; i++) {
      nodes[i].token = tokens[i] ?? '';
      nodes[i].color = colors[i] ?? '#888';
    }
  }

  function tick(dt = 1/60) {
    // advance simulation by a frame (for non-rAF driving)
    for (let i=0; i<1; i++) sim.tick();
  }

  function getGraph(): GraphState {
    return { nodes: nodes as any, links };
  }

  return { getGraph, setLinks, setNodes, tick, onTick };
}
