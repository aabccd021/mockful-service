export function handle(_req: Request): Response {
  return Response.redirect("https://www.google.com/favicon.ico", 301);
}
