import type { Context } from "@src/util.ts";

export async function handle(ctx: Context, checkoutId: string): Promise<Response> {
  const checkout = ctx.db
    .query("SELECT redirect_url FROM paddle_hosted_checkout WHERE id = :checkout_id")
    .get({ checkout_id: checkoutId });

  if (checkout === null) {
    return new Response("Not Found", { status: 404 });
  }

  const pageContent = `
    <html lang="en">
      <head>
        <title>Paddle Hosted Checkout</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
      </head>
      <body style="max-width: 30rem">
        <form method="POST">
          <button style="height: 2rem" name="next-status" value="paid">Set transaction status to "paid"</button><br>
          <button style="height: 2rem" name="next-status" value="completed">Set transaction status to "completed"</button><br>
        </form>
      </body>
    </html>
  `;

  return new Response(pageContent, {
    headers: {
      "content-type": "text/html",
    },
  });
}
