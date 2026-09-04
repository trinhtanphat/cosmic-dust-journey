import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export default function WebGLRecoveryBoundary({
  onContextLost,
  onContextRestored,
}: {
  onContextLost: () => void;
  onContextRestored: () => void;
}) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    const restored = () => onContextRestored();
    canvas.addEventListener('webglcontextlost', lost, false);
    canvas.addEventListener('webglcontextrestored', restored, false);
    return () => {
      canvas.removeEventListener('webglcontextlost', lost, false);
      canvas.removeEventListener('webglcontextrestored', restored, false);
    };
  }, [gl, onContextLost, onContextRestored]);

  return null;
}
