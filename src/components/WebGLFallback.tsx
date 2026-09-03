export function supportsWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function WebGLFallback() {
  return (
    <div className="webgl-fallback" role="status">
      <div className="webgl-fallback__glow" aria-hidden="true" />
      <p className="chapter__eyebrow">Narrative mode</p>
      <h2>Your browser is showing the journey without WebGL.</h2>
      <p>The complete stellar story remains below. For the procedural 3D version, enable WebGL or open this page in a modern browser with hardware acceleration.</p>
    </div>
  );
}
