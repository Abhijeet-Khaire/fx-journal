export function SkeletonCard() {
  return (
    <div className="glass p-6 space-y-4">
      <div className="shimmer h-4 w-24 rounded" />
      <div className="shimmer h-8 w-32 rounded" />
      <div className="shimmer h-3 w-20 rounded" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass p-6 space-y-4">
      <div className="shimmer h-4 w-32 rounded" />
      <div className="shimmer h-48 w-full rounded-lg" />
    </div>
  );
}
