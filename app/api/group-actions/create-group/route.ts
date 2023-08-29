import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";

const publicKey = readFileSync("public.key");

const ADD_GROUP = `
  mutation($input: [AddGroupInput!]!) {
    addGroup(input: $input) {
      group {
        name
      }
    }
  }
`;

export async function POST(request: Request) {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt)
    return NextResponse.json(
      { status: "error", msg: "Oh non ! Vous n'êtes pas connecté(e) !" },
      { status: 401 }
    );

  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object" || payload.accountType === "student")
    return NextResponse.json(
      {
        status: "error",
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de créer un groupe !",
      },
      { status: 403 }
    );

  const teacherEmail = payload.email;

  const newGroup = await request.json();

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: ADD_GROUP,
        variables: {
          input: {
            ...newGroup,
            schoolYear: new Date().getFullYear(),
            teacher: { email: teacherEmail },
            evaluations: [],
            groupStudents: [],
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

    const newGroupName = result.data.addGroup.group[0].name;
    return NextResponse.json(
      { msg: `Le groupe ${newGroupName} a bien été créé !`, status: "success" },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { msg: "Oh non, une erreur non identifiée est survenue !", status: "error" },
      { status: 500 }
    );
  }
}
