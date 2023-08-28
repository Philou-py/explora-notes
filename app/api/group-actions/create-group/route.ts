import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";

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
  const { teacherEmail, newGroup } = await request.json();

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
