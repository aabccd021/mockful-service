export function handle(_req: Request): Response {
  return new Response("Not Implemented", {
    status: 501,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
