import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/[groupId]/checkGroupTeacher";

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
  mutation($groupStudentId: [ID!]) {
    deleteGroupStudent(filter: { id: $groupStudentId }) {
      groupStudent {
        fullName
      }
    }
  }
`;

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

export async function DELETE(request: Request, { params: { teacherEmail, groupId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de supprimer cet élève !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de supprimer cet élève !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

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

    revalidateTag("getGroup-" + groupId);

    if (result.errors || result.data.deleteGroupStudent.groupStudent.length === 0) {
      console.log(result);
      return NextResponse.json(
        { msg: "Oh non, une erreur est survenue !", status: "error" },
        { status: 400 }
      );
    }

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
