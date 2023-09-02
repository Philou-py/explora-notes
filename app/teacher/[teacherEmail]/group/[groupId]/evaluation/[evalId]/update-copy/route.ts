import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";

const publicKey = readFileSync("public.key");

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

export async function POST(request: Request, { params: { teacherEmail, groupId, evalId } }) {
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
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de modifier une copie !",
      },
      { status: 403 }
    );

  const groupTeacher = await getGroupTeacher(groupId);
  if (groupTeacher !== teacherEmail)
    return NextResponse.json(
      {
        status: "error",
        msg: "Désolé, mais vous n'avez pas la permission de modifier une copie !",
      },
      { status: 403 }
    );

  const { copyId, studentId, categoryResults, summary } = await request.json();
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

  try {
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
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { msg: "Oh non, une erreur non identifiée est survenue !", status: "error" },
      { status: 500 }
    );
  }
}
