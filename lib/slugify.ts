// Leaves room for the suffix inside the 128-character project / room ID limit.
const MAX_SLUG_LENGTH = 48;

export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The project ID, which is also its Liveblocks room ID: the name's slug plus a short unique suffix.
// Names with no Latin letters or digits (e.g. Arabic, "!!!") slugify to "" and use `project` instead.
// An empty name has no room ID yet.
export function createRoomId(name: string, suffix: string): string {
  if (name.trim() === "") return "";
  const slug = slugify(name).slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "") || "project";
  return `${slug}-${suffix}`;
}
