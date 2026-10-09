export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Names with no Latin letters or digits (e.g. Arabic, Chinese, "!!!") slugify to "".
// Those fall back to `project-<suffix>`; an empty name stays empty.
export function resolveSlug(name: string, fallbackSuffix: string): string {
  const slug = slugify(name);
  if (slug !== "" || name.trim() === "") return slug;
  return `project-${fallbackSuffix}`;
}
