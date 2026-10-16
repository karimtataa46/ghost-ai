// A spec's creation time for display, in the viewer's locale and time zone, e.g.
// `Oct 16, 2026, 3:10 PM`. Only call it from a client component: the server's locale and time
// zone differ, so a server render would not match the browser's.
export function formatSpecDate(createdAt: string) {
  return new Date(createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
