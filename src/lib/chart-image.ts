/**
 * Exports a rendered chart (Recharts SVG) to a PNG the user can save.
 *
 * Recharts styles most of its geometry through CSS classes, which are lost the
 * moment an SVG is detached from the document. So we clone the node, freeze the
 * computed paint/typography properties as inline attributes, then rasterise the
 * clone onto a canvas at 2x for a crisp export.
 */

const PAINT_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'text-anchor',
  'dominant-baseline',
] as const;

function inlineStyles(source: SVGElement, clone: SVGElement) {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll<SVGElement>('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll<SVGElement>('*'))];

  sourceNodes.forEach((node, i) => {
    const target = cloneNodes[i];
    if (!target) return;
    const computed = window.getComputedStyle(node);
    let css = '';
    for (const prop of PAINT_PROPS) {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal') css += `${prop}:${value};`;
    }
    if (css) target.setAttribute('style', css);
    target.removeAttribute('class');
  });
}

function resolveBackground(el: Element): string {
  let node: Element | null = el;
  while (node) {
    const bg = window.getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'transparent' && !bg.startsWith('rgba(0, 0, 0, 0)')) return bg;
    node = node.parentElement;
  }
  return '#ffffff';
}

export function chartFileName(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'chart';
  return `${slug}-${new Date().toISOString().slice(0, 10)}.png`;
}

/** Rasterises the first SVG inside `container` and triggers a PNG download. */
export async function saveChartAsPng(container: HTMLElement, filename: string, scale = 2): Promise<void> {
  // Skip the export button's own icon — pick the chart surface itself.
  const svg =
    container.querySelector<SVGSVGElement>('svg.recharts-surface') ??
    Array.from(container.querySelectorAll<SVGSVGElement>('svg')).find(
      (el) => !el.closest('[data-chart-export-control]'),
    );
  if (!svg) throw new Error('No chart found to export');

  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const serialized = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not rasterise the chart'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available in this browser');
    ctx.fillStyle = resolveBackground(container);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, width, height);

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
