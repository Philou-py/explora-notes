import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { readFileSync } from "fs";
import { sign } from "jsonwebtoken";

const privateKey = readFileSync("private.key");

export async function POST(request: Request) {
  const { accountType: aT, email, password } = await request.json();

  try {
    const CHECK_USER_PWD = `
      query($email: String!, $password: String!)  {
        checkUserPassword: ${
          aT === "student" ? "checkStudentPassword" : "checkTeacherPassword"
        }(email: $email, password: $password) {
          email
          displayName: ${aT === "student" ? "username" : "fullName"}
        }
      }
    `;
    const dgraphResponse = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: CHECK_USER_PWD,
        variables: {
          email,
          password,
        },
      }),
    });
    const result = await dgraphResponse.json();
    const checkedUser = result.data.checkUserPassword;

    if (!checkedUser) {
      return NextResponse.json(
        {
          msg: "L'adresse email ou le mot de passe sont incorrects !",
          status: "error",
        },
        { status: 400 }
      );
    }

    const jwt = sign({ accountType: aT, email }, privateKey, {
      algorithm: "RS256",
      expiresIn: "1y",
    });

    const response = NextResponse.json(
      { msg: `Content de vous revoir, ${checkedUser.displayName} !`, status: "success" },
      { status: 201 }
    );

    response.cookies.set({
      name: "X-ExploraNotes-Auth",
      value: jwt,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365, // valid for one year
      sameSite: "strict",
      secure: true,
    });

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { msg: "Oh non, une erreur non identifiée est survenue !", status: "error" },
      { status: 500 }
    );
  }
}
