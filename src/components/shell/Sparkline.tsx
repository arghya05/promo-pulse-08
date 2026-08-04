interface SparklineProps {
  data: readonly number[];
  className?: string;
  width?: number;
  height?: number;
}

/** Tiny inline SVG sparkline — no chart library, safe inside headers and chips. */
export const Sparkline = ({ data, className = '', width = 68, height = 22 }: SparklineProps) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${(i * step).toFixed(2)},${(height - ((v - min) / span) * height).toFixed(2)}`);
  const last = points[points.length - 1].split(',');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill="currentColor" />
    </svg>
  );
};
