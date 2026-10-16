import { APICallError } from "ai";

// The Gemini models background tasks try, in order. The alias for the current Flash model comes
// first, so a retired version does not break a task; the others answer when the alias is
// overloaded, unavailable, or out of quota (a quota belongs to one model, so each model here has
// its own). The Flash-Lite model is last: faster and cheaper, and it still drew a valid ecommerce
// design when the other two were out of quota.
export const GEMINI_MODEL_IDS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.5-flash-lite"];

// The provider answers 429 when a rate limit or quota is used up. A daily quota (the free tier
// allows 20 requests a day per model) does not clear for hours, so asking the same model again
// cannot work.
export function isRateLimited(error: unknown): boolean {
  return APICallError.isInstance(error) && error.statusCode === 429;
}
