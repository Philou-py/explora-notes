import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/checkGroupTeacher";

const UPDATE_EVAL = `
  mutation($input: UpdateEvaluationInput!) {
    updateEvaluation(input: $input) {
      evaluation {
        id
      }
    }
  }
`;

export async function POST(request: Request, { params: { teacherEmail, groupId, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de modifier cette évaluation !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de modifier cette évaluation !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

  const { isPublished } = await request.json();

  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: UPDATE_EVAL,
      variables: {
        input: {
          filter: { id: evalId },
          set: { isPublished },
        },
      },
    }),
  });
  const result = await dgraphRes.json();

  revalidateTag("getEvalPublished-" + evalId);

  if (result.errors) {
    console.log(result.errors);
    return NextResponse.json(
      { msg: "Oh non, une erreur est survenue !", status: "error" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      msg: `L'évaluation a bien été rendue ${isPublished ? "publique" : "privée"} !`,
      status: "success",
    },
    { status: 200 }
  );
}
