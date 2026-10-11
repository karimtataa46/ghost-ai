// Reads a request body as a JSON object. An empty body counts as `{}`; invalid JSON,
// arrays, and non-object values return `null` so the caller can answer 400.
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text();

  if (text.trim() === "") {
    return {};
  }

  try {
    const body: unknown = JSON.parse(text);

    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // Falls through to null.
  }

  return null;
}
