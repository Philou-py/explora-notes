import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";

const ADD_GROUP = `
  mutation($input: [AddGroupInput!]!) {
    addGroup(input: $input) {
      group {
        name
      }
    }
  }
`;

export async function POST(request: Request, { params: { teacherEmail } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de créer un groupe !"
  );
  if (identityCheck !== true) return identityCheck;

  const newGroup = await request.json();

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

  revalidateTag("getTeacher-" + teacherEmail);

  const newGroupName = result.data.addGroup.group[0].name;
  return NextResponse.json(
    { msg: `Le groupe ${newGroupName} a bien été créé !`, status: "success" },
    { status: 201 }
  );
}
