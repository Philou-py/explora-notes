import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";

const publicKey = readFileSync("public.key");

const UPDATE_GROUP_STUDENT = `
  mutation($input: UpdateGroupStudentInput!) {
    updateGroupStudent(input: $input) {
      groupStudent {
        fullName
      }
    }
  }
`;

export async function POST(request: Request, { params: { studentEmail } }) {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt)
    return NextResponse.json(
      { status: "error", msg: "Oh non ! Vous n'êtes pas connecté(e) !" },
      { status: 401 }
    );

  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object" || payload.accountType === "teacher")
    return NextResponse.json(
      {
        status: "error",
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de rejoindre un groupe !",
      },
      { status: 403 }
    );

  const { studentJWT } = await request.json();

  try {
    const jwtPayload = verify(studentJWT, publicKey, { algorithms: ["RS256"] });

    if (typeof jwtPayload !== "object" || !jwtPayload.groupStudentId) {
      console.log(jwtPayload);
      throw new Error("JWT is invalid!");
    }

    const groupStudentId = jwtPayload.groupStudentId;

    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: UPDATE_GROUP_STUDENT,
        variables: {
          input: {
            filter: { id: groupStudentId },
            set: { studentAccount: { email: studentEmail } },
          },
        },
      }),
    });

    const result = await dgraphRes.json();

    if (result.errors) {
      console.log(result.errors);
      return NextResponse.json(
        { msg: "Oh non, une erreur est survenue !", status: "error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        msg: "Félicitations ! Vous avez bien rejoint un groupe !",
        status: "success",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        msg: "Vous n'avez pas la permission de rejoindre ce groupe !",
      },
      { status: 403 }
    );
  }
}
