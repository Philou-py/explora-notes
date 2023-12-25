import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/checkGroupTeacher";

const DELETE_COPY = `
  mutation($copyId: [ID!]) {
    deleteCopy(filter: { id: $copyId }) {
      copy {
        groupStudent {
          fullName
        }
      }
    }
  }
`;

export async function DELETE(request: Request, { params: { teacherEmail, groupId, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de supprimer cette copie !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de supprimer cette copie !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

  const { copyId } = await request.json();

  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: DELETE_COPY,
      variables: { copyId },
    }),
  });

  const result = await dgraphRes.json();

  revalidateTag("getEvaluation-" + evalId);
  revalidateTag("getCopy-" + copyId);

  if (result.errors || result.data.deleteCopy.copy.length === 0) {
    console.log(result);
    return NextResponse.json(
      { msg: "Oh non, une erreur est survenue !", status: "error" },
      { status: 400 }
    );
  }

  const studentName = result.data.deleteCopy.copy[0].groupStudent.fullName;
  return NextResponse.json(
    {
      msg: `La copie de l'élève ${studentName} a bien été supprimée !`,
      status: "success",
    },
    { status: 200 }
  );
}
