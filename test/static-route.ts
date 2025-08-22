import * as sqlite from "bun:sqlite";
import * as test from "./util";

using ctx = test.init();

{
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO global_static_route (url, response_status, response_body) VALUES (
      'https://example.com/',
      200,
      '<div>hello</div>'
    );
    INSERT INTO global_static_route_response_header (global_static_route_url, name, value) VALUES (
      'https://example.com/',
      'x-custom-header',
      'custom-value'
    );
  `);

  const response = await fetch("http://localhost:3001/https://example.com");
  if (response.status !== 200) throw new Error();
  if (response.headers.get("x-custom-header") !== "custom-value") throw new Error();
  if ((await response.text()) !== "<div>hello</div>") throw new Error();
}
