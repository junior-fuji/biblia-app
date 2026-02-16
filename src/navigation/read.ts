import { router } from "expo-router";

export function goToBook(book: string, chapter = 1) {
  router.push({
    pathname: "/read/[book]",
    params: { book, chapter: String(chapter) },
  });
}
