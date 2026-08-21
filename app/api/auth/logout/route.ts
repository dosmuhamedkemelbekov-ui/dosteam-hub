import { destroyDosteamSession } from "../../../dosteam-auth";

export async function GET(request: Request) {
  await destroyDosteamSession();
  return Response.redirect(new URL("/auth", request.url));
}
