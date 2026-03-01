/**
 * Global loading UI
 * Shown while pages are being loaded
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-subtle">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-caption">Loading...</p>
      </div>
    </div>
  );
}
