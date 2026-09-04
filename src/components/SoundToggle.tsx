import { useEffect, useMemo } from 'react';
import { createAmbientController, createWebAudioDriver, type AudioLifecycleState } from '../audio/ambient';
import { sceneAudioEnvelope } from '../audio/sceneAudio';
import { chapters } from '../content/chapters';
import { useExperienceStore } from '../experience/store';
import { useObservability } from '../observability/react';

export default function SoundToggle() {
  const soundEnabled = useExperienceStore((state) => state.soundEnabled);
  const setSoundEnabled = useExperienceStore((state) => state.setSoundEnabled);
  const chapterIndex = useExperienceStore((state) => state.chapterIndex);
  const localProgress = useExperienceStore((state) => state.localProgress);
  const observability = useObservability();
  const audio = useMemo(() => {
    const driver = createWebAudioDriver();
    return { driver, controller: createAmbientController(driver) };
  }, []);
  const scene = chapters[Math.max(0, chapterIndex)]?.scene ?? 'dust';

  useEffect(() => () => audio.controller.dispose(), [audio]);
  useEffect(() => {
    audio.controller.setEnvelope(sceneAudioEnvelope(scene, localProgress));
  }, [audio, localProgress, scene]);

  useEffect(() => {
    let awaitingResume = false;
    const names: Partial<Record<AudioLifecycleState, 'audio.suspended' | 'audio.interrupted' | 'audio.resumed'>> = {
      suspended: 'audio.suspended',
      interrupted: 'audio.interrupted',
    };
    return audio.driver.onStateChange?.((state) => {
      if (state === 'suspended' || state === 'interrupted') awaitingResume = true;
      if (state === 'running' && awaitingResume) {
        awaitingResume = false;
        observability.hub.emit('audio.resumed');
        return;
      }
      const name = names[state];
      if (name) observability.hub.emit(name);
    });
  }, [audio, observability]);

  const toggle = async () => {
    const next = !soundEnabled;
    try {
      await audio.controller.setEnabled(next);
      setSoundEnabled(next);
      observability.hub.emit(next ? 'audio.enabled' : 'audio.disabled');
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
