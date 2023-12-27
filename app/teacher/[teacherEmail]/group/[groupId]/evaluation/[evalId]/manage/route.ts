import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";
import { checkEvalTeacher } from "@/app/teacher/[teacherEmail]/group/[groupId]/evaluation/[evalId]/checkEvalTeacher";
import { roundNum } from "@/helpers/roundNum";
import { utils, write } from "xlsx";
import { TemplateForGr } from "@/contexts/SideBarContext";

const GET_COPIES = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      copies {
        id
      }
    }
  }
`;

export async function PUT(request: Request, { params: { teacherEmail, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de modifier cette évaluation !"
  );
  if (identityCheck !== true) return identityCheck;

  const evalTeacherCheck = await checkEvalTeacher(
    evalId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de modifier cette évaluation !"
  );
  if (evalTeacherCheck !== true) return evalTeacherCheck;

  type RequestBody = TemplateForGr & { criteriaToObserve: string[] };
  const updatedEval: RequestBody = await request.json();
  const eToSend = {
    title: updatedEval.title,
    coefficient: Number(updatedEval.coefficient),
    totalPoints: updatedEval.categories.reduce((p, cat) => p + cat.maxPoints, 0),
    criteriaToObserve: updatedEval.criteriaToObserve,
  };

  let OPS = "";

  const crToObStr = eToSend.criteriaToObserve.map((crit) => `{ id: "${crit}" },`).join(" ");
  OPS += `
    updateEvaluation(input: { filter: { id: "${evalId}" }, set: { title: "${eToSend.title}", coefficient: ${eToSend.coefficient}, totalPoints: ${eToSend.totalPoints}, criteriaToObserve: [${crToObStr}] } }) {
      evaluation {
        title
      }
    }
  `;

  const updatedCategories = updatedEval.categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    maxPoints: cat.maxPoints,
  }));
  const updatedCriteria = updatedEval.categories.reduce(
    (arr, cat) =>
      arr.concat(
        cat.criteria.map((crit) => ({ id: crit.id, label: crit.label, maxPoints: crit.maxPoints }))
      ),
    []
  );

  updatedCategories.map((cat) => {
    OPS += `
      updateCategory${cat.id}: updateCategory(input: { filter: { id: "${cat.id}" }, set: { label: "${cat.label}", maxPoints: ${cat.maxPoints} } }) {
        category {
          id
        }
      }
    `;
  });
  updatedCriteria.map((crit) => {
    OPS += `
      updateCriterion${crit.id}: updateCriterion(input: { filter: { id: "${crit.id}" }, set: { label: "${crit.label}", maxPoints: ${crit.maxPoints} } }) {
        criterion {
          id
        }
      }
    `;
  });

  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: `mutation { ${OPS} }` }),
  });

  const result = await dgraphRes.json();

  if (result.errors) {
    return NextResponse.json(
      { msg: "Oh non, une erreur est survenue !", status: "error" },
      { status: 400 }
    );
  }

  const copyResp = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: GET_COPIES, variables: { evalId } }),
  });
  const copyResult = await copyResp.json();
  const copyIDs: string[] = copyResult.data.getEvaluation.copies.map((copy: any) => copy.id);

  let OPS2 = ``;
  copyIDs.map((id) => {
    OPS2 += `
        updateCopy(input: { filter: { id: "${id}" }, set: { shouldObserve: true } }) {
          copy {
            id
          }
        }
      `;
  });

  const updateCopiesResponse = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: `mutation { ${OPS2} }` }),
  });

  const updateCopiesResult = await updateCopiesResponse.json();

  if (updateCopiesResult.errors) {
    console.log(updateCopiesResult.errors);
    return NextResponse.json(
      { msg: "Oh non, une erreur est survenue !", status: "error" },
      { status: 400 }
    );
  }

  revalidateTag("getTeacher-" + teacherEmail);
  revalidateTag("getEvaluation-" + evalId);
  copyIDs.forEach((copyId) => revalidateTag("getCopy-" + copyId));

  return NextResponse.json(
    {
      msg: `L'évaluation ${result.data.updateEvaluation.evaluation[0].title} a bien été modifiée !`,
      status: "success",
    },
    { status: 200 }
  );
}

// ################################ DELETE ################################

export async function DELETE(_: Request, { params: { teacherEmail, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de supprimer cette évaluation !"
  );
  if (identityCheck !== true) return identityCheck;

  const evalTeacherCheck = await checkEvalTeacher(
    evalId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de supprimer cette évaluation !"
  );
  if (evalTeacherCheck !== true) return evalTeacherCheck;

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

// ################################ GET (EXPORT) ################################

interface Evaluation {
  title: string;
  totalPoints: number;
  group: {
    name: string;
  };
  copies: {
    totalPoints: number;
    mark: number;
    bonusPoints: number;
    penaltyPoints: number;
    categoryResults: {
      category: {
        rank: number;
        label: string;
        maxPoints: number;
      };
      points: number;
      criterionResults: {
        criterion: {
          rank: number;
          label: string;
          maxPoints: number;
        };
        points: number;
      }[];
    }[];
    groupStudent: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}

const GET_EVAL = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      title
      totalPoints
      copies {
        totalPoints
        mark
        bonusPoints
        penaltyPoints
        categoryResults {
          category {
            rank
            label
            maxPoints
          }
          points
          criterionResults {
            criterion {
              rank
              label
              maxPoints
            }
            points
          }
        }
        groupStudent {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

export async function GET(_: Request, { params: { teacherEmail, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission d'exporter cette évaluation !"
  );
  if (identityCheck !== true) return identityCheck;

  const evalTeacherCheck = await checkEvalTeacher(
    evalId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission d'exporter cette évaluation !"
  );
  if (evalTeacherCheck !== true) return evalTeacherCheck;

  const evalResponse = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GET_EVAL, variables: { evalId } }),
    cache: "no-store",
  });

  const evalResult = await evalResponse.json();

  if (evalResult.errors) {
    console.log(evalResult.errors);
    return NextResponse.json(
      { msg: "Oh non, une erreur est survenue !", status: "error" },
      { status: 400 }
    );
  }

  const evaluation: Evaluation = evalResult.data.getEvaluation;

  if (evaluation.copies.length === 0) {
    return NextResponse.json(
      {
        msg: "Attention, vous ne pouvez pas exporter les résultats de cette évaluation, car aucune copie n'a été corrigée !",
        status: "info",
      },
      { status: 400 }
    );
  }

  // Sort categoryResults and criterionResults
  evaluation.copies.forEach((copy) => {
    copy.categoryResults.sort((a, b) => a.category.rank - b.category.rank);
    copy.categoryResults.forEach((catRes) => {
      catRes.criterionResults.sort((a, b) => a.criterion.rank - b.criterion.rank);
    });
  });

  const headers: { [key: string]: string | number } = {
    "Nom de famille": "Barème",
    Prénom: "Barème",
    Note: evaluation.totalPoints,
    "Note sur 20": 20,
  };
  evaluation.copies[0].categoryResults.forEach((catRes) => {
    const catLabel = catRes.category.label;
    headers[catLabel] = catRes.category.maxPoints;
    catRes.criterionResults.forEach((critRes) => {
      headers[catLabel + " - " + critRes.criterion.label] = critRes.criterion.maxPoints;
    });
  });
  headers.Bonus = 0;
  headers.Malus = 0;

  const copies = evaluation.copies.map((copy) => {
    const obj: { [key: string]: string | number } = {
      "Nom de famille": copy.groupStudent.lastName,
      Prénom: copy.groupStudent.firstName,
      Note: copy.totalPoints,
      "Note sur 20": roundNum(copy.mark, 2),
    };
    copy.categoryResults.forEach((catRes) => {
      const catLabel = catRes.category.label;
      obj[catLabel] = catRes.points;
      catRes.criterionResults.forEach((critRes) => {
        obj[catLabel + " - " + critRes.criterion.label] = critRes.points;
      });
    });
    obj.Bonus = copy.bonusPoints;
    obj.Malus = copy.penaltyPoints;
    return obj;
  });

  copies.unshift(headers);

  const worksheet = utils.json_to_sheet(copies);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, evaluation.title);

  const buf = write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Disposition": 'attachment; filename="SheetJSNode.xlsx"',
      "Content-Type": "application/vnd.ms-excel",
    },
  });
}

// ################################ PATCH (UPDATE PUBLIC STATUS) ################################

const UPDATE_EVAL = `
  mutation($input: UpdateEvaluationInput!) {
    updateEvaluation(input: $input) {
      evaluation {
        id
      }
    }
  }
`;

export async function PATCH(request: Request, { params: { teacherEmail, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de modifier cette évaluation !"
  );
  if (identityCheck !== true) return identityCheck;

  const evalTeacherCheck = await checkEvalTeacher(
    evalId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de modifier cette évaluation !"
  );
  if (evalTeacherCheck !== true) return evalTeacherCheck;

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
