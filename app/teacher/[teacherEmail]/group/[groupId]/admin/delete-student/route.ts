import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";

const publicKey = readFileSync("public.key");

const GET_COPY_COUNT = `
  query($groupStudentId: ID!) {
    getGroupStudent(id: $groupStudentId) {
      copiesAggregate {
        count
      }
    }
  }
`;

const DELETE_STUDENT = `
  mutation DeleteGroupStudent($groupStudentId: [ID!]) {
    deleteGroupStudent(filter: { id: $groupStudentId }) {
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

async function getCopyCount(groupStudentId: string): Promise<number> {
  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_COPY_COUNT,
      variables: { groupStudentId },
    }),
  });
  const result = await dgraphRes.json();
  return result.data.getGroupStudent.copiesAggregate.count;
}

export async function DELETE(request: Request, { params: { groupId } }) {
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

  const { groupStudentId } = await request.json();

  const copyCount = await getCopyCount(groupStudentId);
  if (copyCount != 0)
    return NextResponse.json(
      {
        status: "error",
        msg: "Attention ! Des copies ont été corrigées pour cet élève, donc vous ne pouvez pas le retirer du groupe !",
      },
      { status: 400 }
    );

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: DELETE_STUDENT,
        variables: { groupStudentId },
      }),
    });

    const result = await dgraphRes.json();

    if (result.errors || result.data.deleteGroupStudent.groupStudent.length === 0) {
      console.log(result);
      return NextResponse.json(
        { msg: "Oh non, une erreur est survenue !", status: "error" },
        { status: 400 }
      );
    }

    revalidateTag("getGroup-" + groupId);

    const studentName = result.data.deleteGroupStudent.groupStudent[0].fullName;
    return NextResponse.json(
      { msg: `L'élève ${studentName} a bien été retiré du groupe !`, status: "success" },
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
