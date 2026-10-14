export function SkeletonLine({ size = 'md', style }) {
  return <div className={`skeleton skeleton-text skeleton-line-${size}`} style={style} />;
}

export function SkeletonBlock({ height = 100, style }) {
  return <div className="skeleton skeleton-block" style={{ height, ...style }} />;
}

export function SkeletonCircle({ size = 40 }) {
  return <div className="skeleton skeleton-circle" style={{ width: size, height: size }} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass-card">
      <SkeletonLine size="sm" style={{ marginBottom: '1rem' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} size={i % 2 === 0 ? 'lg' : 'md'} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4, lines = 3 }) {
  return (
    <div className="grid-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}
