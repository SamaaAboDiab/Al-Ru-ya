/**
 * Shown instantly while a signed-in page loads its data, so navigation responds
 * at once instead of waiting on the server. Shapes echo a typical page: title, then cards.
 */
export default function Loading() {
  return (
    <main className="page" aria-busy="true" aria-live="polite">
      <div className="skeleton-head">
        <span className="skeleton skeleton-circle" />
        <div className="skeleton-lines">
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-text" />
        </div>
      </div>
      <div className="skeleton-grid">
        <span className="skeleton skeleton-card" />
        <span className="skeleton skeleton-card" />
        <span className="skeleton skeleton-card" />
      </div>
    </main>
  );
}
