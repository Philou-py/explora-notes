import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { DGRAPH_URL } from "@/config";
import { checkIdentity } from "@/app/checkIdentity";
import { dgraphQuery } from "@/app/dgraphQuery";
import { checkCopyTeacher } from "@/app/teacher/[teacherEmail]/group/[groupId]/evaluation/[evalId]/manage-copy/checkCopyTeacher";

const GET_COPY = `
  query($copyId: ID!) {
    getCopy(id: $copyId) {
      id
      totalPoints
      comments
      bonusPoints
      penaltyPoints
      shouldObserve
      categoryResults {
        id
        points
        comment
        category {
          id
        }
        criterionResults {
          id
          points
          criterion {
            id
          }
        }
      }
    }
  }
`;

export async function GET(_: Request, { params: { teacherEmail, copyId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de voir les détails de cette copie !"
  );
  if (identityCheck !== true) return identityCheck;

  const copyTeacherCheck = await checkCopyTeacher(
    copyId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de voir les détails de cette copie !"
  );
  if (copyTeacherCheck !== true) return copyTeacherCheck;

  return NextResponse.json({
    copy: await dgraphQuery(GET_COPY, { copyId }, "getCopy", `getCopy-${copyId}`),
  });
}

// ################################ DELETE ################################

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

export async function DELETE(_: Request, { params: { teacherEmail, evalId, copyId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de supprimer cette copie !"
  );
  if (identityCheck !== true) return identityCheck;

  const copyTeacherCheck = await checkCopyTeacher(
    copyId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de supprimer cette copie !"
  );
  if (copyTeacherCheck !== true) return copyTeacherCheck;

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

// ################################ PUT ################################

const makeVars = (prefix: string, ids: string[]) => ids.map((i) => prefix + i);

const makeMutation = (vars: string[][], ops: string) => {
  const varString = vars.reduce((p, v) => p + `$${v[0]}: ${v[1]}, `, "");
  return `
    mutation(${varString}) {
      ${ops}
    }
  `;
};

const makeOpInput = (variable: string, id: string, patch: any) => ({
  [variable]: { filter: { id }, set: patch },
});

const makeInput = (opInputs: any[]) => Object.assign({}, ...opInputs);

const UPDATE_CAT = (catId: string) => `
  updateCategoryResult${catId}: updateCategoryResult(input: $catRes${catId}) {
    categoryResult${catId}: categoryResult {
      id
    }
  }
`;

const UPDATE_CRIT = (critId: string) => `
  updateCriterionResult${critId}: updateCriterionResult(input: $critRes${critId}) {
    criterionResult${critId}: criterionResult {
      id
    }
  }
`;

const UPDATE_COPY = `
  updateCopy(input: $input) {
    copy {
      id
      groupStudent {
        firstName
        lastName
      }
    }
  }
`;

export async function PUT(request: Request, { params: { teacherEmail, evalId, copyId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de modifier une copie !"
  );
  if (identityCheck !== true) return identityCheck;

  const copyTeacherCheck = await checkCopyTeacher(
    copyId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de modifier une copie !"
  );
  if (copyTeacherCheck !== true) return copyTeacherCheck;

  const { studentId, categoryResults, summary } = await request.json();
  const copy = {
    groupStudent: {
      id: studentId,
    },
    ...summary,
    evaluation: { id: evalId },
    shouldObserve: false,
  };

  let criteriaToUpdate = [];

  const categoriesToUpdate = categoryResults.map((cat: any) => {
    criteriaToUpdate.push(
      ...cat.criterionResults.map((crit: any) => ({ id: crit.id, points: crit.points }))
    );
    return { id: cat.id, points: cat.points, comment: cat.comment };
  });

  const catResIDs: string[] = categoryResults.map((catRes: any) => catRes.id);
  const critResIDs: string[] = criteriaToUpdate.map((critRes) => critRes.id);

  categoriesToUpdate.forEach((cat: any) => {
    delete cat.id;
  });
  criteriaToUpdate.forEach((crit: any) => {
    delete crit.id;
  });

  const catResVars = makeVars("catRes", catResIDs);
  const catResVarsAndTypes = catResVars.map((v) => [v, "UpdateCategoryResultInput!"]);
  const critResVars = makeVars("critRes", critResIDs);
  const critResVarsAndTypes = critResVars.map((v) => [v, "UpdateCriterionResultInput!"]);
  const allVarsAndTypes = catResVarsAndTypes.concat(critResVarsAndTypes);
  allVarsAndTypes.push(["input", "UpdateCopyInput!"]);
  const makeCatResOpInput = catResIDs.map((id, i) =>
    makeOpInput(catResVars[i], id, categoriesToUpdate[i])
  );
  const makeCritResOpInput = critResIDs.map((id, i) =>
    makeOpInput(critResVars[i], id, criteriaToUpdate[i])
  );
  const input = makeInput(makeCatResOpInput.concat(makeCritResOpInput));
  const ops =
    UPDATE_COPY +
    catResIDs.reduce((p, id) => p + UPDATE_CAT(id), "") +
    critResIDs.reduce((p, id) => p + UPDATE_CRIT(id), "");

  const MUTATION = makeMutation(allVarsAndTypes, ops);

  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: MUTATION,
      variables: {
        input: {
          filter: { id: copyId },
          set: copy,
        },
        ...input,
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

  revalidateTag("getEvaluation-" + evalId);
  revalidateTag("getCopy-" + copyId);

  const returnedCopy = data.updateCopy.copy[0];
  const grSt = returnedCopy.groupStudent;
  const stName = `${grSt.firstName} ${grSt.lastName}`;
  return NextResponse.json(
    {
      msg: `La copie de l'élève ${stName} a bien été modifiée !`,
      status: "success",
    },
    { status: 200 }
  );
}
