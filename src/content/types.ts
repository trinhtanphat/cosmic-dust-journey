export const sceneIds = [
  'dust',
  'collapse',
  'fusion',
  'main-sequence',
  'red-giant',
  'nebula',
  'white-dwarf',
  'black-hole',
] as const;

export type SceneId = (typeof sceneIds)[number];

export interface SourceProvenance {
  kind: 'authored' | 'observed-public-fact';
  note: string;
  sourceUrl?: string;
}

export interface Chapter {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  interactionCue?: string;
  clockLabel: string;
  scene: SceneId;
  scrollLength: number;
  sourceProvenance: readonly SourceProvenance[];
}
