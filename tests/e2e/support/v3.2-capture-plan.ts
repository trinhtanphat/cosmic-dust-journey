export type CaptureProfileId = 'desktop' | 'mobile' | 'reduced-motion';
export type CaptureKind = 'chapter' | 'boundary';

export interface CaptureCase {
  id: string;
  profile: CaptureProfileId;
  kind: CaptureKind;
  chapterId: string;
  nextChapterId?: string;
  fraction: number;
  reducedMotion: boolean;
}

export const v32CaptureProfiles = ['desktop', 'mobile', 'reduced-motion'] as const satisfies readonly CaptureProfileId[];

export const v32CaptureCases = [
  { id: 'desktop-chapter-overture', profile: 'desktop', kind: 'chapter', chapterId: 'overture', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-cold-cloud', profile: 'desktop', kind: 'chapter', chapterId: 'cold-cloud', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-collapse', profile: 'desktop', kind: 'chapter', chapterId: 'collapse', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-ignition', profile: 'desktop', kind: 'chapter', chapterId: 'ignition', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-main-sequence', profile: 'desktop', kind: 'chapter', chapterId: 'main-sequence', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-red-giant', profile: 'desktop', kind: 'chapter', chapterId: 'red-giant', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-shedding', profile: 'desktop', kind: 'chapter', chapterId: 'shedding', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-white-dwarf', profile: 'desktop', kind: 'chapter', chapterId: 'white-dwarf', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-elsewhere', profile: 'desktop', kind: 'chapter', chapterId: 'elsewhere', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-chapter-epilogue', profile: 'desktop', kind: 'chapter', chapterId: 'epilogue', fraction: 0.5, reducedMotion: false },
  { id: 'desktop-boundary-overture-to-cold-cloud', profile: 'desktop', kind: 'boundary', chapterId: 'overture', nextChapterId: 'cold-cloud', fraction: 0.92, reducedMotion: false },
  { id: 'desktop-boundary-cold-cloud-to-collapse', profile: 'desktop', kind: 'boundary', chapterId: 'cold-cloud', nextChapterId: 'collapse', fraction: 0.92, reducedMotion: false },
  { id: 'desktop-boundary-collapse-to-ignition', profile: 'desktop', kind: 'boundary', chapterId: 'collapse', nextChapterId: 'ignition', fraction: 0.92, reducedMotion: false },
  { id: 'desktop-boundary-ignition-to-main-sequence', profile: 'desktop', kind: 'boundary', chapterId: 'ignition', nextChapterId: 'main-sequence', fraction: 0.92, reducedMotion: false },
  { id: 'desktop-boundary-main-sequence-to-red-giant', profile: 'desktop', kind: 'boundary', chapterId: 'main-sequence', nextChapterId: 'red-giant', fraction: 0.92, reducedMotion: false },
  { id: 'desktop-boundary-red-giant-to-shedding', profile: 'desktop', kind: 'boundary', chapterId: 'red-giant', nextChapterId: 'shedding', fraction: 0.92, reducedMotion: false },
  { id: 'desktop-boundary-shedding-to-white-dwarf', profile: 'desktop', kind: 'boundary', chapterId: 'shedding', nextChapterId: 'white-dwarf', fraction: 0.92, reducedMotion: false },
  { id: 'desktop-boundary-white-dwarf-to-elsewhere', profile: 'desktop', kind: 'boundary', chapterId: 'white-dwarf', nextChapterId: 'elsewhere', fraction: 0.92, reducedMotion: false },
  { id: 'desktop-boundary-elsewhere-to-epilogue', profile: 'desktop', kind: 'boundary', chapterId: 'elsewhere', nextChapterId: 'epilogue', fraction: 0.92, reducedMotion: false },
  { id: 'mobile-chapter-cold-cloud', profile: 'mobile', kind: 'chapter', chapterId: 'cold-cloud', fraction: 0.5, reducedMotion: false },
  { id: 'mobile-boundary-red-giant-to-shedding', profile: 'mobile', kind: 'boundary', chapterId: 'red-giant', nextChapterId: 'shedding', fraction: 0.92, reducedMotion: false },
  { id: 'mobile-boundary-white-dwarf-to-elsewhere', profile: 'mobile', kind: 'boundary', chapterId: 'white-dwarf', nextChapterId: 'elsewhere', fraction: 0.92, reducedMotion: false },
  { id: 'reduced-motion-boundary-red-giant-to-shedding', profile: 'reduced-motion', kind: 'boundary', chapterId: 'red-giant', nextChapterId: 'shedding', fraction: 0.92, reducedMotion: true },
] as const satisfies readonly CaptureCase[];

export function captureCasesForProfile(profile: CaptureProfileId): readonly CaptureCase[] {
  return v32CaptureCases.filter((capture) => capture.profile === profile);
}

export function captureFilename(capture: CaptureCase): string {
  return `${capture.id}.png`;
}

export function captureRelativePath(capture: CaptureCase): string {
  return `${capture.profile}/${captureFilename(capture)}`;
}
