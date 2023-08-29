import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";

const publicKey = readFileSync("public.key");

const UPDATE_STUDENT = `
  mutation($input: UpdateGroupStudentInput!) {
    updateGroupStudent(input: $input) {
      groupStudent {
        fullName
      }
    }
  }
`;

interface Group {
  teacher: {
    email: string;
  };
}

const GET_GROUP = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      teacher {
        email
      }
    }
  }
`;

async function getGroupTeacher(groupId: string): Promise<Group> {
  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_GROUP,
      variables: { groupId },
    }),
  });
  const result = await dgraphRes.json();
  return result.data.getGroup.teacher.email;
}

export async function PUT(request: Request, { params: { groupId } }) {
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
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de modifier cet élève !",
      },
      { status: 403 }
    );

  const teacherEmail = payload.email;
  const groupTeacher = await getGroupTeacher(groupId);
  if (groupTeacher !== teacherEmail)
    return NextResponse.json(
      {
        status: "error",
        msg: "Désolé, mais vous n'avez pas la permission de modifier cet élève !",
      },
      { status: 403 }
    );

  const { firstName, lastName, id } = await request.json();

  if (firstName === "" || lastName === "")
    return NextResponse.json(
      { status: "error", msg: "Attention ! Vous ne pouvez pas laisser certains champs vides !" },
      { status: 400 }
    );

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: UPDATE_STUDENT,
        variables: {
          input: {
            filter: { id: id },
            set: { firstName, lastName, fullName: `${firstName} ${lastName}` },
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

    revalidateTag("getGroupStudents");

    const studentName = result.data.updateGroupStudent.groupStudent[0].fullName;
    return NextResponse.json(
      { msg: `L'élève ${studentName} a bien été renommé !`, status: "success" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { msg: "Oh non, une erreur non identifiée est survenue !", status: "error" },
      { status: 500 }
    );
  }
}
