// Fills the workspace's center until the React Flow + Liveblocks canvas replaces it.
export function CanvasPlaceholder() {
  return (
    <div className="bg-grid flex flex-1 items-center justify-center bg-base px-4 py-8">
      <div className="flex max-w-sm flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-copy-secondary">
          The canvas is coming soon
        </p>
        <p className="text-sm text-copy-muted">
          This is where your system design will live.
        </p>
      </div>
    </div>
  );
}
