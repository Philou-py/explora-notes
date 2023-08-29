import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function GET(_: Request) {
  const response = NextResponse.json({}, { status: 200 });
  response.cookies.delete("X-ExploraNotes-Auth");
  revalidateTag("userSideNavBar");
  return response;
}
