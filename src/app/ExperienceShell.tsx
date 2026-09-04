import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from '../content/chapters';
import ChapterSection from '../components/ChapterSection';
import ProgressRail from '../components/ProgressRail';
import RuntimeErrorBoundary from '../components/RuntimeErrorBoundary';
import SoundToggle from '../components/SoundToggle';
import WebGLFallback, { supportsWebGL } from '../components/WebGLFallback';
import ExperienceCanvas from '../experience/ExperienceCanvas';
import { cinematicProfileFor, resolveCinematicPhase } from '../experience/cinematic';
import { createWebGLRecoveryState, reduceWebGLRecovery } from '../experience/webglRecovery';
import { useExperienceStore } from '../experience/store';
import { classifyRuntimeError } from '../observability/errors';
import { useObservability } from '../observability/react';
import { detectBrowserQuality } from './quality';

const RESTORE_TIMEOUT_MS = 2000;

export default function ExperienceShell() {
  const setGlobalProgress = useExperienceStore((state) => state.setGlobalProgress);
  const setQuality = useExperienceStore((state) => state.setQuality);
  const activeId = useExperienceStore((state) => state.chapterId);
  const localProgress = useExperienceStore((state) => state.localProgress);
  const reducedMotion = useExperienceStore((state) => state.quality.reducedMotion);
  const observability = useObservability();
  const [webgl, setWebgl] = useState(true);
  const [recovery, setRecovery] = useState(createWebGLRecoveryState);
  const previousRecoveryMode = useRef(recovery.mode);
  const previousChapterId = useRef<string | null>(null);
  const journeyCompleted = useRef(false);
  const cinematicPhase = resolveCinematicPhase(cinematicProfileFor(activeId || 'overture'), localProgress).phase;

  useEffect(() => {
    if (activeId !== previousChapterId.current) {
      previousChapterId.current = activeId;
      observability.hub.emit('chapter.enter', { chapterId: activeId });
    }
    if (activeId === 'epilogue' && !journeyCompleted.current) {
      journeyCompleted.current = true;
      observability.hub.emit('journey.complete', { chapterId: activeId });
    }
  }, [activeId, observability]);

  useEffect(() => {
    const supported = supportsWebGL();
    setWebgl(supported);
    if (!supported) observability.hub.emit('webgl.fallback');
  }, [observability]);

  useEffect(() => {
    if (recovery.mode !== 'restoring') return;
    const timer = window.setTimeout(() => {
      setRecovery((current) => reduceWebGLRecovery(current, 'restore-timeout'));
    }, RESTORE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [recovery.mode]);

  useEffect(() => {
    if (recovery.mode === 'fallback' && previousRecoveryMode.current !== 'fallback') {
      observability.hub.emit('webgl.fallback', { chapterId: activeId });
    }
    previousRecoveryMode.current = recovery.mode;
  }, [activeId, observability, recovery.mode]);

  const onContextLost = useCallback(() => {
    observability.hub.emit('webgl.context-lost', { chapterId: activeId });
    setRecovery((current) => reduceWebGLRecovery(current, 'lost'));
  }, [activeId, observability]);

  const onContextRestored = useCallback(() => {
    observability.hub.emit('webgl.context-restored', { chapterId: activeId });
    setRecovery((current) => reduceWebGLRecovery(current, 'restored'));
  }, [activeId, observability]);

  const onRendererError = useCallback((error: Error) => {
    observability.hub.emit('runtime.error', { errorClass: classifyRuntimeError(error), chapterId: activeId });
  }, [activeId, observability]);

  useEffect(() => {
    const updateQuality = () => setQuality(detectBrowserQuality());
    updateQuality();
    window.addEventListener('resize', updateQuality, { passive: true });
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    media?.addEventListener?.('change', updateQuality);
    return () => {
      window.removeEventListener('resize', updateQuality);
      media?.removeEventListener?.('change', updateQuality);
    };
  }, [setQuality]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const scrollFallback = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setGlobalProgress(window.scrollY / max);
    };
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setGlobalProgress(self.progress),
    });
    window.addEventListener('scroll', scrollFallback, { passive: true });
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      scrollFallback();
    });
    return () => {
      trigger.kill();
      window.removeEventListener('scroll', scrollFallback);
    };
  }, [setGlobalProgress]);

  const renderer = webgl && recovery.mode !== 'fallback' ? (
    <RuntimeErrorBoundary
      key={recovery.generation}
      fallback={<WebGLFallback />}
      onError={onRendererError}
    >
      <ExperienceCanvas onContextLost={onContextLost} onContextRestored={onContextRestored} />
    </RuntimeErrorBoundary>
  ) : <WebGLFallback />;

  return (
    <div className="experience-shell" data-active-chapter={activeId} data-cinematic-phase={cinematicPhase} data-reduced-motion={reducedMotion ? 'true' : 'false'} data-webgl-recovery={recovery.mode}>
      <a href="#journey" className="skip-link">Skip to story</a>
      <div className="brand-mark" aria-label="Ten Billion Years">
        <span>10</span>
        <b>BILLION</b>
        <span>YEARS</span>
      </div>
      <SoundToggle />
      <ProgressRail />
      {renderer}
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <main id="journey">
        <h1 className="sr-only">Ten Billion Years — an interactive stellar lifetime</h1>
        {chapters.map((chapter, index) => (
          <ChapterSection chapter={chapter} index={index} key={chapter.id} />
        ))}
      </main>
      <footer className="epilogue-footer">
        <p>Clean-room interactive study · procedural graphics · no proprietary source recovered.</p>
        <a href="#chapter-overture">Return to the beginning</a>
      </footer>
    </div>
  );
}
