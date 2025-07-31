// import { db } from "@util/index.ts";
// import { getAccountId } from "@util/paddle.ts";
// import { is, nullable, object, string } from "superstruct";
//
// const Customer = nullable(
//   object({
//     account_id: string(),
//     id: string(),
//     email: string(),
//   }),
// );
//
// function getCustomers(req: Request, accountId: string): unknown[] {
//   const url = new URL(req.url);
//
//   const emails = url.searchParams.get("email")?.split(",");
//   if (emails !== undefined) {
//     return emails.map((email) => {
//       return db
//         .query("SELECT * FROM paddle_customer WHERE email = $email AND account_id = $accountId")
//         .get({ email, accountId });
//     });
//   }
//
//   return db.query("SELECT * FROM paddle_customer WHERE account_id = $accountId").all({ accountId });
// }

export async function handle(_req: Request): Promise<Response> {
  // not implemented

  return new Response("Not Implemented", { status: 501 });
  // const accountId = getAccountId(req);
  // if (accountId.type === "response") {
  //   return accountId.response;
  // }
  // const customers = getCustomers(req, accountId.value)
  //   .filter((val) => is(val, Customer))
  //   .filter((val) => val !== null)
  //   .map(({ account_id: _, ...data }) => data);
  //
  // return Response.json(
  //   { data: customers },
  //   {
  //     status: 200,
  //   },
  // );
}
