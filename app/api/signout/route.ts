import { NextResponse } from "next/server";

export async function GET(_: Request) {
  const response = NextResponse.json({}, { status: 200 });
  response.cookies.delete("X-ExploraNotes-Auth");
  return response;
}
