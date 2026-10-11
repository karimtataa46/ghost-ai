// Not cryptographic. Uniqueness is enforced by the project ID primary key, not by this suffix.
export function createShortId(): string {
  return Math.floor(Math.random() * 36 ** 6)
    .toString(36)
    .padStart(6, "0");
}
