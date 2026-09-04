import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from '../content/chapters';
import ChapterSection from '../components/ChapterSection';
import ProgressRail from '../components/ProgressRail';
import SoundToggle from '../components/SoundToggle';
import WebGLFallback, { supportsWebGL } from '../components/WebGLFallback';
import ExperienceCanvas from '../experience/ExperienceCanvas';
import { detectBrowserQuality } from './quality';
import { useExperienceStore } from '../experience/store';
import { cinematicProfileFor, resolveCinematicPhase } from '../experience/cinematic';

export default function ExperienceShell() {
  const setGlobalProgress = useExperienceStore((state) => state.setGlobalProgress);
  const setQuality = useExperienceStore((state) => state.setQuality);
  const activeId = useExperienceStore((state) => state.chapterId);
  const localProgress = useExperienceStore((state) => state.localProgress);
  const reducedMotion = useExperienceStore((state) => state.quality.reducedMotion);
  const [webgl, setWebgl] = useState(true);
  const cinematicPhase = resolveCinematicPhase(cinematicProfileFor(activeId || 'overture'), localProgress).phase;

  useEffect(() => {
    setWebgl(supportsWebGL());
  }, []);

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

  return (
    <div className="experience-shell" data-active-chapter={activeId} data-cinematic-phase={cinematicPhase} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <a href="#journey" className="skip-link">Skip to story</a>
      <div className="brand-mark" aria-label="Ten Billion Years">
        <span>10</span>
        <b>BILLION</b>
        <span>YEARS</span>
      </div>
      <SoundToggle />
      <ProgressRail />
      {webgl ? <ExperienceCanvas /> : <WebGLFallback />}
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
