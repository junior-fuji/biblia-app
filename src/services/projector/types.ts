export type ProjectorSlideKind =
  | 'verse'
  | 'stanza'
  | 'chorus'
  | 'bible-title'
  | 'bible-verse'
  | 'event'
  | 'sketch'
  | 'custom'
  | 'blank';

export type ProjectorSlide = {
  id: string;
  kind: ProjectorSlideKind;
  title: string;
  content: string;
  reference?: string;
  verseNumber?: number;
  meta?: {
    bookLabel?: string;
    chapter?: number;
    verse?: number;
    [key: string]: unknown;
  };
};

export type ProjectorDeck = {
  id: string;
  title: string;
  createdAt: string;
  slides: ProjectorSlide[];
};