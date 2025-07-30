import { db } from "@util/index.ts";
import { is, nullable, object, string } from "superstruct";
import { getprojectId } from "../../../util/paddle";

const Customer = nullable(
  object({
    project_id: string(),
    id: string(),
    email: string(),
  }),
);

function getCustomers(req: Request, projectId: string): unknown[] {
  const url = new URL(req.url);

  const emails = url.searchParams.get("email")?.split(",");
  if (emails !== undefined) {
    return emails.map((email) => {
      return db
        .query("SELECT * FROM paddle_customer WHERE email = $email AND project_id = $projectId")
        .get({ email, projectId });
    });
  }

  return db.query("SELECT * FROM paddle_customer WHERE project_id = $projectId").all({ projectId });
}

export async function handle(req: Request): Promise<Response> {
  const projectId = getprojectId(req);
  if (projectId.type === "response") {
    return projectId.response;
  }
  const customers = getCustomers(req, projectId.value)
    .filter((val) => is(val, Customer))
    .filter((val) => val !== null)
    .map(({ project_id: _, ...data }) => data);

  return Response.json(
    { data: customers },
    {
      status: 200,
    },
  );
}
