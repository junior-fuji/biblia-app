export type ProjectorSlideKind =
  | 'bible-title'
  | 'bible-verse'
  | 'custom'
  | 'blank';

export type ProjectorSlide = {
  id: string;
  kind: ProjectorSlideKind;
  title: string;
  content: string;
  reference?: string;
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