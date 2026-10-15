// Up to two capital letters for an avatar without a photo: the first letters of the first and
// last words of the name, or the single letter of a one-word name. `?` for a blank name.
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  // `Array.from` splits by code point, so an emoji or other astral character is not cut in half.
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";

  return (first + last).toUpperCase();
}
