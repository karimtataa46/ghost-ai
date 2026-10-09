// Not cryptographic and not unique across users; mock data only, until the API assigns real ids.
export function createShortId(): string {
  return Math.floor(Math.random() * 36 ** 6)
    .toString(36)
    .padStart(6, "0");
}
