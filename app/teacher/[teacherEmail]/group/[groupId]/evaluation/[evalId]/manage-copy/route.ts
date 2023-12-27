import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { DGRAPH_URL } from "@/config";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/[groupId]/checkGroupTeacher";

const ADD_COPY = `
  mutation($input: [AddCopyInput!]!) {
    addCopy(input: $input) {
      copy {
        id
        groupStudent {
          firstName
          lastName
        }
      }
    }
  }
`;

export async function POST(request: Request, { params: { teacherEmail, groupId, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de créer une copie !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de créer une copie !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

  const { studentId, categoryResults, summary } = await request.json();
  const copy = {
    groupStudent: {
      id: studentId,
    },
    ...summary,
    categoryResults,
    evaluation: { id: evalId },
    shouldObserve: false,
  };

  categoryResults.forEach((catRes: any) => {
    delete catRes.id;
    catRes.criterionResults.forEach((critRes: any) => {
      delete critRes.id;
    });
  });

  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: ADD_COPY,
      variables: {
        input: copy,
      },
    }),
  });

  const { data, errors } = await dgraphRes.json();

  if (errors) {
    console.log(errors);
    return NextResponse.json(
      { msg: "Oh non, une erreur est survenue !", status: "error" },
      { status: 400 }
    );
  }

  const returnedCopy = data.addCopy.copy[0];

  revalidateTag("getEvaluation-" + evalId);
  revalidateTag("getCopy-" + returnedCopy.id);

  const grSt = returnedCopy.groupStudent;
  const stName = `${grSt.firstName} ${grSt.lastName}`;
  return NextResponse.json(
    {
      msg: `La copie de l'élève ${stName} a bien été créée !`,
      status: "success",
    },
    { status: 200 }
  );
}
