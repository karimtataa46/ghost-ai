import { slugify } from "@/lib/slugify";

// `<project-name>-spec-<yyyy-mm-dd>.md`, ASCII only so it can sit in a header without escaping.
// A spec's filename is not stored: the download route and the spec list both derive it here, so
// the name a list shows is the name the download saves.
export function specFilename(projectName: string, createdAt: Date) {
  const name = slugify(projectName).slice(0, 48).replace(/-+$/, "") || "project";

  return `${name}-spec-${createdAt.toISOString().slice(0, 10)}.md`;
}
