import { useEffect, useMemo } from 'react';
import { createAmbientController, createWebAudioDriver } from '../audio/ambient';
import { useExperienceStore } from '../experience/store';

export default function SoundToggle() {
  const soundEnabled = useExperienceStore((state) => state.soundEnabled);
  const setSoundEnabled = useExperienceStore((state) => state.setSoundEnabled);
  const controller = useMemo(() => createAmbientController(createWebAudioDriver()), []);

  useEffect(() => () => controller.dispose(), [controller]);

  const toggle = async () => {
    const next = !soundEnabled;
    try {
      await controller.setEnabled(next);
      setSoundEnabled(next);
    } catch {
      setSoundEnabled(false);
    }
  };

  return (
    <button
      type="button"
      className={`sound-toggle ${soundEnabled ? 'is-on' : ''}`}
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
      onClick={toggle}
    >
      <span className="sound-toggle__bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{soundEnabled ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}
