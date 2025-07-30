export function pageTemplate(body: string): string {
  return `<html lang="en">
<head>
    <title>Sign In - Google Accounts</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
  </head>
  <body style="max-width: 30rem">
    ${body}
  </body>
</html>`;
}
