export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 500 | 502;

// Every API error uses this shape, so clients can read `error` on any non-2xx response.
export function errorResponse(status: ApiErrorStatus, message: string) {
  return Response.json({ error: message }, { status });
}

export function unauthorizedResponse() {
  return errorResponse(401, "Unauthorized");
}
