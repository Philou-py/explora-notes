import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response = NextResponse.json({});
  response.cookies.delete("X-ExploraNotes-Auth");
  return response;
}
