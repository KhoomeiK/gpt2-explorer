import React, { useEffect, useRef, useState } from 'react';
import type { GraphState } from '../types';

interface Props {
  graph: GraphState | null;
  showLabels: boolean;
  tokens: string[];
}

// Basic canvas pan/zoom and draw of nodes/links with labels
export const GraphCanvas: React.FC<Props> = ({ graph, showLabels, tokens }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, k: 1 }); // pan (x,y), zoom k
  const dragging = useRef<{x:number; y:number; startX:number; startY:number} | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function render() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (!graph) {
        ctx.save();
        ctx.fillStyle = '#999';
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText('Run a prompt to see the activation graph…', 20, 30);
        ctx.restore();
        raf = requestAnimationFrame(render);
        return;
      }
      ctx.save();
      ctx.translate(w/2 + viewport.x, h/2 + viewport.y);
      ctx.scale(viewport.k, viewport.k);

      // Draw nodes
      for (const n of graph.nodes) {
        ctx.beginPath();
        ctx.fillStyle = n.color;
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw links (defensive against races / stale edge indices)
      ctx.lineWidth = 2.5;
      for (const e of graph.links) {
        const a = graph.nodes[e.source.id];
        const b = graph.nodes[e.target.id];
        if (!a || !b) continue; // skip if endpoints aren’t present yet
        const alpha = Math.max(0.2, Math.min(0.9, e.currStrength));
        ctx.strokeStyle = `rgba(60,60,60,${alpha})`;
        // ctx.strokeStyle = `rgba(0,0,0,1)`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Labels
      if (showLabels) {
        ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (const n of graph.nodes) {
          // const label = tokens[n.id] ?? String(n.id);
          if (!n) continue;
          const label = tokens[n.id] ?? String(n.id);

          ctx.fillStyle = 'rgba(20,20,20,0.9)';
          ctx.fillText(label, n.x + 6, n.y);
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    }
  }, [graph, showLabels, viewport]);

  // Pan/zoom interactions
  useEffect(() => {
    const canvas = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { offsetX, offsetY, deltaY } = e;
      const scale = Math.exp(-deltaY * 0.001);
      const rect = canvas.getBoundingClientRect();
      const cx = (offsetX - rect.width / 2 - viewport.x) / viewport.k;
      const cy = (offsetY - rect.height / 2 - viewport.y) / viewport.k;
      const k = Math.max(0.2, Math.min(6, viewport.k * scale));
      const x = viewport.x + (1 - scale) * (cx * viewport.k);
      const y = viewport.y + (1 - scale) * (cy * viewport.k);
      setViewport({ x, y, k });
    };
    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      dragging.current = { x: viewport.x, y: viewport.y, startX: e.clientX - rect.left, startY: e.clientY - rect.top };
      (e.target as Element).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - rect.left) - dragging.current.startX;
      const dy = (e.clientY - rect.top) - dragging.current.startY;
      setViewport({ ...viewport, x: dragging.current.x + dx, y: dragging.current.y + dy });
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = null;
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [viewport]);

  return (
    <div className="main">
      <div className="canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
