import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { TemplateForGr } from "@/contexts/SideBarContext";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/[groupId]/checkGroupTeacher";

const ADD_EVAL = `
  mutation($input: [AddEvaluationInput!]!) {
    addEvaluation(input: $input) {
      evaluation {
        id
        group {
          name
        }
      }
    }
  }
`;

export async function POST(request: Request, { params: { teacherEmail, groupId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de créer un barème !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de créer un barème !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

  const newEval: TemplateForGr = await request.json();
  const newEvalToSend = {
    title: newEval.title,
    markPrecision: Number(newEval.markPrecision),
    coefficient: Number(newEval.coefficient),
    totalPoints: newEval.categories.reduce((p, cat) => p + cat.maxPoints, 0),
    categories: newEval.categories.map((cat, catRank) => {
      // Remove IDs and add ranks
      delete cat.id;
      cat.rank = catRank;
      return {
        ...cat,
        criteria: cat.criteria.map((crit, critRank) => {
          delete crit.id;
          crit.rank = critRank;
          return crit;
        }),
      };
    }),
    copies: [],
    average: -1,
    isClosed: false,
    criteriaToObserve: [],
    isPublished: false,
    teacher: {
      email: teacherEmail,
    },
    group: {
      id: groupId,
    },
  };

  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: ADD_EVAL,
      variables: { input: newEvalToSend },
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

  const receivedEval = result.data.addEvaluation.evaluation[0];
  return NextResponse.json(
    {
      msg: `Le barème a bien été créé et affecté au groupe ${receivedEval.group.name} !`,
      redirectURL: `/teacher/${teacherEmail}/group/${groupId}/evaluation/${receivedEval.id}`,
      status: "success",
    },
    { status: 200 }
  );
}
