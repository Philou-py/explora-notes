import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";

const publicKey = readFileSync("public.key");

const invalidJWTMsg = "Oh non ! Vous n'êtes pas connecté(e) !";

export async function checkIdentity(
  accountType: "student" | "teacher" | "all",
  email: string,
  customMsg?: string
): Promise<NextResponse | true> {
  try {
    const cookieStore = cookies();
    const jwt = cookieStore.get("X-ExploraNotes-Auth");
    if (!jwt) return NextResponse.json({ status: "error", msg: invalidJWTMsg }, { status: 401 });

    const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
    if (
      typeof payload !== "object" ||
      (accountType !== "all" && (payload.accountType !== accountType || payload.email !== email))
    ) {
      if (typeof payload === "object")
        console.log(
          `(${payload.email}, ${payload.accountType}) attempted an action as (${email}, ${accountType})!`
        );
      return NextResponse.json(
        {
          status: "error",
          msg: customMsg || invalidJWTMsg,
        },
        { status: 403 }
      );
    }

    return true;
  } catch (error) {
    console.log(`Failed token verification in checkIdentity for ${email}: ${error}`);
    return NextResponse.json({ status: "error", msg: invalidJWTMsg }, { status: 403 });
  }
}
