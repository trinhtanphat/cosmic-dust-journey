import { useEffect, useMemo } from 'react';
import { createAmbientController, createWebAudioDriver } from '../audio/ambient';
import { sceneAudioEnvelope } from '../audio/sceneAudio';
import { chapters } from '../content/chapters';
import { useExperienceStore } from '../experience/store';

export default function SoundToggle() {
  const soundEnabled = useExperienceStore((state) => state.soundEnabled);
  const setSoundEnabled = useExperienceStore((state) => state.setSoundEnabled);
  const chapterIndex = useExperienceStore((state) => state.chapterIndex);
  const localProgress = useExperienceStore((state) => state.localProgress);
  const controller = useMemo(() => createAmbientController(createWebAudioDriver()), []);
  const scene = chapters[Math.max(0, chapterIndex)]?.scene ?? 'dust';

  useEffect(() => () => controller.dispose(), [controller]);
  useEffect(() => {
    controller.setEnvelope(sceneAudioEnvelope(scene, localProgress));
  }, [controller, localProgress, scene]);

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
