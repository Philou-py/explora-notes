import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/checkGroupTeacher";

export async function DELETE(_: Request, { params: { teacherEmail, groupId, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de supprimer cette évaluation !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de supprimer cette évaluation !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

  const GET_EVAL = `
    getEvaluation(id: "${evalId}") {
      copiesAggregate {
        count
      }
      categories {
        id
        criteria {
          id
        }
      }
    }
  `;
  const response = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query { ${GET_EVAL} }`,
    }),
  });
  const {
    data: { getEvaluation },
  } = await response.json();

  if (getEvaluation.copiesAggregate.count !== 0)
    return NextResponse.json(
      {
        status: "error",
        msg: "Attention, vous ne pouvez pas supprimer cette évaluation, car des copies ont déjà été corrigées !",
      },
      { status: 400 }
    );

  const catIDs = getEvaluation.categories.map((cat: any) => cat.id);
  const critIDs = getEvaluation.categories.reduce(
    (arr: any, cat: any) => arr.concat(cat.criteria.map((crit: any) => crit.id)),
    []
  );

  let OPS = "";

  OPS += `
    deleteEvaluation(filter: { id: "${evalId}" }) {
      evaluation {
        id
        title
      }
    }
  `;

  OPS += `
    deleteCategory(filter: { id: [${catIDs.map((id: string) => `"${id}",`).join(" ")}] }) {
      category {
        id
      }
    }
  `;

  OPS += `
    deleteCriterion(filter: { id: [${critIDs.map((id: string) => `"${id}",`).join(" ")}] }) {
      criterion {
        id
      }
    }
  `;

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation { ${OPS} }`,
      }),
    });

    const result = await dgraphRes.json();

    revalidateTag("getTeacher-" + teacherEmail);

    if (result.errors) {
      console.log(result.errors);
      return NextResponse.json(
        { msg: "Oh non, une erreur est survenue !", status: "error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        msg: `L'évaluation ${result.data.deleteEvaluation.evaluation[0].title} a bien été supprimée !`,
        status: "success",
      },
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
