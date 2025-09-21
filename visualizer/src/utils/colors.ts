// Simple sequence-index -> HSL gradient (blue->magenta around the hue circle)
export function seqIndexToColor(i: number, T: number): string {
  const hueStart = 210; // blue
  const hueEnd = 330;   // magenta
  const hue = hueStart + (hueEnd - hueStart) * (i / Math.max(1, T - 1));
  return `hsl(${hue}, 80%, 55%)`;
}
