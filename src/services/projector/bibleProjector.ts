ProjectorSlide

type Verse = {
  id: number;
  verse: number;
  text: string;
};

export function buildBibleSlides(
  bookLabel: string,
  chapter: number,
  verses: Verse[]
): ProjectorSlide[] {
  return verses.map((v) => ({
    id: `${bookLabel}-${chapter}-${v.verse}`,
    title: `${bookLabel} ${chapter}:${v.verse}`,
    content: v.text,
    kind: 'verse',
  }));
}