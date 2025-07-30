import { pageTemplate } from "@util/accounts.google.com";
import type { Context } from "@util/index.ts";

export function handle(_ctx: Context): Response {
  // foo@example.com
  // Some requested scopes were invalid. {invalid=[foo]} Learn more about this error
  // If you are a developer of project_id, see error details.

  const body = `
    <h1>Access blocked: Authorization Error</h1>
    <p>Error 400: invalid_scope </p>
  `;

  return new Response(pageTemplate(body), {
    headers: {
      "content-type": "text/html",
    },
  });
}
